(()=>{
  const SUCCESS_MESSAGE='Price updated, this will reflect on future estimates';
  let activeEdit=null;
  let toastTimer=null;

  function showToast(message=SUCCESS_MESSAGE){
    let toast=document.getElementById('priceUpdateToast');
    if(!toast){
      toast=document.createElement('div');
      toast.id='priceUpdateToast';
      toast.className='price-update-toast';
      toast.setAttribute('role','status');
      toast.setAttribute('aria-live','polite');
      document.body.appendChild(toast);
    }
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('show'),3200);
  }

  function ensureEditor(){
    let dialog=document.getElementById('unitCostDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='unitCostDialog';
    dialog.className='unit-cost-dialog';
    dialog.innerHTML=`
      <form method="dialog" class="unit-cost-dialog-card" id="unitCostForm">
        <div class="unit-cost-dialog-head">
          <div>
            <span class="unit-cost-dialog-kicker">Price book</span>
            <h3>Edit unit cost</h3>
          </div>
          <button type="button" class="unit-cost-dialog-close" id="unitCostClose" aria-label="Close">×</button>
        </div>
        <p class="unit-cost-item" id="unitCostItem"></p>
        <label class="unit-cost-input-label" for="unitCostInput">New unit cost</label>
        <div class="unit-cost-input-wrap"><span>£</span><input id="unitCostInput" type="number" min="0" step="0.01" inputmode="decimal" required></div>
        <p class="unit-cost-help">This updates the saved price book as well as this estimate.</p>
        <div class="unit-cost-dialog-actions">
          <button type="button" class="ghost" id="unitCostCancel">Cancel</button>
          <button type="submit" class="primary">Update price</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);

    const close=()=>{activeEdit=null;dialog.close()};
    dialog.querySelector('#unitCostClose').addEventListener('click',close);
    dialog.querySelector('#unitCostCancel').addEventListener('click',close);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
    dialog.querySelector('#unitCostForm').addEventListener('submit',e=>{
      e.preventDefault();
      savePriceEdit(dialog);
    });
    return dialog;
  }

  function catalogueMatch(kind,row){
    const list=DATA?.[kind]||[];
    return list.find(x=>row.catalogId&&x.id===row.catalogId)||list.find(x=>x.name===row.name);
  }

  function persistPriceBook(kind,row,newCost){
    const storageKey=kind==='materials'?'gf-materials':'gf-tools';
    const versionKey=kind==='materials'?'gf-materials-version':'gf-tools-version';
    const liveMatch=catalogueMatch(kind,row);
    let id=row.catalogId||liveMatch?.id;
    let book=[];
    try{
      const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(Array.isArray(saved))book=saved;
    }catch{}
    if(!book.length)book=structuredClone(DATA?.[kind]||[]);

    let index=book.findIndex(x=>id&&x.id===id);
    if(index<0)index=book.findIndex(x=>x.name===row.name);
    if(index<0){
      id=id||`${kind==='materials'?'custom':'custom-tool'}-${crypto.randomUUID()}`;
      const seed=liveMatch?structuredClone(liveMatch):{id,name:row.name};
      seed.id=id;
      seed.name=row.name;
      seed.cost=newCost;
      book.push(seed);
      index=book.length-1;
    }else{
      id=id||book[index].id;
      book[index].cost=newCost;
    }

    if(id)row.catalogId=id;
    localStorage.setItem(storageKey,JSON.stringify(book));
    localStorage.setItem(versionKey,CATALOG_VERSION);

    const dataMatch=(DATA?.[kind]||[]).find(x=>id&&x.id===id)||(DATA?.[kind]||[]).find(x=>x.name===row.name);
    if(dataMatch)dataMatch.cost=newCost;
    else if(DATA?.[kind])DATA[kind].push(structuredClone(book[index]));
  }

  function savePriceEdit(dialog){
    if(!activeEdit)return;
    const input=dialog.querySelector('#unitCostInput');
    const value=Number(input.value);
    if(!Number.isFinite(value)||value<0){
      input.focus();
      return;
    }

    const {kind,index}=activeEdit;
    const row=state?.[kind]?.[index];
    if(!row)return;
    const oldId=row.catalogId;
    const oldName=row.name;

    row.cost=value;
    if(kind==='materials')delete row.quoteOverride;
    persistPriceBook(kind,row,value);

    state[kind].forEach((other,i)=>{
      if(i===index)return;
      const sameId=row.catalogId&&other.catalogId===row.catalogId;
      const sameName=!row.catalogId&&other.name===oldName;
      if(sameId||sameName){
        other.cost=value;
        if(kind==='materials')delete other.quoteOverride;
      }
    });

    recalc();
    saveDraft();
    activeEdit=null;
    dialog.close();
    queueMicrotask(injectEditButtons);
    showToast();
  }

  function openPriceEditor(kind,index){
    const row=state?.[kind]?.[index];
    if(!row||!String(row.name||'').trim()){
      showToast(`Choose a ${kind==='materials'?'material':'tool'} from the price book first`);
      return;
    }
    activeEdit={kind,index};
    const dialog=ensureEditor();
    dialog.querySelector('#unitCostItem').textContent=row.name;
    const input=dialog.querySelector('#unitCostInput');
    input.value=Number(row.cost||0).toFixed(2);
    dialog.showModal();
    requestAnimationFrame(()=>{input.focus();input.select()});
  }

  function wrapCostCell(cell,kind,index){
    if(!cell)return;
    let wrap=cell.querySelector('.editable-cost-wrap');
    if(!wrap){
      const value=cell.querySelector(kind==='materials'?'.bom-unit-cost':'.tool-unit-cost');
      if(!value)return;
      wrap=document.createElement('div');
      wrap.className='editable-cost-wrap';
      value.replaceWith(wrap);
      wrap.appendChild(value);
    }
    let button=wrap.querySelector('.unit-cost-edit');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='unit-cost-edit';
      button.textContent='Edit';
      button.title='Edit unit cost and update price book';
      wrap.appendChild(button);
    }
    button.dataset.costKind=kind;
    button.dataset.costIndex=String(index);
  }

  function injectEditButtons(){
    document.querySelectorAll('#materialsBody tr').forEach((tr,index)=>{
      wrapCostCell(tr.querySelector('.bom-unit-cost')?.closest('td')||tr.querySelector('.editable-cost-wrap')?.closest('td'),'materials',index);
    });
    document.querySelectorAll('#toolsBody tr').forEach((tr,index)=>{
      wrapCostCell(tr.querySelector('.tool-unit-cost')?.closest('td')||tr.querySelector('.editable-cost-wrap')?.closest('td'),'tools',index);
    });
  }

  document.addEventListener('click',e=>{
    const button=e.target.closest('.unit-cost-edit');
    if(!button)return;
    e.preventDefault();
    e.stopPropagation();
    openPriceEditor(button.dataset.costKind,Number(button.dataset.costIndex));
  });

  for(const id of ['materialsBody','toolsBody']){
    const body=document.getElementById(id);
    if(body)new MutationObserver(()=>queueMicrotask(injectEditButtons)).observe(body,{childList:true,subtree:true});
  }
  requestAnimationFrame(injectEditButtons);
})();

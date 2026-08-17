(()=>{
  const £=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
  const escHtml=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const safeFile=s=>String(s||'').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ')||'Material Order List';

  function bindDownload(){
    const button=document.getElementById('downloadOrderPdf');
    if(!button||button.dataset.bound==='1')return;
    button.dataset.bound='1';
    button.addEventListener('click',downloadOrderPdf);
  }

  function ensureLayout(){
    const card=document.querySelector('.order-card');
    if(!card)return;
    if(document.getElementById('orderPurchaseBody')){bindDownload();return}
    const head=card.querySelector('.section-head');
    if(head){
      const title=head.querySelector('h2');if(title)title.textContent='Material purchase list';
      const copy=document.getElementById('copyOrder');
      let actions=head.querySelector('.order-actions');
      if(!actions){actions=document.createElement('div');actions.className='order-actions';head.appendChild(actions)}
      if(copy)actions.appendChild(copy);
      const download=document.createElement('button');
      download.type='button';download.className='primary';download.id='downloadOrderPdf';download.textContent='Download PDF';
      actions.appendChild(download);
    }
    const legacy=document.getElementById('orderList');
    if(!legacy)return;
    legacy.classList.add('legacy-order-list-hidden');
    const detailed=document.createElement('div');
    detailed.id='orderPurchaseList';
    detailed.innerHTML=`
      <div class="order-purchase-wrap">
        <table class="order-purchase-table">
          <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">List price</th><th class="num">Subtotal</th></tr></thead>
          <tbody id="orderPurchaseBody"></tbody>
        </table>
      </div>
      <div class="order-summary">
        <div class="order-summary-row"><span>List subtotal</span><strong id="orderListSubtotal">£0.00</strong></div>
        <div class="order-summary-row discount"><span>Trade discount</span><strong id="orderTradeDiscount">0% −£0.00</strong></div>
        <div class="order-summary-row grand"><span>Grand total</span><strong id="orderGrandTotal">£0.00</strong></div>
      </div>
      <p class="order-note">Grand total is the material list subtotal less the trade discount set in Section 2.</p>`;
    legacy.insertAdjacentElement('afterend',detailed);
    bindDownload();
  }

  function currentRows(){
    try{return (state?.materials||[]).filter(r=>String(r.name||'').trim()&&Number(r.qty)>0)}catch{return []}
  }
  function discountPct(){
    const el=document.getElementById('tradeDiscount');
    return Math.min(100,Math.max(0,Number(el?.value)||0));
  }
  function figures(){
    const rows=currentRows();
    const subtotal=rows.reduce((sum,r)=>sum+(Number(r.qty)||0)*(Number(r.cost)||0),0);
    const pct=discountPct();
    const saving=subtotal*(pct/100);
    return{rows,subtotal,pct,saving,total:subtotal-saving};
  }

  function render(){
    ensureLayout();
    const body=document.getElementById('orderPurchaseBody');
    if(!body)return;
    const f=figures();
    body.innerHTML=f.rows.length?f.rows.map(r=>{
      const qty=Number(r.qty)||0,cost=Number(r.cost)||0;
      return `<tr><td class="order-desc">${escHtml(r.name)}</td><td class="num order-qty">${qty}</td><td class="num">${£(cost)}</td><td class="num"><strong>${£(qty*cost)}</strong></td></tr>`;
    }).join(''):`<tr><td colspan="4" class="order-empty">Add materials to generate the purchase list.</td></tr>`;
    const sub=document.getElementById('orderListSubtotal');if(sub)sub.textContent=£(f.subtotal);
    const disc=document.getElementById('orderTradeDiscount');if(disc)disc.textContent=`${f.pct}%  −${£(f.saving)}`;
    const grand=document.getElementById('orderGrandTotal');if(grand)grand.textContent=£(f.total);
  }

  function buildPdfSheet(){
    const f=figures();
    const host=document.createElement('div');
    host.className='order-pdf-host';
    const sheet=document.createElement('div');
    sheet.className='order-pdf-sheet';
    const reference=document.getElementById('reference')?.value||'';
    const customer=document.getElementById('customer')?.value||'';
    const date=document.getElementById('date')?.value||'';
    sheet.innerHTML=`
      <div class="order-pdf-brand">GOOD FOUNDATIONS</div>
      <h1>Material Purchase List</h1>
      <div class="order-pdf-meta">
        <div><span>Estimate</span><strong>${escHtml(reference||'—')}</strong></div>
        <div><span>Customer</span><strong>${escHtml(customer||'—')}</strong></div>
        <div><span>Date</span><strong>${escHtml(date||'—')}</strong></div>
      </div>
      <table class="order-pdf-table">
        <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">List price</th><th class="num">Subtotal</th></tr></thead>
        <tbody>${f.rows.length?f.rows.map(r=>{
          const qty=Number(r.qty)||0,cost=Number(r.cost)||0;
          return `<tr><td>${escHtml(r.name)}</td><td class="num">${qty}</td><td class="num">${£(cost)}</td><td class="num">${£(qty*cost)}</td></tr>`;
        }).join(''):'<tr><td colspan="4">No materials added.</td></tr>'}</tbody>
      </table>
      <div class="order-pdf-summary">
        <div><span>List subtotal</span><strong>${£(f.subtotal)}</strong></div>
        <div><span>Trade discount (${f.pct}%)</span><strong>−${£(f.saving)}</strong></div>
        <div><span>Grand total</span><strong>${£(f.total)}</strong></div>
      </div>
      <div class="order-pdf-foot">Internal material purchase sheet. Prices shown are list costs before and after the trade discount set on the estimate.</div>`;
    host.appendChild(sheet);document.body.appendChild(host);
    return{host,sheet};
  }

  async function downloadOrderPdf(){
    if(typeof html2pdf!=='function'){alert('PDF generator did not load. Please refresh and try again.');return}
    render();
    const button=document.getElementById('downloadOrderPdf');
    const old=button?.textContent;
    if(button){button.disabled=true;button.textContent='Creating PDF…'}
    const {host,sheet}=buildPdfSheet();
    const reference=document.getElementById('reference')?.value||'GF Estimate';
    try{
      await html2pdf().set({
        margin:[8,8,8,8],
        filename:`${safeFile(reference)} - Material Purchase List.pdf`,
        image:{type:'jpeg',quality:.98},
        html2canvas:{scale:2,useCORS:true,scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['css','legacy']}
      }).from(sheet).save();
    }finally{
      host.remove();
      if(button){button.disabled=false;button.textContent=old}
    }
  }

  document.addEventListener('input',()=>queueMicrotask(render));
  document.addEventListener('change',()=>queueMicrotask(render));
  document.addEventListener('click',()=>queueMicrotask(render));
  const matBody=document.getElementById('materialsBody');
  if(matBody)new MutationObserver(()=>queueMicrotask(render)).observe(matBody,{childList:true,subtree:true});
  const sum=document.getElementById('sumMaterialCost');
  if(sum)new MutationObserver(()=>queueMicrotask(render)).observe(sum,{childList:true,subtree:true,characterData:true});
  ensureLayout();
  bindDownload();
  setTimeout(render,0);setTimeout(render,250);setTimeout(render,1000);
})();
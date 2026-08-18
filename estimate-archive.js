(()=>{
  const DB_NAME='good-foundations-estimator';
  const DB_VERSION=1;
  const STORE='estimateArchive';
  const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const parseMoney=s=>Number(String(s||'').replace(/[^0-9.-]/g,''))||0;
  const safeName=(s,fallback)=>String(s||'').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').replace(/\s+-\s+/g,'-')||fallback;

  function toast(message,isError=false){
    let el=document.getElementById('archiveToast');
    if(!el){el=document.createElement('div');el.id='archiveToast';el.className='archive-toast';document.body.appendChild(el)}
    el.textContent=message;el.classList.toggle('error',!!isError);el.classList.add('show');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200);
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window))return reject(new Error('This browser does not support the local estimate archive.'));
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)){
          const store=db.createObjectStore(STORE,{keyPath:'id'});
          store.createIndex('savedAt','savedAt');
          store.createIndex('reference','reference');
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Could not open local estimate archive.'));
    });
  }

  async function putArchive(record){
    const db=await openDb();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).put(record);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error('Could not save estimate locally.'));
        tx.onabort=()=>reject(tx.error||new Error('Could not save estimate locally.'));
      });
    }finally{db.close()}
  }

  async function getArchive(){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).getAll();
        req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt)));
        req.onerror=()=>reject(req.error||new Error('Could not load local archive.'));
      });
    }finally{db.close()}
  }

  function currentMaterialRows(){
    return [...document.querySelectorAll('#materialsBody tr')].map(tr=>{
      const name=tr.querySelector('.desc')?.value?.trim()||'';
      const qty=Number(tr.querySelector('.qty')?.value)||0;
      const shownUnit=parseMoney(tr.querySelector('.bom-unit-cost')?.textContent);
      const lineTotal=parseMoney(tr.querySelector('.bom-line-cost')?.textContent);
      const cost=qty>0&&lineTotal>0?lineTotal/qty:shownUnit;
      return{name,qty,cost,lineTotal:lineTotal||qty*cost};
    }).filter(r=>r.name&&r.qty>0);
  }

  function bomFigures(){
    const rows=currentMaterialRows();
    const subtotal=rows.reduce((sum,r)=>sum+r.lineTotal,0);
    const pct=Math.min(100,Math.max(0,Number(document.getElementById('tradeDiscount')?.value)||0));
    const saving=subtotal*pct/100;
    return{rows,subtotal,pct,saving,total:subtotal-saving};
  }

  async function pdfBlobFrom(element,options){
    const worker=html2pdf().set(options).from(element).toPdf();
    const pdf=await worker.get('pdf');
    return pdf.output('blob');
  }

  async function buildQuoteBlob(){
    if(typeof html2pdf!=='function')throw new Error('PDF generator did not load. Please refresh and try again.');
    try{if(typeof closeSuggestions==='function')closeSuggestions()}catch{}
    try{if(typeof recalc==='function')recalc()}catch{}
    document.body.classList.add('pdf-export');
    try{
      await new Promise(r=>setTimeout(r,70));
      return await pdfBlobFrom(document.body,{
        margin:[3,4,3,4],
        image:{type:'jpeg',quality:.95},
        html2canvas:{scale:2,useCORS:true,scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['avoid-all','css','legacy']}
      });
    }finally{document.body.classList.remove('pdf-export')}
  }

  function buildBomSheet(){
    const f=bomFigures();
    const host=document.createElement('div');host.className='order-pdf-host';
    const sheet=document.createElement('div');sheet.className='order-pdf-sheet';
    const reference=document.getElementById('reference')?.value||'';
    const customer=document.getElementById('customer')?.value||'';
    const date=document.getElementById('date')?.value||'';
    sheet.innerHTML=`
      <div class="order-pdf-brand">GOOD FOUNDATIONS</div>
      <h1>Material Purchase List</h1>
      <div class="order-pdf-meta">
        <div><span>Estimate</span><strong>${esc(reference||'—')}</strong></div>
        <div><span>Customer</span><strong>${esc(customer||'—')}</strong></div>
        <div><span>Date</span><strong>${esc(date||'—')}</strong></div>
      </div>
      <table class="order-pdf-table">
        <colgroup><col style="width:58%"><col style="width:10%"><col style="width:16%"><col style="width:16%"></colgroup>
        <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">List price</th><th class="num">Subtotal</th></tr></thead>
        <tbody>${f.rows.length?f.rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="num">${r.qty}</td><td class="num">${money(r.cost)}</td><td class="num">${money(r.lineTotal)}</td></tr>`).join(''):'<tr><td colspan="4">No materials added.</td></tr>'}</tbody>
      </table>
      <div class="order-pdf-summary">
        <div><span>List subtotal</span><strong>${money(f.subtotal)}</strong></div>
        <div><span>Trade discount (${f.pct}%)</span><strong>−${money(f.saving)}</strong></div>
        <div><span>Grand total</span><strong>${money(f.total)}</strong></div>
      </div>
      <div class="order-pdf-foot">Internal material purchase sheet. Prices shown are list costs before and after the trade discount set on the estimate.</div>`;
    host.appendChild(sheet);document.body.appendChild(host);
    return{host,sheet};
  }

  async function buildBomBlob(){
    if(typeof html2pdf!=='function')throw new Error('PDF generator did not load. Please refresh and try again.');
    const {host,sheet}=buildBomSheet();
    try{
      return await pdfBlobFrom(sheet,{
        margin:[10,12,10,12],
        image:{type:'jpeg',quality:.98},
        html2canvas:{scale:2,useCORS:true,scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['css','legacy']}
      });
    }finally{host.remove()}
  }

  async function saveEstimate(){
    const button=document.getElementById('printBtn');
    if(!button||button.disabled)return;
    const old=button.textContent;button.disabled=true;button.textContent='Saving estimate…';
    try{
      const reference=(document.getElementById('reference')?.value||'').trim()||'Untitled';
      const customer=(document.getElementById('customer')?.value||'').trim();
      const refName=safeName(reference,'Untitled');
      const quoteBlob=await buildQuoteBlob();
      const bomBlob=await buildBomBlob();
      const savedAt=new Date().toISOString();
      const id=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      await putArchive({
        id,reference,customer,savedAt,
        total:parseMoney(document.getElementById('grandTotal')?.textContent),
        quoteFilename:`${refName}-quote.pdf`,
        bomFilename:`${refName}-bom.pdf`,
        quoteBlob,bomBlob
      });
      toast(`Estimate ${reference} saved locally — Quote and BOM added to Archive`);
      const saveState=document.getElementById('saveState');if(saveState)saveState.textContent='Saved locally · Quote + BOM archived';
    }catch(err){toast(err.message||'Could not save estimate locally.',true)}
    finally{button.disabled=false;button.textContent=old}
  }

  function viewerUrl(id,type,print=false){
    return `archive-local-viewer.html?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}${print?'&print=1':''}`;
  }

  function renderLocalArchive(estimates){
    const host=document.getElementById('archiveList');if(!host)return;
    host.innerHTML=estimates.length?estimates.map(row=>{
      const when=new Date(row.savedAt).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
      return `<article class="cloud-archive-entry">
        <div class="cloud-archive-main"><strong>${esc(row.reference||'Untitled')} · ${esc(row.customer||'No customer')}</strong><small>${esc(when)} · ${money(row.total)}</small></div>
        <div class="cloud-archive-docs">
          <div class="archive-doc"><span>${esc(row.quoteFilename||'Quote.pdf')}</span><a href="${viewerUrl(row.id,'quote')}" target="_blank" rel="noopener">Open</a><a href="${viewerUrl(row.id,'quote',true)}" target="_blank" rel="noopener">Print</a></div>
          <div class="archive-doc"><span>${esc(row.bomFilename||'BOM.pdf')}</span><a href="${viewerUrl(row.id,'bom')}" target="_blank" rel="noopener">Open</a><a href="${viewerUrl(row.id,'bom',true)}" target="_blank" rel="noopener">Print</a></div>
        </div>
      </article>`;
    }).join(''):'<p class="muted">No saved estimates yet.</p>';
  }

  async function openArchive(){
    const modal=document.getElementById('archiveModal'),host=document.getElementById('archiveList');
    if(!modal||!host)return;
    modal.classList.remove('hidden');host.innerHTML='<p class="muted">Loading saved estimates…</p>';
    try{renderLocalArchive(await getArchive())}
    catch(err){host.innerHTML=`<div class="archive-error"><strong>Archive unavailable</strong><p>${esc(err.message||'Could not load local archive.')}</p></div>`}
  }

  const saveButton=document.getElementById('printBtn');
  if(saveButton){saveButton.textContent='Save estimate';saveButton.onclick=saveEstimate}
  const archiveButton=document.getElementById('archiveBtn');if(archiveButton)archiveButton.onclick=openArchive;
})();

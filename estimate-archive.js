(()=>{
  const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const parseMoney=s=>Number(String(s||'').replace(/[^0-9.-]/g,''))||0;
  const safeName=(s,fallback)=>String(s||'').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ')||fallback;

  function toast(message,isError=false){
    let el=document.getElementById('archiveToast');
    if(!el){el=document.createElement('div');el.id='archiveToast';el.className='archive-toast';document.body.appendChild(el)}
    el.textContent=message;el.classList.toggle('error',!!isError);el.classList.add('show');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200);
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

  function blobToBase64(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(reader.error||new Error('Could not read generated PDF'));
      reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');
      reader.readAsDataURL(blob);
    });
  }

  async function saveEstimate(){
    const button=document.getElementById('printBtn');
    if(!button||button.disabled)return;
    const old=button.textContent;button.disabled=true;button.textContent='Saving estimate…';
    try{
      const quoteBlob=await buildQuoteBlob();
      const bomBlob=await buildBomBlob();
      const [quoteBase64,bomBase64]=await Promise.all([blobToBase64(quoteBlob),blobToBase64(bomBlob)]);
      const response=await fetch('/api/estimates',{
        method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          reference:document.getElementById('reference')?.value||'',
          customer:document.getElementById('customer')?.value||'',
          total:parseMoney(document.getElementById('grandTotal')?.textContent),
          quoteBase64,bomBase64
        })
      });
      const data=await response.json().catch(()=>({}));
      if(response.status===401){sessionStorage.removeItem('gf-authenticated');throw new Error('Your session has expired. Log in again before saving.')}
      if(!response.ok)throw new Error(data.error||'Could not save estimate.');
      toast('Estimate saved — Quote and BOM added to Archive');
      const saveState=document.getElementById('saveState');if(saveState)saveState.textContent='Draft saved locally · estimate archived';
    }catch(err){toast(err.message||'Could not save estimate.',true)}
    finally{button.disabled=false;button.textContent=old}
  }

  function fileUrl(path,filename){return `/api/estimate-file?pathname=${encodeURIComponent(path)}&filename=${encodeURIComponent(filename)}`}
  function printUrl(path,filename){return `archive-viewer.html?pathname=${encodeURIComponent(path)}&filename=${encodeURIComponent(filename)}&print=1`}

  function renderCloudArchive(estimates){
    const host=document.getElementById('archiveList');if(!host)return;
    host.innerHTML=estimates.length?estimates.map(row=>{
      const ref=safeName(row.reference,'Untitled');
      const customer=safeName(row.customer,'No customer');
      const quoteName=`${ref} - ${customer} - Quote.pdf`;
      const bomName=`${ref} - ${customer} - BOM.pdf`;
      const when=new Date(row.savedAt).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
      return `<article class="cloud-archive-entry">
        <div class="cloud-archive-main"><strong>${esc(row.reference||'Untitled')} · ${esc(row.customer||'No customer')}</strong><small>${esc(when)} · ${money(row.total)}</small></div>
        <div class="cloud-archive-docs">
          <div class="archive-doc"><span>Customer quote</span><a href="${fileUrl(row.quotePath,quoteName)}" target="_blank" rel="noopener">Open</a><a href="${printUrl(row.quotePath,quoteName)}" target="_blank" rel="noopener">Print</a></div>
          <div class="archive-doc"><span>BOM / purchase list</span><a href="${fileUrl(row.bomPath,bomName)}" target="_blank" rel="noopener">Open</a><a href="${printUrl(row.bomPath,bomName)}" target="_blank" rel="noopener">Print</a></div>
        </div>
      </article>`;
    }).join(''):'<p class="muted">No saved estimates yet.</p>';
  }

  async function openArchive(){
    const modal=document.getElementById('archiveModal'),host=document.getElementById('archiveList');
    if(!modal||!host)return;
    modal.classList.remove('hidden');host.innerHTML='<p class="muted">Loading saved estimates…</p>';
    try{
      const response=await fetch('/api/estimates',{credentials:'same-origin',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(response.status===401){sessionStorage.removeItem('gf-authenticated');throw new Error('Your session has expired. Log in again to view the archive.')}
      if(!response.ok)throw new Error(data.error||'Could not load saved estimates.');
      renderCloudArchive(data.estimates||[]);
    }catch(err){host.innerHTML=`<div class="archive-error"><strong>Archive unavailable</strong><p>${esc(err.message||'Could not load saved estimates.')}</p></div>`}
  }

  const saveButton=document.getElementById('printBtn');
  if(saveButton){saveButton.textContent='Save estimate';saveButton.onclick=saveEstimate}
  const archiveButton=document.getElementById('archiveBtn');if(archiveButton)archiveButton.onclick=openArchive;
})();

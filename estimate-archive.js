(()=>{
  const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const parseMoney=s=>Number(String(s||'').replace(/[^0-9.-]/g,''))||0;
  const safeName=(s,fallback)=>String(s||'').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').replace(/\s+-\s+/g,'-')||fallback;

  function toast(message,isError=false){
    let el=document.getElementById('archiveToast');
    if(!el){el=document.createElement('div');el.id='archiveToast';el.className='archive-toast';document.body.appendChild(el)}
    el.textContent=message;el.classList.toggle('error',!!isError);el.classList.add('show');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3600);
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
    const customerDiscount=Number(document.getElementById('discount')?.value)||0;
    document.body.classList.add('pdf-export');
    if(customerDiscount<=0)document.body.classList.add('no-customer-discount');
    try{
      await new Promise(r=>setTimeout(r,70));
      return await pdfBlobFrom(document.body,{
        margin:[3,4,3,4],
        image:{type:'jpeg',quality:.95},
        html2canvas:{scale:2,useCORS:true,scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['avoid-all','css','legacy']}
      });
    }finally{
      document.body.classList.remove('pdf-export');
      document.body.classList.remove('no-customer-discount');
    }
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

  function downloadBlob(blob,filename){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;a.style.display='none';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }

  async function saveEstimate(){
    const button=document.getElementById('printBtn');
    if(!button||button.disabled)return;
    const old=button.textContent;button.disabled=true;button.textContent='Creating PDFs…';
    try{
      const reference=(document.getElementById('reference')?.value||'').trim()||'Untitled';
      const refName=safeName(reference,'Untitled');
      const quoteBlob=await buildQuoteBlob();
      const bomBlob=await buildBomBlob();
      downloadBlob(quoteBlob,`${refName}-quote.pdf`);
      await new Promise(r=>setTimeout(r,250));
      downloadBlob(bomBlob,`${refName}-bom.pdf`);
      toast(`${reference}: Quote and BOM downloaded`);
      const saveState=document.getElementById('saveState');if(saveState)saveState.textContent='PDFs downloaded locally';
    }catch(err){toast(err.message||'Could not create PDFs.',true)}
    finally{button.disabled=false;button.textContent=old}
  }

  function openArchive(){
    const modal=document.getElementById('archiveModal'),host=document.getElementById('archiveList');
    if(!modal||!host)return;
    modal.classList.remove('hidden');
    host.innerHTML=`<div class="archive-download-info">
      <strong>PDFs are saved to this device</strong>
      <p>Each time you click <b>Save estimate</b>, two files are downloaded using the job reference:</p>
      <p><b>JOB-REFERENCE-quote.pdf</b><br><b>JOB-REFERENCE-bom.pdf</b></p>
      <p class="muted">Open your browser or device Downloads folder to view, print or move previous estimates. The estimator no longer stores PDF copies internally, so it cannot run out of archive space.</p>
    </div>`;
  }

  const saveButton=document.getElementById('printBtn');
  if(saveButton){saveButton.textContent='Save estimate';saveButton.onclick=saveEstimate}
  const archiveButton=document.getElementById('archiveBtn');if(archiveButton)archiveButton.onclick=openArchive;
})();

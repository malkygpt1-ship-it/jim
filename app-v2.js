let BASE={catalogVersion:'legacy',materials:[],tools:[]};
let CATALOG_VERSION='legacy';
const DEFAULT_MARKUP=30;
const $=s=>document.querySelector(s), money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(+n||0);
const state={materials:[],tools:[]};
const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

function loadMaterials(){
  const base=structuredClone(BASE.materials||[]);
  try{
    const saved=JSON.parse(localStorage.getItem('gf-materials')||'null');
    const savedVersion=localStorage.getItem('gf-materials-version');
    if(Array.isArray(saved)&&savedVersion===CATALOG_VERSION)return saved;
    if(Array.isArray(saved)&&saved.length){
      const used=new Set();
      const merged=base.map(b=>{
        const i=saved.findIndex((s,idx)=>!used.has(idx)&&((b.id&&s.id===b.id)||s.name===b.name));
        if(i<0)return b;
        used.add(i);
        return {...b,...saved[i],id:b.id||saved[i].id,sourceRow:b.sourceRow??saved[i].sourceRow};
      });
      saved.forEach((s,i)=>{if(!used.has(i))merged.push(s)});
      localStorage.setItem('gf-materials',JSON.stringify(merged));
      localStorage.setItem('gf-materials-version',CATALOG_VERSION);
      return merged;
    }
  }catch{}
  localStorage.setItem('gf-materials-version',CATALOG_VERSION);
  return base;
}

let DATA={materials:[],tools:[]};
const lookup=(kind,key)=>DATA[kind].find(x=>x.id===key)||DATA[kind].find(x=>x.name===key);
function markupPct(){return Math.min(500,Math.max(0,+$('#materialMarkup')?.value||0))}
function tradeDiscountPct(){return Math.min(100,Math.max(0,+$('#tradeDiscount')?.value||0))}
function ensureMarkupOption(value){
  const select=$('#materialMarkup');if(!select)return;
  const v=String(value??DEFAULT_MARKUP);
  if(![...select.options].some(o=>o.value===v)){const o=document.createElement('option');o.value=v;o.textContent=`${v}%`;select.appendChild(o)}
  select.value=v;
}
function materialQuoteUnit(r){
  if(hasOwn(r,'quoteOverride')&&Number.isFinite(+r.quoteOverride))return +r.quoteOverride;
  return (+r.cost||0)*(1+markupPct()/100);
}
function materialBillUnit(r){return (+r.cost||0)*(1-tradeDiscountPct()/100)}
function rowUnit(kind,r){return kind==='materials'?materialQuoteUnit(r):(+r.sell||0)}

function renderRows(kind){
  const body=$(kind==='materials'?'#materialsBody':'#toolsBody');
  body.innerHTML=state[kind].map((r,i)=>{
    if(kind==='materials'){
      const qty=+r.qty||0,cost=+r.cost||0,quote=materialQuoteUnit(r);
      return `<tr><td class="suggest-cell"><input class="row-input desc" autocomplete="off" data-kind="materials" data-i="${i}" data-f="name" value="${esc(r.name||'')}" placeholder="Click or type to search..."><div class="suggestions hidden"></div></td><td><input class="row-input qty" type="number" min="0" step="0.01" data-kind="materials" data-i="${i}" data-f="qty" value="${r.qty??1}"></td><td class="num bom-cost-col"><span class="bom-unit-cost">${money(cost)}</span></td><td class="num bom-cost-col"><strong class="bom-line-cost">${money(qty*cost)}</strong></td><td class="num bom-quote-col"><div class="derived-price" title="Cost ${money(cost)} + ${markupPct()}% markup">${money(quote)}</div></td><td class="num bom-quote-col"><strong class="bom-quote-total">${money(qty*quote)}</strong></td><td><button class="remove" data-remove="materials" data-i="${i}">×</button></td></tr>`;
    }
    return `<tr><td class="suggest-cell"><input class="row-input desc" autocomplete="off" data-kind="tools" data-i="${i}" data-f="name" value="${esc(r.name||'')}" placeholder="Click or type to search..."><div class="suggestions hidden"></div></td><td><input class="row-input qty" type="number" min="0" step="0.01" data-kind="tools" data-i="${i}" data-f="qty" value="${r.qty??1}"></td><td><input class="row-input money" type="number" min="0" step="0.01" data-kind="tools" data-i="${i}" data-f="sell" value="${Number(r.sell||0).toFixed(2)}"></td><td class="num"><strong>${money((+r.qty||0)*(+r.sell||0))}</strong></td><td><button class="remove" data-remove="tools" data-i="${i}">×</button></td></tr>`;
  }).join('');
}
function addRow(kind,row){
  const next=row||(kind==='materials'?{name:'',qty:1,cost:0}:{name:'',qty:1,sell:0,cost:0});
  state[kind].push(next);renderRows(kind);recalc();saveDraft();
}
function showSuggestions(input){
  const box=input.parentElement.querySelector('.suggestions'),q=input.value.trim().toLowerCase(),kind=input.dataset.kind;
  const matches=DATA[kind].filter(x=>!q||x.name.toLowerCase().includes(q));
  box.innerHTML=matches.length?matches.map(x=>`<button type="button" class="suggestion" data-pick="${kind}" data-i="${input.dataset.i}" data-key="${esc(x.id||x.name)}"><span>${esc(x.name)}</span><strong>${kind==='materials'?`Cost ${money(x.cost)}`:money(x.sell)}</strong></button>`).join(''):'<div class="suggest-empty">No matching items</div>';
  document.querySelectorAll('.suggestions').forEach(x=>{if(x!==box)x.classList.add('hidden')});box.classList.remove('hidden');
}
function closeSuggestions(){document.querySelectorAll('.suggestions').forEach(x=>x.classList.add('hidden'))}
function totals(){
  const materialCost=state.materials.reduce((a,r)=>a+(+r.qty||0)*(+r.cost||0),0);
  const tradeDiscount=tradeDiscountPct()/100;
  const tradeSaving=materialCost*tradeDiscount;
  const billMat=materialCost-tradeSaving;
  const mat=state.materials.reduce((a,r)=>a+(+r.qty||0)*materialQuoteUnit(r),0);
  const tool=state.tools.reduce((a,r)=>a+(+r.qty||0)*(+r.sell||0),0);
  const labour=(+$('#hours').value||0)*(+$('#labourRate').value||0);
  const discount=Math.min(100,Math.max(0,+$('#discount').value||0))/100;
  return{materialCost,tradeSaving,billMat,mat,tool,labour,total:(mat+tool+labour)*(1-discount)};
}
function recalc(){
  const t=totals();
  const materialBody=$('#materialsBody');
  [...materialBody.querySelectorAll('tr')].forEach((tr,i)=>{
    const r=state.materials[i];if(!r)return;
    const qty=+r.qty||0,cost=+r.cost||0,quote=materialQuoteUnit(r);
    const unitCost=tr.querySelector('.bom-unit-cost');if(unitCost)unitCost.textContent=money(cost);
    const lineCost=tr.querySelector('.bom-line-cost');if(lineCost)lineCost.textContent=money(qty*cost);
    const quoteUnit=tr.querySelector('.derived-price');if(quoteUnit){quoteUnit.textContent=money(quote);quoteUnit.title=`Cost ${money(cost)} + ${markupPct()}% markup`}
    const quoteTotal=tr.querySelector('.bom-quote-total');if(quoteTotal)quoteTotal.textContent=money(qty*quote);
  });
  const toolBody=$('#toolsBody');
  [...toolBody.querySelectorAll('tr')].forEach((tr,i)=>{const r=state.tools[i],cell=tr.querySelector('td.num strong');if(r&&cell)cell.textContent=money((+r.qty||0)*(+r.sell||0))});
  $('#materialsSubtotal').textContent=$('#sumMaterialCost').textContent=money(t.materialCost);
  $('#tradeSaving').textContent=`−${money(t.tradeSaving)}`;
  $('#sumBillMaterials').textContent=money(t.billMat);
  $('#sumMaterials').textContent=money(t.mat);
  $('#toolsSubtotal').textContent=$('#sumTools').textContent=money(t.tool);
  $('#labourSubtotal').textContent=$('#sumLabour').textContent=money(t.labour);
  $('#grandTotal').textContent=money(t.total);
  const rows=state.materials.filter(r=>r.name&&+r.qty>0);
  $('#orderList').innerHTML=rows.length?rows.map(r=>`<div class="order-item"><span>${esc(r.name)}</span><strong>${r.qty}</strong></div>`).join(''):'<span class="muted">Add materials to generate the order list.</span>';
}
function snapshot(){return{reference:$('#reference').value,customer:$('#customer').value,phone:$('#phone').value,date:$('#date').value,address:$('#address').value,work:$('#work').value,hours:$('#hours').value,labourRate:$('#labourRate').value,materialMarkup:$('#materialMarkup').value,tradeDiscount:$('#tradeDiscount').value,discount:$('#discount').value,materials:state.materials,tools:state.tools,updated:new Date().toISOString(),total:totals().total}}
function loadSnap(s){
  for(const k of ['reference','customer','phone','date','address','work','hours','discount','tradeDiscount'])if(s[k]!=null)$('#'+k).value=s[k];
  if(s.tradeDiscount==null)$('#tradeDiscount').value=0;
  $('#labourRate').value=s.labourRate??s.labourSell??20;
  ensureMarkupOption(s.materialMarkup??DEFAULT_MARKUP);
  state.materials=structuredClone(s.materials||[]);
  state.tools=structuredClone(s.tools||[]);
  if(s.materialMarkup==null){state.materials.forEach(r=>{if(!hasOwn(r,'quoteOverride')&&hasOwn(r,'sell'))r.quoteOverride=+r.sell||0})}
  renderRows('materials');renderRows('tools');recalc();saveDraft();
}
let timer;function saveDraft(){clearTimeout(timer);$('#saveState').textContent='Saving…';timer=setTimeout(()=>{localStorage.setItem('gf-draft',JSON.stringify(snapshot()));$('#saveState').textContent='Saved locally'},150)}
function archive(){const arr=JSON.parse(localStorage.getItem('gf-archive')||'[]');arr.unshift({...snapshot(),id:crypto.randomUUID()});localStorage.setItem('gf-archive',JSON.stringify(arr.slice(0,200)));renderArchive()}
function renderArchive(){const arr=JSON.parse(localStorage.getItem('gf-archive')||'[]');$('#archiveList').innerHTML=arr.length?arr.map(s=>`<div class="archive-entry"><strong>${esc(s.reference||'Untitled')} · ${esc(s.customer||'No customer')}</strong><small>${new Date(s.updated).toLocaleString('en-GB')} · ${money(s.total)}</small><div class="archive-actions"><button class="load" data-load="${s.id}">Open</button><button class="delete" data-delete="${s.id}">Delete</button></div></div>`).join(''):'<p class="muted">No archived estimates yet.</p>'}
function safe(v,f){return String(v||'').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ')||f}
async function downloadPdf(){closeSuggestions();recalc();archive();const filename=`${safe($('#reference').value,'GF Estimate')} - ${safe($('#customer').value,'Customer')}.pdf`;if(typeof html2pdf!=='function'){alert('PDF generator did not load. Please refresh and try again.');return}const b=$('#printBtn'),old=b.textContent;b.disabled=true;b.textContent='Creating PDF…';document.body.classList.add('pdf-export');try{await new Promise(r=>setTimeout(r,60));await html2pdf().set({margin:[3,4,3,4],filename,image:{type:'jpeg',quality:.95},html2canvas:{scale:2,useCORS:true,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['avoid-all','css','legacy']}}).from(document.body).save()}finally{document.body.classList.remove('pdf-export');b.disabled=false;b.textContent=old}}

document.addEventListener('focusin',e=>{if(e.target.matches('.desc[data-kind]'))showSuggestions(e.target)});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset.kind){
    const r=state[el.dataset.kind][+el.dataset.i];
    r[el.dataset.f]=el.dataset.f==='name'?el.value:+el.value;
    if(el.dataset.f==='name'){
      showSuggestions(el);
      const hit=lookup(el.dataset.kind,el.value);
      if(hit){r.catalogId=hit.id;r.cost=hit.cost;if(el.dataset.kind==='tools')r.sell=hit.sell;else delete r.quoteOverride}
    }
  }
  recalc();saveDraft();
});
document.addEventListener('mousedown',e=>{
  const p=e.target.closest('[data-pick]');if(!p)return;
  e.preventDefault();
  const r=state[p.dataset.pick][+p.dataset.i],hit=lookup(p.dataset.pick,p.dataset.key);
  if(r&&hit){
    if(p.dataset.pick==='materials')Object.assign(r,{catalogId:hit.id,name:hit.name,cost:hit.cost});
    else Object.assign(r,{catalogId:hit.id,name:hit.name,sell:hit.sell,cost:hit.cost});
    if(p.dataset.pick==='materials')delete r.quoteOverride;
    renderRows(p.dataset.pick);recalc();saveDraft();closeSuggestions();
  }
});
document.addEventListener('click',e=>{
  if(!e.target.closest('.suggest-cell'))closeSuggestions();
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.remove){state[b.dataset.remove].splice(+b.dataset.i,1);renderRows(b.dataset.remove);recalc();saveDraft()}
  if(b.dataset.load){const s=JSON.parse(localStorage.getItem('gf-archive')||'[]').find(x=>x.id===b.dataset.load);if(s){loadSnap(s);$('#archiveModal').classList.add('hidden')}}
  if(b.dataset.delete){const arr=JSON.parse(localStorage.getItem('gf-archive')||'[]').filter(x=>x.id!==b.dataset.delete);localStorage.setItem('gf-archive',JSON.stringify(arr));renderArchive()}
});
$('#materialMarkup').addEventListener('change',()=>{state.materials.forEach(r=>delete r.quoteOverride);recalc();saveDraft()});
$('#tradeDiscount').addEventListener('input',()=>{recalc();saveDraft()});
$('#addMaterial').onclick=()=>addRow('materials');
$('#addTool').onclick=()=>addRow('tools');
$('#printBtn').onclick=downloadPdf;
$('#archiveBtn').onclick=()=>{renderArchive();$('#archiveModal').classList.remove('hidden')};
$('#closeArchive').onclick=()=>$('#archiveModal').classList.add('hidden');
$('#newBtn').onclick=()=>{if(confirm('Start a new estimate?')){const n=parseInt(($('#reference').value.match(/\d+/)||['3072'])[0],10)+1;loadSnap({reference:`GF ${n}`,customer:'',phone:'',date:new Date().toISOString().slice(0,10),address:'',work:'',hours:0,labourRate:20,materialMarkup:$('#materialMarkup').value,tradeDiscount:$('#tradeDiscount').value,discount:0,materials:[],tools:[]})}};
$('#copyOrder').onclick=async()=>{const txt=state.materials.filter(r=>r.name&&+r.qty>0).map(r=>`${r.qty} × ${r.name}`).join('\n');if(txt)await navigator.clipboard.writeText(txt)};

async function init(){
  try{BASE=await window.GF_DATA_PROMISE;CATALOG_VERSION=BASE.catalogVersion||'legacy';DATA={materials:loadMaterials(),tools:structuredClone(BASE.tools||[])};}
  catch(err){console.error('Could not load estimator catalog',err);alert('The materials/tool catalogue could not be loaded. Please refresh and try again.');return;}
  const draft=JSON.parse(localStorage.getItem('gf-draft')||'null');
  if(draft)loadSnap(draft);else{ensureMarkupOption(DEFAULT_MARKUP);$('#tradeDiscount').value=0;addRow('materials');addRow('tools',{name:'',qty:0,sell:0,cost:0});recalc()}
}
init();

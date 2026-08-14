const BASE=window.GF_DATA||{materials:[],tools:[]};
const savedMaterials=(()=>{try{const v=JSON.parse(localStorage.getItem('gf-materials')||'null');return Array.isArray(v)?v:null}catch{return null}})();
const DATA={materials:savedMaterials||BASE.materials,tools:BASE.tools};
const $=s=>document.querySelector(s); const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
const state={materials:[],tools:[]};
let activeSuggest=null;

function fillLists(){
  $('#materialOptions').innerHTML=DATA.materials.map(x=>`<option value="${esc(x.name)}"></option>`).join('');
  $('#toolOptions').innerHTML=DATA.tools.map(x=>`<option value="${esc(x.name)}"></option>`).join('');
}
function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function lookup(kind,name){return DATA[kind].find(x=>x.name===name)}
function addRow(kind,row={name:'',qty:1,sell:0,cost:0}){state[kind].push(row);renderRows(kind);recalc();saveDraft()}
function renderRows(kind){
 const body=$(kind==='materials'?'#materialsBody':'#toolsBody');
 body.innerHTML=state[kind].map((r,i)=>`<tr>
 <td class="suggest-cell"><input class="row-input desc" autocomplete="off" data-kind="${kind}" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="Click or type to search..."><div class="suggestions hidden"></div></td>
 <td><input class="row-input qty" type="number" min="0" step="0.01" data-kind="${kind}" data-i="${i}" data-f="qty" value="${r.qty}"></td>
 <td><input class="row-input money" type="number" min="0" step="0.01" data-kind="${kind}" data-i="${i}" data-f="sell" value="${Number(r.sell||0).toFixed(2)}"></td>
 <td class="num"><strong>${money((r.qty||0)*(r.sell||0))}</strong></td>
 <td><button class="remove" data-remove="${kind}" data-i="${i}">×</button></td></tr>`).join('');
}
function updateLineTotals(){
  for(const kind of ['materials','tools']){
    const body=$(kind==='materials'?'#materialsBody':'#toolsBody');
    if(!body)continue;
    [...body.querySelectorAll('tr')].forEach((tr,i)=>{
      const r=state[kind][i];
      const cell=tr.querySelector('td.num strong');
      if(r&&cell)cell.textContent=money((+r.qty||0)*(+r.sell||0));
    });
  }
}
function closeSuggestions(except=null){document.querySelectorAll('.suggestions').forEach(x=>{if(x!==except)x.classList.add('hidden')});if(!except)activeSuggest=null}
function showSuggestions(input){
 const box=input.parentElement.querySelector('.suggestions'); if(!box)return;
 const kind=input.dataset.kind; const q=input.value.trim().toLowerCase();
 const matches=DATA[kind].filter(x=>!q||x.name.toLowerCase().includes(q));
 box.innerHTML=matches.length?matches.map(x=>`<button type="button" class="suggestion" data-pick="${kind}" data-i="${input.dataset.i}" data-name="${esc(x.name)}"><span>${esc(x.name)}</span><strong>${money(x.sell)}</strong></button>`).join(''):'<div class="suggest-empty">No matching items</div>';
 closeSuggestions(box); box.classList.remove('hidden'); activeSuggest=box;
}
function pickSuggestion(kind,i,name){const r=state[kind][+i],hit=lookup(kind,name);if(!r||!hit)return;r.name=hit.name;r.sell=hit.sell;r.cost=hit.cost;renderRows(kind);recalc();saveDraft();closeSuggestions()}
function totals(){
 const mat=state.materials.reduce((a,r)=>a+(+r.qty||0)*(+r.sell||0),0); const tool=state.tools.reduce((a,r)=>a+(+r.qty||0)*(+r.sell||0),0);
 const hours=+$('#hours').value||0,costH=+$('#labourCost').value||0,sellH=+$('#labourSell').value||0; const labour=hours*sellH;
 const discount=Math.min(100,Math.max(0,+$('#discount').value||0))/100; const before=mat+tool+labour; const total=before*(1-discount);
 const cost=state.materials.reduce((a,r)=>a+(+r.qty||0)*(+r.cost||0),0)+state.tools.reduce((a,r)=>a+(+r.qty||0)*(+r.cost||0),0)+hours*costH;
 const profit=total-cost, margin=total?profit/total*100:0; return {mat,tool,labour,total,cost,profit,margin};
}
function recalc(){const t=totals();updateLineTotals();$('#materialsSubtotal').textContent=money(t.mat);$('#toolsSubtotal').textContent=money(t.tool);$('#labourSubtotal').textContent=money(t.labour);$('#sumMaterials').textContent=money(t.mat);$('#sumTools').textContent=money(t.tool);$('#sumLabour').textContent=money(t.labour);$('#grandTotal').textContent=money(t.total);$('#grossMargin').textContent=`${t.margin.toFixed(1)}%`;$('#profitText').textContent=`${money(t.profit)} forecast gross profit`;renderOrder()}
function renderOrder(){const rows=state.materials.filter(r=>r.name&&+r.qty>0);$('#orderList').innerHTML=rows.length?rows.map(r=>`<div class="order-item"><span>${esc(r.name)}</span><strong>${r.qty}</strong></div>`).join(''):'<span class="muted">Add materials to generate the order list.</span>'}
function snapshot(){return {reference:$('#reference').value,customer:$('#customer').value,phone:$('#phone').value,date:$('#date').value,address:$('#address').value,work:$('#work').value,hours:$('#hours').value,labourCost:$('#labourCost').value,labourSell:$('#labourSell').value,discount:$('#discount').value,materials:state.materials,tools:state.tools,updated:new Date().toISOString(),total:totals().total}}
function loadSnap(s){for(const k of ['reference','customer','phone','date','address','work','hours','labourCost','labourSell','discount']) if(s[k]!=null) $('#'+k).value=s[k];state.materials=structuredClone(s.materials||[]);state.tools=structuredClone(s.tools||[]);renderRows('materials');renderRows('tools');recalc();saveDraft()}
let saveTimer; function saveDraft(){clearTimeout(saveTimer);$('#saveState').textContent='Saving…';saveTimer=setTimeout(()=>{localStorage.setItem('gf-draft',JSON.stringify(snapshot()));$('#saveState').textContent='Saved locally'},180)}
function archive(){const arr=JSON.parse(localStorage.getItem('gf-archive')||'[]');const s=snapshot();arr.unshift({...s,id:crypto.randomUUID()});localStorage.setItem('gf-archive',JSON.stringify(arr.slice(0,200)));renderArchive()}
function renderArchive(){const arr=JSON.parse(localStorage.getItem('gf-archive')||'[]');$('#archiveList').innerHTML=arr.length?arr.map(s=>`<div class="archive-entry"><strong>${esc(s.reference||'Untitled')} · ${esc(s.customer||'No customer')}</strong><small>${new Date(s.updated).toLocaleString('en-GB')} · ${money(s.total)}</small><div class="archive-actions"><button class="load" data-load="${s.id}">Open</button><button class="delete" data-delete="${s.id}">Delete</button></div></div>`).join(''):'<p class="muted">No archived estimates yet.</p>'}
function newEstimate(){if(confirm('Start a new estimate? The current draft will remain in your browser until overwritten.')){const n=parseInt(($('#reference').value.match(/\d+/)||['3072'])[0],10)+1;loadSnap({reference:`GF ${n}`,customer:'',phone:'',date:new Date().toISOString().slice(0,10),address:'',work:'',hours:0,labourCost:8,labourSell:20,discount:0,materials:[],tools:[]})}}

document.addEventListener('focusin',e=>{if(e.target.matches('.desc[data-kind]'))showSuggestions(e.target)});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.kind){const r=state[el.dataset.kind][+el.dataset.i];r[el.dataset.f]=el.dataset.f==='name'?el.value:+el.value;if(el.dataset.f==='name'){showSuggestions(el);const hit=lookup(el.dataset.kind,el.value);if(hit){r.sell=hit.sell;r.cost=hit.cost}}recalc();saveDraft()}else if(el.matches('input,textarea')){recalc();saveDraft()}})
document.addEventListener('mousedown',e=>{const pick=e.target.closest('[data-pick]');if(pick){e.preventDefault();pickSuggestion(pick.dataset.pick,pick.dataset.i,pick.dataset.name)}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!e.target.closest('.suggest-cell'))closeSuggestions();if(!b)return;if(b.dataset.remove){state[b.dataset.remove].splice(+b.dataset.i,1);renderRows(b.dataset.remove);recalc();saveDraft()}if(b.dataset.load){const arr=JSON.parse(localStorage.getItem('gf-archive')||'[]'),s=arr.find(x=>x.id===b.dataset.load);if(s){loadSnap(s);$('#archiveModal').classList.add('hidden')}}if(b.dataset.delete){let arr=JSON.parse(localStorage.getItem('gf-archive')||'[]');arr=arr.filter(x=>x.id!==b.dataset.delete);localStorage.setItem('gf-archive',JSON.stringify(arr));renderArchive()}})
$('#addMaterial').onclick=()=>addRow('materials');$('#addTool').onclick=()=>addRow('tools');$('#printBtn').onclick=()=>{archive();window.print()};$('#archiveBtn').onclick=()=>{renderArchive();$('#archiveModal').classList.remove('hidden')};$('#closeArchive').onclick=()=>$('#archiveModal').classList.add('hidden');$('#newBtn').onclick=newEstimate;$('#copyOrder').onclick=async()=>{const txt=state.materials.filter(r=>r.name&&+r.qty>0).map(r=>`${r.qty} × ${r.name}`).join('\n');if(txt)await navigator.clipboard.writeText(txt)};
fillLists();const draft=JSON.parse(localStorage.getItem('gf-draft')||'null');if(draft)loadSnap(draft);else{addRow('materials');addRow('tools',{name:'N/A',qty:0,sell:0,cost:0});recalc()}

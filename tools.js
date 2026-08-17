let tools=[];
let CATALOG_VERSION='legacy';
let viewMode=localStorage.getItem('gf-tools-view')||'list';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function costOnly(tool){const {sell,...rest}=tool||{};return rest}
function saveTools(){tools=tools.map(costOnly);localStorage.setItem('gf-tools',JSON.stringify(tools));localStorage.setItem('gf-tools-version',CATALOG_VERSION);$('#toolsSaveState').textContent='Saved locally'}
function toolGridCard(t){
 return `<article class="catalog-card tool-catalog-card" data-card-index="${t._i}">
  <div class="catalog-card-media"><div class="catalog-card-placeholder tool-card-placeholder"><span>GF</span><small>TOOL HIRE</small></div><div class="catalog-card-fade"></div></div>
  <div class="catalog-card-content">
   <div class="catalog-card-kicker">GOOD FOUNDATIONS TOOL HIRE</div>
   <input class="catalog-card-title" data-i="${t._i}" data-f="name" value="${esc(t.name)}" aria-label="Tool description">
   <div class="catalog-card-price-row"><label>Cost <span>£</span><input class="catalog-card-price" type="number" min="0" step="0.01" data-i="${t._i}" data-f="cost" value="${Number(t.cost||0).toFixed(2)}"></label><span class="tool-card-markup-note">Markup in estimator</span></div>
   <button class="catalog-card-remove" data-remove-tool="${t._i}" title="Remove tool">×</button>
  </div>
 </article>`;
}
function applyView(){const list=$('#toolsListView'),grid=$('#toolsGridView');if(!list||!grid)return;const isGrid=viewMode==='grid';list.hidden=isGrid;grid.hidden=!isGrid;document.querySelectorAll('[data-tool-view]').forEach(b=>b.classList.toggle('active',b.dataset.toolView===viewMode))}
function render(){
 const q=$('#toolsSearch').value.trim().toLowerCase();
 const rows=tools.map((t,i)=>({...t,_i:i})).filter(t=>!q||String(t.name||'').toLowerCase().includes(q));
 $('#toolsAdminBody').innerHTML=rows.map(t=>`<tr><td class="product-cell"><div class="product-thumb product-thumb-empty tool-thumb"><span>GF</span></div></td><td><input class="row-input admin-desc tool-desc" data-i="${t._i}" data-f="name" value="${esc(t.name)}" title="Edit tool description"></td><td><input class="row-input money" type="number" min="0" step="0.01" data-i="${t._i}" data-f="cost" value="${Number(t.cost||0).toFixed(2)}"></td><td><button class="remove" data-remove-tool="${t._i}" title="Remove tool">×</button></td></tr>`).join('');
 $('#toolsGridView').innerHTML=rows.map(toolGridCard).join('');
 $('#toolsCount').textContent=`${rows.length} of ${tools.length} tools shown`;applyView();
}
function bindEvents(){
 document.addEventListener('input',e=>{const el=e.target;if(el.id==='toolsSearch'){render();return}if(el.dataset.i!=null&&el.dataset.f){const i=+el.dataset.i;if(!tools[i])return;tools[i][el.dataset.f]=el.dataset.f==='name'?el.value:+el.value;$('#toolsSaveState').textContent='Saving…';saveTools()}});
 document.addEventListener('click',e=>{const view=e.target.closest('[data-tool-view]');if(view){viewMode=view.dataset.toolView;localStorage.setItem('gf-tools-view',viewMode);applyView();return}const b=e.target.closest('button');if(!b)return;if(b.dataset.removeTool!=null){const i=+b.dataset.removeTool;if(confirm(`Remove “${tools[i]?.name||'this tool'}” from the cost book?`)){tools.splice(i,1);saveTools();render()}}});
 $('#addToolRecord').onclick=()=>{tools.unshift({id:`custom-tool-${crypto.randomUUID()}`,name:'New tool',cost:0});saveTools();render();setTimeout(()=>document.querySelector('[data-i="0"][data-f="name"]')?.select(),0)};
}
async function init(){
 try{const data=await window.GF_DATA_PROMISE;CATALOG_VERSION=data.catalogVersion||'legacy';let base=(structuredClone(data.tools||[])).map(costOnly);try{const saved=JSON.parse(localStorage.getItem('gf-tools')||'null');if(Array.isArray(saved)&&saved.length){const byId=new Map(saved.map(t=>[t.id,t]));base=base.map(t=>byId.has(t.id)?{...t,...costOnly(byId.get(t.id))}:t);const ids=new Set(base.map(t=>t.id));saved.forEach(t=>{if(!ids.has(t.id))base.push(costOnly(t))})}}catch{}tools=base;saveTools();bindEvents();render()}catch(err){console.error('Could not load tools catalogue',err);$('#toolsCount').textContent='Could not load the tools catalogue. Refresh to try again.'}
}
init();

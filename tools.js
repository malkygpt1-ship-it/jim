let tools=[];
let CATALOG_VERSION='legacy';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(+n||0);

function saveTools(){
  localStorage.setItem('gf-tools',JSON.stringify(tools));
  localStorage.setItem('gf-tools-version',CATALOG_VERSION);
  $('#toolsSaveState').textContent='Saved locally';
}
function margin(t){
  const sell=+t.sell||0,cost=+t.cost||0;
  if(!sell)return 0;
  return ((sell-cost)/sell)*100;
}
function updateRowSummary(el,t){
  const row=el.closest('tr');if(!row)return;
  const m=margin(t),marginEl=row.querySelector('.tool-margin'),profitEl=row.querySelector('.tool-profit');
  if(marginEl){marginEl.textContent=`${m.toFixed(1)}%`;marginEl.classList.toggle('negative',m<0)}
  if(profitEl)profitEl.textContent=money((+t.sell||0)-(+t.cost||0));
}
function render(){
  const q=$('#toolsSearch').value.trim().toLowerCase();
  const rows=tools.map((t,i)=>({...t,_i:i})).filter(t=>!q||String(t.name||'').toLowerCase().includes(q));
  $('#toolsAdminBody').innerHTML=rows.map(t=>`<tr>
    <td class="product-cell"><div class="product-thumb product-thumb-empty tool-thumb"><span>GF</span></div></td>
    <td><input class="row-input admin-desc tool-desc" data-i="${t._i}" data-f="name" value="${esc(t.name)}" title="Edit tool description"></td>
    <td><input class="row-input money" type="number" min="0" step="0.01" data-i="${t._i}" data-f="cost" value="${Number(t.cost||0).toFixed(2)}"></td>
    <td><input class="row-input money" type="number" min="0" step="0.01" data-i="${t._i}" data-f="sell" value="${Number(t.sell||0).toFixed(2)}"></td>
    <td class="num"><strong class="tool-margin ${margin(t)<0?'negative':''}">${margin(t).toFixed(1)}%</strong><small class="tool-profit">${money((+t.sell||0)-(+t.cost||0))}</small></td>
    <td><button class="remove" data-remove-tool="${t._i}" title="Remove tool">×</button></td>
  </tr>`).join('');
  $('#toolsCount').textContent=`${rows.length} of ${tools.length} tools shown`;
}
function bindEvents(){
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.id==='toolsSearch'){render();return;}
    if(el.dataset.i!=null&&el.dataset.f){
      const i=+el.dataset.i;if(!tools[i])return;
      tools[i][el.dataset.f]=el.dataset.f==='name'?el.value:+el.value;
      $('#toolsSaveState').textContent='Saving…';
      saveTools();
      if(el.dataset.f!=='name')updateRowSummary(el,tools[i]);
    }
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.removeTool!=null){
      const i=+b.dataset.removeTool;
      if(confirm(`Remove “${tools[i]?.name||'this tool'}” from the price book?`)){
        tools.splice(i,1);saveTools();render();
      }
    }
  });
  $('#addToolRecord').onclick=()=>{
    tools.unshift({id:`custom-tool-${crypto.randomUUID()}`,name:'New tool',cost:0,sell:0});
    saveTools();render();
    setTimeout(()=>$('#toolsAdminBody input[data-i="0"][data-f="name"]')?.select(),0);
  };
}
async function init(){
  try{
    const data=await window.GF_DATA_PROMISE;
    CATALOG_VERSION=data.catalogVersion||'legacy';
    tools=structuredClone(data.tools||[]);
    bindEvents();render();
  }catch(err){
    console.error('Could not load tools catalogue',err);
    $('#toolsCount').textContent='Could not load the tools catalogue. Refresh to try again.';
  }
}
init();

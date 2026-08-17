let BASE=[];
let CATALOG_VERSION='legacy';
let materials=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function loadMaterials(){
  const base=structuredClone(BASE);
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
function saveMaterials(){
  localStorage.setItem('gf-materials',JSON.stringify(materials));
  localStorage.setItem('gf-materials-version',CATALOG_VERSION);
  $('#materialsSaveState').textContent='Saved locally';
}
function render(){
  const q=$('#materialsSearch').value.trim().toLowerCase();
  const rows=materials.map((m,i)=>({...m,_i:i})).filter(m=>!q||m.name.toLowerCase().includes(q));
  $('#materialsAdminBody').innerHTML=rows.map(m=>`<tr>
    <td><input class="row-input admin-desc" data-i="${m._i}" data-f="name" value="${esc(m.name)}"></td>
    <td><input class="row-input money" type="number" min="0" step="0.01" data-i="${m._i}" data-f="cost" value="${Number(m.cost||0).toFixed(2)}"></td>
    <td><input class="row-input money" type="number" min="0" step="0.01" data-i="${m._i}" data-f="sell" value="${Number(m.sell||0).toFixed(2)}"></td>
    <td><button class="remove" data-remove-material="${m._i}" title="Remove material">×</button></td>
  </tr>`).join('');
  $('#materialsCount').textContent=`${rows.length} of ${materials.length} materials shown`;
}
function bindEvents(){
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.id==='materialsSearch'){render();return;}
    if(el.dataset.i!=null&&el.dataset.f){
      const i=+el.dataset.i;if(!materials[i])return;
      materials[i][el.dataset.f]=el.dataset.f==='name'?el.value:+el.value;
      $('#materialsSaveState').textContent='Saving…';
      saveMaterials();
    }
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.removeMaterial!=null){
      const i=+b.dataset.removeMaterial;
      if(confirm(`Remove “${materials[i]?.name||'this material'}” from the price book?`)){
        materials.splice(i,1);saveMaterials();render();
      }
    }
  });
  $('#addMaterialRecord').onclick=()=>{materials.unshift({id:`custom-${crypto.randomUUID()}`,name:'New material',cost:0,sell:0});saveMaterials();render();setTimeout(()=>$('#materialsAdminBody input[data-i="0"]')?.select(),0)};
  $('#resetMaterials').onclick=()=>{if(confirm('Restore the complete original materials list and discard your material edits?')){materials=structuredClone(BASE);saveMaterials();render()}};
}
async function init(){
  try{
    const data=await window.GF_DATA_PROMISE;
    BASE=data.materials||[];
    CATALOG_VERSION=data.catalogVersion||'legacy';
    materials=loadMaterials();
    bindEvents();
    render();
  }catch(err){
    console.error('Could not load materials catalogue',err);
    $('#materialsCount').textContent='Could not load the materials catalogue. Refresh to try again.';
  }
}
init();

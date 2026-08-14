const BASE=(window.GF_DATA&&window.GF_DATA.materials)||[];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let materials=loadMaterials();

function loadMaterials(){
  try{const saved=JSON.parse(localStorage.getItem('gf-materials')||'null');if(Array.isArray(saved))return saved;}catch{}
  return structuredClone(BASE);
}
function saveMaterials(){
  localStorage.setItem('gf-materials',JSON.stringify(materials));
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

document.addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='materialsSearch'){render();return;}
  if(el.dataset.i!=null&&el.dataset.f){
    const i=+el.dataset.i; if(!materials[i])return;
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
$('#addMaterialRecord').onclick=()=>{materials.unshift({name:'New material',cost:0,sell:0});saveMaterials();render();setTimeout(()=>$('#materialsAdminBody input[data-i="0"]')?.select(),0)};
$('#resetMaterials').onclick=()=>{if(confirm('Restore the original materials list and discard your material edits?')){materials=structuredClone(BASE);saveMaterials();render()}};
render();
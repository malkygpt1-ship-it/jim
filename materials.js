let BASE=[];
let CATALOG_VERSION='legacy';
let materials=[];
let linkedOnly=false;
const SUPPLIER_DATA=window.GF_SUPPLIER_DATA||{};
const supplierMetaAttempted=new Set();
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function safeUrl(value){
  if(!value)return '';
  try{const u=new URL(value,location.origin);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}
}
function applySupplierData(list){
  return list.map(m=>{
    const meta=SUPPLIER_DATA[m.id];
    if(!meta)return m;
    return {...m,...meta,name:m.name,cost:m.cost,sell:m.sell,id:m.id,sourceRow:m.sourceRow};
  });
}
function loadMaterials(){
  const base=structuredClone(BASE);
  try{
    const saved=JSON.parse(localStorage.getItem('gf-materials')||'null');
    const savedVersion=localStorage.getItem('gf-materials-version');
    if(Array.isArray(saved)&&savedVersion===CATALOG_VERSION)return applySupplierData(saved);
    if(Array.isArray(saved)&&saved.length){
      const used=new Set();
      const merged=base.map(b=>{
        const i=saved.findIndex((s,idx)=>!used.has(idx)&&((b.id&&s.id===b.id)||s.name===b.name));
        if(i<0)return b;
        used.add(i);
        return {...b,...saved[i],id:b.id||saved[i].id,sourceRow:b.sourceRow??saved[i].sourceRow};
      });
      saved.forEach((s,i)=>{if(!used.has(i))merged.push(s)});
      const withSupplier=applySupplierData(merged);
      localStorage.setItem('gf-materials',JSON.stringify(withSupplier));
      localStorage.setItem('gf-materials-version',CATALOG_VERSION);
      return withSupplier;
    }
  }catch{}
  localStorage.setItem('gf-materials-version',CATALOG_VERSION);
  return applySupplierData(base);
}
function saveMaterials(){
  localStorage.setItem('gf-materials',JSON.stringify(materials));
  localStorage.setItem('gf-materials-version',CATALOG_VERSION);
  $('#materialsSaveState').textContent='Saved locally';
}
function materialSearchText(m){
  return [m.name,m.supplier,m.supplierSku,m.supplierTitle].filter(Boolean).join(' ').toLowerCase();
}
function productCell(m){
  const url=safeUrl(m.supplierUrl),image=safeUrl(m.supplierImage);
  if(!url)return '<div class="product-thumb product-thumb-empty" title="Supplier not linked yet"><span>GF</span></div>';
  const imageHtml=image?`<img src="${esc(image)}" alt="${esc(m.supplierTitle||m.name)}" loading="lazy">`:'<span>IBT</span>';
  return `<a class="product-thumb" href="${esc(url)}" target="_blank" rel="noopener" title="Open ${esc(m.supplierTitle||m.name)} at ${esc(m.supplier||'supplier')}">${imageHtml}</a>`;
}
function supplierCell(m){
  const url=safeUrl(m.supplierUrl);
  if(!url)return '<span class="supplier-unlinked">Not linked yet</span>';
  return `<a class="supplier-open" href="${esc(url)}" target="_blank" rel="noopener"><span class="supplier-badge">${esc(m.supplier||'Supplier')}</span><small>Open product ↗</small></a>`;
}
function descriptionCell(m){
  const url=safeUrl(m.supplierUrl);
  const supplierTitle=url?`<a class="supplier-product-title" href="${esc(url)}" target="_blank" rel="noopener">${esc(m.supplierTitle||'Open supplier product')} ↗</a>`:'';
  return `<div class="material-description"><input class="row-input admin-desc" data-i="${m._i}" data-f="name" value="${esc(m.name)}" title="Edit material description">${supplierTitle}</div>`;
}
function render(runEnrichment=true){
  const q=$('#materialsSearch').value.trim().toLowerCase();
  const rows=materials.map((m,i)=>({...m,_i:i})).filter(m=>(!linkedOnly||m.supplierUrl)&&(!q||materialSearchText(m).includes(q)));
  $('#materialsAdminBody').innerHTML=rows.map(m=>`<tr class="${m.supplierUrl?'supplier-linked-row':''}">
    <td class="product-cell">${productCell(m)}</td>
    <td>${descriptionCell(m)}</td>
    <td><code class="sku-code">${esc(m.supplierSku||'—')}</code></td>
    <td><input class="row-input money" type="number" min="0" step="0.01" data-i="${m._i}" data-f="cost" value="${Number(m.cost||0).toFixed(2)}"></td>
    <td><input class="row-input money" type="number" min="0" step="0.01" data-i="${m._i}" data-f="sell" value="${Number(m.sell||0).toFixed(2)}"></td>
    <td>${supplierCell(m)}</td>
    <td><button class="remove" data-remove-material="${m._i}" title="Remove material">×</button></td>
  </tr>`).join('');
  const totalLinked=materials.filter(m=>m.supplierUrl).length;
  $('#materialsCount').textContent=`${rows.length} of ${materials.length} materials shown · ${totalLinked} supplier-linked`;
  if(runEnrichment)queueMicrotask(()=>enrichSupplierMeta(rows));
}
async function enrichSupplierMeta(rows){
  const targets=rows.filter(m=>m.supplierUrl&&(!m.supplierSku||!m.supplierImage||!m.supplierTitle)&&!supplierMetaAttempted.has(m.id));
  if(!targets.length)return;
  targets.forEach(m=>supplierMetaAttempted.add(m.id));
  let changed=false;
  await Promise.all(targets.map(async row=>{
    try{
      const r=await fetch(`/api/ibt-product?url=${encodeURIComponent(row.supplierUrl)}`);
      if(!r.ok)return;
      const data=await r.json();
      const m=materials.find(x=>x.id===row.id);
      if(!m)return;
      if(data.sku&&!m.supplierSku){m.supplierSku=data.sku;changed=true}
      if(data.image&&!m.supplierImage){m.supplierImage=data.image;changed=true}
      if(data.title&&!m.supplierTitle){m.supplierTitle=data.title;changed=true}
      if(data.supplier&&!m.supplier){m.supplier=data.supplier;changed=true}
      if(changed)m.supplierCheckedAt=new Date().toISOString();
    }catch(err){console.warn('Could not enrich supplier metadata',row.id,err)}
  }));
  if(changed){saveMaterials();render(false)}
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
  document.addEventListener('change',e=>{
    if(e.target.id==='linkedOnly'){linkedOnly=e.target.checked;render()}
  });
  document.addEventListener('error',e=>{
    if(e.target.matches?.('.product-thumb img')){
      const link=e.target.closest('.product-thumb');
      e.target.remove();
      if(link&&!link.querySelector('span'))link.insertAdjacentHTML('beforeend','<span>IBT</span>');
    }
  },true);
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
  $('#resetMaterials').onclick=()=>{if(confirm('Restore the complete original materials list and discard your material edits?')){materials=applySupplierData(structuredClone(BASE));saveMaterials();render()}};
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

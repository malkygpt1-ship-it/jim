let BASE=[];
let CATALOG_VERSION='legacy';
let materials=[];
let linkedOnly=false;
let viewMode=localStorage.getItem('gf-materials-view')||'list';
const SUPPLIER_DATA=window.GF_SUPPLIER_DATA||{};
const supplierMetaAttempted=new Set();
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function safeUrl(value){if(!value)return '';try{const u=new URL(value,location.origin);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}}
function applySupplierData(list){return list.map(m=>{const meta=SUPPLIER_DATA[m.id];return meta?{...m,...meta,name:m.name,cost:m.cost,id:m.id,sourceRow:m.sourceRow}:m})}
function loadMaterials(){
 const base=structuredClone(BASE);
 try{
  const saved=JSON.parse(localStorage.getItem('gf-materials')||'null');
  const savedVersion=localStorage.getItem('gf-materials-version');
  if(Array.isArray(saved)&&savedVersion===CATALOG_VERSION)return applySupplierData(saved);
  if(Array.isArray(saved)&&saved.length){
   const used=new Set();
   const merged=base.map(b=>{const i=saved.findIndex((s,idx)=>!used.has(idx)&&((b.id&&s.id===b.id)||s.name===b.name));if(i<0)return b;used.add(i);return {...b,...saved[i],id:b.id||saved[i].id,sourceRow:b.sourceRow??saved[i].sourceRow}});
   saved.forEach((s,i)=>{if(!used.has(i))merged.push(s)});
   const withSupplier=applySupplierData(merged);localStorage.setItem('gf-materials',JSON.stringify(withSupplier));localStorage.setItem('gf-materials-version',CATALOG_VERSION);return withSupplier;
  }
 }catch{}
 localStorage.setItem('gf-materials-version',CATALOG_VERSION);return applySupplierData(base);
}
function saveMaterials(){localStorage.setItem('gf-materials',JSON.stringify(materials));localStorage.setItem('gf-materials-version',CATALOG_VERSION);$('#materialsSaveState').textContent='Saved locally'}
function materialSearchText(m){return [m.name,m.supplier,m.supplierSku,m.supplierTitle].filter(Boolean).join(' ').toLowerCase()}
function productCell(m){const url=safeUrl(m.supplierUrl),image=safeUrl(m.supplierImage);if(!url)return '<div class="product-thumb product-thumb-empty" title="Supplier not linked yet"><span>GF</span></div>';const imageHtml=image?`<img src="${esc(image)}" alt="${esc(m.supplierTitle||m.name)}" loading="lazy">`:'<span>IBT</span>';return `<a class="product-thumb" href="${esc(url)}" target="_blank" rel="noopener" title="Open ${esc(m.supplierTitle||m.name)} at ${esc(m.supplier||'supplier')}">${imageHtml}</a>`}
function supplierCell(m){const url=safeUrl(m.supplierUrl);if(!url)return '<span class="supplier-unlinked">Not linked yet</span>';return `<a class="supplier-open" href="${esc(url)}" target="_blank" rel="noopener"><span class="supplier-badge">${esc(m.supplier||'Supplier')}</span><small>Open product ↗</small></a>`}
function descriptionCell(m){const url=safeUrl(m.supplierUrl);const supplierTitle=url?`<a class="supplier-product-title" href="${esc(url)}" target="_blank" rel="noopener">${esc(m.supplierTitle||'Open supplier product')} ↗</a>`:'';return `<div class="material-description"><input class="row-input admin-desc" data-i="${m._i}" data-f="name" value="${esc(m.name)}" title="Edit material description">${supplierTitle}</div>`}
function gridCard(m){
 const image=safeUrl(m.supplierImage),url=safeUrl(m.supplierUrl);const title=esc(m.supplierTitle||m.name);const bg=image?`<img class="catalog-card-image" src="${esc(image)}" alt="${title}" loading="lazy">`:`<div class="catalog-card-placeholder"><span>GF</span><small>${url?'IBT linked':'No image yet'}</small></div>`;
 return `<article class="catalog-card ${url?'is-linked':''}" data-card-index="${m._i}">
  <div class="catalog-card-media">${url?`<a class="catalog-card-link" href="${esc(url)}" target="_blank" rel="noopener" aria-label="Open ${title} at supplier"></a>`:''}${bg}<div class="catalog-card-fade"></div></div>
  <div class="catalog-card-content">
   <div class="catalog-card-kicker">${esc(m.supplierSku||'GOOD FOUNDATIONS')}</div>
   <input class="catalog-card-title" data-i="${m._i}" data-f="name" value="${esc(m.name)}" aria-label="Material description">
   <div class="catalog-card-price-row"><label>Cost <span>£</span><input class="catalog-card-price" type="number" min="0" step="0.01" data-i="${m._i}" data-f="cost" value="${Number(m.cost||0).toFixed(2)}"></label>${url?`<a class="catalog-card-open" href="${esc(url)}" target="_blank" rel="noopener">IBT ↗</a>`:'<span class="catalog-card-unlinked">Unlinked</span>'}</div>
   <button class="catalog-card-remove" data-remove-material="${m._i}" title="Remove material">×</button>
  </div>
 </article>`;
}
function applyView(){
 const list=$('#materialsListView'),grid=$('#materialsGridView');if(!list||!grid)return;
 const isGrid=viewMode==='grid';list.hidden=isGrid;grid.hidden=!isGrid;
 document.querySelectorAll('[data-material-view]').forEach(b=>b.classList.toggle('active',b.dataset.materialView===viewMode));
}
function render(runEnrichment=true){
 const q=$('#materialsSearch').value.trim().toLowerCase();
 const rows=materials.map((m,i)=>({...m,_i:i})).filter(m=>(!linkedOnly||m.supplierUrl)&&(!q||materialSearchText(m).includes(q)));
 $('#materialsAdminBody').innerHTML=rows.map(m=>`<tr class="${m.supplierUrl?'supplier-linked-row':''}"><td class="product-cell">${productCell(m)}</td><td>${descriptionCell(m)}</td><td><code class="sku-code">${esc(m.supplierSku||'—')}</code></td><td><input class="row-input money" type="number" min="0" step="0.01" data-i="${m._i}" data-f="cost" value="${Number(m.cost||0).toFixed(2)}"></td><td>${supplierCell(m)}</td><td><button class="remove" data-remove-material="${m._i}" title="Remove material">×</button></td></tr>`).join('');
 $('#materialsGridView').innerHTML=rows.map(gridCard).join('');
 const totalLinked=materials.filter(m=>m.supplierUrl).length;$('#materialsCount').textContent=`${rows.length} of ${materials.length} materials shown · ${totalLinked} supplier-linked`;
 applyView();if(runEnrichment)queueMicrotask(()=>enrichSupplierMeta(rows));
}
async function enrichSupplierMeta(rows){
 const targets=rows.filter(m=>m.supplierUrl&&(!m.supplierSku||!m.supplierImage||!m.supplierTitle)&&!supplierMetaAttempted.has(m.id));if(!targets.length)return;targets.forEach(m=>supplierMetaAttempted.add(m.id));let changed=false;
 await Promise.all(targets.map(async row=>{try{const r=await fetch(`/api/ibt-product?url=${encodeURIComponent(row.supplierUrl)}`);if(!r.ok)return;const data=await r.json();const m=materials.find(x=>x.id===row.id);if(!m)return;let rowChanged=false;if(data.sku&&!m.supplierSku){m.supplierSku=data.sku;rowChanged=true}if(data.image&&!m.supplierImage){m.supplierImage=data.image;rowChanged=true}if(data.title&&!m.supplierTitle){m.supplierTitle=data.title;rowChanged=true}if(data.supplier&&!m.supplier){m.supplier=data.supplier;rowChanged=true}if(rowChanged){m.supplierCheckedAt=new Date().toISOString();changed=true}}catch(err){console.warn('Could not enrich supplier metadata',row.id,err)}}));if(changed){saveMaterials();render(false)}
}
function bindEvents(){
 document.addEventListener('input',e=>{const el=e.target;if(el.id==='materialsSearch'){render();return}if(el.dataset.i!=null&&el.dataset.f){const i=+el.dataset.i;if(!materials[i])return;materials[i][el.dataset.f]=el.dataset.f==='name'?el.value:+el.value;$('#materialsSaveState').textContent='Saving…';saveMaterials()}});
 document.addEventListener('change',e=>{if(e.target.id==='linkedOnly'){linkedOnly=e.target.checked;render()}});
 document.addEventListener('error',e=>{if(e.target.matches?.('.product-thumb img,.catalog-card-image')){if(e.target.matches('.product-thumb img')){const link=e.target.closest('.product-thumb');e.target.remove();if(link&&!link.querySelector('span'))link.insertAdjacentHTML('beforeend','<span>IBT</span>')}else{const media=e.target.closest('.catalog-card-media');e.target.remove();media?.insertAdjacentHTML('afterbegin','<div class="catalog-card-placeholder"><span>GF</span><small>Image unavailable</small></div>')}}},true);
 document.addEventListener('click',e=>{const view=e.target.closest('[data-material-view]');if(view){viewMode=view.dataset.materialView;localStorage.setItem('gf-materials-view',viewMode);applyView();return}const b=e.target.closest('button');if(!b)return;if(b.dataset.removeMaterial!=null){const i=+b.dataset.removeMaterial;if(confirm(`Remove “${materials[i]?.name||'this material'}” from the price book?`)){materials.splice(i,1);saveMaterials();render()}}});
 $('#addMaterialRecord').onclick=()=>{materials.unshift({id:`custom-${crypto.randomUUID()}`,name:'New material',cost:0});saveMaterials();render();setTimeout(()=>document.querySelector(`[data-i="0"][data-f="name"]`)?.select(),0)};
}
async function init(){try{const data=await window.GF_DATA_PROMISE;BASE=data.materials||[];CATALOG_VERSION=data.catalogVersion||'legacy';materials=loadMaterials();bindEvents();render()}catch(err){console.error('Could not load materials catalogue',err);$('#materialsCount').textContent='Could not load the materials catalogue. Refresh to try again.'}}
init();

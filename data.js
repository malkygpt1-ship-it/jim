// Full catalogue extracted from gf3093.xlsx plus verified IBT catalogue additions.
async function gfFetchCatalogPart(url){
  const r=await fetch(url,{cache:'no-store'});
  if(!r.ok)throw new Error(`${url} ${r.status}`);
  return (await r.text()).trim();
}
async function gfDecodeCatalog(b64){
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
}
function gfLoadScript(url){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=url;s.onload=resolve;s.onerror=()=>reject(new Error(`${url} could not load`));
    document.head.appendChild(s);
  });
}
function gfApplySupplierCosts(materials){
  const costs=window.GF_SUPPLIER_COSTS||{};
  return materials.map(m=>{
    const p=costs[m.id];
    return p?{...m,cost:p.cost,supplierPriceIncVat:p.sourcePriceIncVat,supplierPriceCheckedAt:new Date().toISOString().slice(0,10),supplierPriceBasis:p.basis}:m;
  });
}
window.GF_DATA_PROMISE=Promise.all([
  gfFetchCatalogPart('catalog/materials-1.b64'),
  gfFetchCatalogPart('catalog/materials-2.b64'),
  gfFetchCatalogPart('catalog/tools.b64'),
  gfLoadScript('supplier-costs.js')
    .then(()=>gfLoadScript('supplier-costs-batch14.js'))
    .then(()=>gfLoadScript('supplier-costs-batch15.js'))
    .then(()=>gfLoadScript('catalog-additions-decorative.js'))
    .then(()=>gfLoadScript('generated/ibt-costs.js'))
    .then(()=>gfLoadScript('generated/ibt-materials.js'))
]).then(async([materials1,materials2,tools])=>{
  const decoded=await gfDecodeCatalog(materials1+materials2);
  const manual=window.GF_CATALOG_ADDITIONS_DECORATIVE||[];
  const auto=window.GF_IBT_AUTO_MATERIALS||[];
  const merged=[];const seen=new Set();
  for(const m of [...decoded,...manual,...auto]){if(seen.has(m.id))continue;seen.add(m.id);merged.push(m)}
  return {
    catalogVersion:'2026-08-17-ibt-auto-sync-v1',
    materials:gfApplySupplierCosts(merged),
    tools:await gfDecodeCatalog(tools)
  };
});

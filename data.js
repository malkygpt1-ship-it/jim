// Full catalogue extracted from gf3093.xlsx.
// Materials: Excel Materials!C3:E567 (565 legacy rows) plus verified current catalogue additions.
// Tool hire: Materials!J3:L252 (250 rows).
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
    return p?{...m,cost:p.cost,supplierPriceIncVat:p.sourcePriceIncVat,supplierPriceCheckedAt:'2026-08-17',supplierPriceBasis:p.basis}:m;
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
]).then(async([materials1,materials2,tools])=>{
  const base=gfApplySupplierCosts(await gfDecodeCatalog(materials1+materials2));
  const seen=new Set(base.map(m=>m.id));
  const additions=(window.GF_CATALOG_ADDITIONS_DECORATIVE||[]).filter(m=>!seen.has(m.id));
  return {
    catalogVersion:'2026-08-17-ibt-incvat-v5-decorative',
    materials:[...base,...additions],
    tools:await gfDecodeCatalog(tools)
  };
});

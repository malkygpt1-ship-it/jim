// Full catalogue extracted from gf3093.xlsx.
// Materials: Excel Materials!C3:E567 (565 rows). Tool hire: Materials!J3:L252 (250 rows).
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
window.GF_DATA_PROMISE=Promise.all([
  gfFetchCatalogPart('catalog/materials-1.b64'),
  gfFetchCatalogPart('catalog/materials-2.b64'),
  gfFetchCatalogPart('catalog/tools.b64')
]).then(async([materials1,materials2,tools])=>({
  catalogVersion:'2026-08-17-full-v1',
  materials:await gfDecodeCatalog(materials1+materials2),
  tools:await gfDecodeCatalog(tools)
}));

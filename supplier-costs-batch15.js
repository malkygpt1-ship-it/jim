// Current IBT inc-VAT costs for supplier-data-batch15.js, verified 17 Aug 2026.
// Legacy estimator units are preserved: turf is per m², brick lines per 1000 and dense block per m².
(()=>{
const CHECKED_AT="2026-08-17";
const COSTS={
"mat-002":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus is sold as 4m width x 0.5m increment = 2m²; £16 / 2 = £8 per m²"},
"mat-003":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus current replacement; £16 per 2m² increment = £8 per m²"},
"mat-004":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus current replacement; £16 per 2m² increment = £8 per m²"},
"mat-005":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus current replacement; £16 per 2m² increment = £8 per m²"},
"mat-007":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus current replacement; £16 per 2m² increment = £8 per m²"},
"mat-009":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus current replacement; £16 per 2m² increment = £8 per m²"},
"mat-010":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus current replacement; £16 per 2m² increment = £8 per m²"},
"mat-011":{cost:8,sourcePriceIncVat:16,basis:"Lido Plus current replacement; £16 per 2m² increment = £8 per m²"},
"mat-017":{cost:9.49,sourcePriceIncVat:9.49,basis:"live IBT product page price for A&G Crescent 600x600x40 Natural Grey, each"},
"mat-018":{cost:9.49,sourcePriceIncVat:9.49,basis:"live IBT product page price for A&G Crescent 600x600x40 Charcoal, each"},
"mat-019":{cost:9.49,sourcePriceIncVat:9.49,basis:"live IBT product page price for A&G Crescent 600x600x40 Buff, each"},
"mat-024":{cost:1180,sourcePriceIncVat:1.18,basis:"current Calder Buff Rustic brick £1.18 each x 1000"},
"mat-027":{cost:22,sourcePriceIncVat:2.2,basis:"current 100mm 7N dense block £2.20 each x 10 blocks per m² nominal"}
};
Object.assign(window.GF_SUPPLIER_COSTS||(window.GF_SUPPLIER_COSTS={}),COSTS);
function apply(list){return (Array.isArray(list)?list:[]).map(m=>{const p=COSTS[m.id];return p?{...m,cost:p.cost,supplierPriceIncVat:p.sourcePriceIncVat,supplierPriceCheckedAt:CHECKED_AT,supplierPriceBasis:p.basis}:m})}
try{
  const saved=JSON.parse(localStorage.getItem('gf-materials')||'null');
  if(Array.isArray(saved))localStorage.setItem('gf-materials',JSON.stringify(apply(saved)));
  const draft=JSON.parse(localStorage.getItem('gf-draft')||'null');
  if(draft&&Array.isArray(draft.materials)){
    draft.materials=draft.materials.map(r=>{const p=COSTS[r.catalogId||r.id];return p?{...r,cost:p.cost,supplierPriceIncVat:p.sourcePriceIncVat,supplierPriceCheckedAt:CHECKED_AT,supplierPriceBasis:p.basis}:r});
    localStorage.setItem('gf-draft',JSON.stringify(draft));
  }
}catch(err){console.warn('Could not apply batch 15 supplier costs to local saved data',err)}
})();

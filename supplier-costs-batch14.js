// Current IBT inc-VAT costs for supplier-data-batch14.js.
// Per-metre legacy rows preserve their estimator unit basis.
(()=>{
const CHECKED_AT="2026-08-17";
const COSTS={
"mat-145":{cost:1.6083,sourcePriceIncVat:5.79,basis:"3.6m backing rail / 3.6 = per metre"},
"mat-148":{cost:0.9833,sourcePriceIncVat:4.72,basis:"4.8m fencing slat / 4.8 = per metre"},
"mat-149":{cost:0.9833,sourcePriceIncVat:4.72,basis:"4.8m fencing slat / 4.8 = per metre"},
"mat-211":{cost:2.6396,sourcePriceIncVat:12.67,basis:"4.8m timber / 4.8 = per metre"},
"mat-212":{cost:3.9125,sourcePriceIncVat:18.78,basis:"4.8m timber / 4.8 = per metre"},
"mat-217":{cost:22.5,sourcePriceIncVat:22.5,basis:"current connected IBT 2.4m sleeper inc VAT"},
"mat-218":{cost:29.94,sourcePriceIncVat:29.94,basis:"current connected IBT 3.0m sleeper inc VAT"},
"mat-232":{cost:17.88,sourcePriceIncVat:17.88,basis:"exact IBT product inc VAT"}
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
}catch(err){console.warn('Could not apply batch 14 supplier costs to local saved data',err)}
})();

// IBT inc-VAT material cost refresh, verified 17 Aug 2026.
// Connected materials only. Estimator-unit conversions are preserved for per-metre,
// per-thousand and pack-to-each rows. mat-251 is intentionally omitted: no
// unambiguous current price could be verified from its linked product page.
(()=>{
const CHECKED_AT="2026-08-17";
const COSTS={
"mat-001":{cost:3.9125,sourcePriceIncVat:18.78,basis:"4.8m product / 4.8 = per metre"},
"mat-006":{cost:12.9,sourcePriceIncVat:12.9,basis:"exact IBT product inc VAT"},
"mat-008":{cost:1.592,sourcePriceIncVat:15.92,basis:"10m roll / 10 = per metre"},
"mat-025":{cost:940,sourcePriceIncVat:0.94,basis:"each price × 1000 = per thousand"},
"mat-026":{cost:710,sourcePriceIncVat:0.71,basis:"each price × 1000 = per thousand"},
"mat-028":{cost:910,sourcePriceIncVat:0.91,basis:"each price × 1000 = per thousand"},
"mat-029":{cost:6.5,sourcePriceIncVat:6.5,basis:"exact IBT product inc VAT"},
"mat-030":{cost:59.99,sourcePriceIncVat:59.99,basis:"exact IBT product inc VAT"},
"mat-031":{cost:59.99,sourcePriceIncVat:59.99,basis:"exact IBT product inc VAT"},
"mat-032":{cost:59.99,sourcePriceIncVat:59.99,basis:"exact IBT product inc VAT"},
"mat-033":{cost:59.99,sourcePriceIncVat:59.99,basis:"exact IBT product inc VAT"},
"mat-034":{cost:59.99,sourcePriceIncVat:59.99,basis:"exact IBT product inc VAT"},
"mat-035":{cost:53.99,sourcePriceIncVat:53.99,basis:"exact IBT product inc VAT"},
"mat-038":{cost:5.3881,sourcePriceIncVat:22.63,basis:"4.2m product / 4.2 = per metre"},
"mat-039":{cost:9.37,sourcePriceIncVat:9.37,basis:"exact IBT indexed product inc VAT"},
"mat-040":{cost:150,sourcePriceIncVat:150,basis:"exact IBT product inc VAT"},
"mat-044":{cost:20.14,sourcePriceIncVat:20.14,basis:"exact IBT product inc VAT"},
"mat-045":{cost:3.12,sourcePriceIncVat:3.12,basis:"exact IBT product inc VAT"},
"mat-046":{cost:7.3,sourcePriceIncVat:7.3,basis:"exact IBT product inc VAT"},
"mat-051":{cost:110.99,sourcePriceIncVat:110.99,basis:"exact IBT product inc VAT"},
"mat-052":{cost:9.28,sourcePriceIncVat:9.28,basis:"exact IBT product inc VAT"},
"mat-057":{cost:30.53,sourcePriceIncVat:30.53,basis:"exact IBT product inc VAT"},
"mat-058":{cost:41.99,sourcePriceIncVat:41.99,basis:"exact IBT product inc VAT"},
"mat-059":{cost:64.8,sourcePriceIncVat:64.8,basis:"exact IBT product inc VAT"},
"mat-062":{cost:63.85,sourcePriceIncVat:63.85,basis:"exact IBT product inc VAT"},
"mat-063":{cost:2.65,sourcePriceIncVat:2.65,basis:"exact IBT product inc VAT"},
"mat-064":{cost:12.12,sourcePriceIncVat:12.12,basis:"exact IBT product inc VAT"},
"mat-065":{cost:12.12,sourcePriceIncVat:12.12,basis:"exact IBT product inc VAT"},
"mat-069":{cost:2.9167,sourcePriceIncVat:12.25,basis:"4.2m product / 4.2 = per metre"},
"mat-070":{cost:12.12,sourcePriceIncVat:12.12,basis:"exact IBT product inc VAT"},
"mat-071":{cost:2.65,sourcePriceIncVat:2.65,basis:"exact IBT product inc VAT"},
"mat-072":{cost:12.12,sourcePriceIncVat:12.12,basis:"exact IBT product inc VAT"},
"mat-073":{cost:20.14,sourcePriceIncVat:20.14,basis:"exact IBT product inc VAT"},
"mat-074":{cost:17.88,sourcePriceIncVat:17.88,basis:"exact IBT product inc VAT"},
"mat-075":{cost:2.48,sourcePriceIncVat:2.48,basis:"exact IBT product inc VAT"},
"mat-076":{cost:3.12,sourcePriceIncVat:3.12,basis:"exact IBT product inc VAT"},
"mat-077":{cost:2.48,sourcePriceIncVat:2.48,basis:"exact IBT product inc VAT"},
"mat-079":{cost:2.9167,sourcePriceIncVat:12.25,basis:"4.2m product / 4.2 = per metre"},
"mat-083":{cost:142.97,sourcePriceIncVat:142.97,basis:"exact IBT product inc VAT"},
"mat-084":{cost:9.28,sourcePriceIncVat:9.28,basis:"exact IBT product inc VAT"},
"mat-085":{cost:110.99,sourcePriceIncVat:110.99,basis:"exact IBT product inc VAT"},
"mat-086":{cost:9.28,sourcePriceIncVat:9.28,basis:"exact IBT product inc VAT"},
"mat-087":{cost:142.97,sourcePriceIncVat:142.97,basis:"exact IBT product inc VAT"},
"mat-088":{cost:9.28,sourcePriceIncVat:9.28,basis:"exact IBT product inc VAT"},
"mat-089":{cost:187.64,sourcePriceIncVat:187.64,basis:"exact IBT product inc VAT"},
"mat-090":{cost:10.01,sourcePriceIncVat:10.01,basis:"exact IBT product inc VAT"},
"mat-091":{cost:198.56,sourcePriceIncVat:198.56,basis:"exact IBT product inc VAT"},
"mat-092":{cost:9,sourcePriceIncVat:9,basis:"exact IBT indexed product inc VAT"},
"mat-093":{cost:142.97,sourcePriceIncVat:142.97,basis:"exact IBT product inc VAT"},
"mat-094":{cost:9.28,sourcePriceIncVat:9.28,basis:"exact IBT product inc VAT"},
"mat-095":{cost:152.24,sourcePriceIncVat:152.24,basis:"exact IBT product inc VAT"},
"mat-096":{cost:9.67,sourcePriceIncVat:9.67,basis:"exact IBT product inc VAT"},
"mat-097":{cost:125,sourcePriceIncVat:125,basis:"exact IBT product inc VAT"},
"mat-098":{cost:7.68,sourcePriceIncVat:7.68,basis:"exact IBT product inc VAT"},
"mat-099":{cost:150,sourcePriceIncVat:150,basis:"exact IBT product inc VAT"},
"mat-100":{cost:9.65,sourcePriceIncVat:9.65,basis:"exact IBT product inc VAT"},
"mat-101":{cost:142.97,sourcePriceIncVat:142.97,basis:"exact IBT product inc VAT"},
"mat-102":{cost:9.67,sourcePriceIncVat:9.67,basis:"exact IBT product inc VAT"},
"mat-103":{cost:174.73,sourcePriceIncVat:174.73,basis:"exact IBT product inc VAT"},
"mat-104":{cost:10.62,sourcePriceIncVat:10.62,basis:"exact IBT indexed product inc VAT"},
"mat-107":{cost:150,sourcePriceIncVat:150,basis:"exact IBT product inc VAT"},
"mat-108":{cost:2.2,sourcePriceIncVat:2.2,basis:"exact IBT product inc VAT"},
"mat-117":{cost:108.25,sourcePriceIncVat:108.25,basis:"exact IBT product inc VAT"},
"mat-118":{cost:113.04,sourcePriceIncVat:113.04,basis:"exact IBT product inc VAT"},
"mat-122":{cost:1180,sourcePriceIncVat:1.18,basis:"each price × 1000 = per thousand"},
"mat-126":{cost:1.66,sourcePriceIncVat:1.66,basis:"exact IBT product inc VAT"},
"mat-127":{cost:108.25,sourcePriceIncVat:108.25,basis:"exact IBT product inc VAT"},
"mat-128":{cost:15.54,sourcePriceIncVat:15.54,basis:"exact IBT product inc VAT"},
"mat-129":{cost:50.08,sourcePriceIncVat:50.08,basis:"exact IBT product inc VAT"},
"mat-130":{cost:4.62,sourcePriceIncVat:4.62,basis:"exact IBT product inc VAT"},
"mat-131":{cost:4.8,sourcePriceIncVat:4.8,basis:"exact IBT product inc VAT"},
"mat-132":{cost:6.5,sourcePriceIncVat:6.5,basis:"exact IBT product inc VAT"},
"mat-133":{cost:10.5,sourcePriceIncVat:10.5,basis:"exact IBT product inc VAT"},
"mat-134":{cost:7.38,sourcePriceIncVat:7.38,basis:"exact IBT product inc VAT"},
"mat-135":{cost:12.65,sourcePriceIncVat:12.65,basis:"exact IBT product inc VAT"},
"mat-136":{cost:40.07,sourcePriceIncVat:40.07,basis:"exact IBT product inc VAT"},
"mat-137":{cost:12.65,sourcePriceIncVat:12.65,basis:"exact IBT product inc VAT"},
"mat-138":{cost:1.66,sourcePriceIncVat:1.66,basis:"exact IBT product inc VAT"},
"mat-139":{cost:2.53,sourcePriceIncVat:2.53,basis:"exact IBT product inc VAT"},
"mat-142":{cost:5.79,sourcePriceIncVat:5.79,basis:"exact IBT product inc VAT"},
"mat-144":{cost:7.38,sourcePriceIncVat:7.38,basis:"exact IBT product inc VAT"},
"mat-147":{cost:38.21,sourcePriceIncVat:38.21,basis:"exact IBT product inc VAT"},
"mat-150":{cost:1.0556,sourcePriceIncVat:1.9,basis:"1.8m slat / 1.8 = per metre"},
"mat-151":{cost:1.0556,sourcePriceIncVat:3.8,basis:"3.6m slat / 3.6 = per metre"},
"mat-152":{cost:6.5,sourcePriceIncVat:6.5,basis:"exact IBT product inc VAT"},
"mat-153":{cost:0.434,sourcePriceIncVat:4.34,basis:"pack of 10 / 10 = per fixing"},
"mat-193":{cost:106.52,sourcePriceIncVat:106.52,basis:"exact IBT product inc VAT"},
"mat-194":{cost:7.06,sourcePriceIncVat:7.06,basis:"exact IBT product inc VAT"},
"mat-197":{cost:142.97,sourcePriceIncVat:142.97,basis:"exact IBT product inc VAT"},
"mat-208":{cost:34.08,sourcePriceIncVat:34.08,basis:"exact IBT product inc VAT"},
"mat-210":{cost:5.21,sourcePriceIncVat:5.21,basis:"exact IBT product inc VAT"},
"mat-235":{cost:8.71,sourcePriceIncVat:8.71,basis:"exact IBT product inc VAT"},
"mat-236":{cost:10.99,sourcePriceIncVat:10.99,basis:"exact IBT product inc VAT"},
"mat-249":{cost:142.97,sourcePriceIncVat:142.97,basis:"exact IBT product inc VAT"},
"mat-250":{cost:9.28,sourcePriceIncVat:9.28,basis:"exact IBT product inc VAT"},
"mat-254":{cost:12,sourcePriceIncVat:12,basis:"exact IBT indexed product inc VAT"},
"mat-268":{cost:152.24,sourcePriceIncVat:152.24,basis:"exact IBT product inc VAT"},
"mat-269":{cost:9.67,sourcePriceIncVat:9.67,basis:"exact IBT product inc VAT"},
"mat-274":{cost:59.99,sourcePriceIncVat:59.99,basis:"exact IBT product inc VAT"},
"mat-276":{cost:125,sourcePriceIncVat:125,basis:"exact IBT product inc VAT"},
"mat-488":{cost:8.71,sourcePriceIncVat:8.71,basis:"exact IBT product inc VAT"},
"mat-490":{cost:10.99,sourcePriceIncVat:10.99,basis:"exact IBT product inc VAT"},
"mat-495":{cost:8.71,sourcePriceIncVat:8.71,basis:"exact IBT product inc VAT"},
"mat-497":{cost:11.94,sourcePriceIncVat:11.94,basis:"exact IBT product inc VAT"},
"mat-498":{cost:22.5,sourcePriceIncVat:22.5,basis:"exact IBT product inc VAT"},
"mat-499":{cost:29.94,sourcePriceIncVat:29.94,basis:"exact IBT product inc VAT"},
"mat-500":{cost:37.8,sourcePriceIncVat:37.8,basis:"exact IBT product inc VAT"},
"mat-506":{cost:150,sourcePriceIncVat:150,basis:"exact IBT product inc VAT"},
"mat-507":{cost:9.65,sourcePriceIncVat:9.65,basis:"exact IBT product inc VAT"},
"mat-510":{cost:30.53,sourcePriceIncVat:30.53,basis:"exact IBT product inc VAT"},
"mat-511":{cost:41.99,sourcePriceIncVat:41.99,basis:"exact IBT product inc VAT"},
"mat-512":{cost:12,sourcePriceIncVat:12,basis:"exact IBT product inc VAT"},
"mat-523":{cost:90,sourcePriceIncVat:90,basis:"exact IBT product inc VAT"},
"mat-524":{cost:7.4,sourcePriceIncVat:7.4,basis:"exact IBT product inc VAT"},
"mat-525":{cost:2.6396,sourcePriceIncVat:12.67,basis:"4.8m product / 4.8 = per metre"},
"mat-526":{cost:2.6396,sourcePriceIncVat:12.67,basis:"4.8m product / 4.8 = per metre"},
"mat-527":{cost:3.9125,sourcePriceIncVat:18.78,basis:"4.8m product / 4.8 = per metre"},
"mat-528":{cost:2.9167,sourcePriceIncVat:12.25,basis:"4.2m product / 4.2 = per metre"},
"mat-529":{cost:2.48,sourcePriceIncVat:2.48,basis:"exact IBT product inc VAT"},
"mat-530":{cost:25.48,sourcePriceIncVat:25.48,basis:"exact IBT product inc VAT"},
"mat-531":{cost:26.28,sourcePriceIncVat:26.28,basis:"exact IBT product inc VAT"},
"mat-532":{cost:29.47,sourcePriceIncVat:29.47,basis:"exact IBT product inc VAT"},
"mat-533":{cost:38.21,sourcePriceIncVat:38.21,basis:"exact IBT product inc VAT"},
"mat-534":{cost:41.39,sourcePriceIncVat:41.39,basis:"exact IBT product inc VAT"},
"mat-535":{cost:46.16,sourcePriceIncVat:46.16,basis:"exact IBT product inc VAT"},
"mat-560":{cost:35.02,sourcePriceIncVat:35.02,basis:"exact IBT product inc VAT"},
"mat-561":{cost:35.83,sourcePriceIncVat:35.83,basis:"exact IBT product inc VAT"},
"mat-562":{cost:37.42,sourcePriceIncVat:37.42,basis:"exact IBT product inc VAT"},
"mat-563":{cost:38.21,sourcePriceIncVat:38.21,basis:"exact IBT product inc VAT"}
};
window.GF_SUPPLIER_COSTS=COSTS;

function applyCosts(list){
  return (Array.isArray(list)?list:[]).map(m=>{
    const p=COSTS[m.id];
    return p?{...m,cost:p.cost,supplierPriceIncVat:p.sourcePriceIncVat,supplierPriceCheckedAt:CHECKED_AT,supplierPriceBasis:p.basis}:m;
  });
}

if(window.GF_DATA_PROMISE){
  window.GF_DATA_PROMISE=window.GF_DATA_PROMISE.then(data=>({...data,materials:applyCosts(data.materials||[])}));
}

try{
  const saved=JSON.parse(localStorage.getItem("gf-materials")||"null");
  if(Array.isArray(saved))localStorage.setItem("gf-materials",JSON.stringify(applyCosts(saved)));
  const draft=JSON.parse(localStorage.getItem("gf-draft")||"null");
  if(draft&&Array.isArray(draft.materials)){
    draft.materials=draft.materials.map(r=>{
      const p=COSTS[r.catalogId||r.id];
      return p?{...r,cost:p.cost,supplierPriceIncVat:p.sourcePriceIncVat,supplierPriceCheckedAt:CHECKED_AT,supplierPriceBasis:p.basis}:r;
    });
    localStorage.setItem("gf-draft",JSON.stringify(draft));
  }
}catch(err){console.warn("Could not apply refreshed supplier costs to local saved data",err)}
})();

const SCRIPT_FILES=[
  'supplier-data.js','supplier-data-extra.js','supplier-data-batch4.js','supplier-data-batch5.js',
  'supplier-data-batch6.js','supplier-data-batch7.js','supplier-data-batch8.js','supplier-data-batch9.js',
  'supplier-data-batch10.js','supplier-data-batch11.js','supplier-data-batch12.js','supplier-data-batch13.js'
];
const ALLOWED_HOSTS=new Set(['ibtmerchants.co.uk','www.ibtmerchants.co.uk']);

function decodeHtml(s=''){
  return s.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&pound;/gi,'£').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n));
}
function stripHtml(s=''){
  return decodeHtml(s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
}
function parsePrice(html){
  const text=stripHtml(html);
  const inc=(text.match(/Price\s*:\s*£\s*([0-9,.]+)\s*Inc\s*VAT/i)||[])[1]||'';
  const ex=(text.match(/Price\s*:\s*£\s*([0-9,.]+)\s*Ex\s*VAT/i)||[])[1]||'';
  const simple=(text.match(/(?:From\s*:\s*)?Price\s*:\s*£\s*([0-9,.]+)/i)||[])[1]||'';
  const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title=h1?stripHtml(h1[1]):'';
  const sku=(text.match(/Vendor\s*Code\s*:\s*([A-Z0-9._\-/]+)/i)||[])[1]||'';
  const priceIncVat=Number(String(inc||simple).replace(/,/g,''));
  const priceExVat=Number(String(ex).replace(/,/g,''));
  return {title,sku,priceIncVat:Number.isFinite(priceIncVat)?priceIncVat:null,priceExVat:Number.isFinite(priceExVat)?priceExVat:null};
}
function parseSupplierScript(text,map){
  const entryRe=/["'](mat-\d+)["']\s*:\s*\{([\s\S]*?)(?=\}\s*,?\s*["']mat-\d+["']\s*:|\}\s*\}\s*\)?\s*;|\}\s*\)\s*;)/g;
  let m;
  while((m=entryRe.exec(text))){
    const id=m[1],body=m[2];
    const u=(body.match(/supplierUrl\s*:\s*["']([^"']+)["']/i)||[])[1];
    const note=(body.match(/supplierNote\s*:\s*["']([^"']+)["']/i)||[])[1]||'';
    if(u)map.set(id,{id,url:u,note});
  }
}
async function loadLinks(origin){
  const map=new Map();
  for(const file of SCRIPT_FILES){
    const r=await fetch(`${origin}/${file}`,{headers:{'user-agent':'GoodFoundationsEstimator/1.0'}});
    if(!r.ok)continue;
    parseSupplierScript(await r.text(),map);
  }
  return [...map.values()].sort((a,b)=>Number(a.id.slice(4))-Number(b.id.slice(4)));
}
async function readOne(item){
  try{
    const url=new URL(item.url);
    if(url.protocol!=='https:'||!ALLOWED_HOSTS.has(url.hostname)||!url.pathname.startsWith('/product/'))return {...item,error:'invalid-url'};
    const r=await fetch(url.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)','accept':'text/html,application/xhtml+xml'},cache:'no-store'});
    if(!r.ok)return {...item,error:`http-${r.status}`};
    const data=parsePrice(await r.text());
    if(!data.priceIncVat)return {...item,...data,error:'no-inc-vat-price'};
    return {...item,...data};
  }catch(err){return {...item,error:String(err?.message||err)}}
}
async function mapLimit(items,limit,fn){
  const out=new Array(items.length);let next=0;
  async function worker(){while(true){const i=next++;if(i>=items.length)return;out[i]=await fn(items[i])}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));
  return out;
}
export default async function handler(req,res){
  try{
    const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
    const host=(req.headers['x-forwarded-host']||req.headers.host).split(',')[0];
    const origin=`${proto}://${host}`;
    const all=await loadLinks(origin);
    const start=Math.max(0,parseInt(req.query.start||'0',10)||0);
    const limit=Math.min(40,Math.max(1,parseInt(req.query.limit||'30',10)||30));
    const slice=all.slice(start,start+limit);
    const results=await mapLimit(slice,8,readOne);
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({total:all.length,start,count:results.length,results});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:'Could not refresh IBT prices'});
  }
}

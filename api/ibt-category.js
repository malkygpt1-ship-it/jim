const ALLOWED_HOSTS=new Set(['ibtmerchants.co.uk','www.ibtmerchants.co.uk']);
function decode(s=''){return String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&pound;/gi,'£')}
function strip(s=''){return decode(String(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function abs(base,v){try{return new URL(decode(v),base).href}catch{return ''}}
export default async function handler(req,res){
 try{
  const raw=String(Array.isArray(req.query.url)?req.query.url[0]:req.query.url||'').trim();
  if(!raw)return res.status(400).json({error:'Missing url'});
  const url=new URL(raw);
  if(url.protocol!=='https:'||!ALLOWED_HOSTS.has(url.hostname)||!url.pathname.startsWith('/category/'))return res.status(400).json({error:'Only IBT category URLs allowed'});
  const r=await fetch(url.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)','accept':'text/html'}});
  if(!r.ok)return res.status(502).json({error:`IBT returned ${r.status}`});
  const html=await r.text(), seen=new Set(), products=[];
  for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']*\/product\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const productUrl=abs(url.href,m[1]); if(!productUrl||seen.has(productUrl))continue;
    const title=strip(m[2]); if(!title||title.length<3)continue;
    seen.add(productUrl); products.push({title,url:productUrl});
  }
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
  return res.status(200).json({category:url.href,count:products.length,products});
 }catch(err){console.error(err);return res.status(500).json({error:'Could not read IBT category'})}
}

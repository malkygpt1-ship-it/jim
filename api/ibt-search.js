const HOST='https://www.ibtmerchants.co.uk';
function decode(s=''){return String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&pound;/gi,'£')}
function strip(s=''){return decode(String(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function abs(v){try{return new URL(decode(v),HOST).href}catch{return ''}}
function normalizeSuggestion(x){
 if(typeof x==='string'){
  const href=(x.match(/href=["']([^"']+)["']/i)||[])[1]||'';
  return {title:strip(x),url:href?abs(href):''};
 }
 if(x&&typeof x==='object'){
  const title=x.label||x.value||x.name||x.title||x.text||'';
  const url=x.url||x.href||x.link||'';
  return {title:strip(title),url:url?abs(url):'',raw:x};
 }
 return {title:strip(x),url:''};
}
export default async function handler(req,res){
 try{
  const q=String(Array.isArray(req.query.q)?req.query.q[0]:req.query.q||'').trim();
  if(!q)return res.status(400).json({error:'Missing q'});
  const r=await fetch(HOST+'/wsinnes.asmx/getsuggestedsearch',{
   method:'POST',
   headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)','content-type':'application/x-www-form-urlencoded; charset=UTF-8','x-requested-with':'XMLHttpRequest'},
   body:new URLSearchParams({input:q}).toString()
  });
  const text=await r.text();
  let payload;try{payload=JSON.parse(text)}catch{payload=text}
  const raw=payload?.d??payload;
  const arr=Array.isArray(raw)?raw:(typeof raw==='string'?(()=>{try{return JSON.parse(raw)}catch{return [raw]}})():[]);
  const products=arr.map(normalizeSuggestion).filter(x=>x.title).slice(0,40);
  res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({q,status:r.status,products});
 }catch(e){console.error(e);return res.status(500).json({error:'IBT search failed'})}
}

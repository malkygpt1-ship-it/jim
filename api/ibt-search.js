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
function unwrap(text){
 let payload;try{payload=JSON.parse(text)}catch{payload=text}
 let raw=payload?.d??payload;
 if(typeof raw==='string'&&/<string\b/i.test(raw))raw=decode((raw.match(/<string\b[^>]*>([\s\S]*?)<\/string>/i)||[])[1]||raw);
 if(typeof raw==='string'){
  const trimmed=decode(raw).trim();
  try{raw=JSON.parse(trimmed)}catch{
   const arr=trimmed.match(/\[[\s\S]*\]/);if(arr){try{raw=JSON.parse(arr[0])}catch{}}
  }
 }
 return Array.isArray(raw)?raw:(raw?[raw]:[]);
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
  const products=unwrap(text).map(normalizeSuggestion).filter(x=>x.title).slice(0,40);
  res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({q,status:r.status,products,...(!products.length?{rawPreview:text.slice(0,500)}:{})});
 }catch(e){console.error(e);return res.status(500).json({error:'IBT search failed'})}
}

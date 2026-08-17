const HOST='https://www.ibtmerchants.co.uk';
function decode(s=''){return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&pound;/gi,'£')}
function strip(s=''){return decode(s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function abs(v){try{return new URL(decode(v),HOST).href}catch{return ''}}
function attrs(tag){const out={}; for(const m of tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g))out[m[1].toLowerCase()]=decode(m[2]); return out}
function parseForms(html){
 const forms=[];
 for(const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)){
  const fa=attrs('<form '+m[1]+'>'), body=m[2];
  const inputs=[];
  for(const i of body.matchAll(/<input\b[^>]*>/gi)){const a=attrs(i[0]);inputs.push(a)}
  forms.push({action:abs(fa.action||'/'),method:(fa.method||'get').toLowerCase(),inputs});
 }
 return forms;
}
function parseProducts(html){
 const items=[];
 const seen=new Set();
 for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']*\/product\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const url=abs(m[1]), title=strip(m[2]);
  if(!url||!title||seen.has(url))continue; seen.add(url); items.push({title,url});
 }
 return items;
}
export default async function handler(req,res){
 try{
  const q=String(Array.isArray(req.query.q)?req.query.q[0]:req.query.q||'').trim();
  const home=await fetch(HOST+'/',{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)'}});
  const h=await home.text();
  const forms=parseForms(h);
  const searchForm=forms.find(f=>f.inputs.some(i=>/search/i.test((i.placeholder||'')+' '+(i.name||'')+' '+(i.id||''))));
  if(!q)return res.status(200).json({searchForm});
  if(!searchForm)return res.status(500).json({error:'Could not discover IBT search form'});
  const searchInput=searchForm.inputs.find(i=>/search/i.test((i.placeholder||'')+' '+(i.name||'')+' '+(i.id||'')));
  const params=new URLSearchParams();
  for(const i of searchForm.inputs){if(i.name&&i.value)params.set(i.name,i.value)}
  if(searchInput?.name)params.set(searchInput.name,q); else params.set('search',q);
  let url=new URL(searchForm.action||'/search.aspx',HOST);
  let response;
  if(searchForm.method==='post'){
    response=await fetch(url,{method:'POST',headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)','content-type':'application/x-www-form-urlencoded'},body:params.toString()});
  }else{
    params.forEach((v,k)=>url.searchParams.set(k,v));
    response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)'}});
  }
  const html=await response.text();
  res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({q,requestUrl:response.url,status:response.status,products:parseProducts(html).slice(0,40)});
 }catch(e){console.error(e);res.status(500).json({error:'IBT search failed'})}
}

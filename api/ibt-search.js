const HOST='https://www.ibtmerchants.co.uk';
function decode(s=''){return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&pound;/gi,'£')}
function strip(s=''){return decode(s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function abs(v){try{return new URL(decode(v),HOST).href}catch{return ''}}
function parseProducts(html){
 const items=[],seen=new Set();
 for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']*\/product\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const url=abs(m[1]),title=strip(m[2]);
  if(!url||!title||seen.has(url))continue;seen.add(url);items.push({title,url});
 }
 return items;
}
function snippets(html,needle){
 const out=[];let pos=0,low=html.toLowerCase(),n=needle.toLowerCase();
 while((pos=low.indexOf(n,pos))>=0&&out.length<12){out.push(strip(html.slice(Math.max(0,pos-500),pos+800)));pos+=n.length}
 return out;
}
export default async function handler(req,res){
 try{
  const q=String(Array.isArray(req.query.q)?req.query.q[0]:req.query.q||'').trim();
  const debug=String(req.query.debug||'')==='1';
  if(debug){
   const home=await fetch(HOST+'/',{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)'}});
   const html=await home.text();
   return res.status(200).json({searchInput:snippets(html,'txbsitesearch'),searchRefs:snippets(html,'search.aspx')});
  }
  if(!q)return res.status(400).json({error:'Missing q'});
  const candidates=[
   `${HOST}/search.aspx?search=${encodeURIComponent(q)}`,
   `${HOST}/search.aspx?q=${encodeURIComponent(q)}`,
   `${HOST}/search.aspx?query=${encodeURIComponent(q)}`,
   `${HOST}/search.aspx?term=${encodeURIComponent(q)}`
  ];
  let best={products:[],url:'',status:0};
  for(const url of candidates){
   const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)'}});
   const html=await r.text(),products=parseProducts(html);
   if(products.length>best.products.length)best={products,url:r.url,status:r.status};
  }
  res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({q,requestUrl:best.url,status:best.status,products:best.products.slice(0,40)});
 }catch(e){console.error(e);res.status(500).json({error:'IBT search failed'})}
}

const ALLOWED_HOSTS=new Set(['ibtmerchants.co.uk','www.ibtmerchants.co.uk']);

function decodeHtml(s=''){
  return s.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&pound;/gi,'£').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n));
}
function stripHtml(s=''){
  return decodeHtml(s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
}
function absolute(base,value){
  if(!value)return '';
  try{return new URL(decodeHtml(value),base).href}catch{return ''}
}
function attr(tag,name){
  const m=tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`,'i'));
  return m?decodeHtml(m[1]):'';
}
function isLikelyProductImage(url,text=''){
  const hay=(url+' '+text).toLowerCase();
  return !/logo|icon|sprite|badge|payment|brand|nav-banner|\/ads\//i.test(hay);
}
function pickImage(html,base){
  const metas=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i
  ];
  for(const re of metas){
    const m=html.match(re);
    if(m){const u=absolute(base,m[1]);if(u&&isLikelyProductImage(u))return u}
  }

  const candidates=[];
  for(const m of html.matchAll(/<img\b[^>]*>/gi)){
    const tag=m[0];
    const text=(attr(tag,'alt')+' '+attr(tag,'class')+' '+attr(tag,'id')).toLowerCase();
    for(const a of ['data-zoom-image','data-large-image','data-src','data-original','src']){
      const raw=attr(tag,a);if(!raw)continue;
      const u=absolute(base,raw);if(!u||!isLikelyProductImage(u,text))continue;
      let score=0;
      if(/product|zoom|large|gallery|main/i.test(text+' '+u))score+=8;
      if(/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(u))score+=4;
      if(/DXR\.axd/i.test(u))score-=3;
      candidates.push({u,score});
    }
  }
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0]?.u||'';
}
function parseProduct(html,url){
  const text=stripHtml(html);
  const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title=h1?stripHtml(h1[1]):'';
  const sku=(text.match(/Vendor\s*Code\s*:\s*([A-Z0-9._\-/]+)/i)||[])[1]||'';
  const inc=(text.match(/Price\s*:\s*£\s*([0-9,.]+)\s*Inc\s*VAT/i)||[])[1]||'';
  const ex=(text.match(/Price\s*:\s*£\s*([0-9,.]+)\s*Ex\s*VAT/i)||[])[1]||'';
  const simple=(text.match(/(?:From\s*:\s*)?Price\s*:\s*£\s*([0-9,.]+)/i)||[])[1]||'';
  return {supplier:'IBT Merchants',title,sku,priceIncVat:inc||simple,priceExVat:ex,image:pickImage(html,url),url};
}

export default async function handler(req,res){
  try{
    const raw=Array.isArray(req.query.url)?req.query.url[0]:req.query.url;
    if(!raw)return res.status(400).json({error:'Missing url'});
    const url=new URL(raw);
    if(url.protocol!=='https:'||!ALLOWED_HOSTS.has(url.hostname)||!url.pathname.startsWith('/product/')){
      return res.status(400).json({error:'Only IBT product URLs are allowed'});
    }
    const page=await fetch(url.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)','accept':'text/html,application/xhtml+xml'}});
    if(!page.ok)return res.status(502).json({error:`IBT returned ${page.status}`});
    const html=await page.text();
    const data=parseProduct(html,url.href);
    if(!data.title||/page\s+not\s+found/i.test(data.title)||(!data.sku&&!data.priceIncVat&&!data.priceExVat)){
      return res.status(404).json({error:'IBT product page is no longer active'});
    }
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    if(req.query.image==='1'){
      if(!data.image)return res.status(404).end('No product image found');
      const img=await fetch(data.image,{headers:{'user-agent':'Mozilla/5.0 (compatible; GoodFoundationsEstimator/1.0)','referer':url.href}});
      if(!img.ok)return res.status(502).end(`Image returned ${img.status}`);
      res.setHeader('Content-Type',img.headers.get('content-type')||'image/jpeg');
      res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
      const buf=Buffer.from(await img.arrayBuffer());
      return res.status(200).send(buf);
    }
    return res.status(200).json(data);
  }catch(err){
    console.error(err);
    return res.status(500).json({error:'Could not read supplier product page'});
  }
}

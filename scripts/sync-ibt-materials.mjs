import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/ibt-categories.json'),'utf8'));
const categories=cfg.categories||[];
const UA='Mozilla/5.0 (compatible; GoodFoundationsEstimatorSync/1.0)';

function decodeHtml(s=''){return String(s).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&pound;/gi,'£').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n));}
function stripHtml(s=''){return decodeHtml(String(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());}
function abs(base,v){try{return new URL(decodeHtml(v),base).href}catch{return ''}}
function attr(tag,name){const m=tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`,'i'));return m?decodeHtml(m[1]):''}
function likelyImage(url,text=''){return !/logo|icon|sprite|badge|payment|brand|nav-banner|\/ads\//i.test((url+' '+text).toLowerCase())}
function pickImage(html,base){
  const metas=[/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i];
  for(const re of metas){const m=html.match(re);if(m){const u=abs(base,m[1]);if(u&&likelyImage(u))return u}}
  const c=[];for(const m of html.matchAll(/<img\b[^>]*>/gi)){const tag=m[0],text=(attr(tag,'alt')+' '+attr(tag,'class')+' '+attr(tag,'id')).toLowerCase();for(const a of ['data-zoom-image','data-large-image','data-src','data-original','src']){const raw=attr(tag,a);if(!raw)continue;const u=abs(base,raw);if(!u||!likelyImage(u,text))continue;let score=0;if(/product|zoom|large|gallery|main/i.test(text+' '+u))score+=8;if(/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(u))score+=4;c.push({u,score});}}
  c.sort((a,b)=>b.score-a.score);return c[0]?.u||'';
}
async function fetchText(url){const r=await fetch(url,{headers:{'user-agent':UA,'accept':'text/html,application/xhtml+xml'}});if(!r.ok)throw new Error(`${url} -> ${r.status}`);return await r.text();}
function parseCategory(html,url){const seen=new Set(),out=[];for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']*\/product\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){const u=abs(url,m[1]);if(!u||seen.has(u))continue;const title=stripHtml(m[2]);if(!title||title.length<3)continue;seen.add(u);out.push({title,url:u});}return out;}
function parseProduct(html,url){const text=stripHtml(html);const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);const title=h1?stripHtml(h1[1]):'';const sku=(text.match(/Vendor\s*Code\s*:\s*([A-Z0-9._\-/]+)/i)||[])[1]||'';const inc=(text.match(/Price\s*:\s*£\s*([0-9,.]+)\s*Inc\s*VAT/i)||[])[1]||'';const simple=(text.match(/(?:From\s*:\s*)?Price\s*:\s*£\s*([0-9,.]+)/i)||[])[1]||'';const price=Number(String(inc||simple).replace(/,/g,''));return {title,sku,priceIncVat:Number.isFinite(price)?price:null,image:pickImage(html,url),url};}
function walk(dir){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const p=path.join(dir,e.name);out=out.concat(e.isDirectory()?walk(p):[p]);}return out;}
function existingMaps(){const skuToId=new Map(),urlToId=new Map();let maxId=0;for(const f of walk(ROOT)){if(!/\.(?:js|json|html|md)$/i.test(f))continue;let s='';try{s=fs.readFileSync(f,'utf8')}catch{continue}for(const m of s.matchAll(/mat-(\d+)/g))maxId=Math.max(maxId,+m[1]);for(const m of s.matchAll(/["'](mat-\d+)["']\s*:\s*\{[\s\S]{0,600}?supplierSku\s*:\s*["']([^"']+)["'][\s\S]{0,800}?supplierUrl\s*:\s*["']([^"']+)["']/g)){skuToId.set(m[2].toUpperCase(),m[1]);urlToId.set(m[3],m[1]);}for(const m of s.matchAll(/["'](mat-\d+)["']\s*:\s*\{[\s\S]{0,800}?supplierUrl\s*:\s*["']([^"']+)["'][\s\S]{0,600}?supplierSku\s*:\s*["']([^"']+)["']/g)){skuToId.set(m[3].toUpperCase(),m[1]);urlToId.set(m[2],m[1]);}}
 return {skuToId,urlToId,maxId};}
function js(v){return JSON.stringify(v)}

const maps=existingMaps();let nextId=maps.maxId+1;const products=[];const errors=[];
for(const category of categories){console.log(`Category: ${category}`);try{const html=await fetchText(category);const links=parseCategory(html,category);console.log(`  ${links.length} products`);for(const [i,p] of links.entries()){try{const ph=await fetchText(p.url);const d=parseProduct(ph,p.url);if(!d.title||!d.sku||d.priceIncVat==null)throw new Error('missing title/SKU/price');products.push({...d,category});console.log(`  [${i+1}/${links.length}] ${d.sku} £${d.priceIncVat.toFixed(2)} ${d.title}`);await new Promise(r=>setTimeout(r,120));}catch(e){errors.push({url:p.url,error:String(e.message||e)});console.warn(`  SKIP ${p.url}: ${e.message}`)}}}catch(e){errors.push({url:category,error:String(e.message||e)});console.warn(`FAILED ${category}: ${e.message}`)}}

const unique=new Map();for(const p of products)unique.set(p.sku.toUpperCase(),p);
const additions=[],supplier={},costs={};let matched=0,added=0;
for(const p of [...unique.values()].sort((a,b)=>a.title.localeCompare(b.title))){let id=maps.skuToId.get(p.sku.toUpperCase())||maps.urlToId.get(p.url);if(!id){id=`mat-${String(nextId++).padStart(3,'0')}`;additions.push({id,name:p.title,cost:p.priceIncVat});added++;}else matched++;
 supplier[id]={supplier:'IBT Merchants',supplierSku:p.sku,supplierTitle:p.title,supplierUrl:p.url,supplierImage:p.image,supplierVerified:true};
 costs[id]={cost:p.priceIncVat,sourcePriceIncVat:p.priceIncVat,basis:'Exact IBT product-page price including VAT'};
}

fs.mkdirSync(path.join(ROOT,'generated'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'generated/ibt-materials.js'),`// AUTO-GENERATED by scripts/sync-ibt-materials.mjs. Do not edit manually.\nwindow.GF_IBT_AUTO_MATERIALS=${JSON.stringify(additions,null,2)};\n`);
fs.writeFileSync(path.join(ROOT,'generated/ibt-supplier-data.js'),`// AUTO-GENERATED by scripts/sync-ibt-materials.mjs. Do not edit manually.\nObject.assign(window.GF_SUPPLIER_DATA||(window.GF_SUPPLIER_DATA={}),${JSON.stringify(supplier,null,2)});\n`);
fs.writeFileSync(path.join(ROOT,'generated/ibt-costs.js'),`// AUTO-GENERATED by scripts/sync-ibt-materials.mjs. Exact product-page inc-VAT prices.\nObject.assign(window.GF_SUPPLIER_COSTS||(window.GF_SUPPLIER_COSTS={}),${JSON.stringify(costs,null,2)});\n`);
const summary={generatedAt:new Date().toISOString(),categories:categories.length,productsSeen:products.length,uniqueSkus:unique.size,matchedExisting:matched,addedNew:added,errors};
fs.writeFileSync(path.join(ROOT,'generated/ibt-sync-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));

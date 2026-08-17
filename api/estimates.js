import crypto from 'crypto';
import {del,list,put} from '@vercel/blob';
import {requireAuth} from './_session.js';

const PREFIX='estimates/';
const MAX_PDF_BYTES=3*1024*1024;

function metaEncode(value){return Buffer.from(String(value||''),'utf8').toString('base64url')}
function metaDecode(value){try{return Buffer.from(String(value||''),'base64url').toString('utf8')}catch{return ''}}
function stamp(date=new Date()){return date.toISOString().replace(/[-:.]/g,'')}
function storageError(err){
  const text=String(err?.message||err||'');
  return /token|blob|store|oidc/i.test(text)?'Private estimate storage is not configured yet. Create a Private Blob store for this Vercel project.':'Could not access the estimate archive.';
}
function parseBody(req){
  if(typeof req.body==='string')return JSON.parse(req.body||'{}');
  return req.body||{};
}
function pdfBuffer(value){
  const buf=Buffer.from(String(value||''),'base64');
  if(!buf.length||buf.length>MAX_PDF_BYTES||buf.subarray(0,5).toString()!=='%PDF-')throw new Error('Invalid PDF payload');
  return buf;
}
function parseFolder(folder){
  const parts=folder.split('.');
  if(parts.length<5)return null;
  const [savedKey,ref64,customer64,totalCents]=parts;
  return {
    savedKey,
    reference:metaDecode(ref64)||'Untitled',
    customer:metaDecode(customer64)||'No customer',
    total:(Number(totalCents)||0)/100,
  };
}

async function listAll(){
  const out=[];let cursor;
  do{
    const page=await list({prefix:PREFIX,limit:1000,cursor});
    out.push(...(page.blobs||[]));
    cursor=page.hasMore?page.cursor:undefined;
  }while(cursor);
  return out;
}

async function listEstimates(req,res){
  try{
    const blobs=await listAll();
    const groups=new Map();
    for(const blob of blobs){
      const bits=String(blob.pathname||'').split('/');
      if(bits.length!==3||bits[0]!=='estimates')continue;
      const folder=bits[1],file=bits[2];
      if(file!=='quote.pdf'&&file!=='bom.pdf')continue;
      const meta=parseFolder(folder);if(!meta)continue;
      let row=groups.get(folder);
      if(!row){row={id:folder,...meta,savedAt:blob.uploadedAt||new Date().toISOString(),quotePath:'',bomPath:''};groups.set(folder,row)}
      const uploaded=new Date(blob.uploadedAt||0).getTime();
      if(uploaded>new Date(row.savedAt||0).getTime())row.savedAt=blob.uploadedAt;
      if(file==='quote.pdf')row.quotePath=blob.pathname;
      if(file==='bom.pdf')row.bomPath=blob.pathname;
    }
    const estimates=[...groups.values()].filter(x=>x.quotePath&&x.bomPath).sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt));
    res.setHeader('Cache-Control','private, no-store');
    return res.status(200).json({estimates});
  }catch(err){
    console.error('estimate archive list failed',err);
    return res.status(503).json({error:storageError(err)});
  }
}

async function saveEstimate(req,res){
  let quoteBlob;
  try{
    const body=parseBody(req);
    const reference=String(body.reference||'Untitled').trim()||'Untitled';
    const customer=String(body.customer||'No customer').trim()||'No customer';
    const totalCents=Math.max(0,Math.round((Number(body.total)||0)*100));
    const folder=`${stamp()}.${metaEncode(reference)}.${metaEncode(customer)}.${totalCents}.${crypto.randomUUID()}`;
    const quote=pdfBuffer(body.quoteBase64);
    const bom=pdfBuffer(body.bomBase64);
    quoteBlob=await put(`${PREFIX}${folder}/quote.pdf`,quote,{access:'private',addRandomSuffix:false,contentType:'application/pdf'});
    await put(`${PREFIX}${folder}/bom.pdf`,bom,{access:'private',addRandomSuffix:false,contentType:'application/pdf'});
    return res.status(201).json({ok:true,id:folder});
  }catch(err){
    console.error('estimate archive save failed',err);
    if(quoteBlob?.url){try{await del(quoteBlob.url)}catch{}}
    const message=/Invalid PDF payload/.test(String(err?.message||''))?'The estimate PDFs could not be generated.':storageError(err);
    return res.status(503).json({error:message});
  }
}

export default async function handler(req,res){
  if(!requireAuth(req,res))return;
  if(req.method==='GET')return listEstimates(req,res);
  if(req.method==='POST')return saveEstimate(req,res);
  return res.status(405).json({error:'Method not allowed'});
}

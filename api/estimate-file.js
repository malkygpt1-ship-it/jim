import {get} from '@vercel/blob';
import {requireAuth} from './_session.js';

function safeName(value){return String(value||'estimate.pdf').replace(/[\r\n"\\/]+/g,'-').slice(0,140)||'estimate.pdf'}

export default async function handler(req,res){
  if(!requireAuth(req,res))return;
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const pathname=Array.isArray(req.query.pathname)?req.query.pathname[0]:req.query.pathname;
  if(!pathname||!String(pathname).startsWith('estimates/')||!String(pathname).endsWith('.pdf')||String(pathname).includes('..')){
    return res.status(400).json({error:'Invalid archive path'});
  }
  try{
    const result=await get(String(pathname),{access:'private',ifNoneMatch:req.headers['if-none-match']||undefined});
    if(!result)return res.status(404).end('Not found');
    if(result.statusCode===304){
      res.setHeader('ETag',result.blob.etag);
      res.setHeader('Cache-Control','private, no-cache');
      return res.status(304).end();
    }
    if(result.statusCode!==200||!result.stream)return res.status(404).end('Not found');
    const buffer=Buffer.from(await new Response(result.stream).arrayBuffer());
    const filename=safeName(Array.isArray(req.query.filename)?req.query.filename[0]:req.query.filename);
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`inline; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('ETag',result.blob.etag);
    res.setHeader('Cache-Control','private, no-cache');
    return res.status(200).send(buffer);
  }catch(err){
    console.error('estimate file read failed',err);
    return res.status(503).end('Archive unavailable');
  }
}

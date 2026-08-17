import {createSessionToken,setSessionCookie,verifyCredentials} from './_session.js';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const username=String(body.username||'').trim();
  const password=String(body.password||'');
  if(!verifyCredentials(username,password))return res.status(401).json({error:'Incorrect username or password.'});
  setSessionCookie(res,createSessionToken(username));
  return res.status(200).json({ok:true});
}

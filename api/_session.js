import crypto from 'crypto';

const COOKIE_NAME='gf_session';
const LEGACY_USER='jimrutherford';
const LEGACY_SALT='gf-estimator-login-v1';
const LEGACY_PASSWORD_HASH='d149534b079403128ac6143df42a232e6a42da33df84c0b6eafca70173aa6cb4';
const FALLBACK_SESSION_SECRET='gf-estimator-pre-storage-session-v1';

function sessionSecret(){
  return process.env.GF_SESSION_SECRET||process.env.BLOB_READ_WRITE_TOKEN||FALLBACK_SESSION_SECRET;
}

function b64url(value){return Buffer.from(value).toString('base64url')}
function sign(value){return crypto.createHmac('sha256',sessionSecret()).update(value).digest('base64url')}
function safeEqual(a,b){
  const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));
  return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
}

export function verifyCredentials(username,password){
  const expectedUser=process.env.GF_USERNAME||LEGACY_USER;
  if(!safeEqual(String(username||''),expectedUser))return false;
  if(process.env.GF_PASSWORD)return safeEqual(String(password||''),process.env.GF_PASSWORD);
  const derived=crypto.scryptSync(String(password||''),LEGACY_SALT,32,{N:16384,r:8,p:1}).toString('hex');
  return safeEqual(derived,LEGACY_PASSWORD_HASH);
}

export function createSessionToken(username){
  const payload=b64url(JSON.stringify({sub:String(username||''),exp:Date.now()+12*60*60*1000}));
  return `${payload}.${sign(payload)}`;
}

export function setSessionCookie(res,token){
  const secure=process.env.VERCEL?' Secure;':'';
  res.setHeader('Set-Cookie',`${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200;${secure}`);
}

export function clearSessionCookie(res){
  const secure=process.env.VERCEL?' Secure;':'';
  res.setHeader('Set-Cookie',`${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;${secure}`);
}

function readCookie(req){
  const raw=req.headers?.cookie||'';
  const match=raw.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE_NAME+'='));
  return match?decodeURIComponent(match.slice(COOKIE_NAME.length+1)):'';
}

export function isAuthenticated(req){
  try{
    const token=readCookie(req);if(!token)return false;
    const [payload,sig]=token.split('.');if(!payload||!sig||!safeEqual(sig,sign(payload)))return false;
    const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    return Number(data.exp)>Date.now();
  }catch{return false}
}

export function requireAuth(req,res){
  if(isAuthenticated(req))return true;
  res.status(401).json({error:'Session expired. Please log in again.'});
  return false;
}

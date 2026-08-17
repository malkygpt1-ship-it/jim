import {clearSessionCookie} from './_session.js';

export default async function handler(req,res){
  clearSessionCookie(res);
  return res.status(200).json({ok:true});
}

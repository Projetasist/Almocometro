import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const sessionCookie='__Host-almocometro-session';
export function authConfig(){return env as unknown as {SUPABASE_AUTH_URL:string;SUPABASE_PUBLISHABLE_KEY:string;ADMIN_EMAIL:string};}
export async function authRequest(path:string,body?:unknown,token?:string,method?:string){
 const c=authConfig();
 const response=await fetch(c.SUPABASE_AUTH_URL+'/auth/v1/'+path,{method:method||(body?'POST':'GET'),headers:{apikey:c.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual',signal:AbortSignal.timeout(15000),cache:'no-store'});
 const data=await response.json().catch(()=>({})) as {id?:string;email?:string;email_confirmed_at?:string;access_token?:string;expires_in?:number};return {ok:response.ok,status:response.status,data};
}
export async function verifiedUser(token:string){
 if(!token||token.length>8192)return null;
 const r=await authRequest('user',undefined,token);
 if(!r.ok||!r.data.id||!r.data.email_confirmed_at||!r.data.email)return null;
 return {userId:r.data.id,email:r.data.email as string,displayName:r.data.email as string,fullName:null};
}
export async function getResponsibleUser(){
 const token=(await cookies()).get(sessionCookie)?.value;
 if(token){try{const u=await verifiedUser(token);if(u)return u;}catch{}}
 // Preserve the already verified Sites identity during adoption of email login.
 return getChatGPTUser();
}
export async function requireResponsibleUser(){const u=await getResponsibleUser();if(!u)redirect('/login');return u;}

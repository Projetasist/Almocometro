import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authConfig,authRequest,sessionCookie,verifiedUser} from '@/lib/responsible-auth';
export const dynamic='force-dynamic';
const schema=z.object({action:z.enum(['login','register','recover','session','reset','logout']),email:z.string().email().max(254).optional(),password:z.string().min(8).max(128).optional(),token:z.string().max(8192).optional()});
const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
function setSession(response:NextResponse,token:string,seconds=3600){response.cookies.set(sessionCookie,token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:Math.min(seconds,3600)});return response;}
export async function POST(req:NextRequest){try{
 if(req.headers.get('origin')!==req.nextUrl.origin)return fail('Origem inválida.',403);
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return fail('Confira o e-mail e use uma senha de pelo menos 8 caracteres.');
 const b=parsed.data,c=authConfig();const email=(b.email||'').trim().toLowerCase();
 if(b.action==='logout'){
  const token=req.cookies.get(sessionCookie)?.value;
  if(token)await authRequest('logout',{},token).catch(()=>{});
  return setSession(NextResponse.json({saved:true}), '',0);
 }
 if(b.action==='session'){
  if(!b.token)return fail('Link inválido ou expirado.');const u=await verifiedUser(b.token);
  if(!u||u.email.toLowerCase()!==c.ADMIN_EMAIL.toLowerCase())return fail('Este e-mail não está autorizado para o painel.',403);
  return setSession(NextResponse.json({saved:true}),b.token);
 }
 if(b.action==='reset'){
  const token=req.cookies.get(sessionCookie)?.value;if(!token||!b.password)return fail('Abra novamente o link enviado ao seu e-mail.',401);
  const u=await verifiedUser(token);if(!u||u.email.toLowerCase()!==c.ADMIN_EMAIL.toLowerCase())return fail('Acesso não autorizado.',403);
  const r=await authRequest('user',{password:b.password},token,'PUT');
  if(!r.ok)return fail('Não foi possível alterar a senha. Use uma senha diferente ou solicite outro link.');
  return setSession(NextResponse.json({saved:true,message:'Senha alterada. Entre com sua nova senha.'}), '',0);
 }
 if(!email)return fail('Informe seu e-mail.');
 if(email!==c.ADMIN_EMAIL.toLowerCase()){
  if(b.action==='recover')return NextResponse.json({message:'Se houver uma conta autorizada, você receberá as instruções no e-mail.'});
  return fail('Use o e-mail do responsável autorizado pelo sistema.',403);
 }
 const callback=req.nextUrl.origin+'/login/confirmar';
 if(b.action==='recover'){
  const r=await authRequest('recover?redirect_to='+encodeURIComponent(callback),{email});
  if(!r.ok)return fail('Não foi possível enviar o e-mail agora. Aguarde e tente novamente.',r.status===429?429:503);
  return NextResponse.json({message:'Se houver uma conta autorizada, você receberá as instruções no e-mail.'});
 }
 if(!b.password)return fail('Informe uma senha de pelo menos 8 caracteres.');
 if(b.action==='register'){
  const r=await authRequest('signup?redirect_to='+encodeURIComponent(callback),{email,password:b.password});
  if(!r.ok)return fail('Não foi possível concluir o cadastro. Confira os dados ou tente recuperar sua senha.',r.status===429?429:400);
  return NextResponse.json({message:'Confira seu e-mail para confirmar o cadastro. Se já tiver conta, use Entrar ou Esqueci minha senha.'});
 }
 const r=await authRequest('token?grant_type=password',{email,password:b.password});
 if(!r.ok||!r.data.access_token)return fail('E-mail ou senha inválidos, ou cadastro ainda não confirmado.',401);
 const u=await verifiedUser(r.data.access_token);if(!u||u.email.toLowerCase()!==c.ADMIN_EMAIL.toLowerCase())return fail('Acesso não autorizado.',403);
 return setSession(NextResponse.json({saved:true}),r.data.access_token,r.data.expires_in);
 }catch{return fail('Não foi possível conectar. Tente novamente em instantes.',503);}}

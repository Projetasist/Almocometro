// Authenticated, server-only bridge. The digest is not an API credential.
const TOKEN_HASH = "1b1cea06da0d75f397d109bd84d9b2a490724c8a7a0c7f79af81707e261c3f03";
const actions = new Set(['health','employees','day','mode','history','prices','price','control','delete','register','edit','reply','settle']);
Deno.serve(async req => {
 const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const token=req.headers.get('x-almocometro-token')||'';
 if(token.length!==64)return reply({error:'Unauthorized'},401);
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)));
 let diff=0;for(let i=0;i<32;i++)diff|=digest[i]^parseInt(TOKEN_HASH.slice(i*2,i*2+2),16);
 if(diff)return reply({error:'Unauthorized'},401);
 try {
  const raw=await req.text();if(raw.length>16384)return reply({error:'Payload too large'},413);
  const body=JSON.parse(raw);
  if(!actions.has(body.action)||!body.p||typeof body.p!=='object'||Array.isArray(body.p))return reply({error:'Invalid operation'},400);
  const url=Deno.env.get('SUPABASE_URL');
  const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
  const key=keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return reply({error:'Database unavailable'},503);
  const headers={'Content-Type':'application/json',apikey:key};
  if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
  const response=await fetch(url+'/rest/v1/rpc/almocometro_operation',{method:'POST',headers,body:JSON.stringify({p_action:body.action,p:body.p}),redirect:'error',signal:AbortSignal.timeout(15000)});
  const result=await response.json();
  if(!response.ok){
   if(result.code==='23505')return reply({error:'Já existe um cadastro com este nome neste departamento.',status:409});
   return reply({error:'Não foi possível acessar o banco.',status:503});
  }
  return reply(result);
 } catch {return reply({error:'Não foi possível acessar o banco.'},503)}
});

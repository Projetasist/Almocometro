import {NextRequest,NextResponse} from 'next/server';
import {runtime,settlePending} from '@/lib/lunch';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 const expected=runtime().LUNCH_SCHEDULE_TOKEN;
 const supplied=req.headers.get('x-lunch-service-token');
 if(!expected||!supplied)return NextResponse.json({error:'Unauthorized'},{status:401});
 const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [a,b]=await Promise.all([hash(expected),hash(supplied)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 if(diff)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json(await settlePending(),{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return NextResponse.json({error:'Não foi possível atualizar os pendentes.'},{status:503})}
}

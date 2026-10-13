import {storeCall} from '@/lib/supabase-store';
import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {clock,runtime,settlePending} from '@/lib/lunch';
import {history} from '@/lib/history';
import {z} from 'zod';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
async function allowed(){const u=await getChatGPTUser();return !!u&&u.email.toLowerCase()===runtime().ADMIN_EMAIL.toLowerCase()}
const valid=(s:string)=>{const d=new Date(s+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s};
export async function GET(req:NextRequest){try{if(!await allowed())return fail('Acesso restrito ao responsável.',403);await settlePending();const today=clock().date;const start=req.nextUrl.searchParams.get('start')||today.slice(0,7)+'-01',end=req.nextUrl.searchParams.get('end')||today;if(!valid(start)||!valid(end)||start>end||end>today||(Date.parse(end)-Date.parse(start))/86400000>366)return fail('Selecione um período válido de até 366 dias, encerrando até hoje.');return NextResponse.json(await history(start,end),{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return fail('Não foi possível carregar o histórico. Tente novamente.',503)}}
export async function POST(req:NextRequest){try{if(!await allowed())return fail('Acesso restrito ao responsável.',403);if(req.headers.get('origin')!==req.nextUrl.origin)return fail('Origem inválida.',403);const p=z.object({date:z.string(),cents:z.number().int().min(0).max(10000000)}).safeParse(await req.json());if(!p.success||!valid(p.data.date))return fail('Informe uma data válida e o valor do almoço.');await storeCall('price',{date:p.data.date,cents:p.data.cents});return NextResponse.json({saved:true})}catch(e){console.error(e);return fail('Não foi possível salvar o valor. Tente novamente.',503)}}

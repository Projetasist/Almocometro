import {historyStart,validLunchDate} from '@/lib/lunch-dates';
import {normalizeContact} from '@/lib/whatsapp';
import {z} from 'zod';
import {NextRequest,NextResponse} from 'next/server';
import {getResponsibleUser} from '@/lib/responsible-auth';
import {clock,departments,normalized,runtime,dayRows,getFormMode,activeEmployees,settlePending} from '@/lib/lunch';
import {isFormClosed} from '@/lib/form-control';
import {storeCall,StoreError} from '@/lib/supabase-store';
export const dynamic='force-dynamic';
async function access(req:NextRequest){const e=runtime();const user=await getResponsibleUser();return {admin:!!user&&user.email.toLowerCase()===e.ADMIN_EMAIL.toLowerCase(),form:!!e.FORM_KEY&&req.headers.get('x-form-key')===e.FORM_KEY};}
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
export async function GET(req:NextRequest){try{
 const {admin,form}=await access(req);if(!admin&&!form)return fail('Acesse pelo link enviado no grupo.',403);
 await settlePending();const c=clock();const date=admin?(req.nextUrl.searchParams.get('date')||c.date):c.date;
 if(!validLunchDate(date,c.date))return fail('Selecione uma data entre 01/10/2026 e hoje.');
 const [mode,rows,employees]=await Promise.all([getFormMode(date),dayRows(date,admin),admin?activeEmployees():Promise.resolve(undefined)]);
 return NextResponse.json({date,today:c.date,serverNow:Date.now(),closesAt:Date.parse(c.date+'T08:55:00-03:00'),earliest:historyStart,closed:isFormClosed(mode,date,c.date,c.closed),mode,admin,departments,employees,rows:admin?rows:rows.filter(r=>!r.deleted_date).map(r=>({id:r.id,name:r.name,department:r.department,answered:r.answer!==null&&r.answer!==undefined})),formKey:admin?runtime().FORM_KEY:undefined},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Não foi possível carregar os dados. Tente novamente.',503);}}
const schema=z.object({action:z.enum(['register','reply','control','delete','edit']),channel:z.enum(['form','admin']).optional(),mode:z.enum(['auto','open','closed']).optional(),name:z.string().max(100).optional(),department:z.string().optional(),contact:z.string().max(30).optional(),employeeId:z.string().max(100).optional(),answer:z.number().int().min(0).max(1).optional(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()});
export async function POST(req:NextRequest){try{
 const {admin,form}=await access(req);if(!admin&&!form)return fail('Link de acesso inválido.',403);
 if(req.headers.get('origin')!==req.nextUrl.origin)return fail('Origem inválida.',403);
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return fail('Dados inválidos. Confira o formulário.');
 const b=parsed.data,c=clock();
 if(['delete','edit','control'].includes(b.action)&&!admin)return fail('Apenas o responsável pode realizar esta alteração.',403);
 if(b.action==='delete'){
  if(!b.employeeId)return fail('Selecione um cadastro.');
  const r=await storeCall('delete',{employeeId:b.employeeId});if(!r.changes)return fail('Cadastro não encontrado ou já excluído.',404);
 }else if(b.action==='control'){
  if(!b.mode||b.date!==c.date)return fail('Altere o controle do formulário para a data de hoje.');
  await storeCall('control',{date:c.date,mode:b.mode});return NextResponse.json({saved:true,mode:b.mode,closed:isFormClosed(b.mode,c.date,c.date,c.closed)});
 }else if(b.action==='register'||b.action==='edit'){
  const name=(b.name||'').trim().replace(/\s+/g,' ');
  if(name.length<2||!b.department||!departments.includes(b.department))return fail('Informe o nome e selecione um departamento válido.');
  let contact:string|null;try{contact=normalizeContact(b.contact||'')}catch(e){return fail((e as Error).message)}
  if(b.action==='edit'&&!b.employeeId)return fail('Selecione um cadastro.');
  const r=await storeCall(b.action,{id:crypto.randomUUID(),employeeId:b.employeeId,name,department:b.department,normalized:normalized(name),contact});
  if(b.action==='register'){if(r.deleted_date)return fail('Este cadastro foi excluído. Procure o responsável.',409);return NextResponse.json({employee:r});}
 }else{
  if(b.answer===undefined||!b.employeeId)return fail('Escolha Sim ou Não.');
  const adjust=admin&&b.channel==='admin',date=adjust?(b.date||c.date):c.date;
  if(!validLunchDate(date,c.date))return fail('Selecione uma data entre 01/10/2026 e hoje.');
  await storeCall('reply',{id:crypto.randomUUID(),employeeId:b.employeeId,date,answer:b.answer,adjust});
  return NextResponse.json({saved:true,date,answer:b.answer});
 }
 return NextResponse.json({saved:true});
 }catch(e){return e instanceof StoreError?fail(e.message,e.status):fail('Não foi possível salvar. Tente novamente.',503);}}

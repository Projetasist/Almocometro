import {env} from 'cloudflare:workers';
import {storeCall} from './supabase-store';
export const departments=['Administrativo','Comercial','Projeta U.S.A','Diretoria','Engenharia','Financeiro','SSMA','T.I.','Topogeo','Obras','Planejamento'];
export function clock(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const v=(t:string)=>parts.find(p=>p.type===t)!.value;return {date:v('year')+'-'+v('month')+'-'+v('day'),closed:Number(v('hour'))*60+Number(v('minute'))>=535,settleDue:Number(v('hour'))*60+Number(v('minute'))>=570};}
export function normalized(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ')}
export function runtime(){return env as unknown as {FORM_KEY:string;ADMIN_EMAIL:string;LUNCH_SCHEDULE_TOKEN?:string;LUNCH_MIGRATION_PAUSED?:string};}
const sorted=(rows:any[])=>rows.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'}));
export async function dayRows(date:string,allowRetroactive=false){return sorted(await storeCall('day',{date,retro:allowRetroactive}));}
export async function getFormMode(date:string){return storeCall<import('./form-control').FormMode>('mode',{date});}
export async function activeEmployees(){return sorted(await storeCall('employees'));}
export async function settlePending(){return storeCall('settle');}

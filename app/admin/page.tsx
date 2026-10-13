import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {runtime} from '@/lib/lunch';
import Lunch from '../lunch-client';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireChatGPTUser('/admin');if(u.email.toLowerCase()!==runtime().ADMIN_EMAIL.toLowerCase())return <main className="access"><h1>Acesso restrito</h1><p>Este painel é reservado ao responsável pelo almoço.</p><a href="/">Voltar</a></main>;return <Lunch admin/>;}

import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {runtime} from '@/lib/lunch';
import HistoryClient from './history-client';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireChatGPTUser('/admin/historico');if(u.email.toLowerCase()!==runtime().ADMIN_EMAIL.toLowerCase())return <main className="access"><h1>Acesso restrito</h1><p>Este painel é reservado ao responsável pelo almoço.</p></main>;return <HistoryClient/>;}

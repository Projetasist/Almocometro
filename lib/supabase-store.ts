import {env} from 'cloudflare:workers';
export class StoreError extends Error { constructor(message:string,public status=503){super(message)} }
export async function storeCall<T=any>(action:string,p:Record<string,unknown>={}):Promise<T>{
 const config=env as unknown as {LUNCH_DATABASE_URL?:string;LUNCH_DATABASE_TOKEN?:string;LUNCH_MIGRATION_PAUSED?:string};
 if(config.LUNCH_MIGRATION_PAUSED==='true')throw new StoreError('Atualização do banco em andamento. Aguarde um instante e tente novamente.');
 if(!config.LUNCH_DATABASE_URL||!config.LUNCH_DATABASE_TOKEN)throw new StoreError('Conexão do banco não configurada.');
 let response:Response;
 try {response=await fetch(config.LUNCH_DATABASE_URL,{method:'POST',headers:{'Content-Type':'application/json','x-almocometro-token':config.LUNCH_DATABASE_TOKEN},body:JSON.stringify({action,p}),signal:AbortSignal.timeout(20000),redirect:'manual'});}
 catch(e){const message=e instanceof Error?e.message:String(e);console.error('Database transport failure:',message.replaceAll(config.LUNCH_DATABASE_TOKEN,'[redacted]'));throw new StoreError('Não foi possível acessar o banco. Tente novamente.');}
 if(!response.ok)throw new StoreError('Não foi possível acessar o banco. Tente novamente.');
 const data=await response.json() as T & {error?:string;status?:number};
 if(data&&typeof data==='object'&&data.error)throw new StoreError(data.error,data.status||503);
 return data;
}

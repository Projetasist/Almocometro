'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,Eye,EyeOff,LoaderCircle,LockKeyhole,UtensilsCrossed} from 'lucide-react';
import './login.css';
type Mode='login'|'register'|'recover'|'reset';
export default function Login(){
 const [mode,setMode]=useState<Mode>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{if(new URLSearchParams(location.search).get('mode')==='reset')setMode('reset');},[]);
 function change(m:Mode){setMode(m);setError('');setMessage('');setPassword('');setConfirm('');}
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setMessage('');if((mode==='register'||mode==='reset')&&password!==confirm){setError('As senhas precisam ser iguais.');return;}setBusy(true);try{
 const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:mode,...(mode!=='reset'?{email}:{}),...(mode!=='recover'?{password}:{})})});const data=await response.json() as {error?:string;message?:string};if(!response.ok)throw Error(data.error||'Tente novamente.');
 if(mode==='login'){location.assign('/admin');return;}if(mode==='reset'){change('login');}setMessage(data.message||'Solicitação concluída.');
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const title={login:'Bem-vindo de volta',register:'Crie seu acesso',recover:'Esqueceu sua senha?',reset:'Defina sua nova senha'}[mode];
 const subtitle={login:'Entre para acompanhar os almoços da equipe.',register:'Cadastre o e-mail autorizado para gerenciar os pedidos.',recover:'Enviaremos um link para você criar uma nova senha.',reset:'Escolha uma senha com pelo menos 8 caracteres.'}[mode];
 return <main className="login-shell"><section className="login-story"><a href="/" className="login-brand"><UtensilsCrossed size={27}/>Almoçômetro</a><div><span className="login-kicker">MENOS PLANILHAS. MAIS PRATICIDADE.</span><h1>O almoço da equipe,<br/><span>em dia.</span></h1><p>Confirmações, listas e rateio reunidos em um só lugar.</p></div><small>Projeta · Gestão de almoços</small></section><section className="login-side"><div className="login-card"><div className="login-symbol"><LockKeyhole size={24}/></div><span className="login-kicker">PAINEL DO RESPONSÁVEL</span><h2>{title}</h2><p className="login-description">{subtitle}</p><form onSubmit={submit}>
 {mode!=='reset'&&<label>E-mail<input type="email" autoComplete="email" required maxLength={254} placeholder="seuemail@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>}
 {mode!=='recover'&&<><label>Senha<div className="login-password"><input type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><button type="button" aria-label={show?'Ocultar senha':'Mostrar senha'} onClick={()=>setShow(!show)}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>{(mode==='register'||mode==='reset')&&<label>Confirmar senha<input type={show?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label>}</>}
 {mode==='login'&&<button type="button" className="login-forgot" onClick={()=>change('recover')}>Esqueci minha senha</button>}
 {error&&<div className="login-message error" role="alert">{error}</div>}{message&&<div className="login-message success" role="status">{message}</div>}
 <button className="login-submit" disabled={busy}>{busy?<LoaderCircle size={18} className="login-spin"/>:null}{busy?'Aguarde…':{login:'Entrar no painel',register:'Cadastrar',recover:'Enviar link de recuperação',reset:'Salvar nova senha'}[mode]}{!busy&&<ArrowRight size={18}/>}</button>
 </form>{mode==='login'?<><p className="login-switch">Primeiro acesso? <button onClick={()=>change('register')}>Cadastrar</button></p><div className="login-divider"><span>ou</span></div><a className="login-alternative" href="/signin-with-chatgpt?return_to=%2Fadmin">Continuar com ChatGPT</a></>:<button className="login-back" onClick={()=>change('login')}><ArrowLeft size={16}/>Voltar para entrar</button>}<a className="login-form-link" href="/">Voltar ao formulário de almoço</a></div></section></main>;
}

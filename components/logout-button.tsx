'use client';
import {useState} from 'react';
import {LogOut} from 'lucide-react';
export default function LogoutButton(){const [busy,setBusy]=useState(false);return <button type="button" className="button secondary history-home" disabled={busy} onClick={async()=>{setBusy(true);try{await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});location.assign('/signout-with-chatgpt?return_to=%2Flogin');}catch{setBusy(false)}}}><LogOut size={16}/>{busy?'Saindo…':'Sair'}</button>;}

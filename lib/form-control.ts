export type FormMode='auto'|'open'|'closed';
export function isFormClosed(mode:FormMode,date:string,today:string,afterDeadline:boolean){return mode==='closed'||(mode==='auto'&&(date<today||(date===today&&afterDeadline)));}
export function defaultMode(date:string):FormMode{return date==='2026-10-08'?'open':'auto';}

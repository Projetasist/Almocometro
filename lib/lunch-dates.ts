export const historyStart='2026-10-01';
export function validLunchDate(date:string,today:string){const d=new Date(date+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===date&&date>=historyStart&&date<=today;}

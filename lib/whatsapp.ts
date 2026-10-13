// Store Brazilian numbers in international format, without punctuation.
export function normalizeContact(value:string):string|null {
 const raw=value.trim();if(!raw)return null;
 if(!/^[+\d\s().-]+$/.test(raw))throw new Error('Informe um WhatsApp válido com DDD.');
 let digits=raw.replace(/\D/g,'');
 if(digits.length===10||digits.length===11)digits='55'+digits;
 if(!/^55[1-9][0-9](?:[2-5][0-9]{7}|9[0-9]{8})$/.test(digits))throw new Error('Informe um WhatsApp brasileiro com DDD, como (98) 99999-9999.');
 return digits;
}
export function displayContact(value?:string|null){if(!value)return '';const local=value.replace(/^55/,'');return `(${local.slice(0,2)}) ${local.slice(2,-4)}-${local.slice(-4)}`;}
export function reminderUrl(phone:string,name:string,date:string,formUrl:string){
 const contact=normalizeContact(phone);if(!contact)return '';
 const day=date.split('-').reverse().join('/');
 const message=`Olá, ${name}! Sua resposta sobre o almoço de hoje (${day}) está pendente. Por favor, preencha o formulário informando se vai almoçar ou não.\n\n${formUrl}\n\nObrigado!`;
 return `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;
}

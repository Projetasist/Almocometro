-- Called exclusively by the authenticated server bridge, never by public clients.
create or replace function public.almocometro_operation(p_action text, p jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 today date := (now() at time zone 'America/Sao_Paulo')::date;
 local_time time := (now() at time zone 'America/Sao_Paulo')::time;
 d date;
 employee_record public.employees%rowtype;
 result jsonb;
 n integer;
 remaining integer;
 mode_value text;
 adjust boolean := coalesce((p->>'adjust')::boolean,false);
begin
 if p_action='health' then return jsonb_build_object('database','supabase','date',today); end if;
 if p_action='employees' then
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'department',department,'contact',contact)),'[]') into result from public.employees where deleted_date is null;
  return result;
 elsif p_action='day' then
  d:=(p->>'date')::date;
  select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'name',coalesce(r.employee_name,e.name),'department',coalesce(r.employee_department,e.department),'contact',e.contact,'deleted_date',e.deleted_date,'answer',r.answer,'updated_at',r.updated_at)),'[]') into result
  from public.employees e left join public.replies r on r.employee_id=e.id and r.date=d
  where ((coalesce((p->>'retro')::boolean,false) and e.deleted_date is null) or e.created_date<=d) and (e.deleted_date is null or e.deleted_date>d or r.id is not null);
  return result;
 elsif p_action='mode' then
  select mode into mode_value from public.daily_control where date=(p->>'date')::date;
  return to_jsonb(coalesce(mode_value,case when p->>'date'='2026-10-08' then 'open' else 'auto' end));
 elsif p_action='history' then
  select coalesce(jsonb_agg(jsonb_build_object('employeeId',r.employee_id,'name',coalesce(r.employee_name,e.name),'date',r.date,'department',coalesce(r.employee_department,e.department)) order by r.date),'[]') into result
  from public.replies r join public.employees e on e.id=r.employee_id where r.answer=1 and r.date between (p->>'start')::date and (p->>'end')::date;
  return result;
 elsif p_action='prices' then
  select coalesce(jsonb_agg(to_jsonb(lp) order by date),'[]') into result from public.lunch_prices lp;return result;
 elsif p_action='price' then
  insert into public.lunch_prices(date,cents) values((p->>'date')::date,(p->>'cents')::integer) on conflict(date) do update set cents=excluded.cents;
 elsif p_action='control' then
  if (p->>'date')::date<>today then raise exception 'Invalid control date';end if;
  insert into public.daily_control(date,mode,updated_at) values(today,p->>'mode',now()) on conflict(date) do update set mode=excluded.mode,updated_at=excluded.updated_at;
 elsif p_action='delete' then
  update public.employees set deleted_date=today where id=p->>'employeeId' and deleted_date is null;
  get diagnostics n=row_count;return jsonb_build_object('changes',n);
 elsif p_action='register' then
  insert into public.employees(id,name,department,normalized,created_date,contact) values(p->>'id',p->>'name',p->>'department',p->>'normalized',today,p->>'contact') on conflict(normalized,department) do nothing;
  select jsonb_build_object('id',id,'name',name,'department',department,'deleted_date',deleted_date) into result from public.employees where normalized=p->>'normalized' and department=p->>'department';return result;
 elsif p_action='edit' then
  select * into employee_record from public.employees where id=p->>'employeeId' and deleted_date is null for update;
  if not found then return jsonb_build_object('error','Cadastro não encontrado.','status',404);end if;
  update public.replies set employee_name=coalesce(employee_name,employee_record.name),employee_department=coalesce(employee_department,employee_record.department) where employee_id=employee_record.id and date<today;
  update public.employees set name=p->>'name',department=p->>'department',normalized=p->>'normalized',contact=p->>'contact' where id=employee_record.id;
  update public.replies set employee_name=p->>'name',employee_department=p->>'department' where employee_id=employee_record.id and date>=today;
 elsif p_action='reply' then
  d:=case when adjust then (p->>'date')::date else today end;
  if d<'2026-10-01'::date or d>today then raise exception 'Invalid reply date';end if;
  if not adjust then
   select mode into mode_value from public.daily_control where date=today;
   if coalesce(mode_value,'auto')='closed' or (coalesce(mode_value,'auto')='auto' and local_time>='08:55'::time) then
    return jsonb_build_object('error','O formulário está fechado. Procure o responsável pelo almoço.','status',409);
   end if;
  end if;
  select * into employee_record from public.employees where id=p->>'employeeId' and (created_date<=d or (adjust and deleted_date is null)) for update;
  if not found then return jsonb_build_object('error','Colaborador não encontrado.','status',404);end if;
  if not adjust and employee_record.deleted_date is not null then return jsonb_build_object('error','Este cadastro foi excluído. Procure o responsável.','status',409);end if;
  if adjust then
   insert into public.replies(id,employee_id,date,answer,updated_at,employee_name,employee_department) values(p->>'id',employee_record.id,d,(p->>'answer')::smallint,now(),employee_record.name,employee_record.department)
   on conflict(date,employee_id) do update set answer=excluded.answer,updated_at=excluded.updated_at;
  else
   insert into public.replies(id,employee_id,date,answer,updated_at,employee_name,employee_department) values(p->>'id',employee_record.id,d,(p->>'answer')::smallint,now(),employee_record.name,employee_record.department) on conflict(date,employee_id) do nothing;
   get diagnostics n=row_count;
   if n=0 then return jsonb_build_object('error','Este nome já respondeu hoje e está bloqueado. Para corrigir, procure o responsável.','status',409);end if;
  end if;
 elsif p_action='settle' then
  if local_time<'09:30'::time then return jsonb_build_object('date',today,'changed',0,'skipped',true,'reason','before_0930');end if;
  insert into public.replies(id,employee_id,date,answer,updated_at,employee_name,employee_department)
  select 'auto-no-'||today||'-'||e.id,e.id,today,0,now(),e.name,e.department from public.employees e
  where e.deleted_date is null and e.created_date<=today and not exists(select 1 from public.replies r where r.employee_id=e.id and r.date=today)
  on conflict(date,employee_id) do nothing;
  get diagnostics n=row_count;
  select count(*) into remaining from public.employees e where deleted_date is null and created_date<=today and not exists(select 1 from public.replies r where r.employee_id=e.id and r.date=today);
  return jsonb_build_object('date',today,'changed',n,'remaining',remaining,'skipped',false);
 else raise exception 'Unknown operation';
 end if;
 return jsonb_build_object('saved',true);
end;
$$;
revoke all on function public.almocometro_operation(text,jsonb) from public,anon,authenticated;
grant execute on function public.almocometro_operation(text,jsonb) to service_role;

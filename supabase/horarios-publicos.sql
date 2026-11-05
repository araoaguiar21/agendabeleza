-- Consulta pública apenas de horários ocupados. NUNCA retorna nomes, telefones ou serviços.
-- Executar após supabase/agenda.sql.
create or replace function public.booked_slots(p_day date)
returns table(slot text)
language sql
stable
security definer
set search_path = ''
as $$
  select to_char(a.appointment_time,'HH24:MI') as slot
  from public.appointments a
  where a.appointment_date = p_day
    and a.status <> 'Cancelado'
    and p_day between current_date and current_date + 120
  order by a.appointment_time;
$$;
revoke all on function public.booked_slots(date) from public,anon,authenticated;
grant execute on function public.booked_slots(date) to anon,authenticated;

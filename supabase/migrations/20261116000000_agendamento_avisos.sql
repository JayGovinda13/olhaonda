-- Agendamento dos avisos dentro do próprio Supabase (pg_cron + pg_net), no minuto certo.
-- O agendador do GitHub atrasa e às vezes pula horários; este não.
--
-- Depois de aplicar, rode UMA vez no SQL Editor (os valores ficam no Vault, nada vai para o código):
--   select vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'cron_secret');
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/daily-forecast', 'daily_forecast_url');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Chama a função daily-forecast. Sem os segredos no Vault, não faz nada.
create or replace function public.run_daily_forecast(only_alerts boolean default true)
returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  u text;
  s text;
  req bigint;
begin
  select decrypted_secret into u from vault.decrypted_secrets where name = 'daily_forecast_url' limit 1;
  select decrypted_secret into s from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if u is null or s is null then
    raise notice 'run_daily_forecast: daily_forecast_url / cron_secret ausentes no Vault';
    return null;
  end if;
  if only_alerts then u := u || '?only=alerts'; end if;
  select net.http_post(
    url := u,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', s),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into req;
  return req;
end;
$$;

-- A Edge Function confere o segredo por aqui (só o service_role chama).
create or replace function public.cron_secret_matches(candidate text)
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select coalesce(candidate <> '' and exists (
    select 1 from vault.decrypted_secrets where name = 'cron_secret' and decrypted_secret = candidate
  ), false);
$$;

revoke all on function public.run_daily_forecast(boolean) from public, anon, authenticated;
revoke all on function public.cron_secret_matches(text) from public, anon, authenticated;
grant execute on function public.cron_secret_matches(text) to service_role;

-- Horários em UTC (Brasília = UTC-3): 05:13 fórum + avisos; de 3 em 3 h só avisos.
select cron.unschedule(jobid) from cron.job where jobname in ('olhaonda-resumo-diario', 'olhaonda-avisos-3h');
select cron.schedule('olhaonda-resumo-diario', '13 8 * * *', $$select public.run_daily_forecast(false)$$);
select cron.schedule('olhaonda-avisos-3h', '43 11,14,17,20,23,2 * * *', $$select public.run_daily_forecast(true)$$);

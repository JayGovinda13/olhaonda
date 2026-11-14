-- Avisos com ciclo (entrou → mudou → saiu → voltou) e entrega por WhatsApp.
-- Só no STAGING por enquanto.

---------------------------------------------------------------------------
-- Notificações: vários tipos de aviso por pico (antes: um por pico por dia)
---------------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('match', 'enter', 'back', 'change', 'lost'));

alter table public.notifications drop constraint if exists notifications_user_id_spot_id_session_date_kind_key;
alter table public.notifications add column event_seq bigint;
-- avisos antigos ("match"): continua um por pico por dia
create unique index notifications_match_unique on public.notifications (user_id, spot_id, session_date) where kind = 'match';
-- avisos novos: cada número de aviso do pico só existe uma vez (rodar duas vezes não duplica)
create unique index notifications_event_unique on public.notifications (user_id, spot_id, event_seq) where event_seq is not null;

---------------------------------------------------------------------------
-- Estado do aviso de cada pico favorito (quem escreve é a Edge Function)
---------------------------------------------------------------------------
create table public.alert_state (
  user_id uuid not null references public.profiles on delete cascade,
  spot_id text not null check (char_length(spot_id) <= 60),
  -- AlertState (supabase/functions/_shared/core/alerts.ts): status, janelas já avisadas, número do último aviso
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);
alter table public.alert_state enable row level security;
create policy "vê o próprio estado" on public.alert_state for select to authenticated using (user_id = auth.uid());

-- mudou o gosto, desligou o aviso ou tirou dos favoritos: o ciclo recomeça do zero (próximo aviso = "entrou")
create function public.reset_alert_state() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    delete from public.alert_state where user_id = old.user_id and spot_id = old.spot_id;
    return old;
  end if;
  if new.prefs is distinct from old.prefs or new.notify is distinct from old.notify then
    delete from public.alert_state where user_id = new.user_id and spot_id = new.spot_id;
  end if;
  return new;
end $$;
create trigger favorite_reset_alert after update or delete on public.favorite_spots
  for each row execute function public.reset_alert_state();

---------------------------------------------------------------------------
-- WhatsApp
---------------------------------------------------------------------------
-- número verificado da pessoa. Criado e verificado só pelas Edge Functions (service role).
create table public.whatsapp_contacts (
  user_id uuid primary key references public.profiles on delete cascade,
  phone text not null check (phone ~ '^\+[1-9][0-9]{9,14}$'),
  verified_at timestamptz not null,
  -- quando a pessoa aceitou receber avisos (registro de consentimento, LGPD)
  consented_at timestamptz not null,
  enabled boolean not null default true,
  -- respondeu PARAR no WhatsApp
  opted_out_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index whatsapp_phone_unique on public.whatsapp_contacts (phone);
alter table public.whatsapp_contacts enable row level security;
create policy "vê o próprio número" on public.whatsapp_contacts for select to authenticated using (user_id = auth.uid());
create policy "liga e desliga" on public.whatsapp_contacts for update to authenticated using (user_id = auth.uid());
revoke update on public.whatsapp_contacts from anon, authenticated;
grant update (enabled) on public.whatsapp_contacts to authenticated;

-- código de verificação enviado por WhatsApp (sem política: ninguém lê pelo app)
create table public.whatsapp_codes (
  user_id uuid primary key references public.profiles on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  sent_at timestamptz not null default now(),
  sends_day date not null default current_date,
  sends_today int not null default 1
);
alter table public.whatsapp_codes enable row level security;

-- registro de tudo o que foi enviado (sem política: só o servidor lê)
create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  phone text not null,
  template text not null,
  params jsonb not null default '[]'::jsonb,
  -- sent = aceito pela Meta; dry_run = ambiente sem credenciais; failed = recusado
  status text not null check (status in ('sent', 'delivered', 'read', 'failed', 'dry_run')),
  wa_message_id text,
  error text,
  created_at timestamptz not null default now()
);
create index on public.whatsapp_messages (user_id, created_at desc);
create index on public.whatsapp_messages (wa_message_id) where wa_message_id is not null;
alter table public.whatsapp_messages enable row level security;

-- ligar de novo pelo site (depois de ter respondido PARAR) tira a marca de "não quero receber"
create function public.whatsapp_clear_optout() returns trigger language plpgsql as $$
begin
  if new.enabled and not old.enabled then new.opted_out_at := null; end if;
  return new;
end $$;
create trigger whatsapp_enable_clears_optout before update on public.whatsapp_contacts
  for each row execute function public.whatsapp_clear_optout();

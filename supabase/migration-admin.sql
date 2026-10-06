-- ============================================================
--  KARTE — Migration « espace admin/client sur Supabase »
--  À exécuter dans Supabase > SQL Editor (après schema.sql).
-- ============================================================

-- Colonnes manquantes
alter table public.clients add column if not exists password text;
alter table public.clients add column if not exists logo text;
alter table public.cards   add column if not exists custom jsonb;

-- ---------- Connexion client (sans compte auth : email + mot de passe) ----------
create or replace function public.client_login(p_email text, p_password text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c clients%rowtype; result jsonb;
begin
  select * into c from clients where lower(email) = lower(trim(p_email)) and password = p_password limit 1;
  if c.id is null then return null; end if;

  select jsonb_build_object(
    'client', jsonb_build_object('id', c.id, 'company', c.company, 'email', c.email, 'logo', coalesce(c.logo, '')),
    'workspaces', coalesce(jsonb_agg(jsonb_build_object(
      'id', w.id, 'name', w.name, 'slug', coalesce(w.custom_domain, ''), 'permissions', w.permissions, 'cardId', w.card_id,
      'card', case when cd.id is null then null else jsonb_build_object(
        'id', cd.id, 'slug', cd.slug, 'title', cd.title, 'themeIndex', cd.theme_index,
        'custom', cd.custom, 'blocks', cd.blocks, 'updatedAt', (extract(epoch from cd.updated_at) * 1000)::bigint
      ) end,
      'stats', (select jsonb_build_object(
        'view', count(*) filter (where a.event = 'view'),
        'tap',  count(*) filter (where a.event = 'tap'),
        'chat', count(*) filter (where a.event = 'chat'),
        'lead', count(*) filter (where a.event = 'lead')
      ) from analytics a where a.card_id = cd.id),
      'leads', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'name', coalesce(l.name, ''), 'contact', coalesce(l.email, l.phone, ''),
        'ts', (extract(epoch from l.created_at) * 1000)::bigint
      ) order by l.created_at desc), '[]'::jsonb)
        from (select * from leads where card_id = cd.id order by created_at desc limit 20) l)
    )), '[]'::jsonb)
  ) into result
  from workspaces w
  left join cards cd on cd.id = w.card_id
  where w.client_id = c.id;

  return result;
end $$;

-- ---------- Sauvegarde d'une carte par le client (permissions vérifiées) ----------
create or replace function public.client_save_card(
  p_email text, p_password text, p_card uuid,
  p_title text, p_blocks jsonb, p_theme integer, p_custom jsonb
) returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select true into ok
  from clients c join workspaces w on w.client_id = c.id
  where lower(c.email) = lower(trim(p_email)) and c.password = p_password
    and w.card_id = p_card
    and coalesce((w.permissions->>'editText')::boolean, false) = true
  limit 1;
  if ok is null then return false; end if;

  update cards set
    title = coalesce(p_title, title),
    blocks = coalesce(p_blocks, blocks),
    theme_index = coalesce(p_theme, theme_index),
    custom = coalesce(p_custom, custom)
  where id = p_card;
  return true;
end $$;

grant execute on function public.client_login(text, text) to anon, authenticated;
grant execute on function public.client_save_card(text, text, uuid, text, jsonb, integer, jsonb) to anon, authenticated;

-- ============================================================
--  SPRINT 4 — abonnements (quota de cartes) + clé IA par workspace
-- ============================================================
alter table public.clients    add column if not exists plan text default 'solo';
alter table public.workspaces add column if not exists ai_key text;

-- ---------- Stats journalières pour l'espace client (graphiques) ----------
create or replace function public.client_daily_stats(p_email text, p_password text, p_days integer default 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c clients%rowtype; result jsonb;
begin
  select * into c from clients where lower(email) = lower(trim(p_email)) and password = p_password limit 1;
  if c.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('date', d.day, 'view', d.v, 'tap', d.t, 'chat', d.ch, 'lead', d.l) order by d.day), '[]'::jsonb)
  into result
  from (
    select to_char(a.created_at, 'YYYY-MM-DD') as day,
      count(*) filter (where a.event = 'view') as v,
      count(*) filter (where a.event = 'tap') as t,
      count(*) filter (where a.event = 'chat') as ch,
      count(*) filter (where a.event = 'lead') as l
    from analytics a
    join workspaces w on w.card_id = a.card_id
    where w.client_id = c.id
      and a.created_at >= now() - make_interval(days => p_days)
    group by 1
  ) d;
  return result;
end $$;
grant execute on function public.client_daily_stats(text, text, integer) to anon, authenticated;

-- ---------- Localisation des visiteurs (rapports par région) ----------
alter table public.analytics add column if not exists region text;

-- ============================================================
--  FIX LEADS — enregistrement fiable des messages/inscriptions
--  (contourne les RLS : le visiteur public n'a pas de session)
-- ============================================================
create or replace function public.save_lead(p_card uuid, p_name text, p_email text, p_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.leads (card_id, name, email, phone, source)
  values (p_card, nullif(p_name, ''), nullif(p_email, ''), nullif(p_phone, ''), 'carte');
end $$;

grant execute on function public.save_lead(uuid, text, text, text) to anon, authenticated;

-- Sécurise aussi l'insertion directe (repli) : autorise l'ajout par tous
drop policy if exists "leads: anyone insert" on public.leads;
create policy "leads: anyone insert" on public.leads for insert with check (true);

-- ============================================================
--  Suppression d'un message/contact par le client (sécurisé)
-- ============================================================
create or replace function public.client_delete_lead(p_email text, p_password text, p_lead uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  -- le client doit posséder (via un workspace) la carte à laquelle appartient ce lead
  select true into ok
  from leads ld
  join workspaces w on w.card_id = ld.card_id
  join clients c on c.id = w.client_id
  where ld.id = p_lead
    and lower(c.email) = lower(trim(p_email)) and c.password = p_password
  limit 1;
  if ok is null then return false; end if;
  delete from leads where id = p_lead;
  return true;
end $$;

grant execute on function public.client_delete_lead(text, text, uuid) to anon, authenticated;

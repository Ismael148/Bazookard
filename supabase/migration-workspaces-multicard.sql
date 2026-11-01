-- ============================================================
--  BAZOOKARD — Migration « Workspaces multi-cartes »
--  À exécuter dans Supabase > SQL Editor (après schema.sql et
--  migration-admin.sql). Idempotent : réexécutable sans risque.
-- ============================================================

-- 1) Lien carte -> workspace (colonne déjà prévue dans schema.sql)
alter table public.cards
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists cards_workspace_id_idx on public.cards(workspace_id);

-- 2) Backfill : rattache les cartes existantes à leur workspace
--    (historiquement 1 workspace = 1 carte via workspaces.card_id)
update public.cards c
   set workspace_id = w.id
  from public.workspaces w
 where w.card_id = c.id
   and c.workspace_id is null;

-- ============================================================
--  3) Connexion client : renvoie désormais un TABLEAU de cartes
--     par workspace (clé "cards"), avec stats + leads par carte.
--     "card"/"cardId" (singulier) sont conservés pour compat.
-- ============================================================
create or replace function public.client_login(p_email text, p_password text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c clients%rowtype; result jsonb;
begin
  select * into c from clients
   where lower(email) = lower(trim(p_email)) and password = p_password
   limit 1;
  if c.id is null then return null; end if;

  select jsonb_build_object(
    'client', jsonb_build_object('id', c.id, 'company', c.company, 'email', c.email, 'logo', coalesce(c.logo, '')),
    'workspaces', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'slug', coalesce(w.custom_domain, ''),
        'permissions', w.permissions,
        'cardId', w.card_id,
        'cards', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', cd.id, 'slug', cd.slug, 'title', cd.title, 'themeIndex', cd.theme_index,
              'custom', cd.custom, 'blocks', cd.blocks,
              'updatedAt', (extract(epoch from cd.updated_at) * 1000)::bigint,
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
            ) order by cd.updated_at desc
          )
          from cards cd where cd.workspace_id = w.id
        ), '[]'::jsonb)
      ) order by w.created_at desc
    ), '[]'::jsonb)
  ) into result
  from workspaces w
  where w.client_id = c.id;

  return result;
end $$;

grant execute on function public.client_login(text, text) to anon, authenticated;

-- ============================================================
--  4) Quota d'abonnement (en nombre de CARTES)
-- ============================================================
create or replace function public.plan_quota(p_plan text)
returns integer language sql immutable as $$
  select case lower(coalesce(p_plan, 'solo'))
           when 'pro' then 10
           when 'business' then 20
           else 1
         end;
$$;

-- Compte les cartes d'un client (toutes ses workspaces)
create or replace function public.client_card_count(p_client uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int
    from cards cd
    join workspaces w on w.id = cd.workspace_id
   where w.client_id = p_client;
$$;

-- ============================================================
--  5) Création d'une carte par le client (permission manageCards + quota)
-- ============================================================
create or replace function public.client_create_card(
  p_email text, p_password text, p_workspace uuid, p_title text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c clients%rowtype;
  w workspaces%rowtype;
  new_slug text;
  new_id uuid;
  cnt int;
begin
  select * into c from clients where lower(email) = lower(trim(p_email)) and password = p_password limit 1;
  if c.id is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;

  select * into w from workspaces where id = p_workspace and client_id = c.id limit 1;
  if w.id is null then return jsonb_build_object('ok', false, 'error', 'workspace'); end if;

  if coalesce((w.permissions->>'manageCards')::boolean, true) = false then
    return jsonb_build_object('ok', false, 'error', 'perm');
  end if;

  cnt := client_card_count(c.id);
  if cnt >= plan_quota(c.plan) then
    return jsonb_build_object('ok', false, 'error', 'quota', 'quota', plan_quota(c.plan));
  end if;

  new_slug := regexp_replace(lower(coalesce(nullif(trim(p_title), ''), 'carte')), '[^a-z0-9]+', '-', 'g')
              || '-' || substr(md5(random()::text), 1, 4);

  insert into public.cards (owner_id, workspace_id, slug, title, theme_index, blocks, published)
  values (w.owner_id, w.id, new_slug, coalesce(nullif(trim(p_title), ''), 'Nouvelle carte'), 0,
          '[{"id":"b1","type":"profile","data":{}},{"id":"b2","type":"contact","data":{}},{"id":"b3","type":"social","data":{}}]'::jsonb,
          true)
  returning id into new_id;

  return jsonb_build_object('ok', true, 'id', new_id, 'slug', new_slug);
end $$;

grant execute on function public.client_create_card(text, text, uuid, text) to anon, authenticated;

-- ============================================================
--  6) Duplication d'une carte par le client (permission + quota)
-- ============================================================
create or replace function public.client_duplicate_card(
  p_email text, p_password text, p_card uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c clients%rowtype;
  src cards%rowtype;
  w workspaces%rowtype;
  new_slug text;
  new_id uuid;
begin
  select * into c from clients where lower(email) = lower(trim(p_email)) and password = p_password limit 1;
  if c.id is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;

  select cd.* into src from cards cd
    join workspaces w2 on w2.id = cd.workspace_id
   where cd.id = p_card and w2.client_id = c.id limit 1;
  if src.id is null then return jsonb_build_object('ok', false, 'error', 'card'); end if;

  select * into w from workspaces where id = src.workspace_id limit 1;
  if coalesce((w.permissions->>'manageCards')::boolean, true) = false then
    return jsonb_build_object('ok', false, 'error', 'perm');
  end if;

  if client_card_count(c.id) >= plan_quota(c.plan) then
    return jsonb_build_object('ok', false, 'error', 'quota', 'quota', plan_quota(c.plan));
  end if;

  new_slug := regexp_replace(lower(coalesce(src.title, 'carte')), '[^a-z0-9]+', '-', 'g')
              || '-' || substr(md5(random()::text), 1, 4);

  insert into public.cards (owner_id, workspace_id, slug, title, type, theme_index, custom, blocks, published)
  values (src.owner_id, src.workspace_id, new_slug, src.title || ' (copie)', src.type, src.theme_index, src.custom, src.blocks, true)
  returning id into new_id;

  return jsonb_build_object('ok', true, 'id', new_id, 'slug', new_slug);
end $$;

grant execute on function public.client_duplicate_card(text, text, uuid) to anon, authenticated;

-- ============================================================
--  7) Suppression d'une carte par le client (permission manageCards)
--     Refuse de supprimer la dernière carte d'un workspace.
-- ============================================================
create or replace function public.client_delete_card(
  p_email text, p_password text, p_card uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c clients%rowtype;
  src cards%rowtype;
  w workspaces%rowtype;
  remaining int;
begin
  select * into c from clients where lower(email) = lower(trim(p_email)) and password = p_password limit 1;
  if c.id is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;

  select cd.* into src from cards cd
    join workspaces w2 on w2.id = cd.workspace_id
   where cd.id = p_card and w2.client_id = c.id limit 1;
  if src.id is null then return jsonb_build_object('ok', false, 'error', 'card'); end if;

  select * into w from workspaces where id = src.workspace_id limit 1;
  if coalesce((w.permissions->>'manageCards')::boolean, true) = false then
    return jsonb_build_object('ok', false, 'error', 'perm');
  end if;

  select count(*) into remaining from cards where workspace_id = src.workspace_id;
  if remaining <= 1 then
    return jsonb_build_object('ok', false, 'error', 'last');
  end if;

  -- si cette carte était la carte "principale" du workspace, on détache
  update workspaces set card_id = null where id = src.workspace_id and card_id = src.id;
  delete from cards where id = src.id;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.client_delete_card(text, text, uuid) to anon, authenticated;

-- ============================================================
--  Fin de migration. Les cartes d'un workspace = cards.workspace_id.
-- ============================================================

-- ============================================================
--  8) Stats journalières : compter TOUTES les cartes du client
--     (jointure via cards.workspace_id, plus seulement card_id)
-- ============================================================
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
    join cards cd on cd.id = a.card_id
    join workspaces w on w.id = cd.workspace_id
    where w.client_id = c.id
      and a.created_at >= now() - make_interval(days => p_days)
    group by 1
  ) d;
  return result;
end $$;
grant execute on function public.client_daily_stats(text, text, integer) to anon, authenticated;

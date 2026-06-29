-- ============================================================
-- Minecraft Builds — Reações (like/dislike) e Listas tipo playlist
--
-- Substitui o `mc_build_likes` simples (que ficou em backlog) por um
-- modelo com `kind`, e adiciona o domínio de listas-por-utilizador.
-- ============================================================

-- ----------------------------------------------------------------
-- Reactions: 1 reação por (build, utilizador), mutuamente exclusiva
-- ----------------------------------------------------------------
create table if not exists mc_build_reactions (
  build_id  uuid not null references mc_builds(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  kind      text not null check (kind in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);

create index if not exists idx_mc_build_reactions_build on mc_build_reactions(build_id);
create index if not exists idx_mc_build_reactions_user  on mc_build_reactions(user_id);

alter table mc_build_reactions enable row level security;
create policy "dev_mc_build_reactions_all" on mc_build_reactions for all using (true) with check (true);

-- ----------------------------------------------------------------
-- Lists: playlists pessoais (cada list é dum único user)
-- ----------------------------------------------------------------
create table if not exists mc_lists (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references users(id) on delete cascade,
  name        text not null,
  description text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_mc_lists_owner on mc_lists(owner_id);

create trigger mc_lists_updated_at before update on mc_lists
  for each row execute function update_updated_at();

alter table mc_lists enable row level security;
create policy "dev_mc_lists_all" on mc_lists for all using (true) with check (true);

-- ----------------------------------------------------------------
-- Junction: builds dentro de cada list
-- ----------------------------------------------------------------
create table if not exists mc_list_builds (
  list_id   uuid not null references mc_lists(id) on delete cascade,
  build_id  uuid not null references mc_builds(id) on delete cascade,
  added_at  timestamptz not null default now(),
  primary key (list_id, build_id)
);

create index if not exists idx_mc_list_builds_list  on mc_list_builds(list_id);
create index if not exists idx_mc_list_builds_build on mc_list_builds(build_id);

alter table mc_list_builds enable row level security;
create policy "dev_mc_list_builds_all" on mc_list_builds for all using (true) with check (true);

-- =====================================================================
-- WALIRASA — DATABASE SCHEMA (Supabase / PostgreSQL)
-- Trusted Inclusive Education Ecosystem for Children with ASD
-- =====================================================================
-- Sumber: CONTEXT.md (bagian 5). Migration 0001 = inisialisasi skema penuh.
-- Urutan dari atas ke bawah sudah memperhatikan dependency antar tabel.
-- =====================================================================

-- =====================================================================
-- 0. EXTENSIONS & CUSTOM TYPES
-- =====================================================================

create extension if not exists "pgcrypto";

create type public.user_role as enum ('parent', 'teacher', 'therapist');
create type public.access_role as enum ('teacher', 'therapist');
create type public.goal_status as enum ('active', 'completed', 'archived');
create type public.story_difficulty as enum ('easy', 'medium', 'hard');
create type public.skill_progress_status as enum ('not_started', 'in_progress', 'mastered', 'needs_repeat');


-- =====================================================================
-- 1. PROFILES & CHILDREN
-- =====================================================================

-- Extends auth.users. Satu baris per akun (orang tua / guru / terapis).
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         public.user_role not null default 'parent',
  full_name    text not null,
  avatar_url   text,
  phone        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Data profil untuk semua tipe user (orang tua, guru, terapis).';

-- Anak adalah "aset" milik orang tua, bukan akun login terpisah.
create table public.children (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid not null references public.profiles(id) on delete cascade,
  full_name           text not null,
  nickname            text,
  birth_date          date,
  asd_support_level   text check (asd_support_level in ('level_1','level_2','level_3')),
  avatar_url          text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_children_parent_id on public.children(parent_id);
comment on table public.children is 'Profil anak, dimiliki penuh oleh satu orang tua (parent_id).';


-- =====================================================================
-- 2. ACCESS CONTROL (guru/terapis diundang, token berbatas waktu)
-- =====================================================================

create table public.child_access (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children(id) on delete cascade,
  educator_id   uuid references public.profiles(id) on delete cascade,
  invited_by    uuid not null references public.profiles(id) on delete cascade,
  access_role   public.access_role not null,
  invite_token  text unique not null default encode(extensions.gen_random_bytes(24), 'hex'),
  invite_email  text,                     -- diisi sebelum diundang, sebelum educator_id diketahui
  permissions   jsonb not null default '{
                    "aac": true, "emotion_mirror": true,
                    "social_story": true, "life_skills": true, "reports": true
                  }'::jsonb,
  is_active     boolean not null default true,
  expires_at    timestamptz not null,
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_child_access_child_id on public.child_access(child_id);
create index idx_child_access_educator_id on public.child_access(educator_id);
create unique index uq_child_access_active_educator on public.child_access(child_id, educator_id) where is_active = true;
comment on table public.child_access is 'Trust Vault: hak akses guru/terapis ke satu anak, punya expiry & bisa direvoke kapan saja.';


-- =====================================================================
-- 3. IEP GOALS & AI RECOMMENDATIONS
-- =====================================================================

create table public.iep_goals (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references public.children(id) on delete cascade,
  created_by     uuid not null references public.profiles(id),
  title          text not null,
  description    text,
  target_metric  text,          -- contoh: "jumlah emosi dasar teridentifikasi"
  target_value   numeric,
  current_value  numeric default 0,
  status         public.goal_status not null default 'active',
  start_date     date not null default current_date,
  target_date    date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_iep_goals_child_id on public.iep_goals(child_id);

create table public.iep_recommendations (
  id                uuid primary key default gen_random_uuid(),
  goal_id           uuid not null references public.iep_goals(id) on delete cascade,
  recommendation    text not null,          -- hasil narasi dari Gemini
  based_on_data     jsonb,                  -- snapshot metrik yang dipakai sbg konteks
  generated_at      timestamptz not null default now(),
  reviewed_by       uuid references public.profiles(id),
  reviewed_at       timestamptz
);

create index idx_iep_recommendations_goal_id on public.iep_recommendations(goal_id);


-- =====================================================================
-- 4. AAC COMMUNICATION BOARD
-- =====================================================================

create table public.aac_categories (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid references public.children(id) on delete cascade,  -- null = kategori template global
  name        text not null,
  icon        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.aac_cards (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid references public.children(id) on delete cascade, -- null = kartu template global
  category_id   uuid references public.aac_categories(id) on delete set null,
  label_text    text not null,
  icon_url      text not null,        -- path di Supabase Storage
  audio_text    text not null,        -- teks yang dibacakan Web Speech API
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_aac_cards_child_id on public.aac_cards(child_id);
create index idx_aac_categories_child_id on public.aac_categories(child_id);

-- Log append-only: tidak boleh di-update/delete, hanya insert & select.
create table public.aac_usage_logs (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children(id) on delete cascade,
  card_id     uuid references public.aac_cards(id) on delete set null,
  used_at     timestamptz not null default now()
);

create index idx_aac_usage_logs_child_id on public.aac_usage_logs(child_id, used_at desc);


-- =====================================================================
-- 5. EMOTION MIRROR
-- =====================================================================
-- PENTING: tabel ini HANYA boleh menerima metadata (emosi + confidence).
-- Tidak ada kolom untuk menyimpan gambar/video wajah — sengaja didesain
-- begitu supaya secara struktural mustahil menyimpan data biometrik mentah.

create table public.emotion_mirror_logs (
  id                uuid primary key default gen_random_uuid(),
  child_id          uuid not null references public.children(id) on delete cascade,
  emotion_target    text not null,
  emotion_detected  text not null,
  confidence        numeric(4,3) not null check (confidence between 0 and 1),
  is_match          boolean generated always as (emotion_target = emotion_detected) stored,
  session_id        uuid,
  recorded_at       timestamptz not null default now()
);

create index idx_emotion_logs_child_id on public.emotion_mirror_logs(child_id, recorded_at desc);


-- =====================================================================
-- 6. SOCIAL STORY SIMULATOR
-- =====================================================================

create table public.social_stories (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid references public.children(id) on delete cascade, -- null = template
  title          text not null,
  topic          text,
  difficulty     public.story_difficulty not null default 'medium',
  generated_by   text not null default 'gemini' check (generated_by in ('gemini','manual')),
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

create table public.social_story_panels (
  id                 uuid primary key default gen_random_uuid(),
  story_id           uuid not null references public.social_stories(id) on delete cascade,
  panel_number       int not null,
  image_description  text,
  story_text         text not null,
  audio_text         text not null,
  unique (story_id, panel_number)
);

create table public.social_story_choices (
  id             uuid primary key default gen_random_uuid(),
  story_id       uuid not null references public.social_stories(id) on delete cascade,
  choice_label   text not null,        -- "A", "B", dst
  choice_text    text not null,
  is_appropriate boolean not null default false
);

create table public.social_story_attempts (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references public.children(id) on delete cascade,
  story_id        uuid not null references public.social_stories(id) on delete cascade,
  choice_id       uuid references public.social_story_choices(id),
  was_appropriate boolean,
  attempted_at    timestamptz not null default now()
);

create index idx_story_panels_story_id on public.social_story_panels(story_id);
create index idx_story_choices_story_id on public.social_story_choices(story_id);
create index idx_story_attempts_child_id on public.social_story_attempts(child_id, attempted_at desc);


-- =====================================================================
-- 7. ADAPTIVE LIFE SKILLS (chaining method)
-- =====================================================================

create table public.life_skills (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid references public.children(id) on delete cascade, -- null = template global
  title        text not null,
  category     text,
  is_template  boolean not null default false,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

create table public.life_skill_steps (
  id                uuid primary key default gen_random_uuid(),
  skill_id          uuid not null references public.life_skills(id) on delete cascade,
  step_order        int not null,
  title             text not null,
  description       text,
  media_url         text,
  audio_instruction text not null,
  success_criteria  text,
  unique (skill_id, step_order)
);

create table public.life_skill_progress (
  id                 uuid primary key default gen_random_uuid(),
  child_id           uuid not null references public.children(id) on delete cascade,
  step_id            uuid not null references public.life_skill_steps(id) on delete cascade,
  status             public.skill_progress_status not null default 'not_started',
  attempts_count     int not null default 0,
  last_attempted_at  timestamptz,
  mastered_at        timestamptz,
  unique (child_id, step_id)
);

create index idx_life_skill_steps_skill_id on public.life_skill_steps(skill_id);
create index idx_life_skill_progress_child_id on public.life_skill_progress(child_id);


-- =====================================================================
-- 8. REPORTS & AUDIT TRAIL
-- =====================================================================

create table public.narrative_reports (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  content_text  text not null,       -- hasil narasi dari Gemini
  generated_by  text not null default 'gemini',
  created_at    timestamptz not null default now()
);

-- Audit log untuk aksi sensitif: undang/revoke akses, buat/hapus goal, dst.
-- Diisi dari Server Action, bukan trigger otomatis, supaya action-nya jelas.
create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id),
  action       text not null,         -- contoh: "revoke_access", "create_iep_goal"
  target_table text,
  target_id    uuid,
  child_id     uuid references public.children(id) on delete set null,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index idx_audit_logs_child_id on public.audit_logs(child_id, created_at desc);


-- =====================================================================
-- 9. HELPER FUNCTIONS (dipakai berulang di RLS policy)
-- =====================================================================

create or replace function public.is_parent_of_child(p_child_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.children
    where id = p_child_id and parent_id = auth.uid()
  );
$$;

create or replace function public.has_active_child_access(p_child_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.child_access
    where child_id = p_child_id
      and educator_id = auth.uid()
      and is_active = true
      and expires_at > now()
  );
$$;

create or replace function public.can_access_child(p_child_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select public.is_parent_of_child(p_child_id) or public.has_active_child_access(p_child_id);
$$;


-- =====================================================================
-- 10. ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.child_access enable row level security;
alter table public.iep_goals enable row level security;
alter table public.iep_recommendations enable row level security;
alter table public.aac_categories enable row level security;
alter table public.aac_cards enable row level security;
alter table public.aac_usage_logs enable row level security;
alter table public.emotion_mirror_logs enable row level security;
alter table public.social_stories enable row level security;
alter table public.social_story_panels enable row level security;
alter table public.social_story_choices enable row level security;
alter table public.social_story_attempts enable row level security;
alter table public.life_skills enable row level security;
alter table public.life_skill_steps enable row level security;
alter table public.life_skill_progress enable row level security;
alter table public.narrative_reports enable row level security;
alter table public.audit_logs enable row level security;

-- ---- profiles ----
create policy "view_own_profile" on public.profiles
  for select using (id = auth.uid());

create policy "update_own_profile" on public.profiles
  for update using (id = auth.uid());

create policy "parent_views_their_educators" on public.profiles
  for select using (
    id in (select educator_id from public.child_access
           where child_id in (select id from public.children where parent_id = auth.uid()))
  );

create policy "educator_views_parent_of_accessible_child" on public.profiles
  for select using (
    id in (select parent_id from public.children c
           where public.has_active_child_access(c.id))
  );

-- ---- children ----
create policy "parent_manages_own_children" on public.children
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create policy "educator_views_assigned_child" on public.children
  for select using (public.has_active_child_access(id));

-- ---- child_access ----
create policy "parent_manages_access_grants" on public.child_access
  for all using (public.is_parent_of_child(child_id)) with check (public.is_parent_of_child(child_id));

create policy "educator_views_own_grant" on public.child_access
  for select using (educator_id = auth.uid());

-- ---- iep_goals ----
create policy "accessible_users_view_goals" on public.iep_goals
  for select using (public.can_access_child(child_id));

create policy "parent_and_educator_manage_goals" on public.iep_goals
  for insert with check (public.can_access_child(child_id));

create policy "parent_and_educator_update_goals" on public.iep_goals
  for update using (public.can_access_child(child_id));

create policy "parent_deletes_goals" on public.iep_goals
  for delete using (public.is_parent_of_child(child_id));

-- ---- iep_recommendations ----
create policy "accessible_users_view_recommendations" on public.iep_recommendations
  for select using (public.can_access_child((select child_id from public.iep_goals where id = goal_id)));

-- ---- aac_categories & aac_cards ----
create policy "accessible_users_view_aac_categories" on public.aac_categories
  for select using (child_id is null or public.can_access_child(child_id));
create policy "parent_and_educator_manage_aac_categories" on public.aac_categories
  for all using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));

create policy "accessible_users_view_aac_cards" on public.aac_cards
  for select using (child_id is null or public.can_access_child(child_id));
create policy "parent_and_educator_manage_aac_cards" on public.aac_cards
  for all using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));

-- ---- aac_usage_logs (append-only) ----
create policy "accessible_users_view_aac_logs" on public.aac_usage_logs
  for select using (public.can_access_child(child_id));
create policy "accessible_users_insert_aac_logs" on public.aac_usage_logs
  for insert with check (public.can_access_child(child_id));

-- ---- emotion_mirror_logs (append-only) ----
create policy "accessible_users_view_emotion_logs" on public.emotion_mirror_logs
  for select using (public.can_access_child(child_id));
create policy "accessible_users_insert_emotion_logs" on public.emotion_mirror_logs
  for insert with check (public.can_access_child(child_id));

-- ---- social_stories & children tables ----
create policy "accessible_users_view_stories" on public.social_stories
  for select using (child_id is null or public.can_access_child(child_id));
create policy "parent_and_educator_manage_stories" on public.social_stories
  for all using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));

create policy "accessible_users_view_story_panels" on public.social_story_panels
  for select using (public.can_access_child((select child_id from public.social_stories where id = story_id)) or
                     (select child_id from public.social_stories where id = story_id) is null);
create policy "accessible_users_view_story_choices" on public.social_story_choices
  for select using (public.can_access_child((select child_id from public.social_stories where id = story_id)) or
                     (select child_id from public.social_stories where id = story_id) is null);

create policy "accessible_users_view_story_attempts" on public.social_story_attempts
  for select using (public.can_access_child(child_id));
create policy "accessible_users_insert_story_attempts" on public.social_story_attempts
  for insert with check (public.can_access_child(child_id));

-- ---- life_skills & steps ----
create policy "accessible_users_view_life_skills" on public.life_skills
  for select using (child_id is null or public.can_access_child(child_id));
create policy "parent_and_educator_manage_life_skills" on public.life_skills
  for all using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));

create policy "accessible_users_view_life_skill_steps" on public.life_skill_steps
  for select using (public.can_access_child((select child_id from public.life_skills where id = skill_id)) or
                     (select child_id from public.life_skills where id = skill_id) is null);

-- ---- life_skill_progress ----
create policy "accessible_users_view_progress" on public.life_skill_progress
  for select using (public.can_access_child(child_id));
create policy "accessible_users_upsert_progress" on public.life_skill_progress
  for insert with check (public.can_access_child(child_id));
create policy "accessible_users_update_progress" on public.life_skill_progress
  for update using (public.can_access_child(child_id));

-- ---- narrative_reports ----
create policy "accessible_users_view_reports" on public.narrative_reports
  for select using (public.can_access_child(child_id));

-- ---- audit_logs ----
create policy "parent_views_audit_logs" on public.audit_logs
  for select using (child_id is null or public.is_parent_of_child(child_id));


-- =====================================================================
-- 11. TRIGGERS
-- =====================================================================

-- Auto-update kolom updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_children_updated_at before update on public.children
  for each row execute function public.set_updated_at();
create trigger trg_iep_goals_updated_at before update on public.iep_goals
  for each row execute function public.set_updated_at();
create trigger trg_aac_cards_updated_at before update on public.aac_cards
  for each row execute function public.set_updated_at();

-- Auto-buat baris profiles setiap kali ada user baru daftar via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data->>'full_name', 'Pengguna Baru')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- SELESAI
-- =====================================================================
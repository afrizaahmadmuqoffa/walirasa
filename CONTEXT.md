# WaliRasa - Technical Development Context

## 1. PROJECT OVERVIEW

### Nama Proyek
WaliRasa: Trusted Inclusive Education Ecosystem

### Tema Lomba
"NextGen Secure: Building the Future of Trusted Web Ecosystems"

### SDGs Target
- SDG 4: Quality Education (Pendidikan Berkualitas)
- SDG 10: Reduced Inequalities (Berkurangnya Kesenjangan)

### Deskripsi Singkat
Platform web edukasi inklusif untuk anak dengan Autism Spectrum Disorder (ASD). Menggabungkan AI, komunikasi visual (AAC), dan pelatihan emosi dengan prioritas MUTLAK pada privasi data biometrik anak.

### Target Pengguna
1. **Orang Tua/Wali** - Admin utama, pemilik data, kontrol akses
2. **Guru SLB/Terapis** - Pendidik, akses via token berbatas waktu
3. **Anak dengan ASD** - End-user, interaksi via tablet (UI sensory-friendly)

---

## 2. TECH STACK (TERKUNCI)

### Frontend & Backend
- **Framework**: Next.js
- **Bahasa**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui (komponen aksesibel WCAG)
- **PWA**: next-pwa (offline support untuk tablet)

### Backend-as-a-Service
- **Supabase** (WAJIB digunakan untuk semua aspek backend):
  - PostgreSQL
  - Supabase Auth
  - Supabase Storage
  - Supabase Realtime
  - Supabase Edge Functions
  - Row Level Security (RLS)

### AI & Machine Learning
- **Gemini API** (via Supabase Edge Functions, JANGAN expose API key di client):
  - Model: gemini-flash-lite-latest
  - Penggunaan: generate social stories, life skills steps, IEP recommendations, speech-to-text fallback, laporan naratif
- **TensorFlow.js / MediaPipe Face Mesh** (Client-Side AI):
  - HANYA untuk deteksi ekspresi wajah di fitur Emotion Mirror
  - Proses 100% di browser, video TIDAK dikirim ke server
  - Yang dikirim ke server HANYA metadata JSON: `{"emotion": "happy", "confidence": 0.92}`

### Browser Native APIs
- **Web Speech API**: Text-to-Speech dengan kecepatan adjustable (hingga 82% dari normal)
- **MediaDevices API**: Akses kamera untuk Emotion Mirror
- **Service Workers**: Offline caching via next-pwa

---

## 3. ARSITEKTUR SISTEM

### Diagram Alur Data
```
CLIENT (Browser/Tablet)
├── Next.js Frontend
├── TensorFlow.js/MediaPipe
├── Web Speech API
└── next-pwa (offline)
        │
        │ HTTPS + JWT (Supabase Auth)
        ▼
NEXT.JS SERVER (Server Actions / Route Handlers)
        │
        ▼
SUPABASE
├── PostgreSQL (data dengan RLS)
├── Auth (multi-role: parent, teacher, child)
├── Storage (AAC icons, images)
├── Realtime (WebSocket untuk sync)
└── Edge Functions ──► GEMINI API (API key tersimpan aman di server)
```

### Prinsip Keamanan Utama (NextGen Secure)
1. **Data biometrik (wajah/suara anak) TIDAK PERNAH meninggalkan browser**
2. **Semua panggilan Gemini API via Supabase Edge Functions** (API key tidak pernah sampai ke client)
3. **Row Level Security (RLS)** di setiap tabel PostgreSQL
4. **Time-Limited Access Token** untuk akses guru/terapis
5. **Enkripsi data sensitif** di level database

---

## 4. FITUR UTAMA (5 MODUL)

### 4.1 Web AAC Board (Papan Komunikasi Visual)
**Fungsi**: Alat bantu komunikasi untuk anak non-verbal.

**Spesifikasi Teknis**:
- Drag-and-drop editor untuk guru/orang tua menyusun kartu visual
- Grid responsif (tablet-first, tombol minimal 48x48px)
- Setiap ikon saat ditekan → Web Speech API membacakan dengan kecepatan 82%
- Ikon disimpan di Supabase Storage dengan kebijakan akses per anak
- Kustomisasi per anak (kosakata berbeda per profil)

**Data Flow**:
- Guru upload ikon → Supabase Storage → URL tersimpan di tabel `aac_cards`
- Anak klik ikon → browser baca teks lokal (TTS) → log penggunaan ke tabel `aac_usage_logs`

### 4.2 Emotion Mirror (Latihan Ekspresi Wajah)
**Fungsi**: Melatih anak mengenali & meniru emosi dasar (senang, sedih, marah, takut).

**Spesifikasi Teknis**:
- Animasi 2D wajah target muncul di layar
- Kamera aktif via MediaDevices API
- **TensorFlow.js FaceMesh** mendeteksi landmark wajah di browser
- Klasifikasi emosi dilakukan LOKAL (model ringan via TensorFlow.js)
- HANYA metadata hasil yang dikirim ke server:
  ```json
  {
    "child_id": "uuid",
    "emotion_target": "happy",
    "emotion_detected": "happy",
    "confidence": 0.92,
    "timestamp": "2026-09-22T10:00:00Z"
  }
  ```
- Video stream TIDAK direkam, TIDAK di-upload, TIDAK disimpan

**Kunci Keamanan**: Ini adalah selling point utama "NextGen Secure" — privasi data biometrik anak terjaga mutlak.

### 4.3 Social Story Simulator
**Fungsi**: Simulasi skenario sosial interaktif (cara menyapa, mengantre, berbagi).

**Spesifikasi Teknis**:
- Format: komik interaktif / branching scenario (pilihan berganda visual)
- Konten skenario di-generate oleh **Gemini** via Edge Functions berdasarkan:
  - Usia anak
  - Tingkat spektrum ASD
  - Kebutuhan spesifik dari IEP
- Setiap skenario memiliki 2-4 pilihan respons visual
- Feedback: animasi lembut + suara chime (tidak mengejutkan)
- Hasil interaksi dicatat ke database

**Contoh Prompt ke Gemini (di Edge Function)**:
```
Buat skenario social story untuk anak ASD usia 7 tahun tentang "cara meminta izin ke guru saat ingin ke toilet". Format: 3 panel komik dengan 2 pilihan respons di akhir. Bahasa sederhana, kalimat pendek. Output JSON.
```

### 4.4 Adaptive Step-by-Step Life Skills (Metode Chaining)
**Fungsi**: Mengajarkan rutinitas harian (cuci tangan, sikat gigi, pakai sepatu, dean lain lain) dengan memecah tugas menjadi langkah-langkah kecil.

**Spesifikasi Teknis**:
- Setiap skill dipecah menjadi 5-10 langkah (chaining method)
- Setiap langkah: video pendek/animasi minim distraksi + instruksi suara
- Navigasi: tombol "Selesai" BESAR atau perintah suara (Web Speech API)
- **Slowed-Web Speech**: kecepatan suara default 82%, adjustable oleh guru (range 50%-100%)
- Konten langkah di-generate Gemini atau manual oleh guru
- Progress tracking: langkah mana yang sudah dikuasai, mana yang perlu diulang

**Data Structure**:
```typescript
interface LifeSkillStep {
  id: string;
  skill_id: string;
  order: number;
  title: string;
  description: string;
  media_url: string; // video/animasi
  audio_instruction: string; // teks untuk TTS
  success_criteria: string;
}
```

### 4.5 Collaborative Progress & Goal Tracking
**Fungsi**: Dashboard kolaboratif untuk orang tua, guru, dan terapis memantau perkembangan anak berbasis IEP (Individualized Education Program).

**Spesifikasi Teknis**:
- **Role-Based Access Control (RBAC)**:
  - Orang Tua: akses penuh, bisa invite/revoke guru & terapis
  - Guru: akses hanya ke anak yang ditugaskan, via token berbatas waktu
  - Terapis: akses spesifik ke data terapi
- **Dashboard Metrik**:
  - Frekuensi penggunaan AAC per hari/minggu
  - Akurasi Emotion Mirror per emosi (line chart)
  - Mastery level Life Skills (checklist progress)
  - Social Story completion rate
- **IEP Goal Setting**:
  - Guru set target (contoh: "Anak bisa mengidentifikasi 3 emosi dasar dalam 1 bulan")
  - Gemini 2.5 Pro menganalisis progress → memberikan rekomendasi penyesuaian target
- **Laporan Naratif Otomatis**: Gemini generate laporan teks untuk orang tua berdasarkan data statistik
- **Trust Vault**: Orang tua bisa mencabut akses guru kapan saja (RLS policy update)

---

## 5. SKEMA DATABASE (SUPABASE POSTGRESQL) (MASIH DRAF, BISA BERUBAH MENYESESUAIKAN PENGEMBANGAN)
-- =====================================================================
-- WALIRASA — DATABASE SCHEMA (Supabase / PostgreSQL)
-- Trusted Inclusive Education Ecosystem for Children with ASD
-- =====================================================================
-- Cara pakai: jalankan file ini di Supabase SQL Editor (satu kali, urut
-- dari atas ke bawah — urutan sudah memperhatikan dependency antar tabel).
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
  invite_token  text unique not null default encode(gen_random_bytes(24), 'hex'),
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


## 6. IMPLEMENTASI KEAMANAN (NextGen Secure)

### 6.1 Proteksi Data Biometrik
- Deteksi wajah: TensorFlow.js di browser, model di-load lokal
- Tidak ada endpoint API yang menerima file video/gambar wajah
- Log yang dikirim hanya metadata JSON (emotion, confidence, timestamp)

### 6.2 Proteksi API Key Gemini
- API key Gemini disimpan di environment variable Supabase Edge Functions
- Client TIDAK PERNAH memanggil Gemini API langsung
- Semua request AI: Client → Next.js Server Action → Supabase Edge Function → Gemini API

### 6.3 Akses Berbasis Token
- Guru/terapis tidak mendaftar mandiri, tapi diundang orang tua
- Token akses memiliki `expires_at`
- Orang tua bisa revoke kapan saja (update `is_active = false`)

### 6.4 Enkripsi
- Supabase mengenkripsi data at-rest (AES-256)
- Semua komunikasi via HTTPS/TLS 1.3
- JWT untuk otentikasi, refresh token rotation

---

## 7. UI/UX GUIDELINES (Sensory-Friendly Design)

### Prinsip Desain untuk Anak ASD
1. **Warna**: #A2C5D9, #B5EAD7, #2C4A5E
2. **Font**: poppins
3. **Tombol**: Minimal 48x48px (touch-friendly), dengan label teks + ikon
4. **Animasi**: Hindari animasi cepat, berkedip, atau suara keras. Gunakan transisi lembut (200-300ms, ease-out)
5. **Zen Mode**: Setiap halaman belajar harus punya tombol toggle untuk menghilangkan semua elemen distraksi (navbar, sidebar, notifikasi), hanya menyisakan 1 tugas di tengah layar
6. **Konsistensi**: Navigasi sama di semua halaman, tidak ada perubahan layout mendadak
7. **Feedback**: Visual lembut (bintang, centang) + suara chime pelan.

### Komponen Utama (shadcn/ui + custom)
- `SensoryButton` - tombol besar dengan feedback haptic (vibrate API jika supported)
- `AACGrid` - grid kartu komunikasi dengan drag-drop
- `EmotionCanvas` - canvas untuk menampilkan wajah animasi + kamera preview
- `ZenLayout` - wrapper layout yang bisa toggle distraction-free mode
- `VisualTimer` - progress bar berbasis visual, BUKAN angka countdown

---

## 8. STRUKTUR FOLDER NEXT.JS (MASIH DRAF, BISA BERUBAH SESUAI PENGEMBANGAN)

walirasa/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── invite/[token]/page.tsx        # guru/terapis terima undangan
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/                        # area orang tua & guru/terapis
│   │   ├── layout.tsx                      # sidebar, navbar, RoleGuard
│   │   ├── dashboard/page.tsx              # ringkasan semua anak
│   │   ├── children/
│   │   │   ├── page.tsx                    # daftar anak (khusus parent)
│   │   │   ├── new/page.tsx
│   │   │   └── [childId]/
│   │   │       ├── page.tsx                # overview anak
│   │   │       ├── access/page.tsx         # Trust Vault (kelola akses guru)
│   │   │       ├── iep/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [goalId]/page.tsx
│   │   │       ├── aac-editor/page.tsx
│   │   │       ├── life-skills-editor/page.tsx
│   │   │       └── reports/page.tsx
│   │   └── profile/page.tsx
│   │
│   ├── (kids)/                             # area anak — tablet, Zen Mode
│   │   └── play/[childId]/
│   │       ├── layout.tsx                  # bungkus ZenLayout
│   │       ├── page.tsx                    # menu pilih modul
│   │       ├── aac/page.tsx
│   │       ├── emotion-mirror/page.tsx
│   │       ├── social-story/
│   │       │   ├── page.tsx
│   │       │   └── [storyId]/page.tsx
│   │       └── life-skills/
│   │           ├── page.tsx
│   │           └── [skillId]/page.tsx
│   │
│   ├── api/
│   │   └── webhooks/supabase/route.ts
│   │
│   ├── layout.tsx                          # root layout, font, PWA meta
│   ├── globals.css
│   └── manifest.ts
│
├── components/
│   ├── ui/                                 # primitives shadcn/ui
│   ├── sensory/
│   │   ├── SensoryButton.tsx
│   │   ├── ZenLayout.tsx
│   │   ├── VisualTimer.tsx
│   │   └── ChimeAudio.tsx
│   ├── aac/
│   │   ├── AACGrid.tsx
│   │   ├── AACCardEditor.tsx
│   │   └── AACCategoryTabs.tsx
│   ├── emotion-mirror/
│   │   ├── EmotionCanvas.tsx
│   │   ├── FaceMeshDetector.tsx            # wrapper TensorFlow.js, "use client"
│   │   └── EmotionTargetDisplay.tsx
│   ├── social-story/
│   │   ├── StoryPanel.tsx
│   │   └── ChoiceButtons.tsx
│   ├── life-skills/
│   │   ├── StepCard.tsx
│   │   └── ProgressChecklist.tsx
│   ├── dashboard/
│   │   ├── ChildCard.tsx
│   │   ├── MetricChart.tsx
│   │   ├── AccessTokenManager.tsx
│   │   └── IEPGoalForm.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Navbar.tsx
│       └── RoleGuard.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # browser client
│   │   ├── server.ts                       # server component/action client
│   │   └── middleware.ts                   # refresh session helper
│   ├── actions/                            # Next.js Server Actions
│   │   ├── children.ts
│   │   ├── access.ts
│   │   ├── aac.ts
│   │   ├── emotion-mirror.ts
│   │   ├── social-story.ts
│   │   ├── life-skills.ts
│   │   └── iep.ts
│   ├── ai/edge-function-client.ts          # helper invoke Supabase Edge Function
│   ├── speech/tts.ts                       # wrapper Web Speech API (82% speed)
│   ├── face-detection/face-mesh.ts         # load model, klasifikasi lokal
│   ├── rbac/permissions.ts
│   └── utils.ts
│
├── hooks/
│   ├── useChildAccess.ts
│   ├── useFaceMesh.ts
│   ├── useSpeech.ts
│   └── useRealtimeProgress.ts              # subscribe Supabase Realtime
│
├── types/
│   ├── database.types.ts                   # generated: supabase gen types
│   ├── aac.ts / emotion.ts / social-story.ts / life-skills.ts
│
├── supabase/
│   ├── config.toml
│   ├── migrations/0001_init_schema.sql     # isinya = walirasa_schema.sql
│   └── functions/
│       ├── generate-story/index.ts
│       ├── generate-life-skill-steps/index.ts
│       ├── analyze-iep-progress/index.ts
│       └── _shared/gemini-client.ts
│
├── public/
│   ├── icons/                              # AAC default icon set, ikon PWA
│   └── models/                             # face landmarks model (jika self-hosted)
│
├── middleware.ts                           # refresh session + RBAC route guard
├── next.config.js                          # config next-pwa
├── tailwind.config.ts
└── tsconfig.json
---

## 9. INTEGRASI GEMINI API

### Endpoint 1: Generate Social Story
**Trigger**: Guru klik "Buat Cerita Baru"
**Flow**:
1. Client kirim POST ke Next.js API route dengan data: `{ child_id, topic, difficulty }`
2. Next.js call Supabase Edge Function `generate-story`
3. Edge Function panggil Gemini 2.5 Pro dengan prompt terstruktur
4. Gemini return JSON berisi panels
5. Simpan ke database
6. Return ke client

**Contoh Prompt di Edge Function**:
```typescript
const prompt = `
Kamu adalah spesialis pendidikan anak berkebutuhan khusus.
Buat social story untuk anak ASD dengan kriteria:
- Usia: ${childAge} tahun
- Topik: ${topic}
- Tingkat kesulitan: ${difficulty}

Format output JSON:
{
  "title": "judul cerita",
  "panels": [
    {
      "panel_number": 1,
      "image_description": "deskripsi untuk ilustrasi",
      "text": "teks cerita pendek, maksimal 10 kata",
      "audio_text": "teks untuk dibacakan TTS"
    }
  ],
  "choices": [
    {"id": "A", "text": "pilihan 1", "is_appropriate": true},
    {"id": "B", "text": "pilihan 2", "is_appropriate": false}
  ]
}
`;
```

### Endpoint 2: Generate Life Skill Steps
**Input**: `{ skill_name, child_age, total_steps }`
**Output**: Array langkah dengan instruksi TTS

### Endpoint 3: Analyze IEP Progress
**Input**: Data statistik dari database (frekuensi AAC, akurasi emosi, mastery skills)
**Output**: Rekomendasi penyesuaian target IEP dalam bahasa naratif untuk orang tua

---

## 11. CONSTRAINTS & RULES (WAJIB DIPATUHI)

2. **DILARANG** mengirim data video/gambar wajah anak ke server manapun
3. **DILARANG** expose API key Gemini di sisi client
4. **WAJIB** responsive di tablet dan mobile smarthphone sebagai perangkat utama anak
5. **WAJIB** menggunakan Supabase untuk seluruh kebutuhan backend
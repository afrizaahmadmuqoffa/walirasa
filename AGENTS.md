<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

```markdown
# AGENTS.md — WaliRasa

Panduan wajib untuk AI coding agent yang bekerja di repo ini. Baca seluruh
file ini sebelum mengubah kode. Proyek ini menangani data anak dengan ASD —
prioritas #1 adalah keamanan data anak, bukan kecepatan development.
Jangan tanya ulang hal-hal yang sudah dijawab di sini (stack, struktur
folder, aturan keamanan) — langsung ikuti.

## 1. Project Snapshot
- Nama: WaliRasa — Trusted Inclusive Education Ecosystem
- Domain: platform edukasi inklusif untuk anak dengan Autism Spectrum
  Disorder (ASD)
- Tema kompetisi: "NextGen Secure: Building the Future of Trusted Web
  Ecosystems" (SDG 4 & SDG 10)
- 3 role akun: parent (admin/owner), teacher, therapist (akses via token
  berbatas waktu) — anak adalah end-user tanpa akun login sendiri
- 5 modul: AAC Board, Emotion Mirror, Social Story Simulator, Adaptive
  Life Skills, Collaborative Progress/IEP Dashboard

## 2. Tech Stack (TERKUNCI — jangan diganti tanpa persetujuan eksplisit)
- Next.js (App Router) + TypeScript strict mode
- Tailwind CSS + shadcn/ui
- next-pwa (offline support)
- Supabase: Postgres, Auth, Storage, Realtime, Edge Functions, RLS —
  satu-satunya backend, wajib dipakai untuk semua kebutuhan server-side
- Gemini API (`gemini-flash-lite-latest`) — HANYA dipanggil dari dalam
  Supabase Edge Functions
- TensorFlow.js / MediaPipe FaceMesh — HANYA berjalan di client/browser
- Web Speech API untuk text-to-speech

Jangan usulkan penggantian stack (Firebase, Prisma, tRPC, Express, dll)
sekalipun secara teknis terlihat lebih optimal. Stack ini keputusan
kompetisi, bukan preferensi teknis yang bisa dinegosiasi ulang oleh agent.

## 3. ATURAN KEAMANAN MUTLAK (non-negotiable)
1. Data biometrik anak (gambar wajah, frame video, rekaman suara mentah)
   TIDAK BOLEH meninggalkan browser dalam bentuk apapun — tidak di-upload,
   tidak dikirim ke API route, tidak di-log. Yang boleh dikirim ke server
   HANYA metadata hasil klasifikasi: `{ emotion, confidence, timestamp }`.
   Kalau kamu menulis kode yang mem-fetch/mem-POST payload yang berpotensi
   berisi gambar/video wajah ke endpoint manapun — STOP, jangan asumsikan
   itu benar, tanyakan ke user dulu.
2. `GEMINI_API_KEY` TIDAK BOLEH muncul di kode client (`"use client"`
   component, browser bundle, `NEXT_PUBLIC_*` env var). Semua panggilan
   Gemini wajib lewat `supabase/functions/*`.
3. Semua tabel Supabase WAJIB mengaktifkan Row Level Security. Jangan buat
   tabel baru tanpa `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policy
   yang sesuai di migration yang sama.
4. Akses guru/terapis SELALU lewat tabel `child_access` dengan
   `expires_at` dan `is_active`. Jangan buat jalur akses lain (misal role
   admin hardcode yang bisa lihat semua anak).
5. Tabel log (`aac_usage_logs`, `emotion_mirror_logs`) bersifat
   append-only — jangan tambahkan policy UPDATE/DELETE untuk role biasa
   di tabel-tabel ini.

## 4. Arsitektur & Alur Data
```
Client (browser/tablet)
  → Next.js Server Action / Route Handler
  → Supabase (Postgres+RLS / Storage / Realtime)
  → (khusus task AI) Supabase Edge Function → Gemini API
```
Pola wajib untuk fitur baru yang butuh AI:
1. Client kirim input non-sensitif ke Server Action.
2. Server Action invoke Edge Function terkait lewat
   `lib/ai/edge-function-client.ts`.
3. Edge Function menyimpan `GEMINI_API_KEY` dan memanggil Gemini.
4. Hasil disimpan ke Postgres, baru dikembalikan ke client.

## 5. Peta Folder — taruh kode baru sesuai ini
- Halaman orang tua/guru → `app/(dashboard)/...`
- Halaman anak (Zen Mode) → `app/(kids)/play/[childId]/...`
- Komponen UI generik shadcn → `components/ui/`
- Komponen spesifik modul → `components/<nama-modul>/`
- Server Action baru → `lib/actions/<domain>.ts`, satu file per domain
  tabel (jangan campur beberapa domain dalam satu file)
- Edge Function baru → `supabase/functions/<nama-function>/index.ts`
- Migration SQL baru → `supabase/migrations/XXXX_<deskripsi>.sql` — jangan
  edit migration lama yang sudah pernah dijalankan, selalu buat migration
  baru
- Tipe hasil generate Supabase → `types/database.types.ts`, JANGAN diedit
  manual, regenerate dengan `supabase gen types typescript`

## 6. Konvensi Database
- Semua PK: `uuid default gen_random_uuid()`
- Semua tabel child-scoped punya kolom
  `child_id uuid references children(id) on delete cascade`
- Cek akses di RLS policy pakai helper yang sudah ada —
  `public.can_access_child(child_id)`,
  `public.is_parent_of_child(child_id)`,
  `public.has_active_child_access(child_id)` — jangan tulis ulang
  subquery yang sama di policy baru
- Nama tabel: snake_case, plural (`children`, `aac_cards`)
- Jangan `DROP TABLE`/`DROP COLUMN` di migration baru tanpa konfirmasi
  eksplisit dari user

## 7. Konvensi Kode
- TypeScript strict — tidak ada `any` tanpa komentar justifikasi
- Komponen React: PascalCase file & nama (`AACGrid.tsx`)
- Komponen yang pakai browser API (kamera, Web Speech, TensorFlow.js)
  WAJIB `"use client"` di baris pertama
- Validasi input di Server Action konsisten dengan pola yang sudah ada di
  `lib/actions/` — cek dulu sebelum menambah pola validasi baru
- Jangan fetch Supabase langsung dari client component untuk data
  sensitif/child-scoped — selalu lewat Server Action supaya RLS dan audit
  trail konsisten

## 8. UI/UX Sensory-Friendly (wajib di semua komponen area anak)
- Warna: `#A2C5D9`, `#B5EAD7`, `#2C4A5E`
- Font: Poppins
- Touch target minimal 48x48px
- Transisi 200–300ms, `ease-out` — dilarang animasi cepat/berkedip/flash
- Setiap halaman modul anak WAJIB bisa toggle ke `ZenLayout` (hilangkan
  navbar/sidebar/notifikasi)
- Feedback pakai visual lembut + chime pelan, bukan suara mengejutkan
- TTS default 82% kecepatan (`lib/speech/tts.ts`), adjustable 50–100%
  oleh guru

## 9. Yang TIDAK BOLEH Dilakukan Agent
- Jangan expose `service_role` key Supabase ke client
- Jangan buat endpoint yang menerima file gambar/video wajah
- Jangan hapus/ubah RLS policy yang sudah ada tanpa menjelaskan alasan
  ke user dan menunggu konfirmasi
- Jangan ubah struktur route group `(dashboard)` / `(kids)` tanpa alasan
  kuat — layout dan RBAC bergantung pada pemisahan ini
- Jangan generate data dummy anak yang menyerupai data nyata (nama,
  foto) di seed/demo data — pakai data fiktif yang jelas fiktif

## 10. Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # hanya di server, tidak pernah di client
GEMINI_API_KEY                 # hanya di Supabase Edge Function secrets,
                                # TIDAK di .env Next.js
```

## 11. Sebelum Submit / Commit
- Pastikan tidak ada `console.log` yang membocorkan metadata anak di
  production build
- Jalankan `supabase gen types typescript` ulang kalau ada perubahan
  skema
- Untuk RLS policy baru, cek minimal 3 skenario: parent pemilik anak,
  educator dengan akses aktif, educator dengan akses revoked/expired
```
<!-- END:nextjs-agent-rules -->

# WaliRasa — Development Roadmap & Checkpoint Tracker

> **Cara pakai file ini:** setiap pindah sesi AI (chat baru / agent baru),
> paste isi file ini (atau upload filenya) di awal percakapan bersama
> `AGENTS.md`, lalu bilang: *"lanjutkan dari fase yang statusnya belum ✅
> di STATUS TRACKER."* Agent akan tahu persis harus mulai dari mana tanpa
> kamu jelaskan ulang.

---

## 📍 STATUS TRACKER
**WAJIB dibaca dan diupdate oleh agent.** Jangan kerjakan fase yang
prasyaratnya belum ✅ Selesai. Setelah satu fase lolos SEMUA acceptance
criteria dan Definition of Done, ubah statusnya jadi ✅ dan isi tanggal.

| Fase | Nama                                            | Status         | Tanggal Selesai |
|------|--------------------------------------------------|----------------|------------------|
| 0    | Setup Fondasi Proyek & Pipeline Deploy            | ✅ Selesai    | 2026-09-22          |
| 1    | Autentikasi & Role Dasar                          | ⬜ Belum Mulai | -                |
| 2    | Manajemen Profil Anak                             | ⬜ Belum Mulai | -                |
| 3    | Trust Vault — Akses Guru/Terapis                  | ⬜ Belum Mulai | -                |
| 4    | Modul AAC Communication Board                     | ⬜ Belum Mulai | -                |
| 5    | Modul Emotion Mirror                              | ⬜ Belum Mulai | -                |
| 6    | Modul Social Story Simulator                      | ⬜ Belum Mulai | -                |
| 7    | Modul Adaptive Life Skills                        | ⬜ Belum Mulai | -                |
| 8    | IEP Goals & Collaborative Progress Dashboard      | ⬜ Belum Mulai | -                |
| 9    | PWA & Offline Support                             | ⬜ Belum Mulai | -                |
| 10   | Hardening Keamanan, Aksesibilitas, Deploy Final   | ⬜ Belum Mulai | -                |

Status yang valid: `⬜ Belum Mulai` → `🔄 Sedang Dikerjakan` → `✅ Selesai`

---

## 🤖 Instruksi Wajib Untuk AI Agent

1. Baca `AGENTS.md` di root repo dulu sebelum menyentuh kode apapun.
2. Cari fase pertama di STATUS TRACKER yang statusnya BUKAN ✅. Itu fase
   yang harus dikerjakan sekarang. Jangan loncat ke fase setelahnya.
3. Ubah status fase tsb jadi `🔄 Sedang Dikerjakan` di awal, sebelum mulai
   coding.
4. Ikuti "Langkah Detail" fase tsb secara berurutan. Kalau ada instruksi
   yang ambigu atau butuh keputusan (misal pilih library drag-and-drop),
   putuskan sendiri yang paling sederhana & stabil, lalu catat alasannya
   sebagai komentar di kode — JANGAN berhenti menunggu user kecuali benar-
   benar butuh kredensial/akses (API key, akun Supabase, dsb).
5. Sebelum menandai fase selesai, cek SEMUA item di "Acceptance Criteria"
   fase tsb DAN semua item di "Definition of Done" global di bawah ini.
   Kalau ada satu saja yang gagal, fase belum boleh ditandai ✅.
6. Deploy ke Vercel dan **benar-benar buka URL live-nya**, jangan cuma
   percaya `build sukses` di terminal.
7. Update STATUS TRACKER jadi ✅ + tanggal, commit & push semua perubahan
   (termasuk update file ini sendiri), baru laporkan ke user bahwa fase
   selesai.
8. JANGAN mengerjakan fitur dari fase berikutnya "sekalian" walau
   kelihatan mudah. Satu fase = satu deploy = satu checkpoint yang bisa
   diverifikasi user.
9. JANGAN mengubah/menghapus RLS policy, migration lama, atau struktur
   folder `(dashboard)` / `(kids)` dari fase sebelumnya tanpa alasan
   eksplisit yang diminta oleh instruksi fase yang sedang dikerjakan.

---

## 🌐 Definition of Done (berlaku untuk SEMUA fase)

Selain acceptance criteria khusus tiap fase, ini WAJIB lolos semua
sebelum fase ditandai ✅:

- [ ] `npm run build` sukses tanpa error
- [ ] `npx tsc --noEmit` tidak ada error TypeScript
- [ ] Tidak ada `console.log` sisa debug di kode yang di-commit
- [ ] Fitur fase ini sudah dicoba manual end-to-end di browser oleh
      agent sendiri (klik-klik langsung), bukan cuma dibaca dari kode
- [ ] RLS untuk tabel yang disentuh fase ini sudah dites minimal 2
      skenario: user yang BOLEH akses berhasil, user yang TIDAK boleh
      akses ditolak (dites langsung, bukan diasumsikan dari kode)
- [ ] Sudah di-deploy ke Vercel dan URL production/preview dibuka
      langsung untuk memastikan benar-benar berfungsi
- [ ] STATUS TRACKER di bagian atas file ini sudah diupdate

---

## Fase 0: Setup Fondasi Proyek & Pipeline Deploy

**Tujuan:** proyek Next.js jalan lokal, terhubung ke GitHub, auto-deploy
ke Vercel, terhubung ke project Supabase kosong dengan seluruh skema
tabel sudah ter-migrate.

**Prasyarat:** tidak ada (fase pertama)

**Langkah Detail:**
1. `npx create-next-app@latest walirasa --typescript --tailwind --eslint --app --import-alias "@/*"`
2. `cd walirasa && npx shadcn@latest init` (pilih style default, base
   color boleh sementara "slate" — akan disesuaikan ke palet warna
   sensory-friendly nanti di fase UI modul anak)
3. `npm install @supabase/supabase-js @supabase/ssr`
4. Minta user membuat project baru di supabase.com (agent tidak bisa
   melakukan ini sendiri), catat `Project URL` dan `anon public key`
5. Buat `lib/supabase/client.ts` dan `lib/supabase/server.ts` mengikuti
   pola resmi `@supabase/ssr` untuk Next.js App Router (browser client
   vs server client)
6. Buat `.env.local` berisi `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Pastikan `.env.local` ada di
   `.gitignore` (default Next.js sudah begitu, tinggal dicek)
7. Buat `app/page.tsx` sederhana: judul "WaliRasa — Setup OK" +
   melakukan satu query ringan ke Supabase (misal `select now()` lewat
   RPC atau cek koneksi client) untuk membuktikan koneksi jalan
8. Copy isi `AGENTS.md` yang sudah dibuat sebelumnya ke root repo
9. Copy isi skema SQL (`walirasa_schema.sql` yang sudah dibuat
   sebelumnya) ke `supabase/migrations/0001_init_schema.sql`
10. Install Supabase CLI, `supabase login`, `supabase link --project-ref <ref>`,
    lalu `supabase db push` untuk menjalankan migration
11. Push repo ke GitHub (buat repo baru)
12. Buat project baru di Vercel, hubungkan ke repo GitHub tsb, isi
    Environment Variables yang sama seperti `.env.local` di Vercel
    dashboard (Settings → Environment Variables, untuk Production DAN
    Preview)
13. Trigger deploy, tunggu selesai

**Acceptance Criteria:**
- [ ] `npm run dev` jalan tanpa error di `localhost:3000`
- [ ] Halaman utama menampilkan "WaliRasa — Setup OK" tanpa error koneksi
      Supabase di browser console
- [ ] URL `*.vercel.app` bisa diakses publik dan menampilkan halaman
      yang sama persis seperti localhost
- [ ] Semua 19 tabel dari skema sudah muncul di Supabase Table Editor
- [ ] `AGENTS.md` ada di root repo dan ter-commit

---

## Fase 1: Autentikasi & Role Dasar

**Tujuan:** orang tua bisa register & login; sesi terjaga lewat
middleware; role lain (guru/terapis) BELUM bisa register mandiri —
itu baru dibuka di Fase 3 lewat jalur undangan.

**Prasyarat:** Fase 0 ✅

**Langkah Detail:**
1. `app/(auth)/register/page.tsx` — form: email, password, full_name.
   TIDAK ada pilihan role (selalu jadi `parent`, sesuai default trigger
   `handle_new_user` yang sudah ada di migration)
2. `app/(auth)/login/page.tsx` — form email + password via
   `supabase.auth.signInWithPassword`
3. `middleware.ts` di root — refresh session Supabase (pola
   `updateSession` dari `@supabase/ssr`) dan redirect:
   - belum login & akses `/dashboard/*` atau `/play/*` → ke `/login`
   - sudah login & akses `/login` atau `/register` → ke `/dashboard`
4. `app/(dashboard)/layout.tsx` — ambil data `profiles` user yang login
   lewat Server Component, tampilkan nama + role di header sederhana
5. `app/(dashboard)/dashboard/page.tsx` — halaman kosong: "Selamat
   datang, {full_name}"
6. Tombol logout (Server Action yang panggil `supabase.auth.signOut()`
   lalu redirect ke `/login`)

**Acceptance Criteria:**
- [ ] Register akun baru → baris baru otomatis muncul di tabel
      `profiles` dengan `role = 'parent'` (cek manual di Table Editor)
- [ ] Login dengan akun tsb berhasil, redirect otomatis ke `/dashboard`
      menampilkan nama user
- [ ] Akses `/dashboard` tanpa login → redirect otomatis ke `/login`
- [ ] Logout berfungsi dan kembali ke `/login`
- [ ] Semua di atas dicoba juga di URL Vercel production, bukan cuma
      localhost

---

## Fase 2: Manajemen Profil Anak

**Tujuan:** parent bisa tambah/lihat/edit/hapus data anak miliknya
sendiri, dan RLS teruji parent lain tidak bisa mengaksesnya.

**Prasyarat:** Fase 1 ✅

**Langkah Detail:**
1. `lib/actions/children.ts` — Server Action: `createChild`,
   `updateChild`, `deleteChild`, `getChildrenByParent`
2. `app/(dashboard)/children/page.tsx` — list `ChildCard` untuk anak
   milik parent yang login
3. `app/(dashboard)/children/new/page.tsx` — form tambah anak (nama,
   nickname, birth_date, asd_support_level, upload avatar)
4. `app/(dashboard)/children/[childId]/page.tsx` — detail/edit anak
5. Buat bucket Storage `avatars` di Supabase + policy: hanya parent
   pemilik anak boleh upload/lihat file di path `avatars/{childId}/*`

**Acceptance Criteria:**
- [ ] Parent A tambah anak baru → langsung muncul di `/children`
- [ ] Parent A TIDAK bisa buka data anak milik Parent B walau tahu URL
      `childId`-nya langsung (harus gagal/404 di level query, bukan
      cuma disembunyikan di UI)
- [ ] Edit dan hapus anak berfungsi
- [ ] Upload avatar tersimpan di Storage dan tampil di UI

---

## Fase 3: Trust Vault — Akses Guru/Terapis

**Tujuan:** parent undang guru/terapis via email dengan link token +
masa berlaku; guru/terapis accept undangan lalu dapat akun dengan akses
terbatas ke satu anak; parent bisa revoke kapan saja dan efeknya
langsung.

**Prasyarat:** Fase 2 ✅

**Langkah Detail:**
1. `lib/actions/access.ts` — `inviteEducator(childId, email, accessRole, expiresInDays)`:
   insert ke `child_access` dengan `invite_email`, `access_role`,
   `expires_at`, `educator_id = null`
2. `app/(dashboard)/children/[childId]/access/page.tsx` — form undang +
   list akses aktif dengan tombol "Cabut Akses" (`is_active = false`,
   `revoked_at = now()`)
3. `app/(auth)/invite/[token]/page.tsx` — cek `invite_token` valid &
   belum expired; kalau belum punya akun → form register (email
   prefilled, role otomatis dari undangan, TIDAK bisa diubah user);
   kalau expired → pesan jelas, bukan error mentah
4. Server Action `acceptInvite(token)` — setelah signup sukses, update
   baris `child_access` terkait: isi `educator_id = auth.uid()`
5. Update layout dashboard: role `teacher`/`therapist` yang login
   diarahkan ke tampilan "Anak yang Saya Bantu" (list anak yang mereka
   punya akses), BUKAN halaman "Anak Saya" milik parent

**Acceptance Criteria:**
- [ ] Parent undang guru dengan email tertentu, masa berlaku 30 hari
- [ ] Buka link invite di browser lain (simulasi guru, atau mode
      incognito) → berhasil register dan otomatis dapat akses ke anak
      yang diundangkan
- [ ] Guru login → hanya lihat anak yang diberi akses, tidak bisa lihat
      anak lain milik parent tsb yang belum diundang
- [ ] Parent klik "Cabut Akses" → guru reload halaman → langsung
      kehilangan akses (coba akses langsung URL data anak tsb setelah
      revoke, harus gagal)
- [ ] Set `expires_at` ke masa lalu manual di DB untuk 1 baris test →
      buka link invite-nya → ditolak dengan pesan jelas

---

## Fase 4: Modul AAC Communication Board

**Tujuan:** parent/guru bisa buat kategori & kartu AAC untuk anak
tertentu; anak bisa memakai board itu, tiap tap dibacakan TTS dan
tercatat log.

**Prasyarat:** Fase 3 ✅

**Langkah Detail:**
1. `lib/actions/aac.ts` — `createCategory`, `createCard`, `updateCard`,
   `deleteCard`, `reorderCards`, `getCardsByChild`, `logCardUsage`
2. Bucket Storage `aac-icons` + policy: siapa saja yang
   `can_access_child(child_id)` boleh upload/lihat icon anak tsb
3. `app/(dashboard)/children/[childId]/aac-editor/page.tsx` — editor
   drag-drop (pilih satu library drag-drop yang stabil, catat pilihan +
   alasan di komentar kode), tab per kategori, tiap kartu: upload icon +
   label + audio_text
4. `components/aac/AACGrid.tsx` — grid read-only untuk anak, tombol
   ≥48x48px; onClick → panggil `lib/speech/tts.ts` (Web Speech API,
   rate 0.82) lalu panggil `logCardUsage`
5. `app/(kids)/play/[childId]/aac/page.tsx` — pasang `AACGrid` di dalam
   `ZenLayout`
6. Insert manual (via SQL) minimal 5 kartu template global
   (`child_id IS NULL`) sebagai contoh kosakata dasar

**Acceptance Criteria:**
- [ ] Guru dengan akses aktif bisa buat kategori baru + tambah minimal
      3 kartu dengan icon custom
- [ ] Board anak menampilkan kartu-kartu tsb dan kartu template global
- [ ] Klik kartu → suara benar-benar terbaca di browser (dicoba
      langsung) dan baris baru muncul di `aac_usage_logs`
- [ ] Guru yang aksesnya sudah dicabut (dari Fase 3) tidak bisa lagi
      buka `aac-editor` anak tsb

---

## Fase 5: Modul Emotion Mirror

**Tujuan:** anak latihan menirukan ekspresi wajah, deteksi 100% di
browser, hanya metadata yang terkirim ke server, guru/orang tua lihat
grafik akurasi.

**Prasyarat:** Fase 4 ✅

**Langkah Detail:**
1. `lib/face-detection/face-mesh.ts` — load model TensorFlow.js/
   MediaPipe FaceMesh, fungsi `detectEmotion(videoElement): {emotion, confidence}`,
   mapping landmark ke 4-5 emosi dasar (senang, sedih, marah, takut,
   netral)
2. `components/emotion-mirror/EmotionCanvas.tsx` (`"use client"`) —
   animasi wajah target + preview kamera kecil
3. `components/emotion-mirror/FaceMeshDetector.tsx` — hook loop
   deteksi, callback tiap beberapa ratus ms mengembalikan HANYA
   `{emotion, confidence}`, TIDAK PERNAH frame gambar
4. `lib/actions/emotion-mirror.ts` — `logEmotionResult(childId, target, detected, confidence, sessionId)`,
   parameter tipe-nya SENGAJA tidak menerima file/blob apapun
5. `app/(kids)/play/[childId]/emotion-mirror/page.tsx`
6. Tambahkan chart akurasi per emosi di
   `app/(dashboard)/children/[childId]/reports/page.tsx` (Recharts,
   agregat dari `emotion_mirror_logs`)

**Acceptance Criteria:**
- [ ] Kamera browser aktif, preview tampil
- [ ] Dicek manual lewat tab Network DevTools: TIDAK ADA request keluar
      yang membawa data gambar/video, hanya JSON kecil berisi
      emotion/confidence
- [ ] Setelah sesi latihan, baris baru muncul di `emotion_mirror_logs`
- [ ] Dashboard menampilkan grafik akurasi per emosi dari data sesi yang
      baru dicoba
- [ ] `FaceMeshDetector.tsx` dan `face-mesh.ts` punya komentar jelas di
      bagian atas: "TIDAK MENGIRIM GAMBAR KE SERVER"

---

## Fase 6: Modul Social Story Simulator

**Tujuan:** guru generate cerita sosial via Gemini, anak mainkan cerita
interaktif dengan pilihan, hasil tercatat.

**Prasyarat:** Fase 5 ✅

**Langkah Detail:**
1. `supabase/functions/generate-story/index.ts` — terima
   `{childId, topic, difficulty, childAge}`, panggil Gemini dengan
   prompt terstruktur (format JSON sesuai spek awal proyek)
2. `supabase secrets set GEMINI_API_KEY=<key>` (dilakukan user/agent
   lewat Supabase CLI, TIDAK pernah masuk `.env` Next.js)
3. `lib/ai/edge-function-client.ts` — helper invoke edge function dari
   Server Action
4. `lib/actions/social-story.ts` — `generateStory(childId, topic, difficulty)`:
   panggil edge function, parse hasil JSON, insert ke `social_stories`,
   `social_story_panels`, `social_story_choices`
5. `app/(dashboard)/children/[childId]/social-stories/page.tsx` —
   tombol "Buat Cerita Baru" + list cerita yang ada
6. `components/social-story/StoryPanel.tsx`, `ChoiceButtons.tsx`
7. `app/(kids)/play/[childId]/social-story/[storyId]/page.tsx` — render
   panel demi panel, di akhir tampilkan pilihan, simpan
   `social_story_attempts`

**Acceptance Criteria:**
- [ ] Klik "Buat Cerita Baru" dengan topik & difficulty tertentu →
      dalam waktu wajar (<20 detik) cerita baru (judul + ≥3 panel + ≥2
      pilihan) tersimpan dan tampil di UI
- [ ] Simulasikan `GEMINI_API_KEY` salah/kosong sementara → error
      ditangani dengan pesan jelas ke user, halaman tidak crash
- [ ] Anak bisa mainkan cerita dari awal sampai memilih salah satu
      pilihan, hasil tercatat di `social_story_attempts` dengan
      `was_appropriate` sesuai `is_appropriate` pilihan yang dipilih
- [ ] Cek Network tab: `GEMINI_API_KEY` tidak pernah muncul di request
      dari browser manapun

---

## Fase 7: Modul Adaptive Life Skills

**Tujuan:** guru buat/generate skill dengan langkah-langkah (chaining),
anak jalani step demi step, progress tersimpan.

**Prasyarat:** Fase 6 ✅

**Langkah Detail:**
1. `supabase/functions/generate-life-skill-steps/index.ts` — pola sama
   seperti Fase 6, terima `{skill_name, child_age, total_steps}`
2. `lib/actions/life-skills.ts` — `createSkill`, `generateStepsWithAI`,
   `createStepManual`, `updateProgress(childId, stepId, status)`
3. `app/(dashboard)/children/[childId]/life-skills-editor/page.tsx`
4. `components/life-skills/StepCard.tsx` — tombol "Selesai" BESAR,
   opsional kontrol suara kalau browser support `SpeechRecognition`
5. `app/(kids)/play/[childId]/life-skills/[skillId]/page.tsx` — satu
   step aktif dalam `ZenLayout`, otomatis lanjut ke step berikutnya
   setelah "Selesai" ditekan
6. `components/life-skills/ProgressChecklist.tsx` — dipakai guru untuk
   lihat status tiap step

**Acceptance Criteria:**
- [ ] Guru generate skill baru (misal "Cuci Tangan") dan dapat 5-10
      langkah otomatis, masing-masing punya `audio_instruction`
- [ ] Guru bisa edit manual salah satu langkah dan tersimpan
- [ ] Anak jalani skill step demi step; setelah step terakhir selesai,
      `life_skill_progress` terkait ter-update statusnya dan terlihat
      berubah di dashboard guru
- [ ] Slider kecepatan TTS (50%-100%) di editor benar-benar mengubah
      kecepatan suara saat diputar di sisi anak

---

## Fase 8: IEP Goals & Collaborative Progress Dashboard

**Tujuan:** guru set target IEP, Gemini beri rekomendasi berbasis data
asli, orang tua dapat laporan naratif otomatis.

**Prasyarat:** Fase 7 ✅

**Langkah Detail:**
1. `supabase/functions/analyze-iep-progress/index.ts` — terima ringkasan
   metrik anak (frekuensi AAC, akurasi emosi, mastery skill), keluarkan
   teks rekomendasi
2. `lib/actions/iep.ts` — `createGoal`, `updateGoalStatus`,
   `requestAIRecommendation(goalId)` (insert ke `iep_recommendations`),
   `generateNarrativeReport(childId, periodStart, periodEnd)` (insert
   ke `narrative_reports`)
3. `app/(dashboard)/children/[childId]/iep/page.tsx` — list goal + form
   buat goal baru
4. `app/(dashboard)/children/[childId]/iep/[goalId]/page.tsx` — detail
   goal + tombol "Minta Rekomendasi AI" + riwayat rekomendasi
5. Lengkapi `app/(dashboard)/children/[childId]/reports/page.tsx`
   dengan 4 chart (frekuensi AAC, akurasi emosi, mastery life skills %,
   completion rate social story) + tombol "Generate Laporan Naratif" +
   list laporan yang sudah dibuat

**Acceptance Criteria:**
- [ ] Guru buat goal IEP baru dengan `target_metric` dan `target_date`
- [ ] Setelah ada data dari fase-fase sebelumnya, klik "Minta
      Rekomendasi AI" menghasilkan teks rekomendasi baru yang merujuk
      data ASLI anak tsb (bukan teks generik)
- [ ] Dashboard menampilkan 4 chart dengan data benar-benar dari tabel
      log masing-masing modul
- [ ] "Generate Laporan Naratif" menghasilkan teks yang menyebut
      angka/fakta spesifik dari periode yang dipilih, tersimpan, dan
      bisa dibuka ulang dari list

---

## Fase 9: PWA & Offline Support

**Tujuan:** app bisa di-install di tablet; area anak tetap bisa dipakai
minimal (AAC board + life skills yang sudah pernah dibuka) walau
internet putus.

**Prasyarat:** Fase 8 ✅

**Langkah Detail:**
1. Install & konfigurasi `next-pwa` di `next.config.js`
2. `app/manifest.ts` — nama "WaliRasa", icon, `theme_color` sesuai
   palet warna, `display: "standalone"`
3. Caching strategy: cache-first untuk aset statis (icon AAC, audio),
   network-first untuk data dinamis, fallback halaman offline sederhana
   di area `(kids)`
4. Uji lewat DevTools → Application → Service Workers + simulasi
   offline mode

**Acceptance Criteria:**
- [ ] Prompt "Install App"/add-to-homescreen muncul di Chrome mobile
      emulation
- [ ] Setelah pernah dibuka online sekali, matikan internet (offline
      mode DevTools) → AAC board anak yang sudah pernah dibuka tetap
      tampil dan bisa dipakai (TTS tetap jalan karena Web Speech API
      adalah API browser)
- [ ] Fitur yang butuh network (generate story baru, dsb) menampilkan
      pesan "sedang offline" yang jelas, bukan error/hang

---

## Fase 10: Hardening Keamanan, Aksesibilitas, & Deploy Produksi Final

**Tujuan:** seluruh sistem lolos checklist keamanan & aksesibilitas
sebelum submit lomba, deploy final stabil di Vercel.

**Prasyarat:** Fase 9 ✅

**Langkah Detail:**
1. Review ulang SEMUA RLS policy di 19 tabel — buat checklist manual,
   tes tiap tabel dengan 3 skenario: parent pemilik, educator aktif,
   educator revoked/anonim
2. Jalankan Lighthouse (Accessibility + PWA + Performance) di Chrome
   DevTools untuk halaman `(kids)`, target skor Accessibility ≥90
3. Pastikan halaman `(kids)` bisa dioperasikan dengan keyboard/switch
   access dasar (tab order logis)
4. Grep manual untuk memastikan tidak ada API key hardcode di client:
   `grep -r "GEMINI_API_KEY" --include=*.tsx --include=*.ts app/ components/ lib/`
   harus nol hasil di luar folder `supabase/functions`
5. Finalisasi URL production (`*.vercel.app` atau custom domain)
6. Buat akun demo (1 parent + 1-2 anak + data contoh) khusus juri, DATA
   FIKTIF, kredensial dicatat di `README.md` — bukan di kode

**Acceptance Criteria:**
- [ ] Checklist RLS 19 tabel semua tercentang lolos
- [ ] Skor Lighthouse Accessibility ≥90 di minimal 2 halaman `(kids)`
- [ ] Hasil grep API key di client code = 0 baris mencurigakan
- [ ] URL production final bisa diakses publik dan seluruh 5 modul
      berfungsi end-to-end dari register sampai lihat laporan IEP
- [ ] Akun demo juri sudah dibuat dan didokumentasikan di `README.md`

---

*Setelah Fase 10 ✅, proyek dianggap final dan siap disubmit.*
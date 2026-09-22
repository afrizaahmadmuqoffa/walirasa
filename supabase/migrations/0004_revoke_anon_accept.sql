-- =====================================================================
-- 0004 — REVOKES: accept_invite tidak boleh dieksekusi role anon
-- 0003 sudah revoke dari PUBLIC, tetapi Supabase memberi grant default
-- (alter default privileges) ke role anon sehingga fungsi masih bisa
-- dipanggil tanpa login (walau di dalam selalu ditolak auth.uid() null).
-- Untuk defense-in-depth, cabut juga grant eksplisit ke anon.
-- =====================================================================

revoke execute on function public.accept_invite(text) from anon;

-- Pastikan authenticated tetap punya akses.
grant execute on function public.accept_invite(text) to authenticated;

-- get_invite_details SENGAJA tetap bisa anon (halaman /invite/[token]
-- dirender sebelum login) — read-only, tidak ada mutasi.

-- =====================================================================
-- SELESAI
-- =====================================================================
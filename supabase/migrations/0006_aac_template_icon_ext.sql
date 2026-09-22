-- =====================================================================
-- WALIRASA — MIGRATION 0006: FIX TEMPLATE ICON EXTENSION (.png -> .svg)
-- Kartu template global di-seed pada 0005 dengan icon_url 'global/*.png',
-- sementara file fisiknya adalah SVG vektor (lebih tajam & kecil untuk
-- signed-url storage). Perbaiki ekstensi biar konsisten dengan file asli.
-- =====================================================================

update public.aac_cards
set icon_url = replace(icon_url, '.png', '.svg')
where child_id is null
  and icon_url like 'global/%.png';
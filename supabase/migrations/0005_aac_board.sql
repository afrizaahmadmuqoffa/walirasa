-- =====================================================================
-- WALIRASA — MIGRATION 0005: AAC COMMUNICATION BOARD
-- 1. Bucket Storage 'aac-icons' (private) + storage RLS:
--    - folder "{child_id}/...": hanya user yang can_access_child(child_id)
--      boleh insert/select/update/delete (parent pemilik + educator aktif)
--    - folder "global/...": icon kartu template global; boleh dikelola
--      oleh semua authenticated (dipakai hanya saat seed/update template
--      lewat script, bukan alur produksi — kartu template child_id NULL)
-- 2. Seed kategori & kartu template global (child_id IS NULL) sebagai
--    kosakata dasar contoh untuk semua anak.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Bucket + storage RLS
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('aac-icons', 'aac-icons', false);

create policy "authenticated_manage_aac_icons"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'aac-icons'
  and (
    (storage.foldername(name))[1] = 'global'
    or (
      (storage.foldername(name))[1]::uuid is not null
      and public.can_access_child((storage.foldername(name))[1]::uuid)
    )
  )
);

create policy "authenticated_view_aac_icons"
on storage.objects for select to authenticated
using (
  bucket_id = 'aac-icons'
  and (
    (storage.foldername(name))[1] = 'global'
    or (
      (storage.foldername(name))[1]::uuid is not null
      and public.can_access_child((storage.foldername(name))[1]::uuid)
    )
  )
);

create policy "authenticated_update_aac_icons"
on storage.objects for update to authenticated
using (
  bucket_id = 'aac-icons'
  and (
    (storage.foldername(name))[1] = 'global'
    or (
      (storage.foldername(name))[1]::uuid is not null
      and public.can_access_child((storage.foldername(name))[1]::uuid)
    )
  )
)
with check (
  bucket_id = 'aac-icons'
  and (
    (storage.foldername(name))[1] = 'global'
    or (
      (storage.foldername(name))[1]::uuid is not null
      and public.can_access_child((storage.foldername(name))[1]::uuid)
    )
  )
);

create policy "authenticated_delete_aac_icons"
on storage.objects for delete to authenticated
using (
  bucket_id = 'aac-icons'
  and (
    (storage.foldername(name))[1] = 'global'
    or (
      (storage.foldername(name))[1]::uuid is not null
      and public.can_access_child((storage.foldername(name))[1]::uuid)
    )
  )
);

-- ---------------------------------------------------------------------
-- 2. Seed: kategori template global
-- ---------------------------------------------------------------------
insert into public.aac_categories (child_id, name, icon, sort_order)
values
  (null, 'Kebutuhan Dasar', null, 0),
  (null, 'Perasaan', null, 1);

-- ---------------------------------------------------------------------
-- 3. Seed: kartu template global (icon di storage aac-icons/global/...)
-- ---------------------------------------------------------------------
insert into public.aac_cards
  (child_id, category_id, label_text, icon_url, audio_text, sort_order, is_active)
select
  null,
  c.id,
  v.label_text,
  v.icon_url,
  v.audio_text,
  v.sort_order,
  true
from (values
  ('Kebutuhan Dasar', 0, 'Makan', 'global/makan.png', 'Aku mau makan.'),
  ('Kebutuhan Dasar', 1, 'Minum', 'global/minum.png', 'Aku haus, aku mau minum.'),
  ('Kebutuhan Dasar', 2, 'Toilet', 'global/toilet.png', 'Aku mau ke toilet.'),
  ('Kebutuhan Dasar', 3, 'Istirahat', 'global/istirahat.png', 'Aku capek, aku mau istirahat.'),
  ('Perasaan', 0, 'Bantuan', 'global/bantuan.png', 'Aku butuh bantuan.'),
  ('Perasaan', 1, 'Ya', 'global/ya.png', 'Ya.'),
  ('Perasaan', 2, 'Tidak', 'global/tidak.png', 'Tidak.')
) as v(cat_name, sort_order, label_text, icon_url, audio_text)
join public.aac_categories c on c.name = v.cat_name and c.child_id is null;
-- =====================================================================
-- WALIRASA — MIGRATION 0002: AVATAR STORAGE
-- Bucket 'avatars' (private) + storage RLS: hanya parent pemilik anak
-- yang boleh upload/ubah/hapus, parent & educator aktif yang boleh lihat.
-- Path file: "avatars/{child_id}/{filename}"
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false);

-- INSERT: hanya parent pemilik anak bersangkutan
create policy "parent_upload_child_avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1]::uuid is not null
  and public.is_parent_of_child((storage.foldername(name))[1]::uuid)
);

-- SELECT: parent pemilik ATAU educator dengan akses aktif ke anak tsb
create policy "accessible_users_view_child_avatar"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1]::uuid is not null
  and public.can_access_child((storage.foldername(name))[1]::uuid)
);

-- UPDATE: hanya parent pemilik
create policy "parent_update_child_avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1]::uuid is not null
  and public.is_parent_of_child((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1]::uuid is not null
  and public.is_parent_of_child((storage.foldername(name))[1]::uuid)
);

-- DELETE: hanya parent pemilik
create policy "parent_delete_child_avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1]::uuid is not null
  and public.is_parent_of_child((storage.foldername(name))[1]::uuid)
);
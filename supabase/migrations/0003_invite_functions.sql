-- =====================================================================
-- 0003 — TRUST VAULT INVITE FUNCTIONS
-- Flow untuk link undangan guru/terapis (lihat PLAN.md Fase 3).
-- Dua fungsi SECURITY DEFINER yang TIDAK bisa diakses langsung lewat RLS
-- biasa: child_access punya educator_id NULL sebelum diterima, jadi user
-- anonim tidak bisa SELECT lewat policy. Token 48-hex acak menyulitkan
-- tebakan, sehingga RPC dengan token sebagai bukti aman.
-- =====================================================================

-- ---------------------------------------------------------------------
-- get_invite_details: validasi + data aman untuk halaman /invite/[token]
-- Return jsonb agar tidak mengekspos kolom sensitif (mis. metadata).
-- ---------------------------------------------------------------------
create or replace function public.get_invite_details(p_token text)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  v_invite public.child_access%rowtype;
begin
  select * into v_invite
  from public.child_access
  where invite_token = p_token;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  if not v_invite.is_active then
    return jsonb_build_object('valid', false, 'reason', 'revoked');
  end if;

  if v_invite.expires_at <= now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;

  if v_invite.educator_id is not null then
    return jsonb_build_object('valid', false, 'reason', 'already_used');
  end if;

  return jsonb_build_object(
    'valid', true,
    'access_role', v_invite.access_role,
    'expires_at', v_invite.expires_at,
    'child_id', v_invite.child_id,
    'child_full_name', (select full_name from public.children where id = v_invite.child_id),
    'invite_email', v_invite.invite_email
  );
end;
$$;

-- Read-only, aman dipanggil sebelum login (anon + authenticated).
revoke all on function public.get_invite_details(text) from public;
grant execute on function public.get_invite_details(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- accept_invite: klaim undangan oleh akun yang sudah login.
-- Verifikasi ketat: token valid, email akun == invite_email, belum used,
-- belum expired, dan pengguna tidak boleh menjadi parent pemilik anak tsb.
-- ---------------------------------------------------------------------
create or replace function public.accept_invite(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_invite   public.child_access%rowtype;
  v_user_id  uuid := auth.uid();
  v_email    text := auth.jwt()->>'email';
  v_child    uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'unauthenticated');
  end if;

  select * into v_invite
  from public.child_access
  where invite_token = p_token;

  if not found then
    return jsonb_build_object('success', false, 'error', 'not_found');
  end if;

  if not v_invite.is_active then
    return jsonb_build_object('success', false, 'error', 'revoked');
  end if;

  if v_invite.expires_at <= now() then
    return jsonb_build_object('success', false, 'error', 'expired');
  end if;

  if v_invite.educator_id is not null then
    return jsonb_build_object('success', false, 'error', 'already_used');
  end if;

  if lower(coalesce(v_email, '')) <> lower(coalesce(v_invite.invite_email, '')) then
    return jsonb_build_object('success', false, 'error', 'email_mismatch');
  end if;

  -- Orang tua pemilik anak TIDAK boleh sekaligus menjadi educator anaknya.
  if exists (
    select 1 from public.children c
    where c.id = v_invite.child_id and c.parent_id = v_user_id
  ) then
    return jsonb_build_object('success', false, 'error', 'is_parent');
  end if;

  update public.child_access
  set educator_id = v_user_id,
      granted_at  = now()
  where id = v_invite.id
  returning child_id into v_child;

  insert into public.audit_logs (actor_id, action, target_table, target_id, child_id, metadata)
  values (v_user_id, 'accept_invite', 'child_access', v_invite.id, v_invite.child_id,
          jsonb_build_object('access_role', v_invite.access_role));

  return jsonb_build_object('success', true, 'child_id', v_child);
end;
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

-- ---------------------------------------------------------------------
-- Policy INSERT audit_logs: siapa pun yang login boleh mencatat audt
-- sepanjang actor_id dirinya sendiri (append-only, tanpa UPDATE/DELETE).
-- ---------------------------------------------------------------------
create policy "authenticated_insert_audit_logs" on public.audit_logs
  for insert to authenticated
  with check (actor_id = auth.uid());

-- =====================================================================
-- SELESAI
-- =====================================================================
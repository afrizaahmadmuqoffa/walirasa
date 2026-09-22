import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      ok: false,
      message: "Supabase belum dikonfigurasi. Isi .env.local lalu restart dev server.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.getSession();

  if (error) {
    return { ok: false, message: `Koneksi ke Supabase gagal: ${error.message}` };
  }

  return { ok: true, message: "Koneksi ke Supabase berhasil terhubung." };
}

export default async function Home() {
  const connection = await checkSupabaseConnection();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-white px-6">
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
        style={{ backgroundColor: "#A2C5D9" }}
      >
        🐢
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#2C4A5E" }}>
          WaliRasa — Setup OK
        </h1>
        <p className="max-w-md text-base text-zinc-600">
          Trusted Inclusive Education Ecosystem untuk anak dengan ASD.
        </p>
        <p
          className={`mt-1 rounded-full px-4 py-1.5 text-sm font-medium ${
            connection.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {connection.message}
        </p>
      </div>
      <Link
        href="/docs"
        className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors duration-200 ease-out hover:bg-zinc-50"
      >
        Dokumentasi
      </Link>
    </main>
  );
}
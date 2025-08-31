'use client';
function mask(v?: string) {
  if (!v) return 'undefined';
  if (v.length <= 10) return v;
  return v.slice(0,6) + '...' + v.slice(-4);
}
export default function EnvCheck() {
  return (
    <main className="p-6">
      <pre>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</pre>
      <pre>NEXT_PUBLIC_SUPABASE_ANON_KEY: {mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}</pre>
    </main>
  );
}

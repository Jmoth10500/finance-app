'use client';

export default function EnvCheck() {
  return (
    <main className="p-6">
      <pre>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</pre>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type User = { email?: string | null };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();             // <-- call it
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    const supabase = supabaseBrowser();             // <-- call it
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 space-y-4">
      <h1>Dashboard</h1>

      {user ? (
        <>
          <p>Signed in as <strong>{user.email}</strong></p>
          <button onClick={signOut} className="px-3 py-2 border rounded">
            Sign out
          </button>
        </>
      ) : (
        <>
          <p>You are not signed in.</p>
          <a href="/auth" className="px-3 py-2 border rounded inline-block">
            Go to Sign in
          </a>
        </>
      )}

      <p className="text-sm text-gray-600">Temporary stub page.</p>
    </main>
  );
}

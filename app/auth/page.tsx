'use client';

import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthPage() {
  const signInWithGoogle = async () => {
    const supabase = supabaseBrowser; // NOTE: no ()
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    });
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <button onClick={signInWithGoogle} className="px-3 py-2 border rounded">
        Continue with Google
      </button>
      <p className="text-sm text-gray-600">Temporary stub page.</p>
    </main>
  );
}

'use client';

import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthPage() {
  const sp = useSearchParams();
  const err = sp.get('error');

  const signInWithGoogle = async () => {
    const origin = window.location.origin;
    await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    });
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      {err && (
        <p className="text-red-600">Sign-in error: {decodeURIComponent(err)}</p>
      )}
      <button onClick={signInWithGoogle} className="px-3 py-2 border rounded">
        Continue with Google
      </button>
      <p className="text-sm text-gray-600">Temporary stub page.</p>
    </main>
  );
}

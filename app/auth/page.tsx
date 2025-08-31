'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <main className="p-6">
        <h1>Check your inbox</h1>
        <p>We sent a magic link to {email}.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-sm">
      <h1 className="mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border rounded px-3 py-2"
        />
        <button className="border rounded px-3 py-2">Send magic link</button>
      </form>
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </main>
  );
}

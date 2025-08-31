'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthCallback() {
  const sp = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState('Finishing sign-in...');

  useEffect(() => {
    const code = sp.get('code');
    const next = sp.get('next') ?? '/';

    if (!code) {
      setMsg('No code found. Redirecting...');
      router.replace('/auth');
      return;
    }

    const run = async () => {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMsg(`Sign-in failed: ${error.message}`);
        setTimeout(() => router.replace('/auth'), 1500);
        return;
      }
      router.replace(next);
    };

    run();
  }, [sp, router]);

  return (
    <main className="p-6">
      <h1>Auth Callback</h1>
      <p>{msg}</p>
    </main>
  );
}

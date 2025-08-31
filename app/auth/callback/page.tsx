'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthCallback() {
  const sp = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState('Completing sign-in…');

  useEffect(() => {
    const code = sp.get('code');
    if (!code) {
      setMsg('Missing code');
      return;
    }
    const run = async () => {
      const supabase = supabaseBrowser; // NOTE: no ()
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMsg(`Sign-in failed: ${error.message}`);
        return;
      }
      router.replace('/');
    };
    run();
  }, [sp, router]);

  return (
    <main className="p-6">
      <p>{msg}</p>
    </main>
  );
}

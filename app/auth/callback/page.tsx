'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic'; // don't pre-render this route

export default function AuthCallback() {
  return (
    <Suspense fallback={<main className="p-6">Finishing sign in…</main>}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const supabase = supabaseBrowser;

  useEffect(() => {
    const code = sp.get('code');
    if (!code) {
      router.replace('/auth?error=missing_code');
      return;
    }

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      router.replace(error ? '/auth?error=signin_failed' : '/');
    })();
  }, [sp, router, supabase]);

  return <main className="p-6">Finishing sign in…</main>;
}

'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function AuthCallback() {
  return (
    <Suspense fallback={<main className="p-6">Finishing sign-in…</main>}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const err = sp.get('error_description') || sp.get('error') || undefined;
      if (err) {
        router.replace(`/auth?error=${encodeURIComponent(err)}`);
        return;
      }

      const code = sp.get('code');
      if (code) {
        const supabase = supabaseBrowser();          // <-- call it
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        router.replace(error ? `/auth?error=${encodeURIComponent(error.message)}` : '/');
        return;
      }

      if (typeof window !== 'undefined' && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const access_token = params.get('access_token') ?? undefined;
        const refresh_token = params.get('refresh_token') ?? undefined;

        if (access_token && refresh_token) {
          const supabase = supabaseBrowser();        // <-- call it
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          router.replace(error ? `/auth?error=${encodeURIComponent(error.message)}` : '/');
          return;
        }
      }

      router.replace('/auth?error=missing_code');
    };

    run();
  }, [sp, router]);

  return <main className="p-6">Finishing sign-in…</main>;
}

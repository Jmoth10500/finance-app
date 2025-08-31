'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import StatCard from '@/components/StatCard';

type Tx = { amount: number; date?: string | null };

// ---- Currency helpers ----
// Uses env var, falls back to USD if not set at build time.
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? 'USD';
const nice = (n: number | null) =>
  n == null
    ? '—'
    : new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).format(n);

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalAllTime, setTotalAllTime] = useState<number | null>(null);
  const [txCount, setTxCount] = useState<number | null>(null);
  const [incomeMTD, setIncomeMTD] = useState<number | null>(null);
  const [expenseMTD, setExpenseMTD] = useState<number | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = supabaseBrowser;

        // Who's signed in?
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user ?? null;
        setEmail(user?.email ?? null);
        if (!user) { setLoading(false); return; }

        // All-time stats
        const { data: allTx, error: allErr } = await supabase
          .from('transactions')
          .select('amount');

        if (allErr) throw allErr;

        const all: Tx[] = (allTx ?? []) as Tx[];
        setTxCount(all.length);
        setTotalAllTime(all.reduce((sum, t) => sum + (t.amount ?? 0), 0));

        // Month-to-date stats
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        const isoFirst = firstOfMonth.toISOString();

        const { data: monthTx, error: mErr } = await supabase
          .from('transactions')
          .select('amount,date')
          .gte('date', isoFirst);

        if (mErr) {
          setIncomeMTD(null);
          setExpenseMTD(null);
        } else {
          const month = (monthTx ?? []) as Tx[];
          const income = month.filter(t => (t.amount ?? 0) > 0)
                              .reduce((s, t) => s + (t.amount ?? 0), 0);
          const expense = month.filter(t => (t.amount ?? 0) < 0)
                               .reduce((s, t) => s + (t.amount ?? 0), 0);
          setIncomeMTD(income);
          setExpenseMTD(expense);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return <main className="p-6">Loading…</main>;
  }

  if (!email) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p>You’re not signed in.</p>
        <a className="inline-block rounded border px-3 py-2" href="/auth">Go to Sign in</a>
        <p className="text-sm text-gray-500">You’ll see your numbers here once signed in.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600">Signed in as <strong>{email}</strong></p>
        {/* Debug line so we can see what the bundle uses; remove later */}
        <p className="text-xs text-gray-500">Currency in code: <code>{CURRENCY}</code></p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Can’t read data yet.</p>
          <p className="text-sm mt-1">{error}</p>
          <ol className="list-decimal ml-5 mt-3 text-sm">
            <li>Open your Supabase project → SQL Editor.</li>
            <li>Run the migration to create tables if needed.</li>
            <li>(Optional) Add some rows to <code>transactions</code> (positive = income, negative = expense).</li>
            <li>Refresh this page.</li>
          </ol>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All-time Net" value={nice(totalAllTime)} />
        <StatCard label="Transactions" value={txCount ?? '—'} />
        <StatCard label="Income (MTD)" value={nice(incomeMTD)} note="Sum of positive amounts since 1st" />
        <StatCard label="Expenses (MTD)" value={nice(expenseMTD)} note="Sum of negative amounts since 1st" />
      </section>

      <p className="text-sm text-gray-500">This is a slim starter dashboard. We can expand it with budgets, categories, trends, goals, etc.</p>
    </main>
  );
}

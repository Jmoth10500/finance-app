'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

// ---- Currency helpers (uses NEXT_PUBLIC_CURRENCY, defaults to USD) ----
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? 'USD';
const nice = (n: number | null) =>
  n == null
    ? '—'
    : new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).format(n);

type Category = { id: string; name: string };
type Tx = {
  id: string;
  date: string;
  amount: number;
  note: string | null;
  category: { name: string } | null; // single related category for display
};

export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  const supabase = supabaseBrowser;

  const [txs, setTxs] = useState<Tx[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    setErr(null);
    setLoading(true);

    const [{ data: rawTx, error: txErr }, { data: catData, error: catErr }] = await Promise.all([
      // Alias the relation to a single object named "category"
      supabase
        .from('transactions')
        .select('id,date,amount,note,category:categories(name)')
        .order('date', { ascending: false })
        .limit(200),
      supabase.from('categories').select('id,name').order('name'),
    ]);

    if (txErr) setErr(txErr.message);

    // Normalise relation shape (handles object or array)
    const normalised: Tx[] = (rawTx ?? []).map((r: any) => {
      let cat = r.category ?? r.categories ?? null;
      if (Array.isArray(cat)) cat = cat[0] ?? null;
      return {
        id: r.id,
        date: r.date,
        amount: r.amount,
        note: r.note ?? null,
        category: cat,
      };
    });

    setTxs(normalised);
    if (!catErr) setCats((catData ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!Number.isFinite(val)) {
      setErr('Amount must be a number (positive = income, negative = expense).');
      return;
    }
    const { error } = await supabase.from('transactions').insert({
      date,
      amount: val,
      note: note || null,
      category_id: categoryId || null,
    });
    if (error) setErr(error.message);
    setAmount('');
    setNote('');
    await load();
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Transactions</h1>

      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-sm">Date</label>
          <input type="date" className="border rounded px-2 py-1 w-full"
                 value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Category</label>
          <select className="border rounded px-2 py-1 w-full"
                  value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Amount</label>
          <input className="border rounded px-2 py-1 w-full"
                 value={amount} onChange={(e) => setAmount(e.target.value)}
                 placeholder="e.g. -12.34" />
        </div>
        <div>
          <label className="block text-sm">Note</label>
          <input className="border rounded px-2 py-1 w-full"
                 value={note} onChange={(e) => setNote(e.target.value)}
                 placeholder="optional" />
        </div>
        <button className="px-3 py-2 border rounded">Add</button>
      </form>

      {err ? <p className="text-red-600">{err}</p> : null}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Category</th>
              <th className="py-2">Note</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {txs.map(t => (
              <tr key={t.id}>
                <td className="py-2">{t.date}</td>
                <td className="py-2">{t.category?.name ?? '—'}</td>
                <td className="py-2">{t.note ?? ''}</td>
                <td className="py-2 text-right">{nice(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

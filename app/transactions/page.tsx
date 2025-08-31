'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { nice } from '@/components/Currency';

type Tx = {
  id: string;
  date: string;
  amount: number;
  note: string | null;
  categories: { name: string } | null;
};

type Category = { id: string; name: string };

export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  const supabase = supabaseBrowser;
  const [txs, setTxs] = useState<Tx[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setErr(null);
    const [{ data: txData, error: txErr }, { data: catData, error: catErr }] =
      await Promise.all([
        supabase.from('transactions')
          .select('id,date,amount,note,categories(name)')
          .order('date', { ascending: false })
          .limit(100),
        supabase.from('categories').select('id,name').order('name'),
      ]);
    if (txErr) setErr(txErr.message); else setTxs(txData ?? []);
    if (!catErr) setCats(catData ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!Number.isFinite(val)) { setErr('Amount must be a number'); return; }
    const { error } = await supabase.from('transactions')
      .insert({ date, amount: val, category_id: categoryId || null, note: note || null });
    if (error) setErr(error.message);
    setAmount(''); setNote('');
    load();
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
          <label className="block text-sm">Amount</label>
          <input className="border rounded px-2 py-1 w-full" value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="Positive = income, Negative = expense" />
        </div>
        <div>
          <label className="block text-sm">Category</label>
          <select className="border rounded px-2 py-1 w-full"
                  value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm">Note</label>
          <input className="border rounded px-2 py-1 w-full" value={note}
                 onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </div>
        <button className="px-3 py-2 border rounded">Add</button>
      </form>

      {loading ? <p>Loading…</p> : null}
      {err ? <p className="text-red-600">{err}</p> : null}

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
          {txs.map((t) => (
            <tr key={t.id}>
              <td className="py-2">{t.date}</td>
              <td className="py-2">{t.categories?.name ?? '—'}</td>
              <td className="py-2">{t.note ?? '—'}</td>
              <td className="py-2 text-right font-medium">{nice(t.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

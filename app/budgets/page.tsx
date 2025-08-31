'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { nice } from '@/components/Currency';

type Category = { id: string; name: string };

// What we want each budget row to look like after normalising
type BudgetRow = {
  id: string;
  month_start: string;
  amount: number;
  category: { name: string } | null; // singular relation
};

export const dynamic = 'force-dynamic';

export default function BudgetsPage() {
  const supabase = supabaseBrowser;
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [monthStart, setMonthStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10)
  );
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);

    const [{ data: raw, error: be }, { data: c }] = await Promise.all([
      // alias the relation to "category" to encourage a singular shape
      supabase
        .from('budgets')
        .select('id, month_start, amount, category:categories(name)')
        .order('month_start', { ascending: false })
        .limit(100),
      supabase.from('categories').select('id,name').order('name'),
    ]);

    if (be) setErr(be.message);

    // Normalise any array-shaped relation into a single object
    const b: BudgetRow[] = (raw ?? []).map((r: any) => ({
      id: r.id,
      month_start: r.month_start,
      amount: r.amount,
      category: r.category
        ?? (Array.isArray(r.categories) ? r.categories[0] ?? null : r.categories ?? null),
    }));

    setRows(b);
    setCats((c ?? []) as Category[]);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!Number.isFinite(val) || !categoryId) {
      setErr('Please select a category and enter a numeric amount.');
      return;
    }
    const { error } = await supabase
      .from('budgets')
      .insert({ month_start: monthStart, amount: val, category_id: categoryId });
    if (error) setErr(error.message);
    setAmount('');
    load();
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Budgets</h1>

      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-sm">Month start</label>
          <input
            type="date"
            className="border rounded px-2 py-1 w-full"
            value={monthStart}
            onChange={(e) => setMonthStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Category</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">—</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Amount</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button className="px-3 py-2 border rounded">Add</button>
      </form>

      {err ? <p className="text-red-600">{err}</p> : null}

      <table className="w-full text-sm">
        <thead className="text-left text-gray-500">
          <tr>
            <th className="py-2">Month</th>
            <th className="py-2">Category</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="py-2">{r.month_start}</td>
              <td className="py-2">{r.category?.name ?? '—'}</td>
              <td className="py-2 text-right">{nice(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

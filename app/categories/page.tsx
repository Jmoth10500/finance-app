'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

type Category = { id: string; name: string; color: string | null };

export const dynamic = 'force-dynamic';

export default function CategoriesPage() {
  const supabase = supabaseBrowser;
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,color')
      .order('name');
    if (error) setErr(error.message);
    else setCats(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), color: color || null });
    if (error) setErr(error.message);
    setName(''); setColor('');
    load();
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Categories</h1>

      <form onSubmit={add} className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border rounded px-2 py-1" value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="e.g. Groceries" />
        </div>
        <div>
          <label className="block text-sm">Color (optional)</label>
          <input className="border rounded px-2 py-1" value={color}
                 onChange={(e) => setColor(e.target.value)}
                 placeholder="e.g. emerald" />
        </div>
        <button className="px-3 py-2 border rounded">Add</button>
      </form>

      {loading ? <p>Loading…</p> : null}
      {err ? <p className="text-red-600">{err}</p> : null}

      <ul className="divide-y">
        {cats.map((c) => (
          <li key={c.id} className="py-2 flex justify-between">
            <span>{c.name}</span>
            <span className="text-gray-500 text-sm">{c.color ?? '—'}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

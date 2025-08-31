export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? 'USD';

export function nice(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: CURRENCY,
  }).format(n);
}

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const NUMBER_FMT = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
export const INT_FMT = new Intl.NumberFormat('pt-BR');

export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (!Number.isFinite(n)) return 'R$ 0,00';
  return BRL.format(n);
}

export function formatQty(value: number | string | null | undefined, fractionDigits = 3): string {
  if (value === null || value === undefined || value === '') return '0';
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (!Number.isFinite(n)) return '0';
  return NUMBER_FMT.format(Number(n.toFixed(fractionDigits)));
}

export function toCents(value: number | string): number {
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  return Math.round(n * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function parseMoney(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  return 0;
}

export function decimalToNumber(d: unknown): number {
  if (d === null || d === undefined) return 0;
  if (typeof d === 'string') return parseFloat(d.replace(',', '.')) || 0;
  if (typeof d === 'number') return d;
  // Decimal-like object from Prisma
  if (typeof (d as any)?.toNumber === 'function') return (d as any).toNumber();
  if (typeof (d as any)?.toString === 'function') return parseFloat((d as any).toString()) || 0;
  return 0;
}
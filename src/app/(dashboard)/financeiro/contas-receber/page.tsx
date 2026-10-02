'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatMoney, fmtDate } from '@/lib/money';

export default function ContasReceberPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/accounts-receivable').then((r) => r.json()).then((j) => setItems(j.items || []));
  }, []);
  const total = items.reduce((s, x) => s + (Number(x.amount) - Number(x.paid)), 0);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Contas a Receber</h1>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Total em aberto</div><div className="text-xl font-bold">{formatMoney(total)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Vencidas</div><div className="text-xl font-bold text-destructive">{items.filter((x) => new Date(x.dueDate) < new Date() && x.status !== 'PAID').length}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Contas</div><div className="text-xl font-bold">{items.length}</div></Card>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="h-10 px-3 text-left">Descrição</th><th className="h-10 px-3 text-left">Cliente</th><th className="h-10 px-3 text-right">Valor</th><th className="h-10 px-3 text-left">Vencimento</th><th className="h-10 px-3 text-center">Status</th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.description}</td>
                <td className="p-3">{p.customer?.name ?? '—'}</td>
                <td className="p-3 text-right">{formatMoney(Number(p.amount))}</td>
                <td className="p-3">{fmtDate(p.dueDate)}</td>
                <td className="p-3 text-center">{p.status}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma conta a receber.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
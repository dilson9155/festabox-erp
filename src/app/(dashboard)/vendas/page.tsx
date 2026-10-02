'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import Link from 'next/link';
import { Eye, Printer, X } from 'lucide-react';

export default function VendasPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [q, setQ] = React.useState('');
  const [pageNum, setPageNum] = React.useState(1);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/sales/list?q=${encodeURIComponent(q)}&page=${pageNum}&pageSize=20`);
    const j = await res.json();
    setItems(j.items || []);
  }, [q, pageNum]);
  React.useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const cancel = async (id: string) => {
    const reason = prompt('Motivo do cancelamento?');
    if (!reason) return;
    const res = await fetch(`/api/sales/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    const j = await res.json();
    if (!res.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Venda cancelada', variant: 'success' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-2xl font-bold">Vendas</h1><p className="text-sm text-muted-foreground">Histórico completo de vendas e PDV.</p></div>
        <div className="flex gap-2">
          <Input placeholder="Buscar por número ou cliente..." value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
          <Link href="/pdv"><Button>Abrir PDV</Button></Link>
        </div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Nº</th><th className="h-10 px-3 text-left">Data</th><th className="h-10 px-3 text-left">Cliente</th><th className="h-10 px-3 text-left">Operador</th><th className="h-10 px-3 text-right">Total</th><th className="h-10 px-3 text-center">Status</th><th className="h-10 px-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">#{s.number}</td>
                <td className="p-3">{new Date(s.createdAt).toLocaleString('pt-BR')}</td>
                <td className="p-3">{s.customer?.name ?? '—'}</td>
                <td className="p-3">{s.user?.name}</td>
                <td className="p-3 text-right font-medium">{formatMoney(Number(s.total))}</td>
                <td className="p-3 text-center">{s.status === 'COMPLETED' ? <span className="text-success">OK</span> : s.status === 'CANCELED' ? <span className="text-destructive">Cancelada</span> : s.status}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <a href={`/api/sales/${s.id}/receipt`} target="_blank" rel="noreferrer"><Button size="icon-sm" variant="ghost" title="Imprimir cupom"><Printer className="h-4 w-4" /></Button></a>
                    {s.status === 'COMPLETED' && (
                      <Button size="icon-sm" variant="ghost" onClick={() => cancel(s.id)} title="Cancelar"><X className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma venda encontrada.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
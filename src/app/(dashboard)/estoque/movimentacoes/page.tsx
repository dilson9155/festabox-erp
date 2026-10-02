'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatDate, formatQty } from '@/lib/money';

export default function MovimentacoesPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/stock-movements').then((r) => r.json()).then((j) => setItems(j.items || []));
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Movimentações de Estoque</h1>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="h-10 px-3 text-left">Data</th><th className="h-10 px-3 text-left">Produto</th><th className="h-10 px-3 text-left">Tipo</th><th className="h-10 px-3 text-right">Qtd</th><th className="h-10 px-3 text-right">Anterior</th><th className="h-10 px-3 text-right">Atual</th><th className="h-10 px-3 text-left">Motivo</th><th className="h-10 px-3 text-left">Usuário</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{new Date(it.createdAt).toLocaleString('pt-BR')}</td>
                <td className="p-3">{it.product?.name}</td>
                <td className="p-3">{it.type}</td>
                <td className="p-3 text-right">{formatQty(Number(it.quantity))}</td>
                <td className="p-3 text-right">{formatQty(Number(it.previousQty))}</td>
                <td className="p-3 text-right">{formatQty(Number(it.newQty))}</td>
                <td className="p-3">{it.reason ?? '—'}</td>
                <td className="p-3">{it.user?.name}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Sem movimentações.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
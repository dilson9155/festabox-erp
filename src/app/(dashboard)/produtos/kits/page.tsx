'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';

export default function KitsPage() {
  const { push } = useToast();
  const [products, setProducts] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [items, setItems] = React.useState<{ productId: string; quantity: number }[]>([]);
  const [selected, setSelected] = React.useState('');
  const [qty, setQty] = React.useState(1);

  React.useEffect(() => { fetch('/api/products?pageSize=100').then((r) => r.json()).then((j) => setProducts(j.items || [])); }, []);

  const total = items.reduce((s, it) => {
    const p = products.find((p) => p.id === it.productId);
    return s + (p ? Number(p.salePrice) * it.quantity : 0);
  }, 0);

  const save = async () => {
    if (!name.trim() || items.length === 0) return push({ title: 'Informe nome e ao menos um item', variant: 'destructive' });
    // Cria produto-kit via /api/products (isKit flag e itens via tabela separada)
    const res = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, salePrice: total, isKit: true, trackStock: false }),
    });
    if (!res.ok) { const j = await res.json(); return push({ title: 'Erro', description: j.error, variant: 'destructive' }); }
    push({ title: 'Kit cadastrado', variant: 'success' });
    setName(''); setItems([]);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kits / Combos</h1>
      <Card className="p-4 mb-4 space-y-3">
        <Input placeholder="Nome do kit (ex: Kit Festa 20 pessoas)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-12 gap-2">
          <select className="col-span-7 h-10 rounded-md border px-3 text-sm" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Selecione um produto...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} - {formatMoney(Number(p.salePrice))}</option>)}
          </select>
          <Input className="col-span-3" type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} />
          <Button className="col-span-2" onClick={() => {
            if (!selected) return;
            setItems((cur) => [...cur, { productId: selected, quantity: qty }]);
            setSelected('');
          }}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
        {items.length > 0 && (
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="h-9 px-3 text-left">Produto</th><th className="h-9 px-3 text-center">Qtd</th><th className="h-9 px-3 text-right">Subtotal</th></tr></thead>
              <tbody>
                {items.map((it, idx) => {
                  const p = products.find((p) => p.id === it.productId);
                  return (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{p?.name}</td>
                      <td className="p-3 text-center">{it.quantity}</td>
                      <td className="p-3 text-right">{formatMoney(p ? Number(p.salePrice) * it.quantity : 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="border-t bg-muted/40 font-medium"><td className="p-3" colSpan={2}>Total do kit</td><td className="p-3 text-right">{formatMoney(total)}</td></tr></tfoot>
            </table>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={save} disabled={!items.length}>Salvar Kit</Button>
        </div>
      </Card>
    </div>
  );
}
function formatMoney(n: number) { return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
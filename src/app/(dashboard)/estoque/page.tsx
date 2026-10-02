'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { formatMoney, decimalToNumber } from '@/lib/money';
import { AlertTriangle, ArrowUp, ArrowDown, Plus } from 'lucide-react';

export default function EstoquePage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [movementType, setMovementType] = React.useState<'ADJUST_IN' | 'ADJUST_OUT' | 'LOSS' | 'DAMAGE' | 'INITIAL'>('ADJUST_IN');
  const [productId, setProductId] = React.useState('');
  const [products, setProducts] = React.useState<any[]>([]);
  const [qty, setQty] = React.useState(0);
  const [reason, setReason] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const { push } = useToast();

  const load = React.useCallback(async () => {
    const r = await fetch('/api/stock-balances');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    fetch('/api/products?pageSize=200').then((r) => r.json()).then((j) => setProducts(j.items || []));
  }, []);

  const save = async () => {
    if (!productId || qty <= 0 || !reason.trim()) return push({ title: 'Preencha todos os campos', variant: 'destructive' });
    const r = await fetch('/api/stock-movements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, type: movementType, quantity: qty, reason }) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Movimentação registrada', variant: 'success' });
    setOpen(false); setProductId(''); setQty(0); setReason('');
    load();
  };

  const filtered = items.filter((it) => !filter || (it.name + it.code).toLowerCase().includes(filter.toLowerCase()));
  const low = items.filter((it) => it.stockMin > 0 && it.stock <= it.stockMin).length;
  const out = items.filter((it) => it.stock <= 0).length;
  const totalValue = items.reduce((s, it) => s + it.stock * (it.costPrice ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground">Visão em tempo real dos saldos por produto.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Filtrar..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56" />
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Movimentar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Produtos</div><div className="text-xl font-bold">{items.length}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Estoque baixo</div><div className="text-xl font-bold text-warning">{low}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Sem estoque</div><div className="text-xl font-bold text-destructive">{out}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Valor em estoque</div><div className="text-xl font-bold">{formatMoney(totalValue)}</div></Card>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="h-10 px-3 text-left">Produto</th>
              <th className="h-10 px-3 text-left">Categoria</th>
              <th className="h-10 px-3 text-right">Custo</th>
              <th className="h-10 px-3 text-right">Venda</th>
              <th className="h-10 px-3 text-right">Estoque</th>
              <th className="h-10 px-3 text-right">Mínimo</th>
              <th className="h-10 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.productId} className="border-t">
                <td className="p-3">{it.name}</td>
                <td className="p-3">{it.category}</td>
                <td className="p-3 text-right">{formatMoney(it.costPrice)}</td>
                <td className="p-3 text-right">{formatMoney(it.salePrice)}</td>
                <td className="p-3 text-right font-medium">{it.stock.toLocaleString('pt-BR')}</td>
                <td className="p-3 text-right">{it.stockMin?.toLocaleString('pt-BR') ?? '-'}</td>
                <td className="p-3 text-center">
                  {it.stock <= 0 ? <Badge variant="destructive">Zerado</Badge> :
                    it.stockMin > 0 && it.stock <= it.stockMin ? <Badge variant="warning">Baixo</Badge> :
                      <Badge variant="success">OK</Badge>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum item.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="p-4 w-full max-w-md">
            <h3 className="font-semibold mb-3">Movimentação de estoque</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Tipo</label>
                <select className="w-full h-10 rounded-md border px-3 text-sm" value={movementType} onChange={(e) => setMovementType(e.target.value as any)}>
                  <option value="INITIAL">Estoque inicial</option>
                  <option value="ADJUST_IN">Entrada (Ajuste)</option>
                  <option value="ADJUST_OUT">Saída (Ajuste)</option>
                  <option value="LOSS">Perda</option>
                  <option value="DAMAGE">Avaria</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Produto</label>
                <select className="w-full h-10 rounded-md border px-3 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Quantidade</label>
                <Input type="number" step="0.001" value={qty} onChange={(e) => setQty(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Motivo *</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Obrigatório para rastreabilidade" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Registrar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
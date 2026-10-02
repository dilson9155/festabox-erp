'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { Plus, Send } from 'lucide-react';
import Link from 'next/link';

export default function ComprasPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const { push } = useToast();
  const [open, setOpen] = React.useState(false);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [form, setForm] = React.useState<any>({ supplierId: '', invoiceNumber: '', invoiceKey: '', invoiceDate: '' });
  const [lines, setLines] = React.useState<{ productId: string; quantity: number; unitCost: number }[]>([]);

  const load = React.useCallback(async () => {
    const r = await fetch('/api/purchases');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    const s = await fetch('/api/suppliers').then((r) => r.json());
    const p = await fetch('/api/products?pageSize=200').then((r) => r.json());
    setSuppliers(s.items || []);
    setProducts(p.items || []);
    setForm({ supplierId: '', invoiceNumber: '', invoiceKey: '', invoiceDate: new Date().toISOString().slice(0, 10) });
    setLines([]);
    setOpen(true);
  };

  const addLine = () => setLines([...lines, { productId: '', quantity: 1, unitCost: 0 }]);
  const updateLine = (i: number, k: string, v: any) => setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  const save = async () => {
    if (!form.supplierId) return push({ title: 'Selecione um fornecedor', variant: 'destructive' });
    if (lines.length === 0) return push({ title: 'Adicione ao menos um item', variant: 'destructive' });
    const res = await fetch('/api/purchases', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: lines.filter((l) => l.productId) }),
    });
    const j = await res.json();
    if (!res.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Compra registrada', variant: 'success' });
    setOpen(false); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="text-sm text-muted-foreground">Registre entradas de mercadoria e gere contas a pagar.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/compras/importar-nfe">
            <Button variant="outline"><Send className="h-4 w-4 mr-1" /> Importar NF-e</Button>
          </Link>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nova Compra</Button>
        </div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Nº</th><th className="h-10 px-3 text-left">Fornecedor</th><th className="h-10 px-3 text-left">NF</th><th className="h-10 px-3 text-right">Total</th><th className="h-10 px-3 text-center">Status</th><th className="h-10 px-3 text-left">Data</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">#{p.number}</td>
                <td className="p-3">{p.supplier?.legalName}</td>
                <td className="p-3">{p.invoiceNumber ?? '—'}</td>
                <td className="p-3 text-right">{formatMoney(Number(p.total))}</td>
                <td className="p-3 text-center">{p.status}</td>
                <td className="p-3">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma compra registrada.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold mb-3">Nova Compra</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Fornecedor *">
                <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.legalName}</option>)}
                </select>
              </Field>
              <Field label="Nº NF"><Input value={form.invoiceNumber ?? ''} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></Field>
              <Field label="Chave NF"><Input value={form.invoiceKey ?? ''} onChange={(e) => setForm({ ...form, invoiceKey: e.target.value })} /></Field>
              <Field label="Data NF"><Input type="date" value={form.invoiceDate ?? ''} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} /></Field>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between"><h4 className="font-medium">Itens</h4><Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" /> Item</Button></div>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <select className="col-span-6 h-10 rounded-md border px-2 text-sm" value={l.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)}>
                    <option value="">Produto...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <Input className="col-span-2" type="number" step="0.001" value={l.quantity} onChange={(e) => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)} />
                  <Input className="col-span-2" type="number" step="0.01" value={l.unitCost} onChange={(e) => updateLine(i, 'unitCost', parseFloat(e.target.value) || 0)} />
                  <div className="col-span-1 text-right text-sm">{(l.quantity * l.unitCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  <Button size="icon-sm" variant="ghost" className="col-span-1" onClick={() => removeLine(i)}>×</Button>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-primary">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar Compra</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-muted-foreground mb-1">{label}</label>{children}</div>;
}
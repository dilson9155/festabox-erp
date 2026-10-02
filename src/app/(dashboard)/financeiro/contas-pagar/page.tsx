'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatMoney, fmtDate } from '@/lib/money';

type Payable = { id: string; description: string; supplier?: { legalName: string } | null; amount: number; paid: number; status: string; dueDate: string };

export default function ContasPagarPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<Payable[]>([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({});
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [costCenters, setCostCenters] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    const r = await fetch('/api/accounts-payable');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    const s = await fetch('/api/suppliers').then((r) => r.json());
    const cc = await fetch('/api/cost-centers').then((r) => r.json());
    setSuppliers(s.items || []);
    setCostCenters(cc.items || []);
    setForm({ description: '', amount: 0, dueDate: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };

  const save = async () => {
    if (!form.description?.trim() || !form.amount) return push({ title: 'Preencha descrição e valor', variant: 'destructive' });
    const res = await fetch('/api/accounts-payable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    const j = await res.json();
    if (!res.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Conta cadastrada', variant: 'success' });
    setOpen(false); load();
  };

  const total = items.reduce((s, x) => s + (Number(x.amount) - Number(x.paid)), 0);
  const overdue = items.filter((x) => new Date(x.dueDate) < new Date() && x.status !== 'PAID').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-2xl font-bold">Contas a Pagar</h1><p className="text-sm text-muted-foreground">Gerencie despesas, parcelamentos e vencimentos.</p></div>
        <Button onClick={openCreate}>Nova conta</Button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Total em aberto</div><div className="text-xl font-bold">{formatMoney(total)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Vencidas</div><div className="text-xl font-bold text-destructive">{overdue}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Contas</div><div className="text-xl font-bold">{items.length}</div></Card>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Descrição</th><th className="h-10 px-3 text-left">Fornecedor</th><th className="h-10 px-3 text-right">Valor</th><th className="h-10 px-3 text-right">Pago</th><th className="h-10 px-3 text-left">Vencimento</th><th className="h-10 px-3 text-center">Status</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.description}</td>
                <td className="p-3">{p.supplier?.legalName ?? '—'}</td>
                <td className="p-3 text-right">{formatMoney(Number(p.amount))}</td>
                <td className="p-3 text-right">{formatMoney(Number(p.paid))}</td>
                <td className="p-3">{fmtDate(p.dueDate)}</td>
                <td className="p-3 text-center">{p.status}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma conta a pagar.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="p-4 w-full max-w-md">
            <h3 className="font-semibold mb-3">Nova Conta a Pagar</h3>
            <div className="space-y-3">
              <Input placeholder="Descrição *" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.supplierId ?? ''} onChange={(e) => setForm({ ...form, supplierId: e.target.value || null })}>
                <option value="">Fornecedor (opcional)</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.legalName}</option>)}
              </select>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.costCenterId ?? ''} onChange={(e) => setForm({ ...form, costCenterId: e.target.value || null })}>
                <option value="">Centro de custo (opcional)</option>
                {costCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Input type="number" step="0.01" placeholder="Valor *" value={form.amount ?? 0} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Input type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
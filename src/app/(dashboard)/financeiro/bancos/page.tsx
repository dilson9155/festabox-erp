'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';

export default function BancosPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({ type: 'BANK', initialBalance: 0 });

  const load = React.useCallback(async () => {
    const r = await fetch('/api/financial-accounts');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    const res = await fetch('/api/financial-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, initialBalance: Number(form.initialBalance) || 0 }) });
    const j = await res.json();
    if (!res.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Conta cadastrada', variant: 'success' });
    setOpen(false); setForm({ type: 'BANK', initialBalance: 0 }); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-2xl font-bold">Contas Financeiras</h1><p className="text-sm text-muted-foreground">Caixas, bancos, contas digitais, PIX.</p></div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova conta</Button>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Nome</th><th className="h-10 px-3 text-left">Tipo</th><th className="h-10 px-3 text-left">Banco</th><th className="h-10 px-3 text-left">Agência</th><th className="h-10 px-3 text-left">Conta</th><th className="h-10 px-3 text-left">Chave PIX</th></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.name}</td>
                <td className="p-3">{it.type}</td>
                <td className="p-3">{it.bank ?? '—'}</td>
                <td className="p-3">{it.agency ?? '—'}</td>
                <td className="p-3">{it.account ?? '—'}</td>
                <td className="p-3">{it.pixKey ?? '—'}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma conta cadastrada.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="p-4 w-full max-w-md">
            <h3 className="font-semibold mb-3">Nova Conta</h3>
            <div className="space-y-2">
              <Input placeholder="Nome" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="CASH">Caixa</option><option value="BANK">Banco</option><option value="PIX">Conta PIX</option><option value="CARD">Cartão</option><option value="DIGITAL">Conta Digital</option>
              </select>
              <Input placeholder="Banco" value={form.bank ?? ''} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Agência" value={form.agency ?? ''} onChange={(e) => setForm({ ...form, agency: e.target.value })} />
                <Input placeholder="Conta" value={form.account ?? ''} onChange={(e) => setForm({ ...form, account: e.target.value })} />
              </div>
              <Input placeholder="Chave PIX" value={form.pixKey ?? ''} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} />
              <Input type="number" step="0.01" placeholder="Saldo inicial" value={form.initialBalance ?? 0} onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
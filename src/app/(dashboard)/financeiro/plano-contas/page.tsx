'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';

export default function PlanoContasPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [form, setForm] = React.useState<any>({ type: 'REVENUE' });

  const load = React.useCallback(async () => {
    const r = await fetch('/api/chart-of-accounts');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.code || !form.name) return push({ title: 'Código e nome obrigatórios', variant: 'destructive' });
    const r = await fetch('/api/chart-of-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Conta cadastrada', variant: 'success' });
    setForm({ type: 'REVENUE' }); load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Plano de Contas</h1>
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-12 gap-2">
          <Input className="col-span-2" placeholder="Código" value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input className="col-span-6" placeholder="Nome" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="col-span-3 h-10 rounded-md border px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="REVENUE">Receita</option><option value="EXPENSE">Despesa</option>
          </select>
          <Button className="col-span-1" onClick={save}><Plus className="h-4 w-4" /></Button>
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="h-10 px-3 text-left">Código</th><th className="h-10 px-3 text-left">Nome</th><th className="h-10 px-3 text-left">Tipo</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3 font-mono">{it.code}</td>
                <td className="p-3">{it.name}</td>
                <td className="p-3">{it.type === 'REVENUE' ? 'Receita' : 'Despesa'}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Plano vazio.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
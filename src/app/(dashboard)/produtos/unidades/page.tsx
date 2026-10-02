'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus, Trash2 } from 'lucide-react';

type Unit = { id: string; name: string; abbreviation: string };

export default function UnitsPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<Unit[]>([]);
  const [name, setName] = React.useState('');
  const [abbrev, setAbbrev] = React.useState('');

  const load = React.useCallback(async () => {
    const r = await fetch('/api/units');
    const j = await r.json();
    setItems(j.items || []);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim() || !abbrev.trim()) return;
    const r = await fetch('/api/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, abbreviation: abbrev }) });
    if (!r.ok) { const j = await r.json(); push({ title: 'Erro', description: j.error, variant: 'destructive' }); return; }
    setName(''); setAbbrev('');
    push({ title: 'Unidade cadastrada', variant: 'success' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Inativar?')) return;
    await fetch('/api/units', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Unidades de Medida</h1>
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-12 gap-2">
          <Input className="col-span-6" placeholder="Nome (ex: Quilograma)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input className="col-span-4" placeholder="Abrev (KG)" value={abbrev} onChange={(e) => setAbbrev(e.target.value)} />
          <Button className="col-span-2" onClick={add}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Nome</th><th className="h-10 px-3 text-left">Abreviação</th><th className="h-10 px-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.abbreviation}</td>
                <td className="p-3 text-right"><Button size="icon-sm" variant="ghost" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma unidade cadastrada.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
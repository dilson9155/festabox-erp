'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus, Trash2 } from 'lucide-react';

type Item = { id: string; name: string };

export function GenericCrud({ title, endpoint }: { title: string; endpoint: string }) {
  const { push } = useToast();
  const [items, setItems] = React.useState<Item[]>([]);
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch(endpoint);
    const j = await r.json();
    setItems(j.items || []);
  }, [endpoint]);

  React.useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erro');
      setName('');
      push({ title: 'Cadastrado', variant: 'success' });
      load();
    } catch (e: any) { push({ title: 'Erro', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este item?')) return;
    await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    push({ title: 'Removido', variant: 'success' });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <Card className="p-4 mb-4">
        <div className="flex gap-2">
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Button onClick={add} disabled={loading}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </div>
      </Card>
      <Card>
        {items.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum item cadastrado.</div> : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between p-3">
                <span>{it.name}</span>
                <Button size="icon-sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
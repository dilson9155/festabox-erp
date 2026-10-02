'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';

export default function CentrosCustoPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');

  const load = React.useCallback(async () => {
    const r = await fetch('/api/cost-centers');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    const r = await fetch('/api/cost-centers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Centro cadastrado', variant: 'success' });
    setName(''); load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Centros de Custo</h1>
      <Card className="p-4 mb-4 flex gap-2">
        <Input placeholder="Nome (ex: Loja, Marketing, Aluguel)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="h-10 px-3 text-left">Nome</th></tr></thead>
          <tbody>{items.map((it) => <tr key={it.id} className="border-t"><td className="p-3">{it.name}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
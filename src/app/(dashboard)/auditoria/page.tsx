'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/money';

export default function AuditoriaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [entity, setEntity] = useState('');
  useEffect(() => {
    fetch(`/api/audit?entity=${encodeURIComponent(entity)}`).then((r) => r.json()).then((j) => setItems(j.items || []));
  }, [entity]);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Auditoria</h1>
      <Card className="p-4 mb-4">
        <div className="flex gap-2">
          <Input placeholder="Filtrar por entidade (Product, Sale, Customer...)" value={entity} onChange={(e) => setEntity(e.target.value)} />
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="h-10 px-3 text-left">Data</th><th className="h-10 px-3 text-left">Usuário</th><th className="h-10 px-3 text-left">Entidade</th><th className="h-10 px-3 text-left">ID</th><th className="h-10 px-3 text-left">Ação</th><th className="h-10 px-3 text-left">Motivo</th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{new Date(a.createdAt).toLocaleString('pt-BR')}</td>
                <td className="p-3">{a.user?.name ?? '—'}</td>
                <td className="p-3">{a.entity}</td>
                <td className="p-3 font-mono text-xs">{a.entityId.slice(0, 8)}</td>
                <td className="p-3">{a.action}</td>
                <td className="p-3">{a.reason ?? '—'}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Sem registros de auditoria.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
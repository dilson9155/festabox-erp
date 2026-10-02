'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

type U = { id: string; name: string; email: string; role: string; active: boolean };

export default function UsuariosPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<U[]>([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({ role: 'CASHIER' });

  const load = React.useCallback(async () => {
    const r = await fetch('/api/users');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.email || !form.password) return push({ title: 'Preencha todos os campos', variant: 'destructive' });
    const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Usuário criado', variant: 'success' });
    setOpen(false); setForm({ role: 'CASHIER' }); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Button onClick={() => setOpen(true)}>Novo usuário</Button>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="h-10 px-3 text-left">Nome</th><th className="h-10 px-3 text-left">E-mail</th><th className="h-10 px-3 text-left">Função</th><th className="h-10 px-3 text-center">Status</th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3 text-center">{u.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum usuário.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="p-4 w-full max-w-md">
            <h3 className="font-semibold mb-3">Novo Usuário</h3>
            <div className="space-y-2">
              <Input placeholder="Nome" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input type="email" placeholder="E-mail" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input type="password" placeholder="Senha (mín. 6)" value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">ADMIN - acesso total</option>
                <option value="MANAGER">GERENTE - exceto excluir</option>
                <option value="CASHIER">CAIXA - PDV</option>
                <option value="SELLER">VENDEDOR</option>
                <option value="STOCKIST">ESTOQUISTA</option>
                <option value="FINANCIAL">FINANCEIRO</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Criar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
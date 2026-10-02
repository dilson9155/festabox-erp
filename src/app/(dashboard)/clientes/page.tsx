'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { BR_STATES } from '@/lib/br-states';

type Customer = { id: string; personType?: string; name: string; tradeName?: string; document?: string; email?: string; phone?: string; whatsapp?: string; address?: string; number?: string; district?: string; city?: string; state?: string; zipCode?: string; creditLimit?: number; notes?: string; };

export default function ClientesPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<Customer[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [form, setForm] = React.useState<any>({});
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    const r = await fetch(`/api/customers?q=${encodeURIComponent(search)}`);
    const j = await r.json();
    setItems(j.items || []);
  }, [search]);
  React.useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const save = async () => {
    if (!form.name?.trim()) return push({ title: 'Informe o nome', variant: 'destructive' });
    const url = editing ? `/api/customers/${editing.id}` : '/api/customers';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, creditLimit: Number(form.creditLimit) || 0 }) });
    const j = await res.json();
    if (!res.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: editing ? 'Cliente atualizado' : 'Cliente cadastrado', variant: 'success' });
    setOpen(false); setEditing(null); setForm({});
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button onClick={() => { setEditing(null); setForm({ personType: 'INDIVIDUAL', creditLimit: 0 }); setOpen(true); }}>Novo</Button>
        </div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Nome</th><th className="h-10 px-3 text-left">Documento</th><th className="h-10 px-3 text-left">Telefone</th><th className="h-10 px-3 text-right">Limite</th><th className="h-10 px-3 text-center">Ações</th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/40">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.document ?? '—'}</td>
                <td className="p-3">{c.phone ?? c.whatsapp ?? '—'}</td>
                <td className="p-3 text-right">{(c.creditLimit ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-3 text-center"><Button size="sm" variant="ghost" onClick={() => { setEditing(c); setForm(c); setOpen(true); }}>Editar</Button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="p-4 w-full max-w-2xl">
            <h3 className="font-semibold mb-3">{editing ? 'Editar' : 'Novo'} Cliente</h3>
            <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
              <Field label="Tipo"><select className="w-full h-10 rounded-md border px-3 text-sm" value={form.personType ?? 'INDIVIDUAL'} onChange={(e) => setForm({ ...form, personType: e.target.value })}><option value="INDIVIDUAL">Pessoa Física</option><option value="COMPANY">Pessoa Jurídica</option></select></Field>
              <Field label="Nome *"><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Nome fantasia"><Input value={form.tradeName ?? ''} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} /></Field>
              <Field label="CPF/CNPJ"><Input value={form.document ?? ''} onChange={(e) => setForm({ ...form, document: e.target.value })} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Telefone"><Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp ?? ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
              <Field label="Limite de crédito (R$)"><Input type="number" step="0.01" value={form.creditLimit ?? 0} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} /></Field>
              <Field label="CEP"><Input value={form.zipCode ?? ''} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} /></Field>
              <Field label="Endereço"><Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
              <Field label="Número"><Input value={form.number ?? ''} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
              <Field label="Bairro"><Input value={form.district ?? ''} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>
              <Field label="Cidade"><Input value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <Field label="UF"><select className="w-full h-10 rounded-md border px-3 text-sm" value={form.state ?? ''} onChange={(e) => setForm({ ...form, state: e.target.value })}><option value="">—</option>{BR_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.uf}</option>)}</select></Field>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
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
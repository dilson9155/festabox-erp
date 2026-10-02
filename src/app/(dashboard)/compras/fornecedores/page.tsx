'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { BR_STATES } from '@/lib/br-states';

type Supplier = { id: string; legalName: string; tradeName?: string; document?: string; phone?: string; email?: string; city?: string; state?: string; };

export default function FornecedoresPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<Supplier[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [form, setForm] = React.useState<any>({});
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    const r = await fetch(`/api/suppliers?q=${encodeURIComponent(search)}`);
    const j = await r.json();
    setItems(j.items || []);
  }, [search]);
  React.useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const save = async () => {
    if (!form.legalName?.trim()) return push({ title: 'Informe a razão social', variant: 'destructive' });
    const res = await fetch(editing ? `/api/suppliers/${editing.id}` : '/api/suppliers', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json();
    if (!res.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Fornecedor salvo', variant: 'success' });
    setOpen(false); setEditing(null); setForm({});
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <div className="flex gap-2">
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }}>Novo</Button>
        </div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Razão Social</th><th className="h-10 px-3 text-left">Fantasia</th><th className="h-10 px-3 text-left">CNPJ</th><th className="h-10 px-3 text-left">Telefone</th><th className="h-10 px-3 text-center">Ações</th></tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/40">
                <td className="p-3">{s.legalName}</td>
                <td className="p-3">{s.tradeName ?? '—'}</td>
                <td className="p-3">{s.document ?? '—'}</td>
                <td className="p-3">{s.phone ?? '—'}</td>
                <td className="p-3 text-center"><Button size="sm" variant="ghost" onClick={() => { setEditing(s); setForm(s); setOpen(true); }}>Editar</Button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum fornecedor.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="p-4 w-full max-w-2xl">
            <h3 className="font-semibold mb-3">{editing ? 'Editar' : 'Novo'} Fornecedor</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Razão Social *"><Input value={form.legalName ?? ''} onChange={(e) => setForm({ ...form, legalName: e.target.value })} /></Field>
              <Field label="Nome fantasia"><Input value={form.tradeName ?? ''} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} /></Field>
              <Field label="CNPJ"><Input value={form.document ?? ''} onChange={(e) => setForm({ ...form, document: e.target.value })} /></Field>
              <Field label="IE"><Input value={form.ie ?? ''} onChange={(e) => setForm({ ...form, ie: e.target.value })} /></Field>
              <Field label="Telefone"><Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp ?? ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Contato"><Input value={form.contact ?? ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
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
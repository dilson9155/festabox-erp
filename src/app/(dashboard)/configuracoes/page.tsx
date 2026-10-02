'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { BR_STATES } from '@/lib/br-states';

export default function ConfiguracoesPage() {
  const { push } = useToast();
  const [company, setCompany] = React.useState<any>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/company').then((r) => r.json()).then((j) => { setCompany(j); setLoading(false); });
  }, []);

  const save = async () => {
    const r = await fetch('/api/company', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(company) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Configurações salvas', variant: 'success' });
  };

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>
      <Card className="p-6 max-w-3xl space-y-3">
        <h2 className="font-semibold">Dados da Empresa</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome fantasia"><Input value={company.name ?? ''} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></Field>
          <Field label="Razão social"><Input value={company.legalName ?? ''} onChange={(e) => setCompany({ ...company, legalName: e.target.value })} /></Field>
          <Field label="CNPJ"><Input value={company.document ?? ''} onChange={(e) => setCompany({ ...company, document: e.target.value })} /></Field>
          <Field label="Inscrição Estadual"><Input value={company.stateTax ?? ''} onChange={(e) => setCompany({ ...company, stateTax: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={company.email ?? ''} onChange={(e) => setCompany({ ...company, email: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={company.phone ?? ''} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></Field>
          <Field label="WhatsApp"><Input value={company.whatsapp ?? ''} onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })} /></Field>
          <Field label="CEP"><Input value={company.zipCode ?? ''} onChange={(e) => setCompany({ ...company, zipCode: e.target.value })} /></Field>
          <Field label="Endereço"><Input value={company.address ?? ''} onChange={(e) => setCompany({ ...company, address: e.target.value })} /></Field>
          <Field label="Número"><Input value={company.number ?? ''} onChange={(e) => setCompany({ ...company, number: e.target.value })} /></Field>
          <Field label="Bairro"><Input value={company.district ?? ''} onChange={(e) => setCompany({ ...company, district: e.target.value })} /></Field>
          <Field label="Cidade"><Input value={company.city ?? ''} onChange={(e) => setCompany({ ...company, city: e.target.value })} /></Field>
          <Field label="UF"><select className="w-full h-10 rounded-md border px-3 text-sm" value={company.state ?? ''} onChange={(e) => setCompany({ ...company, state: e.target.value })}><option value="">—</option>{BR_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.uf}</option>)}</select></Field>
        </div>

        <h2 className="font-semibold pt-3 border-t">Configurações operacionais</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!company.allowNegativeStock} onChange={(e) => setCompany({ ...company, allowNegativeStock: e.target.checked })} /> Permitir estoque negativo</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!company.allowChangePrice} onChange={(e) => setCompany({ ...company, allowChangePrice: e.target.checked })} /> Permitir alterar preço no PDV</label>
          <Field label="Desconto máximo (%)"><Input type="number" step="0.01" value={company.discountMaxPercent ?? 5} onChange={(e) => setCompany({ ...company, discountMaxPercent: parseFloat(e.target.value) || 0 })} /></Field>
        </div>

        <h2 className="font-semibold pt-3 border-t">Módulo Fiscal (preparado, desativado)</h2>
        <p className="text-xs text-muted-foreground">Esta versão não emite documentos fiscais. A arquitetura de dados já está preparada para ativação futura (NFC-e, NF-e, SAT, CF-e) sem necessidade de reestruturar o sistema.</p>

        <div className="pt-3 border-t flex justify-end"><Button onClick={save}>Salvar configurações</Button></div>
      </Card>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-muted-foreground mb-1">{label}</label>{children}</div>;
}
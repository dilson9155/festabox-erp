'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { Upload, Check, AlertTriangle } from 'lucide-react';

type Item = {
  id: string;
  productId?: string | null;
  matchStatus: 'MATCHED' | 'NEW' | 'IGNORED';
  action: string;
  ean?: string | null;
  supplierCode?: string | null;
  name: string;
  ncm?: string | null;
  cfop?: string | null;
  unit?: string | null;
  quantity: number;
  unitCost: number;
  total: number;
  productCurrentPrice?: number | null;
  productCurrentCost?: number | null;
  newSalePrice?: number | null;
  marginPercent?: number | null;
};

type ImportData = {
  ok: boolean;
  id: string;
  parsed: {
    key: string;
    number: string;
    date: string | null;
    supplier: { cnpj: string; name: string };
    items: any[];
    supplierFound: boolean;
  };
};

export default function NfeImportPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<Item[]>([]);
  const [meta, setMeta] = React.useState<ImportData['parsed'] | null>(null);
  const [importId, setImportId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  const upload = async (file: File) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/nfe-import', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      setImportId(j.id);
      setMeta(j.parsed);
      setItems(j.parsed.items);
      push({ title: 'NF-e importada', description: `${j.parsed.items.length} itens`, variant: 'success' });
    } catch (e: any) { push({ title: 'Erro', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const apply = async () => {
    setApplying(true);
    try {
      const payload = {
        supplierName: meta?.supplier.name,
        supplierCnpj: meta?.supplier.cnpj,
        items: items.map((it) => ({ id: it.id, action: it.action, newSalePrice: it.newSalePrice })),
      };
      const res = await fetch(`/api/nfe-import/${importId}/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      push({ title: 'Importação concluída', description: j.purchaseId ? `Compra # gerada` : 'Produtos atualizados', variant: 'success' });
      setItems([]); setMeta(null); setImportId('');
    } catch (e: any) { push({ title: 'Erro', description: e.message, variant: 'destructive' }); }
    finally { setApplying(false); }
  };

  const total = items.reduce((s, it) => s + Number(it.total), 0);
  const matched = items.filter((it) => it.matchStatus === 'MATCHED').length;
  const newCount = items.filter((it) => it.matchStatus === 'NEW').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Importar NF-e (XML)</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Faça upload do arquivo XML da NF-e para cadastrar/atualizar produtos, gerar compra e lançar estoque.
        A NF-e será usada apenas para entrada — nenhuma nota fiscal será emitida por aqui.
      </p>

      {!meta ? (
        <Card className="p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="mb-3">Selecione um arquivo XML de NF-e.</p>
            <label className="inline-block">
                <input
                  type="file"
                  accept=".xml,text/xml,application/xml"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
                <span className="cursor-pointer inline-flex items-center justify-center h-11 rounded-md bg-primary text-primary-foreground px-6">
                  {loading ? 'Processando...' : 'Selecionar XML'}
                </span>
              </label>
          </Card>
      ) : (
        <>
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">NF-e</div><div className="font-medium">#{meta.number}</div></div>
              <div><div className="text-xs text-muted-foreground">Data</div><div className="font-medium">{meta.date ?? '-'}</div></div>
              <div><div className="text-xs text-muted-foreground">Fornecedor</div><div className="font-medium">{meta.supplier.name}</div></div>
              <div><div className="text-xs text-muted-foreground">Total</div><div className="font-bold text-primary">{formatMoney(total)}</div></div>
            </div>
          </Card>

          <Card className="mb-4">
            <div className="p-3 border-b flex items-center justify-between bg-muted/30 text-sm">
              <div>Itens: <strong>{items.length}</strong> · Match: <span className="text-success">{matched}</span> · Novos: <span className="text-warning">{newCount}</span></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setMeta(null); setItems([]); }}>Cancelar</Button>
                <Button size="sm" onClick={apply} disabled={applying}>{applying ? 'Aplicando...' : 'Confirmar importação'}</Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="h-10 px-3 text-left">Status</th>
                    <th className="h-10 px-3 text-left">EAN</th>
                    <th className="h-10 px-3 text-left">Produto</th>
                    <th className="h-10 px-3 text-right">Qtd</th>
                    <th className="h-10 px-3 text-right">Custo</th>
                    <th className="h-10 px-3 text-right">Total</th>
                    <th className="h-10 px-3 text-right">Preço Atual</th>
                    <th className="h-10 px-3 text-right">Novo Preço</th>
                    <th className="h-10 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id || i} className="border-t">
                      <td className="p-3">{it.matchStatus === 'MATCHED' ? <span title="Encontrado" className="text-success"><Check className="h-4 w-4" /></span> : <span title="Novo" className="text-warning"><AlertTriangle className="h-4 w-4" /></span>}</td>
                      <td className="p-3 font-mono text-xs">{it.ean ?? '-'}</td>
                      <td className="p-3">{it.name}</td>
                      <td className="p-3 text-right">{Number(it.quantity).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right">{formatMoney(Number(it.unitCost))}</td>
                      <td className="p-3 text-right font-medium">{formatMoney(Number(it.total))}</td>
                      <td className="p-3 text-right text-xs">{it.productCurrentPrice ? formatMoney(Number(it.productCurrentPrice)) : '—'}</td>
                      <td className="p-3 text-right">
                        <Input type="number" step="0.01" value={it.newSalePrice ?? ''} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, newSalePrice: parseFloat(e.target.value) || 0 } : x))} className="h-8 w-24 text-right" />
                      </td>
                      <td className="p-3 text-center">
                        <select className="h-8 rounded-md border px-2 text-xs" value={it.action} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, action: e.target.value as any } : x))}>
                          {it.matchStatus === 'MATCHED' ? (
                            <>
                              <option value="UPDATE">Atualizar tudo</option>
                              <option value="UPDATE_COST">Só custo</option>
                              <option value="UPDATE_PRICE">Só preço</option>
                              <option value="UPDATE_STOCK">Só estoque</option>
                              <option value="SKIP">Pular</option>
                            </>
                          ) : (
                            <>
                              <option value="CREATE">Criar novo</option>
                              <option value="SKIP">Pular</option>
                            </>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
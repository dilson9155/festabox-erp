'use client';
import * as React from 'react';
import { useToast } from '@/components/ui/toast';

export function ProductForm({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: () => void }) {
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [brands, setBrands] = React.useState<any[]>([]);
  const [units, setUnits] = React.useState<any[]>([]);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);

  const [form, setForm] = React.useState<any>(initial ?? {
    name: '', internalCode: '', sku: '', barcode: '', description: '',
    costPrice: 0, salePrice: 0, wholesalePrice: 0, promotionPrice: 0,
    stockMin: 0, stockMax: 0,
    trackStock: true, controlLot: false, controlExpiry: false,
    active: true, ncm: '', cfop: '',
  });

  React.useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/brands').then((r) => r.json()),
      fetch('/api/units').then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
    ]).then(([c, b, u, s]) => {
      setCategories(c.items || []);
      setBrands(b.items || []);
      setUnits(u.items || []);
      setSuppliers(s.items || []);
    });
  }, []);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setLoading(true);
    try {
      const url = initial?.id ? `/api/products/${initial.id}` : '/api/products';
      const method = initial?.id ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      push({ title: 'Produto salvo', variant: 'success' });
      onSaved(); onClose();
    } catch (e: any) {
      push({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome *"><Input value={form.name} onChange={(e) => update('name', e.target.value)} /></Field>
        <Field label="Código interno"><Input value={form.internalCode ?? ''} onChange={(e) => update('internalCode', e.target.value)} /></Field>
        <Field label="Código de barras (EAN)"><Input value={form.barcode ?? ''} onChange={(e) => update('barcode', e.target.value)} /></Field>
        <Field label="SKU"><Input value={form.sku ?? ''} onChange={(e) => update('sku', e.target.value)} /></Field>
        <Field label="Categoria">
          <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.categoryId ?? ''} onChange={(e) => update('categoryId', e.target.value || null)}>
            <option value="">—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Marca">
          <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.brandId ?? ''} onChange={(e) => update('brandId', e.target.value || null)}>
            <option value="">—</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Unidade">
          <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.unitId ?? ''} onChange={(e) => update('unitId', e.target.value || null)}>
            <option value="">—</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.abbreviation} - {u.name}</option>)}
          </select>
        </Field>
        <Field label="Fornecedor">
          <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.supplierId ?? ''} onChange={(e) => update('supplierId', e.target.value || null)}>
            <option value="">—</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.legalName}</option>)}
          </select>
        </Field>
        <Field label="Preço de custo"><Input type="number" step="0.0001" value={form.costPrice} onChange={(e) => update('costPrice', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Preço de venda *"><Input type="number" step="0.01" value={form.salePrice} onChange={(e) => update('salePrice', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Preço atacado"><Input type="number" step="0.01" value={form.wholesalePrice ?? 0} onChange={(e) => update('wholesalePrice', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Preço promocional"><Input type="number" step="0.01" value={form.promotionPrice ?? 0} onChange={(e) => update('promotionPrice', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Estoque mínimo"><Input type="number" step="0.001" value={form.stockMin ?? 0} onChange={(e) => update('stockMin', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Estoque máximo"><Input type="number" step="0.001" value={form.stockMax ?? 0} onChange={(e) => update('stockMax', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="NCM (preparado fiscal)"><Input value={form.ncm ?? ''} onChange={(e) => update('ncm', e.target.value)} /></Field>
        <Field label="CFOP (preparado fiscal)"><Input value={form.cfop ?? ''} onChange={(e) => update('cfop', e.target.value)} /></Field>
      </div>
      <Field label="Descrição"><textarea className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px]" value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} /></Field>
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.trackStock} onChange={(e) => update('trackStock', e.target.checked)} /> Controlar estoque</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.controlLot} onChange={(e) => update('controlLot', e.target.checked)} /> Lote</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.controlExpiry} onChange={(e) => update('controlExpiry', e.target.checked)} /> Validade</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.active} onChange={(e) => update('active', e.target.checked)} /> Ativo</label>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t">
        <button type="button" className="px-4 h-10 rounded-md border" onClick={onClose}>Cancelar</button>
        <button type="button" disabled={loading} onClick={save} className="px-4 h-10 rounded-md bg-primary text-primary-foreground disabled:opacity-60">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { Tag } from 'lucide-react';

export default function EtiquetasPage() {
  const { push } = useToast();
  const [products, setProducts] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [labels, setLabels] = React.useState(1);
  const [model, setModel] = React.useState<'80x40' | '50x30' | 'custom'>('80x40');

  React.useEffect(() => { fetch('/api/products?pageSize=100').then((r) => r.json()).then((j) => setProducts(j.items || [])); }, []);

  const print = () => {
    const items = selected.flatMap((id) => {
      const p = products.find((p) => p.id === id);
      return Array(Math.max(1, labels)).fill(p);
    }).filter(Boolean);
    if (!items.length) return push({ title: 'Selecione produtos', variant: 'destructive' });
    const w = window.open('', 'labels', 'width=800,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Etiquetas</title>
      <style>
        @page { margin: 4mm; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 8px; }
        .labels { display: grid; grid-template-columns: repeat(${model === '80x40' ? 2 : 3}, 1fr); gap: 4px; }
        .label { border: 1px dashed #888; padding: 6px; text-align: center; break-inside: avoid; font-size: 11px; }
        .label .name { font-weight: bold; line-height: 1.1; min-height: 28px; }
        .label .price { color: #c00; font-size: 14px; font-weight: bold; margin-top: 4px; }
        .label .barcode { font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 12px; margin-top: 4px; letter-spacing: 1px; }
      </style></head><body>
      <div class="labels">
        ${items.map((it) => `
          <div class="label">
            <div class="name">${escape(it.name)}</div>
            <div>${escape(it.barcode ?? it.internalCode ?? '')}</div>
            <div class="price">${formatMoney(Number(it.salePrice))}</div>
            <div class="barcode">*${escape(it.barcode ?? it.internalCode ?? '')}*</div>
          </div>
        `).join('')}
      </div>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>`);
    w.document.close();
  };

  const toggle = (id: string) => setSelected((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Etiquetas de Produtos</h1>
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3">
            <label className="text-xs text-muted-foreground">Modelo</label>
            <select className="w-full h-10 rounded-md border px-3 text-sm" value={model} onChange={(e) => setModel(e.target.value as any)}>
              <option value="80x40">80x40mm (recomendado)</option>
              <option value="50x30">50x30mm</option>
              <option value="custom">Customizado</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="text-xs text-muted-foreground">Etiquetas por produto</label>
            <Input type="number" min={1} value={labels} onChange={(e) => setLabels(parseInt(e.target.value) || 1)} />
          </div>
          <div className="col-span-3 text-sm">Selecionados: <strong>{selected.length}</strong></div>
          <Button className="col-span-3" onClick={print} disabled={!selected.length}><Tag className="h-4 w-4 mr-1" /> Imprimir etiquetas</Button>
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Sel.</th><th className="h-10 px-3 text-left">Produto</th><th className="h-10 px-3 text-right">Preço</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/40">
                <td className="p-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} /></td>
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-right">{formatMoney(Number(p.salePrice))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
function escape(s: string) { return (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)); }
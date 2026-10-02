'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Plus, Trash2 } from 'lucide-react';

type Printer = { id: string; name: string; profile: string; connection: string; width: string; isDefaultPdv: boolean; isDefaultAdmin: boolean; isLabelPrinter: boolean };

export default function ImpressorasPage() {
  const { push } = useToast();
  const [items, setItems] = React.useState<Printer[]>([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({ profile: 'ESC_POS_80MM', connection: 'USB', width: 'MM80', charsPerLine: 42, autocut: true, isDefaultPdv: false, isDefaultAdmin: false });

  const load = React.useCallback(async () => {
    const r = await fetch('/api/printers');
    const j = await r.json();
    setItems(j.items || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    const r = await fetch('/api/printers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Impressora cadastrada', variant: 'success' });
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remover?')) return;
    await fetch('/api/printers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Impressoras</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova impressora</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Perfis suportados: ESC/POS 58mm e 80mm, USB, rede e Windows compartilhada. Para impressão real,
        utilize um serviço local de impressão ou o módulo de impressão do navegador.
      </p>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Nome</th><th className="h-10 px-3 text-left">Perfil</th><th className="h-10 px-3 text-left">Conexão</th><th className="h-10 px-3 text-center">Largura</th><th className="h-10 px-3 text-center">Padrões</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.profile}</td>
                <td className="p-3">{p.connection}</td>
                <td className="p-3 text-center">{p.width}</td>
                <td className="p-3 text-center">
                  {p.isDefaultPdv && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mr-1">PDV</span>}
                  {p.isDefaultAdmin && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mr-1">Admin</span>}
                  {p.isLabelPrinter && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Etiquetas</span>}
                </td>
                <td className="p-3 text-right"><Button size="icon-sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma impressora cadastrada.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="p-4 w-full max-w-lg">
            <h3 className="font-semibold mb-3">Nova Impressora</h3>
            <div className="space-y-2">
              <Input placeholder="Nome" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })}>
                <option value="ESC_POS_58MM">ESC/POS 58mm</option>
                <option value="ESC_POS_80MM">ESC/POS 80mm</option>
                <option value="WINDOWS_GENERIC">Windows genérica</option>
                <option value="LABEL_GENERIC">Etiquetas genérica</option>
              </select>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={form.connection} onChange={(e) => setForm({ ...form, connection: e.target.value })}>
                <option value="USB">USB</option><option value="NETWORK">Rede</option><option value="SHARED_WINDOWS">Compartilhada Windows</option><option value="BROWSER_PRINT">Impressão do navegador</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Host / Device" value={form.devicePath ?? ''} onChange={(e) => setForm({ ...form, devicePath: e.target.value })} />
                <Input type="number" placeholder="Porta" value={form.port ?? ''} onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="h-10 rounded-md border px-3 text-sm" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })}>
                  <option value="MM58">58mm</option><option value="MM80">80mm</option><option value="LABEL">Etiqueta</option>
                </select>
                <Input type="number" placeholder="Caracteres/linha" value={form.charsPerLine ?? 42} onChange={(e) => setForm({ ...form, charsPerLine: parseInt(e.target.value) || 42 })} />
              </div>
              <div className="flex gap-3 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.autocut} onChange={(e) => setForm({ ...form, autocut: e.target.checked })} /> Corte automático</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.isDefaultPdv} onChange={(e) => setForm({ ...form, isDefaultPdv: e.target.checked })} /> Padrão PDV</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.isDefaultAdmin} onChange={(e) => setForm({ ...form, isDefaultAdmin: e.target.checked })} /> Padrão Admin</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.isLabelPrinter} onChange={(e) => setForm({ ...form, isLabelPrinter: e.target.checked })} /> Etiquetas</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
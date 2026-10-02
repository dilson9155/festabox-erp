'use client';
import * as React from 'react';
import { DataTable } from '@/components/layout/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ProductForm } from '@/components/forms/product-form';
import { formatMoney } from '@/lib/money';
import { Edit, Trash2, Plus } from 'lucide-react';

export default function ProdutosPage() {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(undefined);
  const [reload, setReload] = React.useState(0);
  const { push } = useToast();

  const columns = [
    { key: 'code', label: 'Código', render: (p: any) => p.internalCode || p.barcode || '-' },
    { key: 'name', label: 'Nome', render: (p: any) => <span className="font-medium">{p.name}</span> },
    { key: 'category', label: 'Categoria', render: (p: any) => p.category?.name ?? '-' },
    { key: 'price', label: 'Preço', render: (p: any) => formatMoney(Number(p.salePrice)), className: 'text-right' },
    { key: 'stock', label: 'Estoque', render: (p: any) => Number(p.stock || 0).toLocaleString('pt-BR'), className: 'text-right' },
    { key: 'status', label: 'Status', render: (p: any) => p.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge> },
    {
      key: 'actions', label: '', render: (p: any) => (
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" onClick={async () => { setEditing(p); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
          <Button size="icon-sm" variant="ghost" onClick={async () => {
            if (!confirm('Inativar este produto?')) return;
            await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
            push({ title: 'Produto inativado', variant: 'success' });
            setReload((r) => r + 1);
          }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        key={reload}
        title="Produtos"
        endpoint="/api/products"
        columns={columns}
        pageSize={20}
        onAdd={() => { setEditing(undefined); setOpen(true); }}
        addLabel="Novo Produto"
        searchPlaceholder="Buscar por nome, código ou EAN..."
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Produto</DialogTitle></DialogHeader>
          <ProductForm initial={editing} onClose={() => setOpen(false)} onSaved={() => setReload((r) => r + 1)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
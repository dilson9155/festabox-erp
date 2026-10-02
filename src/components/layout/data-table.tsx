'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  title?: string;
  endpoint: string;
  columns: any[];
  pageSize?: number;
  onAdd?: () => void;
  addLabel?: string;
  searchPlaceholder?: string;
}

export function DataTable<T extends { id: string }>({ title, endpoint, columns, pageSize = 20, onAdd, addLabel = 'Novo', searchPlaceholder = 'Buscar...' }: DataTableProps<T>) {
  const [items, setItems] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`${endpoint}?${params}`);
      const json = await res.json();
      setItems(json.items || []);
      setTotal(json.total ?? 0);
    } finally { setLoading(false); }
  }, [endpoint, q, page, pageSize]);

  React.useEffect(() => { load(); }, [load]);

  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={searchPlaceholder} className="pl-9" />
          </div>
          {onAdd && <Button onClick={onAdd}><Plus className="h-4 w-4 mr-1" /> {addLabel}</Button>}
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={`h-10 px-3 text-left font-medium text-muted-foreground ${c.className ?? ''}`}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</td></tr>
              ) : items.map((it) => (
                <tr key={it.id} className="border-t hover:bg-muted/40">
                  {columns.map((c) => (
                    <td key={c.key} className={`p-3 ${c.className ?? ''}`}>{c.render(it)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t text-sm">
          <div className="text-muted-foreground">{total} registro(s)</div>
          <div className="flex items-center gap-2">
            <Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span>Página {page} de {lastPage}</span>
            <Button size="icon-sm" variant="outline" disabled={page >= lastPage} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
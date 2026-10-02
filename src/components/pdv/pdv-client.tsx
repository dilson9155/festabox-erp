'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Search, Trash2, Plus, Minus, X, Receipt, CreditCard, Banknote, Smartphone, User as UserIcon, Tag as TagIcon, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { formatMoney } from '@/lib/money';

type Product = {
  id: string; code: string; ean: string; name: string; price: number;
  unit: string; category: string; stock: number; trackStock: boolean;
};

type CartItem = { product: Product; quantity: number; unitPrice: number; discount: number };

type Customer = { id: string; name: string; document?: string };

export default function PdvClient() {
  const { push } = useToast();
  const [query, setQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<Product[]>([]);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [customerId, setCustomerId] = React.useState<string>('');
  const [openCust, setOpenCust] = React.useState(false);
  const [openPay, setOpenPay] = React.useState(false);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [loadingFinal, setLoadingFinal] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<{ id: string; number: number; total: number; change: number } | null>(null);

  const searchRef = React.useRef<HTMLInputElement>(null);

  // Atalhos
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); setOpenCust(true); }
      if (e.key === 'F3') { e.preventDefault(); setGlobalDiscount((d) => d); }
      if (e.key === 'F5' && cart.length) { e.preventDefault(); setOpenPay(true); }
      if (e.key === 'F7') { e.preventDefault(); if (cart.length) cancelLastItem(); }
      if (e.key === 'F8') { e.preventDefault(); cancelAll(); }
      if (e.key === 'Escape') { setOpenPay(false); setOpenCust(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart]);

  React.useEffect(() => { searchRef.current?.focus(); }, []);

  React.useEffect(() => {
    fetch('/api/customers?limit=10').then((r) => r.json()).then((d) => setCustomers(d.items || [])).catch(() => {});
  }, []);

  // busca com debounce
  React.useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=20`);
        const data = await res.json();
        setResults(data.items || []);
        setSelectedIndex(0);
      } finally { setSearching(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Auto-add when exact code matches (barcode simulation)
  React.useEffect(() => {
    if (!query.trim()) return;
    const exact = results.find((r) => r.code === query || r.ean === query);
    if (exact && results.length === 1) {
      addToCart(exact);
      setQuery('');
      setResults([]);
    }
  }, [results, query]);

  const addToCart = (p: Product) => {
    setCart((cur) => {
      const idx = cur.findIndex((c) => c.product.id === p.id);
      if (idx >= 0) {
        const next = [...cur];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...cur, { product: p, quantity: 1, unitPrice: p.price, discount: 0 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    setCart((cur) => cur.map((c) => c.product.id === id ? { ...c, quantity: qty } : c));
  };
  const updatePrice = (id: string, price: number) => {
    setCart((cur) => cur.map((c) => c.product.id === id ? { ...c, unitPrice: Math.max(0, price) } : c));
  };
  const updateDiscount = (id: string, discount: number) => {
    setCart((cur) => cur.map((c) => c.product.id === id ? { ...c, discount: Math.max(0, discount) } : c));
  };
  const removeItem = (id: string) => setCart((cur) => cur.filter((c) => c.product.id !== id));
  const cancelLastItem = () => setCart((cur) => cur.slice(0, -1));
  const cancelAll = () => { setCart([]); setGlobalDiscount(0); };

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.unitPrice, 0);
  const totalDiscount = cart.reduce((s, c) => s + c.discount, 0) + globalDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

  const finalize = async (payments: any[]) => {
    setLoadingFinal(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          discount: globalDiscount,
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity, unitPrice: c.unitPrice, discount: c.discount })),
          payments,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao finalizar');
      setLastSale({ id: data.id, number: data.number, total: data.total, change: data.change });
      push({ title: `Venda #${data.number} finalizada`, description: `Total ${formatMoney(data.total)} · Troco ${formatMoney(data.change)}`, variant: 'success' });
      setCart([]); setCustomerId(''); setGlobalDiscount(0);
      setOpenPay(false);
    } catch (e: any) {
      push({ title: 'Erro', description: e.message ?? 'Tente novamente', variant: 'destructive' });
    } finally {
      setLoadingFinal(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 h-[calc(100vh-7rem)]">
      {/* ESQUERDA - Busca e grid de produtos */}
      <div className="flex flex-col gap-3 min-h-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Buscar por nome, código de barras, código interno ou SKU (F1)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-14 text-lg"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto pr-2 scrollbar-thin flex-1">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => { addToCart(p); setQuery(''); setResults([]); }}
              className="text-left rounded-md border bg-card hover:bg-accent hover:border-primary p-3 transition-colors"
            >
              <div className="text-xs text-muted-foreground">{p.code || p.ean}</div>
              <div className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{p.name}</div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px]">{p.unit}</Badge>
                <span className="font-bold text-primary">{formatMoney(p.price)}</span>
              </div>
            </button>
          ))}
          {!searching && query && results.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-12">
              Nenhum produto encontrado para "{query}".
            </div>
          )}
        </div>
      </div>

      {/* DIREITA - Carrinho e ações */}
      <Card className="flex flex-col min-h-0">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-medium">Carrinho ({cart.length})</div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={cancelLastItem} disabled={!cart.length}><Minus className="h-4 w-4" /> F7</Button>
              <Button size="sm" variant="ghost" onClick={cancelAll} disabled={!cart.length} className="text-destructive"><X className="h-4 w-4" /> F8</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
                Bipe ou busque um produto para começar.
              </div>
            ) : cart.map((c) => (
              <div key={c.product.id} className="rounded-md border p-2 mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight line-clamp-2">{c.product.name}</div>
                    <div className="text-xs text-muted-foreground">{c.product.unit} · {formatMoney(c.unitPrice)}</div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeItem(c.product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-sm" onClick={() => updateQty(c.product.id, c.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <Input type="number" step="0.001" value={c.quantity} onChange={(e) => updateQty(c.product.id, parseFloat(e.target.value) || 0)} className="h-8 w-20 text-center" />
                    <Button variant="outline" size="icon-sm" onClick={() => updateQty(c.product.id, c.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <Input type="number" step="0.01" value={c.unitPrice} onChange={(e) => updatePrice(c.product.id, parseFloat(e.target.value) || 0)} className="h-8 w-24 text-right" title="Preço unit." />
                  <div className="font-semibold text-sm w-24 text-right">{formatMoney(c.quantity * c.unitPrice - c.discount)}</div>
                </div>
                {c.discount > 0 && (
                  <div className="text-[11px] text-warning mt-1">Desconto item: {formatMoney(c.discount)}</div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span><span>{formatMoney(cart.reduce((s, x) => s + x.quantity * x.unitPrice, 0))}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Desconto</span>
              <Input type="number" step="0.01" value={globalDiscount} onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)} className="h-8 w-28 text-right" />
            </div>
            <div className="flex items-center justify-between border-t pt-2 mt-1">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">{formatMoney(total)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenCust(true)}><UserIcon className="h-4 w-4 mr-1" /> Cliente (F2)</Button>
              <Button size="xl" disabled={!cart.length} onClick={() => setOpenPay(true)}>Finalizar (F5)</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Cliente */}
      <Dialog open={openCust} onOpenChange={setOpenCust}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecionar cliente</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <select className="w-full h-10 rounded-md border px-3 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— Sem cliente —</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}{c.document ? ` · ${c.document}` : ''}</option>))}
            </select>
            <p className="text-xs text-muted-foreground">Para cadastrar novos clientes, vá em Clientes no menu.</p>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pagamento */}
      <PaymentDialog open={openPay} onOpenChange={setOpenPay} total={total} onConfirm={finalize} loading={loadingFinal} />

      {/* Recibo Final */}
      <Dialog open={!!lastSale} onOpenChange={(o) => !o && setLastSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /> Venda finalizada</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div>Venda número: <strong>#{lastSale?.number}</strong></div>
            <div>Total: <strong>{formatMoney(lastSale?.total ?? 0)}</strong></div>
            <div>Troco: <strong>{formatMoney(lastSale?.change ?? 0)}</strong></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLastSale(null)}>Nova venda</Button>
            <Button onClick={() => { window.open(`/api/sales/${lastSale?.id}/receipt`, '_blank'); }}>Imprimir cupom</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentDialog({ open, onOpenChange, total, onConfirm, loading }: { open: boolean; onOpenChange: (v: boolean) => void; total: number; onConfirm: (payments: any[]) => void; loading: boolean }) {
  type Line = { method: string; amount: number; installments?: number; cardType?: 'DEBIT' | 'CREDIT' };
  const [lines, setLines] = React.useState<Line[]>([{ method: 'CASH', amount: total, cardType: 'DEBIT' }]);
  const [cashReceived, setCashReceived] = React.useState<number>(total);

  React.useEffect(() => { if (open) { setLines([{ method: 'CASH', amount: total, cardType: 'DEBIT' }]); setCashReceived(total); } }, [open, total]);

  const paid = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const remaining = total - paid;
  const change = Math.max(0, paid - total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Finalizar venda · {formatMoney(total)}</DialogTitle></DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          {lines.map((l, i) => (
            <div key={i} className="rounded-md border p-3 grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <label className="text-xs text-muted-foreground">Forma</label>
                <select className="w-full h-10 rounded-md border px-2 text-sm" value={l.method} onChange={(e) => {
                  const v = e.target.value;
                  setLines((cur) => cur.map((x, idx) => idx === i ? { ...x, method: v, cardType: v === 'CREDIT_CARD' ? 'CREDIT' : v === 'DEBIT_CARD' ? 'DEBIT' : undefined } : x));
                }}>
                  <option value="CASH">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="CREDIT_STORE">Crediário</option>
                  <option value="TRANSFER">Transferência</option>
                  <option value="VOUCHER">Vale</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="text-xs text-muted-foreground">Valor</label>
                <Input type="number" step="0.01" value={l.amount} onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setLines((cur) => cur.map((x, idx) => idx === i ? { ...x, amount: v } : x));
                  if (l.method === 'CASH') setCashReceived(v);
                }} />
              </div>
              {(l.method === 'CREDIT_CARD' || l.method === 'CREDIT_STORE') && (
                <div className="col-span-3">
                  <label className="text-xs text-muted-foreground">Parcelas</label>
                  <Input type="number" min={1} max={12} value={l.installments ?? 1} onChange={(e) => setLines((cur) => cur.map((x, idx) => idx === i ? { ...x, installments: parseInt(e.target.value) || 1 } : x))} />
                </div>
              )}
              {lines.length > 1 && (
                <Button variant="ghost" size="icon-sm" className="col-span-1" onClick={() => setLines((cur) => cur.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines((cur) => [...cur, { method: 'PIX', amount: remaining > 0 ? remaining : 0 }])}>
            <Plus className="h-4 w-4 mr-1" /> Dividir pagamento
          </Button>
        </div>

        <div className="border-t pt-3 grid grid-cols-3 gap-2 text-sm">
          <div><div className="text-muted-foreground">Pago</div><div className="font-bold">{formatMoney(paid)}</div></div>
          <div><div className="text-muted-foreground">Restante</div><div className={`font-bold ${remaining > 0 ? 'text-destructive' : ''}`}>{formatMoney(remaining)}</div></div>
          <div><div className="text-muted-foreground">Troco</div><div className="font-bold text-success">{formatMoney(change)}</div></div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button disabled={remaining > 0 || loading} onClick={() => onConfirm(lines)}>{loading ? 'Processando...' : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
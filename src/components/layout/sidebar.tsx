'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Users, Truck, ShoppingBag,
  Receipt, FileText, Wallet, Banknote, Building2, BarChart3, UserCog,
  Printer, Settings, ScrollText, Database, Tag as TagIcon, PackagePlus, Layers,
  ArrowLeftRight, ClipboardList, Package2, CalendarClock, Send, BookOpen, Tags,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; children?: Item[] };

const ITEMS: Item[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pdv', label: 'PDV', icon: ShoppingCart },
  {
    href: '/vendas', label: 'Vendas', icon: Receipt,
    children: [
      { href: '/vendas', label: 'Vendas', icon: Receipt },
      { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
      { href: '/devolucoes', label: 'Devoluções', icon: ArrowLeftRight },
    ],
  },
  {
    href: '/produtos', label: 'Produtos', icon: Package,
    children: [
      { href: '/produtos', label: 'Produtos', icon: Package },
      { href: '/produtos/categorias', label: 'Categorias', icon: Layers },
      { href: '/produtos/marcas', label: 'Marcas', icon: Tags },
      { href: '/produtos/unidades', label: 'Unidades', icon: BoxIcon },
      { href: '/produtos/kits', label: 'Kits / Combos', icon: PackagePlus },
      { href: '/produtos/etiquetas', label: 'Etiquetas', icon: TagIcon },
    ],
  },
  {
    href: '/estoque', label: 'Estoque', icon: Boxes,
    children: [
      { href: '/estoque', label: 'Estoque', icon: Boxes },
      { href: '/estoque/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
      { href: '/estoque/lotes', label: 'Lotes', icon: Package2 },
      { href: '/estoque/validades', label: 'Validades', icon: CalendarClock },
    ],
  },
  {
    href: '/compras', label: 'Compras', icon: ShoppingBag,
    children: [
      { href: '/compras/fornecedores', label: 'Fornecedores', icon: Truck },
      { href: '/compras', label: 'Compras', icon: ShoppingBag },
      { href: '/compras/importar-nfe', label: 'Importar NF-e', icon: Send },
    ],
  },
  {
    href: '/financeiro', label: 'Financeiro', icon: Wallet,
    children: [
      { href: '/financeiro/contas-pagar', label: 'Contas a Pagar', icon: Banknote },
      { href: '/financeiro/contas-receber', label: 'Contas a Receber', icon: Wallet },
      { href: '/financeiro/caixa', label: 'Caixa', icon: Receipt },
      { href: '/financeiro/bancos', label: 'Bancos', icon: Building2 },
      { href: '/financeiro/plano-contas', label: 'Plano de Contas', icon: BookOpen },
      { href: '/financeiro/centros-custo', label: 'Centros de Custo', icon: ClipboardList },
    ],
  },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/usuarios', label: 'Usuários', icon: UserCog },
  { href: '/impressoras', label: 'Impressoras', icon: Printer },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/auditoria', label: 'Auditoria', icon: ScrollText },
  { href: '/backup', label: 'Backup', icon: Database },
];

function BoxIcon({ className }: { className?: string }) { return <Package className={className} />; }

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-background">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">FB</div>
        <div className="ml-3">
          <div className="font-bold text-base leading-tight">FestaBox</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">ERP / PDV</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        {ITEMS.map((item) => {
          const exact = pathname === item.href;
          const childActive = item.children?.some((c) => pathname.startsWith(c.href));
          const active = exact || childActive;
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground/80',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.children && <ChevronRight className={cn('h-3 w-3 transition-transform', active && 'rotate-90')} />}
              </Link>
              {item.children && active && (
                <div className="ml-7 mt-1 mb-2 space-y-1 border-l pl-3">
                  {item.children.filter((c) => c.href !== item.href).map((c) => {
                    const ca = pathname.startsWith(c.href);
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={cn('block text-sm py-1 px-2 rounded', ca ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground')}
                      >
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
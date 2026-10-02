import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, decimalToNumber } from '@/lib/money';
import { TrendingUp, ShoppingCart, AlertTriangle, Banknote, Package as PackageIcon, Users, Receipt, Wallet, Calculator, Calendar } from 'lucide-react';
import Link from 'next/link';
import { rangeToday, rangeThisMonth } from '@/lib/date-utils';

async function loadData(companyId: string) {
  const today = rangeToday();
  const month = rangeThisMonth();

  const [salesToday, salesMonth, productCount, lowStock, outStock, openReceivables, openPayables, recentSales, topProducts] = await Promise.all([
    prisma.sale.findMany({ where: { companyId, status: 'COMPLETED', completedAt: { gte: today.e, lte: today.s } } }),
    prisma.sale.findMany({ where: { companyId, status: 'COMPLETED', completedAt: { gte: month.e, lte: month.s } } }),
    prisma.product.count({ where: { companyId, active: true } }),
    prisma.product.findMany({
      where: { companyId, active: true, stockMin: { gt: 0 }, trackStock: true },
      take: 8, orderBy: { updatedAt: 'desc' },
    }),
    prisma.product.count({ where: { companyId, active: true, trackStock: true } }),
    prisma.accountsReceivable.aggregate({ where: { companyId, status: { in: ['OPEN', 'PARTIAL', 'OVERDUE'] } }, _sum: { amount: true, paid: true } }),
    prisma.accountsPayable.aggregate({ where: { companyId, status: { in: ['OPEN', 'PARTIAL', 'OVERDUE'] } }, _sum: { amount: true, paid: true } }),
    prisma.sale.findMany({ where: { companyId, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 8, include: { customer: true, user: true } }),
    prisma.saleItem.groupBy({ by: ['productId'], where: { sale: { companyId, status: 'COMPLETED' } }, _sum: { quantity: true, total: true }, orderBy: { _sum: { total: 'desc' } }, take: 5 }),
  ]);

  const sum = (arr: { total: any }[]) => arr.reduce((s, x) => s + decimalToNumber(x.total), 0);
  const todayTotal = sum(salesToday);
  const monthTotal = sum(salesMonth);
  const ticket = salesMonth.length ? monthTotal / salesMonth.length : 0;
  const lowStockCount = lowStock.filter(p => decimalToNumber(p.stockMin) > 0).length;

  const productsMap = new Map(topProducts.map((tp) => [tp.productId, tp]));
  const topProductsWithNames = await prisma.product.findMany({ where: { id: { in: topProducts.map((t) => t.productId) } }, select: { id: true, name: true } });
  const top = topProductsWithNames.map((p) => {
    const t = productsMap.get(p.id)!;
    return { id: p.id, name: p.name, qty: decimalToNumber(t._sum.quantity || 0), total: decimalToNumber(t._sum.total || 0) };
  });

  return {
    todayTotal, monthSalesCount: salesMonth.length, monthTotal, ticket, productCount,
    openReceivables: decimalToNumber(openReceivables._sum.amount) - decimalToNumber(openReceivables._sum.paid),
    openPayables: decimalToNumber(openPayables._sum.amount) - decimalToNumber(openPayables._sum.paid),
    recentSales: recentSales.map((s) => ({ id: s.id, number: s.number, total: decimalToNumber(s.total), customer: s.customer?.name ?? '—', user: s.user?.name ?? '—', at: s.createdAt })),
    top, lowStockCount,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const companyId = (session?.user as any)?.companyId as string;
  const data = await loadData(companyId);

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral da operação em tempo real" />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(data.todayTotal)}</div>
            <p className="text-xs text-muted-foreground">Atualizado agora</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas do Mês</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(data.monthTotal)}</div>
            <p className="text-xs text-muted-foreground">{data.monthSalesCount} vendas · ticket médio {formatMoney(data.ticket)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(data.openReceivables)}</div>
            <p className="text-xs text-muted-foreground">Em aberto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Pagar</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(data.openPayables)}</div>
            <p className="text-xs text-muted-foreground">Vencidos + a vencer</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Receipt className="h-4 w-4" /> Últimas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {data.recentSales.map((s) => (
                  <Link key={s.id} href={`/vendas/${s.id}`} className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                    <div>
                      <div className="font-medium">#{s.number} · {s.customer}</div>
                      <div className="text-xs text-muted-foreground">por {s.user} · {new Date(s.at).toLocaleString('pt-BR')}</div>
                    </div>
                    <div className="font-semibold">{formatMoney(s.total)}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Produtos cadastrados</span>
              <Badge variant="info">{data.productCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Estoque baixo</span>
              <Badge variant="warning">{data.lowStockCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>A pagar</span>
              <Badge variant="destructive">{formatMoney(data.openPayables)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Top 5 Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados ainda.</p> : (
              <ul className="space-y-2">
                {data.top.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{p.name}</span>
                    <span className="font-medium">{formatMoney(p.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/pdv" className="rounded-md border p-3 hover:bg-muted text-sm font-medium">Abrir PDV</Link>
            <Link href="/produtos" className="rounded-md border p-3 hover:bg-muted text-sm font-medium">Produtos</Link>
            <Link href="/compras/importar-nfe" className="rounded-md border p-3 hover:bg-muted text-sm font-medium">Importar NF-e</Link>
            <Link href="/relatorios" className="rounded-md border p-3 hover:bg-muted text-sm font-medium">Relatórios</Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
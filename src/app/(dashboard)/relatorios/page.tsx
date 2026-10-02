import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { formatMoney, decimalToNumber } from '@/lib/money';

export default async function RelatoriosPage() {
  const session = await auth();
  const companyId = (session?.user as any)?.companyId;
  const [sales, top, lowStock, byMethod] = await Promise.all([
    prisma.sale.findMany({ where: { companyId, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 50, include: { customer: true, items: true, payments: true } }),
    prisma.saleItem.groupBy({ by: ['productId'], where: { sale: { companyId, status: 'COMPLETED' } }, _sum: { quantity: true, total: true }, orderBy: { _sum: { total: 'desc' } }, take: 10 }),
    prisma.product.findMany({ where: { companyId, active: true, stockMin: { gt: 0 } }, take: 50, include: { stockBalances: true } }),
    prisma.salePayment.groupBy({ by: ['method'], where: { sale: { companyId, status: 'COMPLETED' } }, _sum: { amount: true } }),
  ]);
  const products = await prisma.product.findMany({ where: { id: { in: top.map((t) => t.productId) } } });
  const productsMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Top Produtos</h2>
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="h-9 px-3 text-left">Produto</th><th className="h-9 px-3 text-right">Qtd</th><th className="h-9 px-3 text-right">Total</th></tr></thead>
            <tbody>
              {top.map((t) => {
                const p = productsMap.get(t.productId);
                return <tr key={t.productId} className="border-t"><td className="p-3">{p?.name}</td><td className="p-3 text-right">{decimalToNumber(t._sum.quantity || 0).toLocaleString('pt-BR')}</td><td className="p-3 text-right">{formatMoney(decimalToNumber(t._sum.total || 0))}</td></tr>;
              })}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Por Forma de Pagamento</h2>
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="h-9 px-3 text-left">Forma</th><th className="h-9 px-3 text-right">Valor</th></tr></thead>
            <tbody>{byMethod.map((m) => <tr key={m.method} className="border-t"><td className="p-3">{m.method}</td><td className="p-3 text-right">{formatMoney(decimalToNumber(m._sum.amount))}</td></tr>)}</tbody>
          </table>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Estoque Baixo</h2>
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="h-9 px-3 text-left">Produto</th><th className="h-9 px-3 text-right">Estoque</th><th className="h-9 px-3 text-right">Mínimo</th></tr></thead>
            <tbody>
              {lowStock.map((p) => {
                const stock = decimalToNumber(p.stockBalances[0]?.quantity);
                return <tr key={p.id} className="border-t"><td className="p-3">{p.name}</td><td className="p-3 text-right">{stock}</td><td className="p-3 text-right">{decimalToNumber(p.stockMin)}</td></tr>;
              })}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-2">DRE Gerencial (Resumo)</h2>
          <div className="space-y-2 text-sm">
            {(() => {
              const rev = sales.reduce((s, x) => s + decimalToNumber(x.total), 0);
              const disc = sales.reduce((s, x) => s + decimalToNumber(x.discount), 0);
              const returns = 0;
              const netRev = rev - disc - returns;
              const cost = sales.reduce((s, x) => s + x.items.reduce((a, it) => a + decimalToNumber(it.quantity) * decimalToNumber(it.product?.costPrice || 0), 0), 0);
              const gross = netRev - cost;
              return (
                <>
                  <div className="flex justify-between"><span>Receita de vendas</span><span>{formatMoney(rev)}</span></div>
                  <div className="flex justify-between"><span>(-) Descontos</span><span>-{formatMoney(disc)}</span></div>
                  <div className="flex justify-between font-medium"><span>= Receita líquida</span><span>{formatMoney(netRev)}</span></div>
                  <div className="flex justify-between"><span>(-) CMV estimado</span><span>-{formatMoney(cost)}</span></div>
                  <div className="flex justify-between border-t pt-1 font-medium"><span>= Resultado bruto</span><span>{formatMoney(gross)}</span></div>
                  <div className="text-xs text-muted-foreground">Obs: baseado em vendas completadas. CMV calculado pelo custo atual dos produtos.</div>
                </>
              );
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}
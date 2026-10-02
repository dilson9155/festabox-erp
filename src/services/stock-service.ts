import { prisma } from '@/lib/prisma';
import { decimalToNumber } from '@/lib/money';

export type StockLevelMap = Map<string, number>;

export async function loadStockMap(companyId: string, productIds: string[]): Promise<StockLevelMap> {
  if (productIds.length === 0) return new Map();
  const balances = await prisma.stockBalance.findMany({ where: { companyId: companyId, productId: { in: productIds } } });
  const map = new Map<string, number>();
  for (const b of balances) map.set(b.productId, decimalToNumber(b.quantity));
  return map;
}
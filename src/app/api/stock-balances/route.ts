import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const balances = await prisma.stockBalance.findMany({ where: { product: { companyId: user.companyId, active: true } }, include: { product: { include: { unit: true, category: true } } } });
    const items = balances.map((b) => ({
      productId: b.productId,
      name: b.product.name,
      code: b.product.internalCode ?? b.product.barcode ?? '',
      unit: b.product.unit?.abbreviation ?? 'UN',
      category: b.product.category?.name ?? '',
      stockMin: Number(b.product.stockMin ?? 0),
      stock: Number(b.quantity ?? 0),
      costPrice: Number(b.product.costPrice ?? 0),
      salePrice: Number(b.product.salePrice ?? 0),
    }));
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}
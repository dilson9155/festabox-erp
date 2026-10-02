import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';
import { decimalToNumber } from '@/lib/money';

const schema = z.object({
  productId: z.string(),
  type: z.enum(['ADJUST_IN', 'ADJUST_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'LOSS', 'DAMAGE', 'INVENTORY', 'INITIAL']),
  quantity: z.number().positive(),
  reason: z.string().min(1, 'Informe o motivo'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.STOCK_MOVE)) return jsonError('Sem permissão', 403);

    const data = schema.parse(await req.json());
    const product = await prisma.product.findFirst({ where: { id: data.productId, companyId: user.companyId } });
    if (!product) return jsonError('Produto não encontrado', 404);

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.stockBalance.findFirst({ where: { productId: product.id, companyId: user.companyId } });
      const previousQty = balance ? decimalToNumber(balance.quantity) : 0;
      const sign = ['ADJUST_IN', 'TRANSFER_IN', 'INVENTORY', 'INITIAL'].includes(data.type) ? 1 : -1;
      const newQty = previousQty + sign * data.quantity;

      if (balance) await tx.stockBalance.update({ where: { id: balance.id }, data: { quantity: newQty } });
      else await tx.stockBalance.create({ data: { productId: product.id, companyId: user.companyId, quantity: newQty } });

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          userId: user.id,
          type: data.type,
          quantity: sign * data.quantity,
          previousQty,
          newQty,
          reason: data.reason,
          unitCost: decimalToNumber(product.costPrice),
          originType: 'MANUAL',
        },
      });
      return movement;
    });

    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'StockMovement', entityId: result.id, action: 'create', after: data });
    return Response.json({ ok: true, movement: result });
  } catch (e) { return handleApiError(e); }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1'), 1);
    const pageSize = 50;
    const where: any = { product: { companyId: user.companyId } };
    if (productId) where.productId = productId;

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({ where, include: { product: true, user: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.stockMovement.count({ where }),
    ]);
    return Response.json({ items, total, page, pageSize });
  } catch (e) { return handleApiError(e); }
}
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const sale = await prisma.sale.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: { customer: true, user: true, items: { include: { product: true } }, payments: true },
    });
    if (!sale) return jsonError('Não encontrada', 404);
    return Response.json(sale);
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PDV_CANCEL)) return jsonError('Sem permissão', 403);

    const body = await req.json().catch(() => ({}));
    const reason = (body.reason as string) || 'Não informado';

    const sale = await prisma.sale.findFirst({ where: { id: params.id, companyId: user.companyId }, include: { items: true, payments: true } });
    if (!sale) return jsonError('Não encontrada', 404);
    if (sale.status === 'CANCELED') return jsonError('Venda já cancelada', 400);

    const result = await prisma.$transaction(async (tx) => {
      // restaurar saldo de estoque
      for (const it of sale.items) {
        const balance = await tx.stockBalance.findFirst({ where: { productId: it.productId, companyId: user.companyId } });
        const previousQty = balance ? Number(balance.quantity) : 0;
        const newQty = previousQty + Number(it.quantity);
        if (balance) await tx.stockBalance.update({ where: { id: balance.id }, data: { quantity: newQty } });
        else await tx.stockBalance.create({ data: { productId: it.productId, companyId: user.companyId, quantity: newQty } });
        await tx.stockMovement.create({
          data: {
            productId: it.productId, userId: user.id, type: 'RETURN_SALE',
            quantity: Number(it.quantity), previousQty, newQty,
            reason: `Cancelamento venda #${sale.number}`, originType: 'SALE', originId: sale.id,
          },
        });
      }
      // estornar movimentações de caixa
      await tx.cashMovement.deleteMany({ where: { saleId: sale.id } });
      // cancelar contas a receber geradas
      await tx.accountsReceivable.updateMany({ where: { saleId: sale.id, status: { not: 'PAID' } }, data: { status: 'CANCELED' } });
      const updated = await tx.sale.update({ where: { id: sale.id }, data: { status: 'CANCELED', canceledAt: new Date(), cancelReason: reason } });
      return updated;
    });

    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'Sale', entityId: sale.id, action: 'cancel', reason });
    return Response.json(result);
  } catch (e) { return handleApiError(e); }
}
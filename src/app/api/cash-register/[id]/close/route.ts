import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { decimalToNumber } from '@/lib/money';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PDV_CLOSE_CASH)) return jsonError('Sem permissão', 403);

    const cash = await prisma.cashRegister.findFirst({ where: { id: params.id, companyId: user.companyId } });
    if (!cash) return jsonError('Caixa não encontrado', 404);
    if (cash.status !== 'OPEN') return jsonError('Caixa já está fechado', 400);

    const body = await req.json();
    const informed = Number(body.informedAmount) || 0;

    const movements = await prisma.cashMovement.findMany({ where: { cashRegisterId: cash.id } });
    let totalIn = decimalToNumber(cash.openingAmount);
    let totalOut = 0;
    for (const m of movements) {
      const v = decimalToNumber(m.amount);
      if (['SALE', 'PAYMENT_RECEIVED', 'SUPPLY'].includes(m.type)) totalIn += v;
      else if (['BLEED', 'EXPENSE', 'PAYMENT_PAID'].includes(m.type)) totalOut += v;
    }
    const expected = totalIn - totalOut;
    const difference = informed - expected;

    const updated = await prisma.cashRegister.update({
      where: { id: cash.id },
      data: { status: 'CLOSED', closingAmount: expected, difference, closedAt: new Date(), notes: body.notes ?? cash.notes },
    });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'CashRegister', entityId: cash.id, action: 'close', after: { expected, informed, difference } });
    return Response.json(updated);
  } catch (e) { return handleApiError(e); }
}
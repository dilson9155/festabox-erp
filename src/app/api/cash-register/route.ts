import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';
import { decimalToNumber } from '@/lib/money';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const list = await prisma.cashRegister.findMany({
      where: { companyId: user.companyId },
      include: { user: true },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });
    const current = list.find((c) => c.status === 'OPEN' && c.userId === user.id) || null;
    return Response.json({ items: list, current });
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PDV_OPEN_CASH)) return jsonError('Sem permissão', 403);
    const open = await prisma.cashRegister.findFirst({ where: { companyId: user.companyId, userId: user.id, status: 'OPEN' } });
    if (open) return jsonError('Já existe um caixa aberto', 400);
    const body = await req.json();
    const openingAmount = Number(body.openingAmount) || 0;
    const notes = body.notes as string | undefined;
    const created = await prisma.cashRegister.create({ data: { companyId: user.companyId, userId: user.id, openingAmount, notes, status: 'OPEN' } });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'CashRegister', entityId: created.id, action: 'open', after: { openingAmount } });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
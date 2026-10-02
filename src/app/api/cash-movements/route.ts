import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const schema = z.object({
  cashRegisterId: String(),
  type: z.enum(['BLEED', 'SUPPLY', 'EXPENSE', 'OTHER']),
  amount: z.number().positive(),
  reason: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.FINANCE_CASH)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const cash = await prisma.cashRegister.findFirst({ where: { id: data.cashRegisterId, companyId: user.companyId, status: 'OPEN' } });
    if (!cash) return jsonError('Caixa não está aberto', 400);
    const created = await prisma.cashMovement.create({ data: { cashRegisterId: data.cashRegisterId, userId: user.id, type: data.type, amount: data.amount, reason: data.reason ?? null } });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'CashMovement', entityId: created.id, action: 'create', after: data });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const url = new URL(req.url);
    const cashRegisterId = url.searchParams.get('cashRegisterId');
    if (!cashRegisterId) return jsonError('cashRegisterId obrigatório', 400);
    const items = await prisma.cashMovement.findMany({ where: { cashRegisterId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}
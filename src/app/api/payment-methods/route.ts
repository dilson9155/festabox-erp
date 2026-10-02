import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const items = await prisma.paymentMethod.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: 'asc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['CASH', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD', 'VOUCHER', 'TRANSFER', 'CHECK', 'CREDIT_STORE', 'OTHER']),
  maxInstallments: z.number().int().min(1).max(36).default(1),
  settleDays: z.number().int().default(0),
  feePercent: z.number().nonnegative().default(0),
  pixKey: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.SETTINGS_MANAGE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const created = await prisma.paymentMethod.create({ data: { ...data, companyId: user.companyId } });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const items = await prisma.financialAccount.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({
  name: z.string().min(1),
  type: z.string(),
  bank: z.string().optional().nullable(),
  agency: z.string().optional().nullable(),
  account: z.string().optional().nullable(),
  pixKey: z.string().optional().nullable(),
  pixKeyType: z.string().optional().nullable(),
  initialBalance: z.number().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.FINANCE_BANK)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const created = await prisma.financialAccount.create({ data: { ...data, companyId: user.companyId } });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'FinancialAccount', entityId: created.id, action: 'create', after: data });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
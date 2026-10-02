import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const q = url.searchParams.get('q')?.trim() ?? '';
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    if (q) where.OR = [{ description: { contains: q, mode: 'insensitive' } }, { supplier: { legalName: { contains: q, mode: 'insensitive' } } }];
    const items = await prisma.accountsPayable.findMany({ where, include: { supplier: true, installments: true }, orderBy: { dueDate: 'asc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({
  description: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  amount: z.number().positive(),
  dueDate: z.string(),
  category: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.FINANCE_PAYABLE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const created = await prisma.accountsPayable.create({ data: { ...data, dueDate: new Date(data.dueDate), companyId: user.companyId } as any });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'AccountsPayable', entityId: created.id, action: 'create', after: data });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
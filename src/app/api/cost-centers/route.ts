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
    const [items, paymentMethods, cardBrands] = await Promise.all([
      prisma.costCenter.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
      prisma.paymentMethod.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
      prisma.cardBrand.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
    ]);
    return Response.json({ items, paymentMethods, cardBrands });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({ name: z.string().min(1), description: z.string().optional().nullable() });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.SETTINGS_MANAGE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const created = await prisma.costCenter.create({ data: { ...data, companyId: user.companyId } });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'CostCenter', entityId: created.id, action: 'create', after: data });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
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
    const items = await prisma.chartOfAccount.findMany({ where: { companyId: user.companyId }, orderBy: { code: 'asc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({ code: z.string(), name: z.string(), type: z.enum(['REVENUE', 'EXPENSE']), parentId: z.string().optional().nullable() });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.SETTINGS_MANAGE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const created = await prisma.chartOfAccount.create({ data: { ...data, companyId: user.companyId } });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.AUDIT_VIEW)) return jsonError('Sem permissão', 403);
    const url = new URL(req.url);
    const entity = url.searchParams.get('entity') ?? undefined;
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1'), 1);
    const pageSize = 50;
    const where: any = { companyId: user.companyId };
    if (entity) where.entity = entity;
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, include: { user: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auditLog.count({ where }),
    ]);
    return Response.json({ items, total, page, pageSize });
  } catch (e) { return handleApiError(e); }
}
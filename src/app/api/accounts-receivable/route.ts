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
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    const items = await prisma.accountsReceivable.findMany({ where, include: { customer: true }, orderBy: { dueDate: 'asc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}
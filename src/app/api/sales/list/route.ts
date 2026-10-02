import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';
import { decimalToNumber } from '@/lib/money';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1'), 1);
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') ?? '20'), 100);

    const where: any = { companyId: user.companyId };
    if (q) {
      where.OR = [
        { number: parseInt(q) || 0 },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.sale.findMany({ where, include: { customer: true, user: true, payments: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.sale.count({ where }),
    ]);
    return Response.json({ items, total, page, pageSize });
  } catch (e) { return handleApiError(e); }
}
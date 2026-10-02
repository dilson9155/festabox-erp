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
    const q = url.searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 200);

    const where: any = { companyId: user.companyId, active: true };
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { document: { contains: q } }, { phone: { contains: q } }];
    const items = await prisma.customer.findMany({ where, orderBy: { name: 'asc' }, take: limit });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({
  personType: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
  name: z.string().min(1),
  tradeName: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  ie: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  creditLimit: z.number().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.CUSTOMER_MANAGE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const created = await prisma.customer.create({ data: { ...data, companyId: user.companyId } as any });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'Customer', entityId: created.id, action: 'create', after: data });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
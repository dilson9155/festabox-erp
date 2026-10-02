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
    if (q) where.OR = [{ legalName: { contains: q, mode: 'insensitive' } }, { tradeName: { contains: q, mode: 'insensitive' } }, { document: { contains: q } }];
    const items = await prisma.supplier.findMany({ where, orderBy: { legalName: 'asc' }, take: limit });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({
  legalName: z.string().min(1),
  tradeName: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  ie: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.SUPPLIER_MANAGE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const created = await prisma.supplier.create({ data: { ...data, companyId: user.companyId } });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'Supplier', entityId: created.id, action: 'create', after: data });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}
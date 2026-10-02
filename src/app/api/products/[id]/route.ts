import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const p = await prisma.product.findFirst({ where: { id: params.id, companyId: user.companyId }, include: { category: true, brand: true, unit: true, stockBalances: true, barcodes: true } });
    if (!p) return jsonError('Produto não encontrado', 404);
    return Response.json(p);
  } catch (e) { return handleApiError(e); }
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  wholesalePrice: z.number().nonnegative().optional(),
  promotionPrice: z.number().nonnegative().optional(),
  stockMin: z.number().nonnegative().optional(),
  stockMax: z.number().nonnegative().optional(),
  controlLot: z.boolean().optional(),
  controlExpiry: z.boolean().optional(),
  trackStock: z.boolean().optional(),
  active: z.boolean().optional(),
  ncm: z.string().optional().nullable(),
  cest: z.string().optional().nullable(),
  cfop: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PRODUCT_MANAGE)) return jsonError('Sem permissão', 403);

    const before = await prisma.product.findUnique({ where: { id: params.id } });
    if (!before || before.companyId !== user.companyId) return jsonError('Não encontrado', 404);

    const data = patchSchema.parse(await req.json());
    const updated = await prisma.product.update({ where: { id: params.id }, data: data as any });

    await logAudit({
      companyId: user.companyId, userId: user.id, entity: 'Product', entityId: params.id, action: 'update',
      before: { costPrice: before.costPrice, salePrice: before.salePrice }, after: data,
    });
    return Response.json(updated);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PRODUCT_DELETE)) return jsonError('Sem permissão', 403);

    const before = await prisma.product.findUnique({ where: { id: params.id } });
    if (!before || before.companyId !== user.companyId) return jsonError('Não encontrado', 404);

    await prisma.product.update({ where: { id: params.id }, data: { active: false } });
    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'Product', entityId: params.id, action: 'delete' });
    return Response.json({ ok: true });
  } catch (e) { return handleApiError(e); }
}
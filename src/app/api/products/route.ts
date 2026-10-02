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
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1'), 1);
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') ?? '20'), 100);
    const categoryId = url.searchParams.get('categoryId') || undefined;

    const where: any = { companyId: user.companyId };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { internalCode: { contains: q } },
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { equals: q } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
        include: { category: true, brand: true, unit: true, stockBalances: true },
      }),
      prisma.product.count({ where }),
    ]);

    return Response.json({
      items: items.map((p) => ({
        ...p,
        stock: p.stockBalances[0]?.quantity?.toString() ?? '0',
      })),
      total, page, pageSize,
    });
  } catch (e) { return handleApiError(e); }
}

const productSchema = z.object({
  name: z.string().min(1),
  internalCode: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().nonnegative().default(0),
  salePrice: z.number().nonnegative().default(0),
  wholesalePrice: z.number().nonnegative().default(0),
  promotionPrice: z.number().nonnegative().default(0),
  stockMin: z.number().nonnegative().default(0),
  stockMax: z.number().nonnegative().default(0),
  location: z.string().optional().nullable(),
  controlLot: z.boolean().default(false),
  controlExpiry: z.boolean().default(false),
  trackStock: z.boolean().default(true),
  active: z.boolean().default(true),
  ncm: z.string().optional(),
  cest: z.string().optional(),
  cfop: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PRODUCT_MANAGE)) return jsonError('Sem permissão', 403);

    const data = productSchema.parse(await req.json());
    const product = await prisma.product.create({ data: { ...data, companyId: user.companyId } as any });

    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'Product', entityId: product.id, action: 'create', after: data });
    return Response.json(product);
  } catch (e) { return handleApiError(e); }
}
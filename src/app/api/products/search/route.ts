import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);

    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);

    if (!q) return Response.json({ items: [] });

    const items = await prisma.product.findMany({
      where: {
        companyId: user.companyId,
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { internalCode: { contains: q } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { equals: q } },
          { barcodes: { some: { code: q } } },
        ],
      },
      include: { unit: true, category: true },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return Response.json({
      items: items.map((p) => ({
        id: p.id,
        code: p.internalCode ?? '',
        ean: p.barcode ?? '',
        name: p.name,
        price: Number(p.salePrice ?? 0),
        unit: p.unit?.abbreviation ?? 'UN',
        category: p.category?.name ?? '',
        stock: 0, // saldo agregado carregado em /api/stock
        controlLot: p.controlLot,
        controlExpiry: p.controlExpiry,
        trackStock: p.trackStock,
        allowChangePrice: true,
      })),
    });
  } catch (e) { return handleApiError(e); }
}
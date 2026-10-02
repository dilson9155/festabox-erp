import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    const items = await prisma.purchase.findMany({ where, include: { supplier: true, user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({
  supplierId: z.string(),
  invoiceNumber: z.string().optional().nullable(),
  invoiceKey: z.string().optional().nullable(),
  invoiceDate: z.string().optional().nullable(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().positive(), unitCost: z.number().nonnegative() })),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PURCHASE_MANAGE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const lastNumber = await prisma.purchase.findFirst({ where: { companyId: user.companyId }, orderBy: { number: 'desc' } });
    const number = (lastNumber?.number ?? 0) + 1;
    let total = 0;
    const purchase = await prisma.purchase.create({
      data: {
        companyId: user.companyId,
        number,
        supplierId: data.supplierId,
        userId: user.id,
        status: 'OPEN',
        invoiceNumber: data.invoiceNumber ?? null,
        invoiceKey: data.invoiceKey ?? null,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        items: {
          create: data.items.map((it) => {
            const itemTotal = it.quantity * it.unitCost;
            total += itemTotal;
            return { productId: it.productId, quantity: it.quantity, unitCost: it.unitCost, total: itemTotal };
          }),
        },
        total,
      },
    });
    // gerar contas a pagar
    await prisma.accountsPayable.create({
      data: {
        companyId: user.companyId,
        supplierId: data.supplierId,
        purchaseId: purchase.id,
        description: `Compra #${number}`,
        amount: total,
        dueDate: new Date(Date.now() + 30 * 86400e3),
        status: 'OPEN',
      },
    });
    return Response.json(purchase);
  } catch (e) { return handleApiError(e); }
}
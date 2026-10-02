import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.BACKUP_MANAGE)) return jsonError('Sem permissão', 403);
    const companyId = user.companyId;
    const [products, customers, suppliers, sales, purchases, accountsPayable, accountsReceivable] = await Promise.all([
      prisma.product.findMany({ where: { companyId } }),
      prisma.customer.findMany({ where: { companyId } }),
      prisma.supplier.findMany({ where: { companyId } }),
      prisma.sale.findMany({ where: { companyId }, include: { items: true, payments: true } }),
      prisma.purchase.findMany({ where: { companyId }, include: { items: true } }),
      prisma.accountsPayable.findMany({ where: { companyId } }),
      prisma.accountsReceivable.findMany({ where: { companyId } }),
    ]);
    const data = { exportedAt: new Date().toISOString(), products, customers, suppliers, sales, purchases, accountsPayable, accountsReceivable };
    return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="festabox-backup.json"` } });
  } catch (e) { return handleApiError(e); }
}
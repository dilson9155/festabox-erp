import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, jsonError } from '@/lib/session';
import { buildReceipt } from '@/lib/escpos';
import { decimalToNumber } from '@/lib/money';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError('Não autorizado', 401);

  const sale = await prisma.sale.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { customer: true, user: true, company: true, items: { include: { product: true } }, payments: true },
  });
  if (!sale) return new Response('Venda não encontrada', { status: 404 });

  const printer = await prisma.printer.findFirst({ where: { companyId: user.companyId, isDefaultPdv: true, active: true } });
  const width = printer?.width === 'MM58' ? 32 : 42;

  const bytes = buildReceipt({
    company: { name: sale.company.name, document: sale.company.document, address: sale.company.address, phone: sale.company.phone },
    number: sale.number,
    date: new Date(sale.createdAt).toLocaleString('pt-BR'),
    operator: sale.user?.name ?? '',
    customerName: sale.customer?.name,
    items: sale.items.map((it) => ({ name: it.product.name, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), total: Number(it.total) })),
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    addition: Number(sale.addition),
    total: Number(sale.total),
    payments: sale.payments.map((p) => ({ method: p.method, amount: Number(p.amount), installments: p.installments })),
    change: Number(sale.change),
    width,
  });
  return new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="venda-${sale.number}.bin"` } });
}
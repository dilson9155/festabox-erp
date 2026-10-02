import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { decimalToNumber, fromCents, toCents } from '@/lib/money';

type PaymentInput = { method: string; amount: number; installments?: number; cardBrandId?: string; cardType?: 'DEBIT' | 'CREDIT'; pixKey?: string };

type CartItem = { productId: string; quantity: number; unitPrice: number; discount?: number; addition?: number };

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PDV_SELL)) return jsonError('Sem permissão', 403);

    const body = await req.json();
    const { customerId, items, payments, discount = 0, addition = 0, notes, openCash } = body as {
      customerId?: string;
      items: CartItem[];
      payments: PaymentInput[];
      discount?: number;
      addition?: number;
      notes?: string;
      openCash?: boolean;
    };

    if (!items?.length) return jsonError('Adicione ao menos um item', 400);
    if (!payments?.length) return jsonError('Informe a forma de pagamento', 400);

    // Resolver caixa aberto
    const cashOpen = await prisma.cashRegister.findFirst({ where: { companyId: user.companyId, userId: user.id, status: 'OPEN' }, orderBy: { openedAt: 'desc' } });
    if (!cashOpen && hasPermission(user.role, user.permissions, PERMISSIONS.PDV_OPEN_CASH)) {
      // abertura implícita se o usuário quiser (sem valor inicial)
      if (openCash) {
        await prisma.cashRegister.create({ data: { companyId: user.companyId, userId: user.id, status: 'OPEN', openingAmount: 0 } });
      } else {
        return jsonError('Abra o caixa para iniciar', 400);
      }
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, companyId: user.companyId } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const it of items) {
      const p = productMap.get(it.productId);
      if (!p) return jsonError('Produto não encontrado', 400);
      if (!p.active) return jsonError(`Produto ${p.name} inativo`, 400);
      if (!p.trackStock) continue;
      const current = await prisma.stockBalance.findFirst({ where: { productId: p.id, companyId: user.companyId } });
      const currentQty = current ? decimalToNumber(current.quantity) : 0;
      if (currentQty - it.quantity < 0) {
        const allowNeg = await prisma.company.findUnique({ where: { id: user.companyId } });
        if (!allowNeg?.allowNegativeStock) return jsonError(`Estoque insuficiente para ${p.name}`, 400);
      }
    }

    let subtotal = 0;
    const linePayloads: { product: typeof products[0]; qty: number; price: number; discount: number; addition: number; total: number }[] = [];
    for (const it of items) {
      const p = productMap.get(it.productId)!;
      const qty = it.quantity;
      const price = it.unitPrice;
      const discount = it.discount ?? 0;
      const addition = it.addition ?? 0;
      const total = qty * price - discount + addition;
      subtotal += total;
      linePayloads.push({ product: p, qty, price, discount, addition, total });
    }

    const total = subtotal - (discount || 0) + (addition || 0);
    const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const change = paid > total ? paid - total : 0;

    // Próximo número de venda
    const lastNumber = await prisma.sale.findFirst({ where: { companyId: user.companyId }, orderBy: { number: 'desc' }, select: { number: true } });
    const number = (lastNumber?.number ?? 0) + 1;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          companyId: user.companyId,
          number,
          customerId: customerId || null,
          userId: user.id,
          cashierId: user.id,
          status: 'COMPLETED',
          subtotal, discount, addition, total, paid, notes,
          change,
          payments: SalePaymentCreate(payments, total, paid, change),
          items: SaleItemsCreate(linePayloads),
        },
      });

      // movimentações de estoque
      for (const it of items) {
        const p = productMap.get(it.productId)!;
        if (!p.trackStock) continue;
        const balance = await tx.stockBalance.findFirst({ where: { productId: p.id, companyId: user.companyId } });
        const previousQty = balance ? decimalToNumber(balance.quantity) : 0;
        const newQty = previousQty - it.quantity;
        if (balance) {
          await tx.stockBalance.update({ where: { id: balance.id }, data: { quantity: newQty } });
        } else {
          await tx.stockBalance.create({ data: { productId: p.id, companyId: user.companyId, quantity: newQty } });
        }
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            userId: user.id,
            type: 'SALE',
            quantity: -Math.abs(it.quantity),
            previousQty,
            newQty,
            unitCost: decimalToNumber(p.costPrice),
            originType: 'SALE',
            originId: created.id,
          },
        });
      }

      // caixa (se pagamento em dinheiro)
      const cash = await tx.cashRegister.findFirst({ where: { companyId: user.companyId, userId: user.id, status: 'OPEN' }, orderBy: { openedAt: 'desc' } });
      if (cash) {
        const cashPayment = payments.find((p) => p.method === 'CASH');
        if (cashPayment) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: cash.id,
              userId: user.id,
              type: 'SALE',
              amount: cashPayment.amount,
              reason: 'Venda PDV',
              saleId: created.id,
              paymentMethod: 'CASH',
            },
          });
        }
      }

      // gerar contas a receber para vendas a prazo / crediário
      for (const p of payments) {
        if (p.method === 'CREDIT_STORE' && p.installments && p.installments > 1 && customerId) {
          const installmentAmount = p.amount / p.installments;
          const due = new Date();
          for (let i = 0; i < p.installments; i++) {
            due.setMonth(due.getMonth() + 1);
            await tx.accountsReceivable.create({
              data: {
                companyId: user.companyId,
                customerId,
                description: `Venda #${number} - parcela ${i + 1}/${p.installments}`,
                amount: installmentAmount,
                dueDate: due,
                status: 'OPEN',
                saleId: created.id,
              },
            });
          }
        }
      }

      return created;
    });

    await logAudit({
      companyId: user.companyId, userId: user.id, entity: 'Sale', entityId: sale.id, action: 'create',
      after: { number: sale.number, total: decimalToNumber(sale.total), itemsCount: items.length, payments: payments.length },
    });

    return Response.json({ ok: true, id: sale.id, number: sale.number, total: decimalToNumber(sale.total), change: decimalToNumber(sale.change) });
  } catch (e) { return handleApiError(e); }
}

function SalePaymentCreate(payments: PaymentInput[], total: number, paid: number, change: number) {
  return {
    create: payments.map((p) => ({
      method: p.method as any,
      methodName: undefined,
      amount: p.amount,
      received: paid,
      change,
      installments: p.installments ?? 1,
      cardBrandId: p.cardBrandId ?? undefined,
      cardType: p.cardType ?? undefined,
    })),
  };
}

function SaleItemsCreate(items: { product: any; qty: number; price: number; discount: number; addition: number; total: number }[]) {
  return {
    create: items.map((it) => ({
      productId: it.product.id,
      quantity: it.qty,
      unitPrice: it.price,
      originalPrice: it.product.salePrice,
      discount: it.discount,
      addition: it.addition,
      total: it.total,
      ncm: it.product.ncm,
      cfop: it.product.cfop,
    })),
  };
}
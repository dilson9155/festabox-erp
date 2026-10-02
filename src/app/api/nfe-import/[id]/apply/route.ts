import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { decimalToNumber } from '@/lib/money';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const item = await prisma.nfeImport.findFirst({ where: { id: params.id, companyId: user.companyId }, include: { items: { include: { product: true } }, supplier: true } });
    if (!item) return jsonError('Importação não encontrada', 404);
    return Response.json(item);
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PURCHASE_IMPORT_NFE)) return jsonError('Sem permissão', 403);

    const body = await req.json();
    const items: { id: string; action: 'CREATE' | 'UPDATE' | 'UPDATE_STOCK' | 'UPDATE_COST' | 'UPDATE_PRICE' | 'SKIP'; newSalePrice?: number; marginPercent?: number }[] = body.items ?? [];
    const supplierName = body.supplierName;
    const supplierId = body.supplierId;
    const supplierCnpj = body.supplierCnpj;
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });

    let supplier = supplierId ? await prisma.supplier.findFirst({ where: { id: supplierId, companyId: user.companyId } }) : null;
    if (!supplier && supplierCnpj) supplier = await prisma.supplier.findFirst({ where: { document: supplierCnpj, companyId: user.companyId } });
    if (!supplier && supplierName) {
      supplier = await prisma.supplier.create({
        data: { companyId: user.companyId, legalName: supplierName, document: supplierCnpj ?? null, tradeName: supplierName },
      });
    }

    // Criar/atualizar produtos, estoques, gerar Purchase
    let supplierForPurchase = supplier;
    const lastNumber = await prisma.purchase.findFirst({ where: { companyId: user.companyId }, orderBy: { number: 'desc' } });
    const purchaseNumber = (lastNumber?.number ?? 0) + 1;

    let total = 0;
    let subtotal = 0;

    for (const it of items) {
      const item = await prisma.nfeImportItem.findUnique({ where: { id: it.id }, include: { product: true } });
      if (!item) continue;
      if (it.action === 'SKIP') continue;

      if (it.action === 'CREATE') {
        const newProduct = await prisma.product.create({
          data: {
            companyId: user.companyId,
            name: item.name,
            barcode: item.ean || null,
            internalCode: item.supplierCode || null,
            ncm: item.ncm,
            cfop: item.cfop,
            supplierId: supplier?.id ?? null,
            costPrice: decimalToNumber(item.unitCost),
            salePrice: it.newSalePrice ?? decimalToNumber(item.unitCost) * 2.5,
            trackStock: true,
          },
        });
        await prisma.nfeImportItem.update({ where: { id: it.id }, data: { action: 'CREATE', productId: newProduct.id } });
        await applyStockIn(newProduct.id, user.id, user.companyId, Number(item.quantity), decimalToNumber(item.unitCost), purchaseNumber);
        subtotal += Number(item.total);
        total += Number(item.total);
      } else if (it.action === 'UPDATE' || it.action === 'UPDATE_PRICE' || it.action === 'UPDATE_COST' || it.action === 'UPDATE_STOCK') {
        if (!item.productId) continue;
        const updateData: any = {};
        if (it.action === 'UPDATE') updateData.name = item.name, updateData.barcode = item.ean || undefined, updateData.costPrice = decimalToNumber(item.unitCost), updateData.salePrice = it.newSalePrice ?? decimalToNumber(item.unitCost) * 2.5;
        if (it.action === 'UPDATE_PRICE') updateData.salePrice = it.newSalePrice;
        if (it.action === 'UPDATE_COST') updateData.costPrice = decimalToNumber(item.unitCost);
        await prisma.product.update({ where: { id: item.productId }, data: updateData });
        if (it.action !== 'UPDATE_STOCK') {
          await applyStockIn(item.productId, user.id, user.companyId, Number(item.quantity), decimalToNumber(item.unitCost), purchaseNumber);
        }
        subtotal += Number(item.total);
        total += Number(item.total);
      }
    }

    // Criar compra
    const importRec = await prisma.nfeImport.findUnique({ where: { id: params.id } });
    let purchaseId: string | null = null;
    if (total > 0 && supplierForPurchase) {
      const created = await prisma.purchase.create({
        data: {
          companyId: user.companyId,
          number: purchaseNumber,
          supplierId: supplierForPurchase.id,
          userId: user.id,
          status: 'OPEN',
          invoiceNumber: importRec?.invoiceNumber ?? undefined,
          invoiceKey: importRec?.invoiceKey ?? undefined,
          invoiceDate: importRec?.invoiceDate ?? undefined,
          subtotal, total,
          importedFromNfeId: params.id,
        },
      });
      purchaseId = created.id;
      // accounts payable
      await prisma.accountsPayable.create({
        data: {
          companyId: user.companyId,
          supplierId: supplierForPurchase.id,
          purchaseId: created.id,
          description: `Compra NF ${importRec?.invoiceNumber} - ${supplierForPurchase.legalName}`,
          amount: total,
          dueDate: new Date(Date.now() + 30 * 86400e3),
          status: 'OPEN',
        },
      });
      await prisma.nfeImport.update({ where: { id: params.id }, data: { status: 'APPLIED', purchaseId: created.id } });
    } else {
      await prisma.nfeImport.update({ where: { id: params.id }, data: { status: 'APPLIED' } });
    }

    await logAudit({ companyId: user.companyId, userId: user.id, entity: 'NfeImport', entityId: params.id, action: 'apply', after: { items: items.length, total } });
    return Response.json({ ok: true, purchaseId });
  } catch (e) { return handleApiError(e); }
}

async function applyStockIn(productId: string, userId: string, companyId: string, quantity: number, unitCost: number, _origin: number) {
  await prisma.$transaction(async (tx) => {
    const balance = await tx.stockBalance.findFirst({ where: { productId, companyId } });
    const previousQty = balance ? decimalToNumber(balance.quantity) : 0;
    const newQty = previousQty + quantity;
    if (balance) await tx.stockBalance.update({ where: { id: balance.id }, data: { quantity: newQty } });
    else await tx.stockBalance.create({ data: { productId, companyId, quantity: newQty } });
    await tx.stockMovement.create({
      data: { productId, userId, type: 'PURCHASE', quantity, previousQty, newQty, unitCost, originType: 'IMPORT_NFE' },
    });
  });
}
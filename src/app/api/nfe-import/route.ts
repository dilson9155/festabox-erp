import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { parseNfeXml } from '@/lib/nfe-parser';
import { decimalToNumber } from '@/lib/money';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const items = await prisma.nfeImport.findMany({ where: { companyId: user.companyId }, include: { supplier: true, items: true }, orderBy: { createdAt: 'desc' }, take: 50 });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PURCHASE_IMPORT_NFE)) return jsonError('Sem permissão', 403);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError('Arquivo XML obrigatório', 400);
    const xml = await file.text();
    const parsed = parseNfeXml(xml);

    // Tentar identificar fornecedor existente pelo CNPJ
    const supplier = await prisma.supplier.findFirst({ where: { companyId: user.companyId, document: parsed.supplier.cnpj } });
    // Tentar identificar produtos por EAN / código
    const eans = parsed.items.map((i) => i.ean).filter(Boolean) as string[];
    const codes = parsed.items.map((i) => i.code).filter(Boolean) as string[];
    const products = await prisma.product.findMany({
      where: { companyId: user.companyId, OR: [{ barcode: { in: eans } }, { internalCode: { in: codes } }, { sku: { in: codes } }] },
    });
    const productByEan = new Map(products.map((p) => [p.barcode, p] as const));
    const productByCode = new Map(products.map((p) => [p.internalCode ?? p.sku, p] as const));

    const itemsWithMatch = parsed.items.map((it) => {
      const found = (it.ean && productByEan.get(it.ean)) || (it.code && productByCode.get(it.code));
      const suggestedPrice = it.unitCost * 2.5; // markup padrão 150%
      return {
        ean: it.ean,
        supplierCode: it.supplierCode,
        name: it.name,
        ncm: it.ncm,
        cfop: it.cfop,
        unit: it.unit,
        quantity: it.quantity,
        unitCost: it.unitCost,
        total: it.total,
        productId: found?.id ?? null,
        productCurrentPrice: found ? decimalToNumber(found.salePrice) : null,
        productCurrentCost: found ? decimalToNumber(found.costPrice) : null,
        newSalePrice: Number(suggestedPrice.toFixed(2)),
        marginPercent: 150,
        matchStatus: found ? 'MATCHED' : 'NEW',
      };
    });

    const importRecord = await prisma.nfeImport.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        supplierId: supplier?.id ?? null,
        status: 'PENDING',
        invoiceNumber: parsed.number,
        invoiceKey: parsed.key,
        invoiceDate: parsed.date ? new Date(parsed.date) : null,
        invoiceValue: parsed.total,
        xmlRaw: xml,
        matchedCount: itemsWithMatch.filter((i) => i.matchStatus === 'MATCHED').length,
        newCount: itemsWithMatch.filter((i) => i.matchStatus === 'NEW').length,
        items: {
          create: itemsWithMatch.map((it) => ({
            ean: it.ean, supplierCode: it.supplierCode, name: it.name, ncm: it.ncm, cfop: it.cfop,
            unit: it.unit, quantity: it.quantity, unitCost: it.unitCost, total: it.total,
            productId: it.productId, matchStatus: it.matchStatus as any, action: 'CREATE' as any,
            newSalePrice: it.newSalePrice, marginPercent: it.marginPercent,
          })),
        },
      },
      include: { items: { include: { product: true } }, supplier: true },
    });

    return Response.json({ ok: true, id: importRecord.id, parsed: { ...parsed, items: itemsWithMatch, supplierFound: !!supplier } });
  } catch (e: any) {
    console.error('NFE_IMPORT', e);
    return jsonError(e?.message ?? 'Erro ao processar NF-e', 400);
  }
}
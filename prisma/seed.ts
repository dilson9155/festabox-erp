import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FestaBox ERP...');

  // Empresa padrão
  const company = await prisma.company.upsert({
    where: { document: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'FestaBox',
      tradeName: 'FestaBox',
      legalName: 'FestaBox Embalagens e Festas Ltda',
      document: '00.000.000/0001-00',
      stateTax: '',
      email: 'contato@festabox.com',
      phone: '(00) 0000-0000',
      whatsapp: '(00) 90000-0000',
      address: 'Rua das Embalagens, 123',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000',
      allowNegativeStock: false,
      discountMaxPercent: 5,
    },
  });

  // Usuário admin
  const hash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@festabox.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Administrador',
      email: 'admin@festabox.com',
      password: hash,
        role: 'ADMIN',
        active: true,
    } as any,
  });

  // Categorias
  const catNames = ['Embalagens', 'Doces', 'Balas', 'Pirulitos', 'Chocolates', 'Artigos para Festas', 'Descartáveis', 'Decoração', 'Limpeza', 'Outros'];
  for (const name of catNames) {
    await prisma.category.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name } });
  }

  // Marcas
  const brands = ['Elegance', 'Fest', 'Bauducco', 'Nestlé', 'Genérica'];
  for (const name of brands) {
    await prisma.brand.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name } });
  }

  // Unidades
  const units = [
    { name: 'Unidade', abbreviation: 'UN' },
    { name: 'Caixa', abbreviation: 'CX' },
    { name: 'Pacote', abbreviation: 'PCT' },
    { name: 'Fardo', abbreviation: 'FD' },
    { name: 'Centena', abbreviation: 'CT' },
    { name: 'Quilograma', abbreviation: 'KG' },
    { name: 'Grama', abbreviation: 'G' },
    { name: 'Metro', abbreviation: 'MT' },
    { name: 'Litro', abbreviation: 'LT' },
  ];
  for (const u of units) {
    await prisma.unit.upsert({ where: { companyId_abbreviation: { companyId: company.id, abbreviation: u.abbreviation } }, update: { name: u.name }, create: { ...u, companyId: company.id } });
  }

  // Produtos exemplo
  const catEmbalagens = await prisma.category.findFirst({ where: { companyId: company.id, name: 'Embalagens' } });
  const catDoces = await prisma.category.findFirst({ where: { companyId: company.id, name: 'Doces' } });
  const catFestas = await prisma.category.findFirst({ where: { companyId: company.id, name: 'Artigos para Festas' } });
  const unitUN = await prisma.unit.findFirst({ where: { companyId: company.id, abbreviation: 'UN' } });
  const unitCX = await prisma.unit.findFirst({ where: { companyId: company.id, abbreviation: 'CX' } });
  const unitPCT = await prisma.unit.findFirst({ where: { companyId: company.id, abbreviation: 'PCT' } });

  const products = [
    { name: 'Copo descartável 200ml', categoryId: catEmbalagens?.id, unitId: unitUN?.id, costPrice: 0.08, salePrice: 0.15, stockMin: 100, barcode: '7891234500011' },
    { name: 'Prato descartável', categoryId: catEmbalagens?.id, unitId: unitUN?.id, costPrice: 0.20, salePrice: 0.40, stockMin: 100, barcode: '7891234500028' },
    { name: 'Garfo descartável (100un)', categoryId: catEmbalagens?.id, unitId: unitCX?.id, costPrice: 8, salePrice: 15, stockMin: 10, barcode: '7891234500035' },
    { name: 'Guardanapo 50un', categoryId: catEmbalagens?.id, unitId: unitPCT?.id, costPrice: 1.5, salePrice: 3, stockMin: 20, barcode: '7891234500042' },
    { name: 'Sacola plástica', categoryId: catEmbalagens?.id, unitId: unitUN?.id, costPrice: 0.05, salePrice: 0.15, stockMin: 200, barcode: '7891234500059' },
    { name: 'Pote para marmita 500ml', categoryId: catEmbalagens?.id, unitId: unitUN?.id, costPrice: 0.35, salePrice: 0.80, stockMin: 100, barcode: '7891234500066' },
    { name: 'Bala sortida pct 100un', categoryId: catDoces?.id, unitId: unitPCT?.id, costPrice: 4, salePrice: 9, stockMin: 20, barcode: '7891234500073' },
    { name: 'Pirulito cores sortidas', categoryId: catDoces?.id, unitId: unitUN?.id, costPrice: 0.30, salePrice: 0.75, stockMin: 100, barcode: '7891234500080' },
    { name: 'Chocolate ao leite 20g', categoryId: catDoces?.id, unitId: unitUN?.id, costPrice: 0.60, salePrice: 1.50, stockMin: 100, barcode: '7891234500097' },
    { name: 'Chiclete', categoryId: catDoces?.id, unitId: unitUN?.id, costPrice: 0.20, salePrice: 0.50, stockMin: 100, barcode: '7891234500103' },
    { name: 'Marshmallow 100g', categoryId: catDoces?.id, unitId: unitUN?.id, costPrice: 1.5, salePrice: 3.5, stockMin: 30, barcode: '7891234500110' },
    { name: 'Vela de aniversário pct 12', categoryId: catFestas?.id, unitId: unitPCT?.id, costPrice: 3, salePrice: 7, stockMin: 20, barcode: '7891234500127' },
    { name: 'Balão metalizado ouro', categoryId: catFestas?.id, unitId: unitUN?.id, costPrice: 1.5, salePrice: 3.5, stockMin: 50, barcode: '7891234500134' },
    { name: 'Fita decorativa', categoryId: catFestas?.id, unitId: unitUN?.id, costPrice: 1.2, salePrice: 3, stockMin: 30, barcode: '7891234500141' },
  ];
  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { companyId: company.id, barcode: p.barcode } });
    if (!exists) {
      const created = await prisma.product.create({ data: { ...p, companyId: company.id, active: true, controlLot: false, controlExpiry: false, trackStock: true } as any });
      await prisma.stockBalance.create({ data: { productId: created.id, companyId: company.id, quantity: 50 } });
    }
  }

  // Cliente exemplo
  await prisma.customer.upsert({
    where: { companyId_document: { companyId: company.id, document: '000.000.000-00' } },
    update: {},
    create: { companyId: company.id, name: 'Consumidor Final', document: '000.000.000-00', personType: 'INDIVIDUAL', active: true } as any,
  });

  // Fornecedor exemplo
  await prisma.supplier.upsert({
    where: { companyId_document: { companyId: company.id, document: '11.111.111/0001-11' } },
    update: {},
    create: { companyId: company.id, legalName: 'Distribuidora Festa', document: '11.111.111/0001-11', tradeName: 'FestaDistribuidora', active: true } as any,
  });

  // Formas de pagamento padrão
  const defaultMethods = [
    { name: 'Dinheiro', type: 'CASH' as any },
    { name: 'PIX', type: 'PIX' as any },
    { name: 'Cartão de Débito', type: 'DEBIT_CARD' as any },
    { name: 'Cartão de Crédito', type: 'CREDIT_CARD' as any, maxInstallments: 12 },
    { name: 'Crediário', type: 'CREDIT_STORE' as any, maxInstallments: 6 },
    { name: 'Transferência', type: 'TRANSFER' as any },
  ];
  for (const m of defaultMethods) {
    await prisma.paymentMethod.upsert({
      where: { companyId_name: { companyId: company.id, name: m.name } },
      update: {},
      create: { ...m, companyId: company.id, active: true } as any,
    });
  }

  // Bandeiras
  const cardBrands = ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express', 'Diners'];
  for (const name of cardBrands) {
    await prisma.cardBrand.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name, active: true } });
  }

  // Conta padrão Caixa
  await prisma.financialAccount.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Caixa Loja' } },
    update: {},
    create: { companyId: company.id, name: 'Caixa Loja', type: 'CASH', initialBalance: 0, active: true },
  });

  // Centro de custo padrão
  const defaultCostCenters = ['Administração', 'Loja', 'Marketing', 'Aluguel', 'Energia', 'Água', 'Internet', 'Salários', 'Transporte', 'Manutenção'];
  for (const name of defaultCostCenters) {
    await prisma.costCenter.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name, active: true } });
  }

  // Plano de contas padrão
  const chartDefaults = [
    { code: '1', name: 'RECEITAS', type: 'REVENUE' },
    { code: '1.1', name: 'VENDAS', type: 'REVENUE' },
    { code: '1.1.01', name: 'Vendas à vista', type: 'REVENUE' },
    { code: '1.1.02', name: 'Vendas cartão', type: 'REVENUE' },
    { code: '1.1.03', name: 'Vendas PIX', type: 'REVENUE' },
    { code: '2', name: 'DESPESAS', type: 'EXPENSE' },
    { code: '2.1', name: 'OPERACIONAIS', type: 'EXPENSE' },
    { code: '2.1.01', name: 'Aluguel', type: 'EXPENSE' },
    { code: '2.1.02', name: 'Energia', type: 'EXPENSE' },
    { code: '2.1.03', name: 'Internet', type: 'EXPENSE' },
    { code: '2.1.04', name: 'Salários', type: 'EXPENSE' },
  ];
  for (const c of chartDefaults) {
    await prisma.chartOfAccount.upsert({ where: { companyId_code: { companyId: company.id, code: c.code } }, update: { name: c.name }, create: { ...c, companyId: company.id, active: true } });
  }

  console.log('Seed concluído.');
  console.log('Login: admin@festabox.com / admin123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
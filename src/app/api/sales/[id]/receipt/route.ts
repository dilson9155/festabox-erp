import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, jsonError } from '@/lib/session';
import { decimalToNumber } from '@/lib/money';
import { fmt } from '@/lib/date-utils';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError('Não autorizado', 401);

  const sale = await prisma.sale.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { customer: true, user: true, company: true, items: { include: { product: true } }, payments: true },
  });
  if (!sale) return new Response('Venda não encontrada', { status: 404 });

  const items = sale.items.map((it) => `
    <tr>
      <td class="it-name">${it.product.name}</td>
      <td class="it-qty">${Number(it.quantity).toFixed(it.product.unit?.abbreviation === 'UN' ? 0 : 3)}</td>
      <td class="it-price">${formatBRL(Number(it.unitPrice))}</td>
      <td class="it-total">${formatBRL(Number(it.total))}</td>
    </tr>
  `).join('');

  const payments = sale.payments.map((p) => {
    const label = p.method === 'CASH' ? 'Dinheiro' : p.method === 'PIX' ? 'PIX' : p.method === 'DEBIT_CARD' ? 'Cartão Débito' : p.method === 'CREDIT_CARD' ? `Crédito (${p.installments}x)` : p.method === 'CREDIT_STORE' ? `Crediário (${p.installments}x)` : p.method;
    return `<div class="row"><span>${label}</span><span>${formatBRL(Number(p.amount))}</span></div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cupom #${sale.number}</title>
<style>
@page { margin: 4mm; }
* { box-sizing: border-box; }
body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 6mm 2mm; color: #000; }
.center { text-align: center; }
.title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 2px 0; }
.sub { font-size: 11px; }
hr { border: 0; border-top: 1px dashed #000; margin: 4px 0; }
.row { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th { border-bottom: 1px dashed #000; padding: 2px; text-align: left; font-weight: bold; }
td { padding: 2px 0; vertical-align: top; }
.it-name { width: 50%; }
.it-qty { width: 12%; text-align: right; }
.it-price { width: 18%; text-align: right; }
.it-total { width: 20%; text-align: right; font-weight: bold; }
.big { font-size: 16px; font-weight: bold; }
.muted { color: #444; }
.divider { border-top: 1px dashed #000; margin: 4px 0; padding-top: 2px; }
@media print {
  .noprint { display: none; }
}
.noprint { padding: 8px; text-align: center; }
button { padding: 6px 12px; cursor: pointer; }
</style></head><body>
<div class="center title">${escape(sale.company.name)}</div>
${sale.company.document ? `<div class="center sub">CNPJ: ${escape(sale.company.document)}</div>` : ''}
${sale.company.address ? `<div class="center sub">${escape(sale.company.address)}${sale.company.number ? `, ${sale.company.number}` : ''}</div>` : ''}
${sale.company.phone ? `<div class="center sub">Tel: ${escape(sale.company.phone)}</div>` : ''}
<hr/>
<div class="center title">CUPOM NÃO FISCAL</div>
<hr/>
<div class="row"><span>Data:</span><span>${fmt(sale.createdAt)}</span></div>
<div class="row"><span>Venda:</span><span>#${sale.number}</span></div>
<div class="row"><span>Operador:</span><span>${escape(sale.user?.name ?? '')}</span></div>
${sale.customer ? `<div class="row"><span>Cliente:</span><span>${escape(sale.customer.name)}</span></div>` : ''}
<hr/>
<table>
  <thead><tr><th>Item</th><th class="it-qty">Qtd</th><th class="it-price">Vlr</th><th class="it-total">Total</th></tr></thead>
  <tbody>${items}</tbody>
</table>
<hr/>
<div class="row"><span>Subtotal</span><span>${formatBRL(Number(sale.subtotal))}</span></div>
${Number(sale.discount) > 0 ? `<div class="row"><span>Desconto</span><span>- ${formatBRL(Number(sale.discount))}</span></div>` : ''}
${Number(sale.addition) > 0 ? `<div class="row"><span>Acréscimo</span><span>+ ${formatBRL(Number(sale.addition))}</span></div>` : ''}
<div class="divider row big"><span>TOTAL</span><span>${formatBRL(Number(sale.total))}</span></div>
${payments ? `<hr/><div class="muted">Pagamentos:</div>${payments}` : ''}
${Number(sale.change) > 0 ? `<div class="row"><span>Troco</span><span>${formatBRL(Number(sale.change))}</span></div>` : ''}
<hr/>
<div class="center sub muted">Obrigado pela preferência!</div>
<div class="center sub muted">${fmt(new Date(), "dd/MM/yyyy HH:mm:ss")}</div>
<div class="noprint" style="margin-top:12px">
  <button onclick="window.print()">Imprimir</button>
  <button onclick="window.close()">Fechar</button>
</div>
</body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function formatBRL(n: number) {
  return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function escape(s: string) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
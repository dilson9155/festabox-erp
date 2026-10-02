// Gerador ESC/POS genérico para impressoras térmicas (58mm/80mm)
// Saída: Uint8Array de bytes brutos ESC/POS

export const ESC = 0x1b;
export const GS = 0x1d;

function cmd(...bytes: number[]) { return Uint8Array.from(bytes); }

export const Escpos = {
  init: () => cmd(ESC, 0x40),
  alignCenter: () => cmd(ESC, 0x61, 0x01),
  alignLeft: () => cmd(ESC, 0x61, 0x00),
  boldOn: () => cmd(ESC, 0x45, 0x01),
  boldOff: () => cmd(ESC, 0x45, 0x00),
  sizeNormal: () => cmd(GS, 0x21, 0x00),
  sizeDouble: () => cmd(GS, 0x21, 0x11),
  cut: () => cmd(GS, 0x56, 0x42, 0x00),
  feed: (n = 3) => cmd(ESC, 0x64, n),
};

function text(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function padLine(left: string, right: string, width = 42): Uint8Array {
  const l = left ?? '';
  const r = right ?? '';
  const space = Math.max(1, width - l.length - r.length);
  return text((l + ' '.repeat(space) + r).slice(0, width) + '\n');
}

function hr(width = 42, char = '-'): Uint8Array {
  return text(char.repeat(width) + '\n');
}

export function buildReceipt(opts: {
  company: { name: string; document?: string | null; address?: string | null; phone?: string | null };
  number: number;
  date: string;
  operator: string;
  customerName?: string | null;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  discount: number;
  addition: number;
  total: number;
  payments: { method: string; amount: number; installments?: number }[];
  change?: number;
  width?: number;
}): Uint8Array {
  const w = opts.width ?? 42;
  const chunks: Uint8Array[] = [];

  chunks.push(Escpos.init());
  chunks.push(Escpos.alignCenter());
  chunks.push(Escpos.boldOn());
  chunks.push(Escpos.sizeDouble());
  chunks.push(text((opts.company.name || '').slice(0, w) + '\n'));
  chunks.push(Escpos.sizeNormal());
  chunks.push(Escpos.boldOff());
  if (opts.company.document) chunks.push(text(`CNPJ: ${opts.company.document}\n`));
  if (opts.company.address) chunks.push(text(opts.company.address + '\n'));
  if (opts.company.phone) chunks.push(text(`Tel: ${opts.company.phone}\n`));
  chunks.push(hr(w));
  chunks.push(Escpos.boldOn());
  chunks.push(text('CUPOM NÃO FISCAL\n'));
  chunks.push(Escpos.boldOff());
  chunks.push(hr(w, '='));
  chunks.push(Escpos.alignLeft());
  chunks.push(padLine('Data:', opts.date, w));
  chunks.push(padLine('Venda:', `#${opts.number}`, w));
  chunks.push(padLine('Operador:', opts.operator.slice(0, w - 10), w));
  if (opts.customerName) chunks.push(padLine('Cliente:', opts.customerName.slice(0, w - 10), w));
  chunks.push(hr(w, '='));
  chunks.push(text(buildItemHeader(w)));
  chunks.push(hr(w));
  for (const it of opts.items) {
    chunks.push(text(truncate(it.name, w)));
    chunks.push(padLine(`  ${formatQty(it.quantity)} x ${formatMoney(it.unitPrice)}`, formatMoney(it.total), w));
  }
  chunks.push(hr(w, '='));
  chunks.push(padLine('Subtotal:', formatMoney(opts.subtotal), w));
  if (opts.discount) chunks.push(padLine('Desconto:', '-' + formatMoney(opts.discount), w));
  if (opts.addition) chunks.push(padLine('Acréscimo:', '+' + formatMoney(opts.addition), w));
  chunks.push(Escpos.boldOn());
  chunks.push(padLine('TOTAL:', formatMoney(opts.total), w));
  chunks.push(Escpos.boldOff());
  chunks.push(hr(w, '='));
  if (opts.payments.length) {
    for (const p of opts.payments) {
      const label = mapPaymentLabel(p.method);
      const suffix = p.installments && p.installments > 1 ? ` (${p.installments}x)` : '';
      chunks.push(padLine(label + suffix + ':', formatMoney(p.amount), w));
    }
    if ((opts.change ?? 0) > 0) chunks.push(padLine('Troco:', formatMoney(opts.change!), w));
  }
  chunks.push(Escpos.feed(3));
  chunks.push(Escpos.alignCenter());
  chunks.push(text('Obrigado pela preferência!\n'));
  chunks.push(Escpos.feed(2));
  chunks.push(Escpos.cut());
  // concat
  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(totalLen);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function mapPaymentLabel(m: string): string {
  switch (m) {
    case 'CASH': return 'Dinheiro';
    case 'PIX': return 'PIX';
    case 'DEBIT_CARD': return 'Cartao Debito';
    case 'CREDIT_CARD': return 'Cartao Credito';
    case 'CREDIT_STORE': return 'Crediario';
    case 'TRANSFER': return 'Transferencia';
    case 'VOUCHER': return 'Vale';
    default: return m;
  }
}

function buildItemHeader(w: number) {
  const cols = ['Item', 'Qtd', 'Vlr', 'Total'];
  const widths = [Math.floor(w * 0.45), Math.floor(w * 0.15), Math.floor(w * 0.18), Math.floor(w * 0.22)];
  let s = '';
  for (let i = 0; i < cols.length; i++) s += pad(cols[i], widths[i], i === 0 ? 'left' : 'right');
  return s + '\n';
}

function pad(s: string, n: number, dir: 'left' | 'right' = 'left'): string {
  s = String(s).slice(0, n);
  const sp = Math.max(0, n - s.length);
  return dir === 'left' ? s + ' '.repeat(sp) : ' '.repeat(sp) + s;
}

function truncate(s: string, w: number) {
  if (s.length <= w) return s + '\n';
  return s.slice(0, w - 1) + '\n';
}

function formatMoney(n: number) {
  return (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatQty(n: number) {
  return (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}
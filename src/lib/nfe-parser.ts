import { XMLParser } from 'fast-xml-parser';

export type NfeParsed = {
  key: string;
  number: string;
  series: string;
  date: string | null;
  total: number };
export type NfeParsedItem = {
  number: number;
  ean: string | null;
  code: string | null;
  supplierCode: string | null;
  name: string;
  ncm: string | null;
  cfop: string | null;
  unit: string | null;
  quantity: number;
  unitCost: number;
  total: number;
};
export type NfeParsedFull = {
  key: string;
  number: string;
  series: string;
  date: string | null;
  supplier: { cnpj: string; name: string; ie?: string | null };
  total: number;
  items: NfeParsedItem[];
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: true });

export function parseNfeXml(xml: string): NfeParsedFull {
  const obj = parser.parse(xml);
  const nfe = findNfeObject(obj);
  if (!nfe) throw new Error('XML NF-e inválido');
  const inf = nfe.infNFe;
  const ide = inf.ide;
  const emit = inf.emit;
  const total = inf.total?.ICMSTot ?? {};
  const det = Array.isArray(inf.det) ? inf.det : inf.det ? [inf.det] : [];
  const items: NfeParsedItem[] = det.map((d: any, idx: number) => {
    const prod = d.prod;
    return {
      number: idx + 1,
      ean: prod.cEAN && prod.cEAN != 'SEM GTIN' ? String(prod.cEAN) : null,
      code: prod.cProd ? String(prod.cProd) : null,
      supplierCode: prod.cProd ? String(prod.cProd) : null,
      name: String(prod.xProd ?? 'Produto sem nome'),
      ncm: prod.NCM ? String(prod.NCM) : null,
      cfop: prod.CFOP ? String(prod.CFOP) : null,
      unit: prod.uCom ? String(prod.uCom) : null,
      quantity: Number(prod.qCom ?? 0),
      unitCost: Number(prod.vUnCom ?? 0),
      total: Number(prod.vProd ?? 0),
    };
  });
  return {
    key: String(inf['@_Id'] ?? '').replace(/^NFe/, ''),
    number: String(ide.nNF ?? ''),
    series: String(ide.serie ?? '1'),
    date: ide.dEmi ?? ide.dSaiEnt ?? null,
    supplier: {
      cnpj: String(emit.CNPJ ?? emit.CPF ?? ''),
      name: String(emit.xNome ?? ''),
      ie: emit.IE ? String(emit.IE) : null,
    },
    total: Number(total.vNF ?? 0),
    items,
  };
}

function findNfeObject(obj: any): any {
  if (!obj) return null;
  if (obj.nfeProc) return obj.nfeProc.NFe ?? null;
  if (obj.NFe) return obj.NFe;
  if (obj.infNFe) return { infNFe: obj.infNFe };
  // fast-xml-parser pode retornar { de 'Key': '...' }
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val?.infNFe) return val;
  }
  return null;
}
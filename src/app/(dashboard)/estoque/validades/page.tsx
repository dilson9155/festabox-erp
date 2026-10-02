'use client';
import { Card } from '@/components/ui/card';
export default function ValidadesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Validades</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        Alertas de vencimento (7/30 dias) e gestão de validade por lote. Veja a tabela <code>StockLot</code> no banco e habilite o controle por produto.
      </Card>
    </div>
  );
}
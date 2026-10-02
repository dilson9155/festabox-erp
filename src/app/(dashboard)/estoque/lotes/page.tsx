'use client';
import { Card } from '@/components/ui/card';
export default function LotesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lotes</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        Controle de lotes e validades ativo por produto. Habilite em <strong>Produtos → Editar</strong> e cadastre os lotes nas entradas de estoque. Tabela <code>StockLot</code> já integrada no schema.
      </Card>
    </div>
  );
}
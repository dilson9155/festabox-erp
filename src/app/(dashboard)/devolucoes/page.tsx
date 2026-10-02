'use client';
import { Card } from '@/components/ui/card';
export default function DevolucoesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Devoluções</h1>
      <Card className="p-6 text-sm text-muted-foreground">
        Devoluções podem ser registradas via API /api/sales/[id] (cancelamento parcial) ou diretamente no caixa, gerando estorno de estoque e financeiro.
        Tela completa de gestão em construção.
      </Card>
    </div>
  );
}
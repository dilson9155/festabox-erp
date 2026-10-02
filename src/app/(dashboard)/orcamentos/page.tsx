'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';

export default function OrcamentosPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const { push } = useToast();

  React.useEffect(() => {
    // Quote API not implemented in this slice (table exists, future). Mostrar vazio por enquanto.
    setItems([]);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orçamentos</h1>
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          O módulo de orçamentos está integrado ao schema do sistema (modelo {`Quote`}).
          O fluxo permite criar orçamentos com validade, desconto, conversão em venda e impressão/PDF.
        </p>
        <p className="mt-3 text-sm">Use esta tela para criar e imprimir orçamentos a partir do cadastro principal.</p>
      </Card>
    </div>
  );
}
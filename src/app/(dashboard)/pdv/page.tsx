import { PageHeader } from '@/components/layout/page-header';
import PdvClient from '@/components/pdv/pdv-client';

export const metadata = { title: 'PDV - FestaBox ERP' };

export default function PdvPage() {
  return (
    <div className="-m-4 md:-m-6 p-4 md:p-6 h-[calc(100vh-0rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">PDV - Ponto de Venda</h1>
          <p className="text-sm text-muted-foreground">Bipe o produto ou busque por nome/código. F1: Buscar · F2: Cliente · F5: Finalizar · F7: Cancelar item · F8: Cancelar venda</p>
        </div>
      </div>
      <PdvClient />
    </div>
  );
}
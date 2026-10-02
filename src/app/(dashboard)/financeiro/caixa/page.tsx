'use client';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatMoney, decimalToNumber } from '@/lib/money';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Lock } from 'lucide-react';

export default function CaixaPage() {
  const { push } = useToast();
  const [list, setList] = React.useState<any[]>([]);
  const [current, setCurrent] = React.useState<any>(null);
  const [openModal, setOpenModal] = React.useState(false);
  const [openingAmount, setOpeningAmount] = React.useState(0);
  const [moveModal, setMoveModal] = React.useState<'OPEN' | null>(null);
  const [moveType, setMoveType] = React.useState<'SUPPLY' | 'BLEED' | 'EXPENSE'>('SUPPLY');
  const [moveAmount, setMoveAmount] = React.useState(0);
  const [moveReason, setMoveReason] = React.useState('');
  const [closeModal, setCloseModal] = React.useState(false);
  const [informed, setInformed] = React.useState(0);

  const load = React.useCallback(async () => {
    const r = await fetch('/api/cash-register');
    const j = await r.json();
    setList(j.items || []);
    setCurrent(j.current);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const openCash = async () => {
    const r = await fetch('/api/cash-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ openingAmount }) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Caixa aberto', variant: 'success' });
    setOpenModal(false);
    load();
  };

  const movement = async () => {
    const r = await fetch('/api/cash-movements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cashRegisterId: current.id, type: moveType, amount: moveAmount, reason: moveReason }) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Movimentação registrada', variant: 'success' });
    setMoveModal(null); setMoveAmount(0); setMoveReason('');
    load();
  };

  const closeCash = async () => {
    const r = await fetch(`/api/cash-register/${current.id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ informedAmount: informed }) });
    const j = await r.json();
    if (!r.ok) return push({ title: 'Erro', description: j.error, variant: 'destructive' });
    push({ title: 'Caixa fechado', description: `Diferença: ${formatMoney(Number(j.difference ?? 0))}`, variant: 'success' });
    setCloseModal(false);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Caixa</h1>

      <Card className="p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Caixa atual</div>
          {current ? (
            <div className="font-medium">Aberto · valor inicial {formatMoney(Number(current.openingAmount))}</div>
          ) : <div className="font-medium">Nenhum caixa aberto para você.</div>}
        </div>
        <div className="flex gap-2">
          {current ? (
            <>
              <Button onClick={() => { setMoveType('SUPPLY'); setMoveModal('OPEN'); }} variant="outline"><ArrowDownToLine className="h-4 w-4 mr-1" /> Suprimento</Button>
              <Button onClick={() => { setMoveType('BLEED'); setMoveModal('OPEN'); }} variant="outline"><ArrowUpFromLine className="h-4 w-4 mr-1" /> Sangria</Button>
              <Button onClick={() => setCloseModal(true)}><Lock className="h-4 w-4 mr-1" /> Fechar Caixa</Button>
            </>
          ) : (
            <Button onClick={() => setOpenModal(true)}><Wallet className="h-4 w-4 mr-1" /> Abrir Caixa</Button>
          )}
        </div>
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="h-10 px-3 text-left">Operador</th><th className="h-10 px-3 text-left">Aberto em</th><th className="h-10 px-3 text-left">Fechado em</th><th className="h-10 px-3 text-right">Inicial</th><th className="h-10 px-3 text-center">Status</th><th className="h-10 px-3 text-right">Diferença</th></tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.user?.name}</td>
                <td className="p-3">{new Date(c.openedAt).toLocaleString('pt-BR')}</td>
                <td className="p-3">{c.closedAt ? new Date(c.closedAt).toLocaleString('pt-BR') : '—'}</td>
                <td className="p-3 text-right">{formatMoney(Number(c.openingAmount))}</td>
                <td className="p-3 text-center">{c.status}</td>
                <td className="p-3 text-right">{c.difference != null ? formatMoney(Number(c.difference)) : '—'}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum caixa registrado.</td></tr>}
          </tbody>
        </table>
      </Card>

      {openModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-3">Abrir Caixa</h3>
            <Input type="number" step="0.01" value={openingAmount} onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)} placeholder="Valor inicial (R$)" />
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
              <Button onClick={openCash}>Abrir</Button>
            </div>
          </Card>
        </div>
      )}

      {moveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-3">{moveType === 'SUPPLY' ? 'Suprimento' : moveType === 'BLEED' ? 'Sangria' : 'Despesa'}</h3>
            <div className="space-y-2">
              <Input type="number" step="0.01" value={moveAmount} onChange={(e) => setMoveAmount(parseFloat(e.target.value) || 0)} placeholder="Valor" />
              <Input value={moveReason} onChange={(e) => setMoveReason(e.target.value)} placeholder="Motivo" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setMoveModal(null)}>Cancelar</Button>
              <Button onClick={movement}>Registrar</Button>
            </div>
          </Card>
        </div>
      )}

      {closeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-3">Fechar Caixa</h3>
            <p className="text-sm text-muted-foreground mb-2">Informe o valor em dinheiro contado fisicamente:</p>
            <Input type="number" step="0.01" value={informed} onChange={(e) => setInformed(parseFloat(e.target.value) || 0)} placeholder="Valor informado" />
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setCloseModal(false)}>Cancelar</Button>
              <Button onClick={closeCash}>Fechar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
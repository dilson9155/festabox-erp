'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Database, Download, Upload } from 'lucide-react';

export default function BackupPage() {
  const { push } = useToast();
  const exportData = async () => {
    try {
      const res = await fetch('/api/admin/backup/export');
      if (!res.ok) throw new Error('Erro');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `festabox-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { push({ title: 'Erro ao exportar', variant: 'destructive' }); }
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Backup</h1>
      <Card className="p-6 max-w-2xl">
        <div className="flex items-start gap-3 mb-3">
          <Database className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-semibold">Backup de Dados</h2>
            <p className="text-sm text-muted-foreground">
              Faça backup regular dos dados do sistema. O arquivo gerado contém todos os cadastros, vendas e movimentações em formato JSON.
              Para restaurar, contate o administrador do banco PostgreSQL.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <Button onClick={exportData}><Download className="h-4 w-4 mr-1" /> Exportar dados</Button>
          <Button variant="outline" disabled title="Em breve"><Upload className="h-4 w-4 mr-1" /> Importar backup</Button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Para backup completo do banco, use <code className="bg-muted px-1 rounded">pg_dump</code> ou a ferramenta do seu provedor de banco.
        </div>
      </Card>
    </div>
  );
}
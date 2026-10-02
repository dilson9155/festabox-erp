import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'FestaBox ERP',
  description: 'Sistema de Gestão Comercial e PDV - Embalagens, Doces e Artigos para Festas',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
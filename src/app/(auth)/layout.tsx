import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export const metadata = { title: 'Entrar - FestaBox ERP' };

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session) redirect('/dashboard');
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/30 flex items-center justify-center p-4">{children}</div>;
}
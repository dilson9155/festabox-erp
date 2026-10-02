import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as any;
  return {
    id: u.id as string,
    email: u.email as string,
    name: u.name as string,
    role: u.role as any,
    companyId: u.companyId as string,
    permissions: u.permissions as string | null,
  };
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error('UNAUTHORIZED');
  return u;
}

export async function requireCompany() {
  const u = await requireUser();
  const company = await prisma.company.findUnique({ where: { id: u.companyId } });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  return { user: u, company };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(e: unknown) {
  const msg = e instanceof Error ? e.message : 'UNKNOWN';
  if (msg === 'UNAUTHORIZED') return jsonError('Não autorizado', 401);
  if (msg === 'FORBIDDEN') return jsonError('Sem permissão', 403);
  if (msg === 'NOT_FOUND') return jsonError('Não encontrado', 404);
  if (msg === 'COMPANY_NOT_FOUND') return jsonError('Empresa não encontrada', 400);
  console.error('API_ERROR', e);
  return jsonError('Não foi possível concluir a operação. Tente novamente.', 500);
}
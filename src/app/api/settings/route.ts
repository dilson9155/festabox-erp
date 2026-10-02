import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (key) {
      const row = await prisma.systemSetting.findUnique({ where: { companyId_key: { companyId: user.companyId, key } } });
      return Response.json({ value: row?.value ?? null });
    }
    const rows = await prisma.systemSetting.findMany({ where: { companyId: user.companyId } });
    return Response.json({ items: rows });
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const { key, value, type, description } = await req.json();
    const row = await prisma.systemSetting.upsert({
      where: { companyId_key: { companyId: user.companyId, key } },
      create: { companyId: user.companyId, key, value: String(value ?? ''), type, description },
      update: { value: String(value ?? ''), type, description },
    });
    return Response.json(row);
  } catch (e) { return handleApiError(e); }
}
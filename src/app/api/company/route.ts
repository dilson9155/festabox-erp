import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) return jsonError('Empresa não encontrada', 404);
    return Response.json(company);
  } catch (e) { return handleApiError(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.SETTINGS_MANAGE)) return jsonError('Sem permissão', 403);
    const data = await req.json();
    const updated = await prisma.company.update({ where: { id: user.companyId }, data });
    return Response.json(updated);
  } catch (e) { return handleApiError(e); }
}
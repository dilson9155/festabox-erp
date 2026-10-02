import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const items = await prisma.printer.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PRINTER_MANAGE)) return jsonError('Sem permissão', 403);
    const data = await req.json();
    const created = await prisma.printer.create({ data: { ...data, companyId: user.companyId } });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PRINTER_MANAGE)) return jsonError('Sem permissão', 403);
    const { id } = await req.json();
    await prisma.printer.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true });
  } catch (e) { return handleApiError(e); }
}
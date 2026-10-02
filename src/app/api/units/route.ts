import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    const items = await prisma.unit.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { abbreviation: 'asc' } });
    return Response.json({ items });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({ name: z.string().min(1), abbreviation: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PRODUCT_MANAGE)) return jsonError('Sem permissão', 403);
    const body = schema.parse(await req.json());
    const created = await prisma.unit.create({ data: { ...body, companyId: user.companyId } });
    return Response.json(created);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.PRODUCT_MANAGE)) return jsonError('Sem permissão', 403);
    const { id } = await req.json();
    await prisma.unit.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true });
  } catch (e) { return handleApiError(e); }
}
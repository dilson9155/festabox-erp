import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError, jsonError } from '@/lib/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.USER_VIEW)) return jsonError('Sem permissão', 403);
    const items = await prisma.user.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } });
    return Response.json({ items: items.map((u) => ({ ...u, password: undefined })) });
  } catch (e) { return handleApiError(e); }
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'SELLER', 'STOCKIST', 'FINANCIAL']),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Não autorizado', 401);
    if (!hasPermission(user.role, user.permissions, PERMISSIONS.USER_MANAGE)) return jsonError('Sem permissão', 403);
    const data = schema.parse(await req.json());
    const hash = await bcrypt.hash(data.password, 10);
    const created = await prisma.user.create({ data: { ...data, password: hash, email: data.email.toLowerCase(), companyId: user.companyId } });
    return Response.json({ ...created, password: undefined });
  } catch (e) { return handleApiError(e); }
}
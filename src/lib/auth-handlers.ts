export const handlers = (await import('@/lib/auth')).handlers;
export const { GET, POST } = handlers;
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      companyId: string;
      role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'SELLER' | 'STOCKIST' | 'FINANCIAL';
      permissions: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    companyId: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'SELLER' | 'STOCKIST' | 'FINANCIAL';
    permissions: string | null;
  }
}
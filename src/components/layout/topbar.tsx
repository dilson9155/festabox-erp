'use client';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Search, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { data } = useSession();
  return (
    <header className="h-16 border-b bg-background flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produtos, clientes, vendas..." className="pl-9" />
        </div>
      </div>
      <div className="flex-1 md:hidden" />
      <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {data?.user?.name?.[0] ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium leading-tight">{data?.user?.name ?? 'Usuário'}</div>
              <div className="text-[10px] text-muted-foreground">{(data?.user as any)?.role ?? ''}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{data?.user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
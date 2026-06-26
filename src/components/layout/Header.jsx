import { LogOut, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';

export function Header() {
  const { user, company, signOut } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200/70 bg-white/50 px-5 backdrop-blur-xl">
      <div className="hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-400 md:flex">
        <Search size={17} strokeWidth={1.8} />
        Buscar contratos, obras ou fornecedores
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">{user?.name || 'Usuário'}</p>
          <p className="text-xs text-zinc-500">{company?.name || 'Empresa'}</p>
        </div>

        <Button variant="ghost" onClick={signOut}>
          <LogOut size={17} strokeWidth={1.8} />
        </Button>
      </div>
    </header>
  );
}

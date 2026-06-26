import { NavLink } from 'react-router-dom';
import { Building2, FileText, LayoutDashboard, PenLine, Settings, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';
import { CompanySwitcher } from './CompanySwitcher';

const menu = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Contratos', path: '/contracts', icon: FileText },
  { label: 'Assinaturas', path: '/signatures', icon: PenLine },
  { label: 'Obras', path: '/obras', icon: Building2 },
  { label: 'Ordens de compra', path: '/purchase-orders', icon: ShoppingCart },
  { label: 'Configurações', path: '/settings', icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 overflow-hidden border-r border-zinc-200/70 bg-white/60 px-4 py-5 backdrop-blur-xl lg:block">
      <div className="mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-sm font-semibold text-white">
            C
          </div>

          <div>
            <strong className="block text-sm font-semibold text-zinc-950">Contratos</strong>
            <span className="text-xs text-zinc-500">Gestão orçamentária</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <CompanySwitcher />
      </div>

      <nav className="space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-medium transition',
                  isActive
                    ? 'bg-zinc-950 !text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                )
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Contracts() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Contratos</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">Contratos da empresa</h1>
          <p className="mt-1 text-sm text-zinc-500">Liste, filtre e acompanhe contratos criados pela empresa.</p>
        </div>

        <Link
          to="/contracts/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
        >
          <Plus size={17} strokeWidth={1.8} />
          Novo contrato
        </Link>
      </div>

      <Card>
        <div className="py-10 text-center">
          <h2 className="text-base font-semibold text-zinc-950">Nenhum contrato cadastrado ainda</h2>
          <p className="mt-1 text-sm text-zinc-500">No próximo passo vamos buscar contratos reais da API.</p>
        </div>
      </Card>
    </div>
  );
}

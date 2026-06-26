import { Building2, FileText, PenLine, WalletCards } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const cards = [
  { title: 'Contratos ativos', value: '0', description: 'Contratos em vigência', icon: FileText },
  { title: 'Assinaturas pendentes', value: '0', description: 'Aguardando assinatura', icon: PenLine },
  { title: 'Obras em andamento', value: '0', description: 'Projetos ativos', icon: Building2 },
  { title: 'Orçamento realizado', value: 'R$ 0,00', description: 'Custos lançados', icon: WalletCards }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Dashboard</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">Visão geral da operação</h1>
          <p className="mt-1 text-sm text-zinc-500">Acompanhe contratos, assinaturas, obras e orçamento em tempo real.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <p className="text-sm text-zinc-500">{card.title}</p>
              <strong className="mt-1 block text-2xl font-semibold tracking-tight text-zinc-950">{card.value}</strong>
              <p className="mt-1 text-xs text-zinc-400">{card.description}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">Próximas entregas</h2>
            <p className="text-sm text-zinc-500">Os contratos e obras recentes vão aparecer aqui.</p>
          </div>
          <Badge>Sem dados ainda</Badge>
        </div>
      </Card>
    </div>
  );
}

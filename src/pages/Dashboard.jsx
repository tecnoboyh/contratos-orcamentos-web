import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  FileText,
  Loader2,
  PenLine,
  RefreshCcw,
  ShoppingCart,
  WalletCards
} from 'lucide-react';

import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function getBudgetBarWidth(value) {
  const percent = Number(value || 0);

  if (percent < 0) return 0;
  if (percent > 100) return 100;

  return percent;
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/dashboard');

      setDashboard(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar os indicadores do dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const contracts = dashboard?.contracts || {};
  const obras = dashboard?.obras || {};
  const purchaseOrders = dashboard?.purchaseOrders || {};
  const costs = dashboard?.costs || {};
  const alerts = dashboard?.alerts || {};

  const cards = [
    {
      title: 'Contratos ativos',
      value: formatNumber(contracts.active),
      description: `${formatNumber(contracts.total)} contratos cadastrados`,
      icon: FileText
    },
    {
      title: 'Assinaturas pendentes',
      value: formatNumber(contracts.waitingSignature),
      description: 'Contratos aguardando assinatura',
      icon: PenLine
    },
    {
      title: 'Obras em andamento',
      value: formatNumber(obras.inProgress),
      description: `${formatNumber(obras.total)} obras cadastradas`,
      icon: Building2
    },
    {
      title: 'Orçamento realizado',
      value: formatCurrency(obras.realizedBudget),
      description: `${formatNumber(obras.budgetUsagePercent)}% do previsto`,
      icon: WalletCards
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Dashboard</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Visão geral da operação
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Acompanhe contratos, assinaturas, obras, orçamento e ordens de compra.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={loadDashboard} disabled={loading}>
          {loading ? (
            <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <RefreshCcw size={14} strokeWidth={1.8} />
          )}
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && !dashboard ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
            <Loader2 size={18} strokeWidth={1.8} className="animate-spin" />
            Carregando indicadores...
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.title}>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>

                  <p className="text-sm text-zinc-500">
                    {card.title}
                  </p>

                  <strong className="mt-1 block text-2xl font-semibold tracking-tight text-zinc-950">
                    {card.value}
                  </strong>

                  <p className="mt-1 text-xs text-zinc-400">
                    {card.description}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">
                    Contratos
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Resumo por situação dos contratos da empresa.
                  </p>
                </div>

                <Badge>{formatCurrency(contracts.totalValue)}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">Rascunhos</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{formatNumber(contracts.draft)}</p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">Aguardando assinatura</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{formatNumber(contracts.waitingSignature)}</p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">Assinados / arquivados</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{formatNumber(contracts.signed)}</p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">Vencendo</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{formatNumber(contracts.expiring)}</p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">Expirados</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{formatNumber(contracts.expired)}</p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">Encerrados</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">{formatNumber(contracts.closed)}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">
                    Orçamento das obras
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Previsto vs. realizado com base nos custos lançados.
                  </p>
                </div>

                <Badge variant={alerts.budgetOverLimit ? 'danger' : 'default'}>
                  {formatNumber(obras.budgetUsagePercent)}%
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                    <p className="text-xs text-zinc-400">Previsto</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-950">{formatCurrency(obras.expectedBudget)}</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                    <p className="text-xs text-zinc-400">Realizado</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-950">{formatCurrency(obras.realizedBudget)}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>Uso do orçamento</span>
                    <span>{formatNumber(obras.budgetUsagePercent)}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-950"
                      style={{ width: `${getBudgetBarWidth(obras.budgetUsagePercent)}%` }}
                    />
                  </div>
                </div>

                {alerts.budgetOverLimit && (
                  <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                    <AlertTriangle size={17} strokeWidth={1.8} className="mt-0.5 shrink-0" />
                    O orçamento realizado ultrapassou o valor previsto.
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <ClipboardList size={18} strokeWidth={1.8} />
              </div>

              <h2 className="text-base font-semibold text-zinc-950">
                Obras
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Planejamento</span>
                  <strong className="text-zinc-950">{formatNumber(obras.planning)}</strong>
                </div>

                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Em andamento</span>
                  <strong className="text-zinc-950">{formatNumber(obras.inProgress)}</strong>
                </div>

                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Finalizadas</span>
                  <strong className="text-zinc-950">{formatNumber(obras.finished)}</strong>
                </div>

                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Canceladas</span>
                  <strong className="text-zinc-950">{formatNumber(obras.canceled)}</strong>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <ShoppingCart size={18} strokeWidth={1.8} />
              </div>

              <h2 className="text-base font-semibold text-zinc-950">
                Ordens de compra
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Total de O.C.</span>
                  <strong className="text-zinc-950">{formatNumber(purchaseOrders.total)}</strong>
                </div>

                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Valor total</span>
                  <strong className="text-zinc-950">{formatCurrency(purchaseOrders.totalValue)}</strong>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <AlertTriangle size={18} strokeWidth={1.8} />
              </div>

              <h2 className="text-base font-semibold text-zinc-950">
                Alertas
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Contratos vencendo</span>
                  <strong className="text-zinc-950">{formatNumber(alerts.contractsExpiring)}</strong>
                </div>

                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Aguardando assinatura</span>
                  <strong className="text-zinc-950">{formatNumber(alerts.contractsWaitingSignature)}</strong>
                </div>

                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>Obras em andamento</span>
                  <strong className="text-zinc-950">{formatNumber(alerts.obrasInProgress)}</strong>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

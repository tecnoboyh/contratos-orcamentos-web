import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ExternalLink,
  FileBarChart,
  Loader2,
  ReceiptText,
  Search
} from 'lucide-react';

import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';

const obraStatusLabels = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizada',
  CANCELED: 'Cancelada'
};

const obraStatusVariants = {
  PLANNING: 'default',
  IN_PROGRESS: 'warning',
  FINISHED: 'success',
  CANCELED: 'danger'
};

const budgetVariants = {
  ON_TRACK: 'success',
  NEAR_LIMIT: 'warning',
  OVER_BUDGET: 'danger',
  WITHOUT_BUDGET: 'default'
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totals = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc.obras += 1;
        acc.expectedBudget += Number(report.expectedBudget || 0);
        acc.realizedBudget += Number(report.realizedBudget || 0);
        acc.purchaseOrders += Number(report.totals?.purchaseOrders || 0);
        acc.purchaseOrdersValue += Number(report.totals?.purchaseOrdersValue || 0);

        if (report.budget?.status === 'OVER_BUDGET') {
          acc.overBudget += 1;
        }

        return acc;
      },
      {
        obras: 0,
        expectedBudget: 0,
        realizedBudget: 0,
        purchaseOrders: 0,
        purchaseOrdersValue: 0,
        overBudget: 0
      }
    );
  }, [reports]);

  async function loadReports() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);

      const query = params.toString();
      const response = await api.get(query ? `/reports/obras?${query}` : '/reports/obras');

      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar os relatórios.');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((state) => ({
      ...state,
      [name]: value
    }));
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Relatórios</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Relatórios de obras
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Liste as obras e abra um relatório completo em uma página separada, pronto para impressão.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={loadReports} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={15} strokeWidth={1.8} /> : null}
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <Building2 size={17} strokeWidth={1.8} />
          </div>
          <p className="text-xs text-zinc-500">Obras analisadas</p>
          <strong className="mt-1 block text-xl font-semibold text-zinc-950">{totals.obras}</strong>
        </Card>

        <Card>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <BarChart3 size={17} strokeWidth={1.8} />
          </div>
          <p className="text-xs text-zinc-500">Orçamento previsto</p>
          <strong className="mt-1 block text-xl font-semibold text-zinc-950">{formatCurrency(totals.expectedBudget)}</strong>
        </Card>

        <Card>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <ReceiptText size={17} strokeWidth={1.8} />
          </div>
          <p className="text-xs text-zinc-500">Orçamento realizado</p>
          <strong className="mt-1 block text-xl font-semibold text-zinc-950">{formatCurrency(totals.realizedBudget)}</strong>
        </Card>

        <Card>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <AlertTriangle size={17} strokeWidth={1.8} />
          </div>
          <p className="text-xs text-zinc-500">Obras acima do orçamento</p>
          <strong className="mt-1 block text-xl font-semibold text-zinc-950">{totals.overBudget}</strong>
        </Card>
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search
              size={17}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar por obra, local ou descrição"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-3 focus:ring-zinc-100"
            />
          </div>

          <Select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Todos os status</option>
            <option value="PLANNING">Planejamento</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="FINISHED">Finalizada</option>
            <option value="CANCELED">Cancelada</option>
          </Select>

          <Button type="button" variant="secondary" onClick={loadReports} disabled={loading}>
            Filtrar
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-950">Listagem de relatórios</h2>
          <p className="text-sm text-zinc-500">Abra o relatório em página separada para visualizar ou imprimir.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={17} strokeWidth={1.8} />
            Carregando relatórios...
          </div>
        ) : reports.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileBarChart className="mx-auto mb-3 text-zinc-300" size={34} strokeWidth={1.6} />
            <h3 className="text-sm font-semibold text-zinc-950">Nenhum relatório encontrado</h3>
            <p className="mt-1 text-sm text-zinc-500">Crie uma obra para gerar relatórios operacionais.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {reports.map((report) => (
              <div key={report.id} className="px-5 py-4 transition hover:bg-zinc-50">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-950">{report.name}</h3>
                      <Badge variant={obraStatusVariants[report.status] || 'default'}>
                        {obraStatusLabels[report.status] || report.status}
                      </Badge>
                      <Badge variant={budgetVariants[report.budget?.status] || 'default'}>
                        {report.budget?.label || 'Sem análise'}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-zinc-500">{report.location || 'Sem local informado'}</p>

                    {report.contract && (
                      <p className="mt-1 text-xs text-zinc-400">
                        Contrato: {report.contract.title} · {report.contract.relatedParty}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2 text-left sm:grid-cols-3 lg:min-w-[330px]">
                    <div>
                      <p className="text-xs text-zinc-400">Progresso</p>
                      <p className="text-sm font-medium text-zinc-950">{report.progress || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Previsto</p>
                      <p className="text-sm font-medium text-zinc-950">{formatCurrency(report.expectedBudget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Realizado</p>
                      <p className="text-sm font-medium text-zinc-950">{formatCurrency(report.realizedBudget)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-950"
                    style={{ width: `${Math.min(report.progress || 0, 100)}%` }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-zinc-500">
                    {report.totals?.completedSteps || 0}/{report.totals?.steps || 0} etapas ·{' '}
                    {report.totals?.costs || 0} custos · {report.totals?.vistorias || 0} vistorias ·{' '}
                    {report.totals?.purchaseOrders || 0} O.C.
                  </p>

                  <Button
                    type="button"
                    onClick={() => navigate(`/reports/obras/${report.id}/view`)}
                    className="!text-white"
                  >
                    <ExternalLink size={15} strokeWidth={1.8} />
                    Abrir relatório
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

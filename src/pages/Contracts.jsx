import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, Loader2, Plus, Search, Send, Trash2 } from 'lucide-react';

import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const statusLabels = {
  DRAFT: 'Rascunho',
  WAITING_SIGNATURE: 'Aguardando assinatura',
  SIGNED: 'Arquivado',
  ACTIVE: 'Ativo',
  EXPIRING: 'Vencendo',
  EXPIRED: 'Encerrado',
  CANCELED: 'Cancelado'
};

const typeLabels = {
  SERVICE: 'Serviço',
  WORK: 'Obra',
  RENT: 'Locação',
  EMPLOYMENT: 'Trabalho',
  OTHER: 'Outro'
};

function statusVariant(status) {
  if (status === 'SIGNED' || status === 'ACTIVE') return 'success';
  if (status === 'WAITING_SIGNATURE' || status === 'EXPIRING') return 'warning';
  if (status === 'EXPIRED' || status === 'CANCELED') return 'danger';
  return 'default';
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—';

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);

    return params.toString();
  }, [filters]);

  async function loadContracts() {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/contracts${queryParams ? `?${queryParams}` : ''}`);
      setContracts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar os contratos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContracts();
  }, [queryParams]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((state) => ({ ...state, [name]: value }));
  }

  async function handleDelete(contractId) {
    const confirmed = window.confirm('Deseja remover este contrato?');

    if (!confirmed) return;

    try {
      await api.delete(`/contracts/${contractId}`);
      setContracts((state) => state.filter((contract) => contract.id !== contractId));
    } catch (err) {
      alert(err.response?.data?.message || 'Não foi possível remover o contrato.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Contratos</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Contratos da empresa
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Liste, filtre e acompanhe contratos criados pela empresa selecionada.
          </p>
        </div>

        <Link
          to="/contracts/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium !text-white shadow-sm transition hover:bg-zinc-800"
        >
          <Plus size={17} strokeWidth={1.8} />
          Novo contrato
        </Link>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17} strokeWidth={1.8} />
            <Input
              name="search"
              placeholder="Buscar por título, parte ou documento"
              value={filters.search}
              onChange={handleFilterChange}
              className="pl-9"
            />
          </div>

          <Select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>

          <Select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="">Todos os tipos</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={17} strokeWidth={1.8} />
            Carregando contratos...
          </div>
        </Card>
      ) : contracts.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
              <FileText size={20} strokeWidth={1.8} />
            </div>

            <h2 className="text-base font-semibold text-zinc-950">
              Nenhum contrato encontrado
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Crie o primeiro contrato para iniciar o fluxo de assinatura.
            </p>

            <Link
              to="/contracts/new"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium !text-white shadow-sm transition hover:bg-zinc-800"
            >
              <Plus size={17} strokeWidth={1.8} />
              Criar contrato
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => {
            const currentStatus = contract.currentStatus || contract.status;

            return (
              <Card key={contract.id} className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(currentStatus)}>{statusLabels[currentStatus] || currentStatus}</Badge>
                      <Badge>{typeLabels[contract.type] || contract.type}</Badge>
                    </div>

                    <h2 className="truncate text-base font-semibold text-zinc-950">
                      {contract.title}
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Parte relacionada: <span className="font-medium text-zinc-700">{contract.relatedParty}</span>
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-3 lg:w-[520px]">
                    <div>
                      <p className="text-xs text-zinc-400">Valor</p>
                      <p className="font-medium text-zinc-800">{formatMoney(contract.totalValue || contract.monthlyValue)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-400">Início</p>
                      <p className="font-medium text-zinc-800">{formatDate(contract.startDate)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-400">Encerramento</p>
                      <p className="font-medium text-zinc-800">{formatDate(contract.endDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {statusLabels === 'WAITING_SIGNATURE' && (
                      <Link
                        to={`/signatures?contractId=${contract.id}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 text-sm font-medium !text-white shadow-sm transition hover:bg-zinc-800"
                      >
                        <Send size={16} strokeWidth={1.8} />
                        Enviar para assinatura
                      </Link>
                    )}

                    <Link
                      to={`/obras?contractId=${contract.id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      <CalendarDays size={16} strokeWidth={1.8} />
                      Obra
                    </Link>

                    <Button variant="ghost" onClick={() => handleDelete(contract.id)}>
                      <Trash2 size={16} strokeWidth={1.8} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

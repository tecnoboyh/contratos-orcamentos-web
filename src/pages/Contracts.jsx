import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  CalendarDays,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  X
} from 'lucide-react';

import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';

const statusLabels = {
  DRAFT: 'Rascunho',
  WAITING_SIGNATURE: 'Aguardando assinatura',
  SIGNED: 'Assinado',
  ACTIVE: 'Ativo',
  EXPIRING: 'Vencendo',
  CLOSED: 'Encerrado',
  EXPIRED: 'Expirado',
  CANCELED: 'Cancelado'
};

const typeLabels = {
  SERVICE: 'Serviço',
  WORK: 'Obra',
  RENT: 'Locação',
  EMPLOYMENT: 'Trabalho',
  OTHER: 'Outro'
};

function getContractStatus(contract) {
  if (contract.archivedAt || contract.status === 'SIGNED') {
    return 'SIGNED';
  }

  return contract.currentStatus || contract.status;
}

function canSendToSignature(contract) {
  const status = getContractStatus(contract);
  const hasSignatureRequests =
    Array.isArray(contract.signatureRequests) &&
    contract.signatureRequests.length > 0;

  return (
    !hasSignatureRequests &&
    status !== 'WAITING_SIGNATURE' &&
    status !== 'SIGNED' &&
    status !== 'EXPIRED' &&
    status !== 'CANCELED' &&
    status !== 'CLOSED'
  );
}

function canRenewContract(contract) {
  const status = getContractStatus(contract);
  return ['ACTIVE', 'EXPIRING', 'EXPIRED', 'SIGNED', 'CLOSED'].includes(status);
}

function canCloseContract(contract) {
  const status = getContractStatus(contract);
  return !['CLOSED', 'CANCELED'].includes(status);
}

function canCreateAddendum(contract) {
  const status = getContractStatus(contract);
  return status !== 'CANCELED';
}

function statusVariant(status) {
  if (status === 'SIGNED' || status === 'ACTIVE') return 'success';
  if (status === 'WAITING_SIGNATURE' || status === 'EXPIRING') return 'warning';
  if (status === 'EXPIRED' || status === 'CANCELED' || status === 'CLOSED') return 'danger';
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

function getRemainingValidity(contract) {
  const status = getContractStatus(contract);

  if (status === 'SIGNED') return 'Arquivado';
  if (status === 'CLOSED') return 'Encerrado';
  if (status === 'CANCELED') return 'Cancelado';

  if (!contract.endDate) return 'Sem encerramento';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(contract.endDate);
  endDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Vencido';
  if (diffDays === 0) return 'Vence hoje';

  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;

  if (months <= 0) return `${diffDays} dia${diffDays === 1 ? '' : 's'}`;
  if (days === 0) return `${months} mês${months === 1 ? '' : 'es'}`;

  return `${months} mês${months === 1 ? '' : 'es'} e ${days} dia${days === 1 ? '' : 's'}`;
}

function dateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function Modal({ title, description, open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-zinc-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedContract, setSelectedContract] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [addendumModalOpen, setAddendumModalOpen] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  const [renewForm, setRenewForm] = useState({
    startDate: '',
    endDate: '',
    totalValue: '',
    monthlyValue: '',
    note: ''
  });

  const [closeForm, setCloseForm] = useState({
    reason: '',
    closedAt: ''
  });

  const [addendumForm, setAddendumForm] = useState({
    title: '',
    description: '',
    totalValue: '',
    monthlyValue: '',
    startDate: '',
    endDate: ''
  });

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

  function handleRenewFormChange(event) {
    const { name, value } = event.target;
    setRenewForm((state) => ({ ...state, [name]: value }));
  }

  function handleCloseFormChange(event) {
    const { name, value } = event.target;
    setCloseForm((state) => ({ ...state, [name]: value }));
  }

  function handleAddendumFormChange(event) {
    const { name, value } = event.target;
    setAddendumForm((state) => ({ ...state, [name]: value }));
  }

  async function handleDelete(contractId) {
    const confirmed = window.confirm('Deseja remover este contrato?');

    if (!confirmed) return;

    try {
      await api.delete(`/contracts/${contractId}`);
      setContracts((state) => state.filter((contract) => contract.id !== contractId));
      setSuccess('Contrato removido com sucesso.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível remover o contrato.');
    }
  }

  function handleViewContract(contract) {
    setSelectedContract(contract);
    setViewModalOpen(true);
  }

  function openRenewModal(contract) {
    setSelectedContract(contract);
    setRenewForm({
      startDate: dateInputValue(contract.startDate),
      endDate: '',
      totalValue: contract.totalValue || '',
      monthlyValue: contract.monthlyValue || '',
      note: ''
    });
    setRenewModalOpen(true);
  }

  function openCloseModal(contract) {
    setSelectedContract(contract);
    setCloseForm({
      reason: '',
      closedAt: new Date().toISOString().slice(0, 10)
    });
    setCloseModalOpen(true);
  }

  function openAddendumModal(contract) {
    setSelectedContract(contract);
    setAddendumForm({
      title: `Aditivo - ${contract.title}`,
      description: '',
      totalValue: contract.totalValue || '',
      monthlyValue: contract.monthlyValue || '',
      startDate: dateInputValue(contract.startDate),
      endDate: dateInputValue(contract.endDate)
    });
    setAddendumModalOpen(true);
  }

  async function handleRenewContract(event) {
    event.preventDefault();

    if (!selectedContract) return;

    if (!renewForm.endDate) {
      setError('Informe a nova data de encerramento.');
      return;
    }

    try {
      setSavingAction(true);
      setError('');
      setSuccess('');

      await api.post(`/contracts/${selectedContract.id}/renew`, {
        startDate: renewForm.startDate || null,
        endDate: renewForm.endDate,
        totalValue: renewForm.totalValue !== '' ? Number(renewForm.totalValue) : undefined,
        monthlyValue: renewForm.monthlyValue !== '' ? Number(renewForm.monthlyValue) : undefined,
        note: renewForm.note || null
      });

      setSuccess('Contrato renovado com sucesso.');
      setRenewModalOpen(false);
      setSelectedContract(null);
      await loadContracts();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível renovar o contrato.');
    } finally {
      setSavingAction(false);
    }
  }

  async function handleCloseContract(event) {
    event.preventDefault();

    if (!selectedContract) return;

    try {
      setSavingAction(true);
      setError('');
      setSuccess('');

      await api.post(`/contracts/${selectedContract.id}/close`, {
        reason: closeForm.reason || null,
        closedAt: closeForm.closedAt || null
      });

      setSuccess('Contrato encerrado com sucesso.');
      setCloseModalOpen(false);
      setSelectedContract(null);
      await loadContracts();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível encerrar o contrato.');
    } finally {
      setSavingAction(false);
    }
  }

  async function handleCreateAddendum(event) {
    event.preventDefault();

    if (!selectedContract) return;

    try {
      setSavingAction(true);
      setError('');
      setSuccess('');

      await api.post(`/contracts/${selectedContract.id}/addendum`, {
        title: addendumForm.title || null,
        description: addendumForm.description || null,
        totalValue: addendumForm.totalValue !== '' ? Number(addendumForm.totalValue) : undefined,
        monthlyValue: addendumForm.monthlyValue !== '' ? Number(addendumForm.monthlyValue) : undefined,
        startDate: addendumForm.startDate || null,
        endDate: addendumForm.endDate || null
      });

      setSuccess('Aditivo gerado com sucesso.');
      setAddendumModalOpen(false);
      setSelectedContract(null);
      await loadContracts();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível gerar o aditivo.');
    } finally {
      setSavingAction(false);
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
            Tela de gestão com vigência, partes, valores e ações rápidas dos contratos.
          </p>
        </div>

        <Link
          to="/contracts/new"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-medium !text-white shadow-sm transition hover:bg-zinc-800"
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

      {(error || success) && (
        <div
          className={
            success
              ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
              : 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600'
          }
        >
          {success || error}
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
              className="mt-5 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-medium !text-white shadow-sm transition hover:bg-zinc-800"
            >
              <Plus size={17} strokeWidth={1.8} />
              Criar contrato
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => {
            const currentStatus = getContractStatus(contract);

            return (
              <Card key={contract.id} className="p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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

                  <div className="grid gap-2 text-sm sm:grid-cols-2 xl:w-[760px] 2xl:grid-cols-3">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Parte relacionada</p>
                      <p className="mt-0.5 truncate font-medium text-zinc-800">{contract.relatedParty || '—'}</p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Tipo de contrato</p>
                      <p className="mt-0.5 font-medium text-zinc-800">{typeLabels[contract.type] || contract.type || '—'}</p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Valor do contrato</p>
                      <p className="mt-0.5 font-medium text-zinc-800">{formatMoney(contract.totalValue || contract.monthlyValue)}</p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Data de início</p>
                      <p className="mt-0.5 font-medium text-zinc-800">{formatDate(contract.startDate)}</p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Data de encerramento</p>
                      <p className="mt-0.5 font-medium text-zinc-800">{formatDate(contract.endDate)}</p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Vigência restante</p>
                      <p className="mt-0.5 font-medium text-zinc-800">{getRemainingValidity(contract)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewContract(contract)}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      <Eye size={16} strokeWidth={1.8} />
                      Visualizar
                    </button>

                    {canRenewContract(contract) && (
                      <button
                        type="button"
                        onClick={() => openRenewModal(contract)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
                      >
                        <RefreshCcw size={16} strokeWidth={1.8} />
                        Renovar
                      </button>
                    )}

                    {canCloseContract(contract) && (
                      <button
                        type="button"
                        onClick={() => openCloseModal(contract)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                      >
                        <Ban size={16} strokeWidth={1.8} />
                        Encerrar
                      </button>
                    )}

                    {canCreateAddendum(contract) && (
                      <button
                        type="button"
                        onClick={() => openAddendumModal(contract)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-2.5 text-xs font-medium !text-white shadow-sm transition hover:bg-zinc-800"
                      >
                        <FilePlus2 size={16} strokeWidth={1.8} />
                        Gerar aditivo
                      </button>
                    )}

                    {canSendToSignature(contract) && (
                      <Link
                        to={`/signatures?contractId=${contract.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-2.5 text-xs font-medium !text-white shadow-sm transition hover:bg-zinc-800"
                      >
                        <Send size={16} strokeWidth={1.8} />
                        Enviar para assinatura
                      </Link>
                    )}

                    <Link
                      to={`/obras?contractId=${contract.id}`}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
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

      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Visualizar contrato"
        description="Confira os dados principais e o conteúdo do contrato."
      >
        {selectedContract && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs text-zinc-400">Título</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{selectedContract.title}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs text-zinc-400">Parte relacionada</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{selectedContract.relatedParty || '—'}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs text-zinc-400">Tipo de contrato</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{typeLabels[selectedContract.type] || selectedContract.type || '—'}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs text-zinc-400">Valor do contrato</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{formatMoney(selectedContract.totalValue || selectedContract.monthlyValue)}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs text-zinc-400">Data de início</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{formatDate(selectedContract.startDate)}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs text-zinc-400">Data de encerramento</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{formatDate(selectedContract.endDate)}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs text-zinc-400">Vigência restante</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{getRemainingValidity(selectedContract)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
              <p className="mb-2 text-sm font-semibold text-zinc-950">Conteúdo</p>
              <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                {selectedContract.content || 'Contrato sem conteúdo preenchido.'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renovar contrato"
        description="Informe a nova vigência e ajuste valores se necessário."
      >
        <form onSubmit={handleRenewContract} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Data de início"
              name="startDate"
              type="date"
              value={renewForm.startDate}
              onChange={handleRenewFormChange}
            />

            <Input
              label="Nova data de encerramento"
              name="endDate"
              type="date"
              value={renewForm.endDate}
              onChange={handleRenewFormChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Valor total"
              name="totalValue"
              type="number"
              min="0"
              step="0.01"
              value={renewForm.totalValue}
              onChange={handleRenewFormChange}
            />

            <Input
              label="Valor mensal"
              name="monthlyValue"
              type="number"
              min="0"
              step="0.01"
              value={renewForm.monthlyValue}
              onChange={handleRenewFormChange}
            />
          </div>

          <Textarea
            label="Observação da renovação"
            name="note"
            value={renewForm.note}
            onChange={handleRenewFormChange}
            placeholder="Ex.: contrato renovado por mais 12 meses."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRenewModalOpen(false)}>
              Cancelar
            </Button>

            <Button type="submit" disabled={savingAction} className="!text-white">
              {savingAction ? 'Salvando...' : 'Renovar contrato'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="Encerrar contrato"
        description="Registre o motivo e a data de encerramento."
      >
        <form onSubmit={handleCloseContract} className="space-y-4">
          <Input
            label="Data de encerramento"
            name="closedAt"
            type="date"
            value={closeForm.closedAt}
            onChange={handleCloseFormChange}
          />

          <Textarea
            label="Motivo do encerramento"
            name="reason"
            value={closeForm.reason}
            onChange={handleCloseFormChange}
            placeholder="Ex.: serviço concluído, contrato encerrado por acordo entre as partes..."
          />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Esta ação muda o status do contrato para encerrado.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCloseModalOpen(false)}>
              Cancelar
            </Button>

            <Button type="submit" disabled={savingAction} className="!bg-red-600 !text-white hover:!bg-red-700">
              {savingAction ? 'Encerrando...' : 'Encerrar contrato'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={addendumModalOpen}
        onClose={() => setAddendumModalOpen(false)}
        title="Gerar aditivo"
        description="Crie um novo contrato em rascunho baseado no contrato selecionado."
      >
        <form onSubmit={handleCreateAddendum} className="space-y-4">
          <Input
            label="Título do aditivo"
            name="title"
            value={addendumForm.title}
            onChange={handleAddendumFormChange}
          />

          <Textarea
            label="Descrição / conteúdo do aditivo"
            name="description"
            value={addendumForm.description}
            onChange={handleAddendumFormChange}
            placeholder="Descreva o ajuste, cláusula adicional ou alteração acordada."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Valor total"
              name="totalValue"
              type="number"
              min="0"
              step="0.01"
              value={addendumForm.totalValue}
              onChange={handleAddendumFormChange}
            />

            <Input
              label="Valor mensal"
              name="monthlyValue"
              type="number"
              min="0"
              step="0.01"
              value={addendumForm.monthlyValue}
              onChange={handleAddendumFormChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Data de início"
              name="startDate"
              type="date"
              value={addendumForm.startDate}
              onChange={handleAddendumFormChange}
            />

            <Input
              label="Data de encerramento"
              name="endDate"
              type="date"
              value={addendumForm.endDate}
              onChange={handleAddendumFormChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddendumModalOpen(false)}>
              Cancelar
            </Button>

            <Button type="submit" disabled={savingAction} className="!text-white">
              {savingAction ? 'Gerando...' : 'Gerar aditivo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

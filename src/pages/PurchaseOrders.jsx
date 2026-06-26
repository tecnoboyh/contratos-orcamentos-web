import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X
} from 'lucide-react';

import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';

const statusLabels = {
  DRAFT: 'Rascunho',
  ISSUED: 'Emitida',
  APPROVED: 'Aprovada',
  CANCELED: 'Cancelada'
};

const statusVariants = {
  DRAFT: 'default',
  ISSUED: 'warning',
  APPROVED: 'success',
  CANCELED: 'danger'
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function emptyForm(initialObraId = '') {
  return {
    obraId: initialObraId,
    number: '',
    payerCnpj: '',
    supplier: '',
    description: '',
    totalValue: '',
    status: 'DRAFT',
    issuedAt: ''
  };
}

export default function PurchaseOrders() {
  const { company } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialObraId = searchParams.get('obraId') || '';

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [obras, setObras] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    obraId: initialObraId
  });

  const [form, setForm] = useState(emptyForm(initialObraId));

  const [loading, setLoading] = useState(false);
  const [loadingObras, setLoadingObras] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedObra = useMemo(() => {
    return obras.find((obra) => obra.id === form.obraId);
  }, [obras, form.obraId]);

  const payerCnpjOptions = useMemo(() => {
    const options = [];

    if (company?.cnpj) {
      options.push({
        value: company.cnpj,
        label: `${company.name || 'Empresa selecionada'} - ${company.cnpj}`
      });
    }

    purchaseOrders.forEach((order) => {
      if (!order?.payerCnpj) return;

      const alreadyExists = options.some((option) => option.value === order.payerCnpj);

      if (!alreadyExists) {
        options.push({
          value: order.payerCnpj,
          label: order.payerCnpj
        });
      }
    });

    return options;
  }, [company, purchaseOrders]);

  async function loadPurchaseOrders() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.obraId) params.set('obraId', filters.obraId);

      const query = params.toString();
      const response = await api.get(query ? `/purchase-orders?${query}` : '/purchase-orders');

      const data = Array.isArray(response.data) ? response.data : [];
      setPurchaseOrders(data);

      if (selectedOrder) {
        const updated = data.find((item) => item.id === selectedOrder.id);
        setSelectedOrder(updated || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar as ordens de compra.');
    } finally {
      setLoading(false);
    }
  }

  async function loadObras() {
    try {
      setLoadingObras(true);
      const response = await api.get('/obras');
      setObras(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setObras([]);
    } finally {
      setLoadingObras(false);
    }
  }

  useEffect(() => {
    loadObras();
  }, []);

  useEffect(() => {
    loadPurchaseOrders();
  }, [filters.status, filters.obraId]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((state) => ({
      ...state,
      [name]: value
    }));

    if (name === 'obraId') {
      const params = new URLSearchParams(searchParams);

      if (value) {
        params.set('obraId', value);
      } else {
        params.delete('obraId');
      }

      setSearchParams(params);
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((state) => ({
      ...state,
      [name]: value
    }));
  }

  function openCreateModal() {
    setForm({
      ...emptyForm(filters.obraId),
      payerCnpj: company?.cnpj || ''
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.obraId || !form.number || !form.payerCnpj || !form.totalValue) {
      setError('Informe obra, número da O.C., CNPJ pagador e valor total.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await api.post('/purchase-orders', {
        obraId: form.obraId,
        number: form.number,
        payerCnpj: form.payerCnpj,
        supplier: form.supplier || null,
        description: form.description || null,
        totalValue: Number(form.totalValue),
        status: form.status,
        issuedAt: form.issuedAt || null
      });

      setSuccess('Ordem de compra criada com sucesso.');
      setSelectedOrder(response.data);
      setModalOpen(false);
      setForm(emptyForm(filters.obraId));

      await loadPurchaseOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível criar a ordem de compra.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(order, status) {
    try {
      setUpdatingStatus(true);
      setError('');
      setSuccess('');

      const response = await api.put(`/purchase-orders/${order.id}`, {
        status,
        issuedAt: status === 'ISSUED' && !order.issuedAt
          ? new Date().toISOString().slice(0, 10)
          : order.issuedAt
      });

      setSelectedOrder(response.data);
      setSuccess('Status da ordem de compra atualizado.');
      await loadPurchaseOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível atualizar a ordem de compra.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete(orderId) {
    const confirmed = window.confirm('Deseja remover esta ordem de compra?');

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await api.delete(`/purchase-orders/${orderId}`);

      setPurchaseOrders((state) => state.filter((item) => item.id !== orderId));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      setSuccess('Ordem de compra removida com sucesso.');
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível remover a ordem de compra.');
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    loadPurchaseOrders();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Ordens de compra</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Ordem de Compra (O.C.)
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Emita e acompanhe ordens de compra vinculadas às obras e contratos.
          </p>
        </div>

        <Button type="button" onClick={openCreateModal} className="!text-white">
          <Plus size={17} strokeWidth={1.8} />
          Nova O.C.
        </Button>
      </div>

      {(error || success) && (
        <div
          className={
            success
              ? 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
              : 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600'
          }
        >
          {success || error}
        </div>
      )}

      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1fr_220px_260px_auto]">
          <div className="relative">
            <Search
              size={17}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar por número, fornecedor ou CNPJ"
              className="pl-9"
            />
          </div>

          <Select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="ISSUED">Emitida</option>
            <option value="APPROVED">Aprovada</option>
            <option value="CANCELED">Cancelada</option>
          </Select>

          <Select name="obraId" value={filters.obraId} onChange={handleFilterChange} disabled={loadingObras}>
            <option value="">Todas as obras</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.name}
              </option>
            ))}
          </Select>

          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card className="p-0">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">
              O.C. cadastradas
            </h2>

            <p className="text-sm text-zinc-500">
              Clique em uma ordem para ver o resumo e atualizar o status.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-zinc-500">
              <Loader2 className="animate-spin" size={17} strokeWidth={1.8} />
              Carregando ordens de compra...
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ShoppingCart className="mx-auto mb-3 text-zinc-300" size={34} strokeWidth={1.6} />

              <h3 className="text-sm font-semibold text-zinc-950">
                Nenhuma O.C. encontrada
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Crie uma ordem de compra vinculada a uma obra.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {purchaseOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="block w-full px-5 py-4 text-left transition hover:bg-zinc-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-zinc-950">
                          {order.number}
                        </h3>

                        <Badge variant={statusVariants[order.status] || 'default'}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-zinc-500">
                        {order.supplier || 'Fornecedor não informado'}
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        Obra: {order.obra?.name || '-'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-zinc-950">
                        {formatCurrency(order.totalValue)}
                      </p>

                      <p className="text-xs text-zinc-500">
                        Emissão: {formatDate(order.issuedAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {!selectedOrder ? (
            <div className="py-12 text-center">
              <ClipboardCheck className="mx-auto mb-3 text-zinc-300" size={34} strokeWidth={1.6} />

              <h3 className="text-sm font-semibold text-zinc-950">
                Nenhuma O.C. selecionada
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Selecione uma ordem de compra para ver os dados principais.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                    {selectedOrder.number}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {selectedOrder.supplier || 'Fornecedor não informado'}
                  </p>
                </div>

                <Badge variant={statusVariants[selectedOrder.status] || 'default'}>
                  {statusLabels[selectedOrder.status] || selectedOrder.status}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">Valor total</p>
                  <p className="mt-1 text-base font-semibold text-zinc-950">
                    {formatCurrency(selectedOrder.totalValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-xs text-zinc-400">CNPJ pagador</p>
                  <p className="mt-1 text-base font-semibold text-zinc-950">
                    {selectedOrder.payerCnpj}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-400">Obra</p>
                  <p className="font-medium text-zinc-800">
                    {selectedOrder.obra?.name || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Contrato vinculado</p>
                  <p className="font-medium text-zinc-800">
                    {selectedOrder.contract?.title || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Data de emissão</p>
                  <p className="font-medium text-zinc-800">
                    {formatDate(selectedOrder.issuedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Descrição</p>
                  <p className="font-medium text-zinc-800">
                    {selectedOrder.description || 'Sem descrição.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-950">
                  Atualizar status
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant={selectedOrder.status === 'ISSUED' ? 'primary' : 'secondary'}
                    onClick={() => handleStatusChange(selectedOrder, 'ISSUED')}
                    disabled={updatingStatus}
                    className={selectedOrder.status === 'ISSUED' ? '!text-white' : ''}
                  >
                    Emitida
                  </Button>

                  <Button
                    type="button"
                    variant={selectedOrder.status === 'APPROVED' ? 'primary' : 'secondary'}
                    onClick={() => handleStatusChange(selectedOrder, 'APPROVED')}
                    disabled={updatingStatus}
                    className={selectedOrder.status === 'APPROVED' ? '!text-white' : ''}
                  >
                    Aprovada
                  </Button>

                  <Button
                    type="button"
                    variant={selectedOrder.status === 'DRAFT' ? 'primary' : 'secondary'}
                    onClick={() => handleStatusChange(selectedOrder, 'DRAFT')}
                    disabled={updatingStatus}
                    className={selectedOrder.status === 'DRAFT' ? '!text-white' : ''}
                  >
                    Rascunho
                  </Button>

                  <Button
                    type="button"
                    variant={selectedOrder.status === 'CANCELED' ? 'primary' : 'secondary'}
                    onClick={() => handleStatusChange(selectedOrder, 'CANCELED')}
                    disabled={updatingStatus}
                    className={selectedOrder.status === 'CANCELED' ? '!text-white' : ''}
                  >
                    Cancelada
                  </Button>
                </div>
              </div>

              <Button type="button" variant="ghost" onClick={() => handleDelete(selectedOrder.id)}>
                <Trash2 size={16} strokeWidth={1.8} />
                Remover O.C.
              </Button>
            </div>
          )}
        </Card>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                  Nova ordem de compra
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  A O.C. será vinculada à obra selecionada e ao contrato de origem, quando existir.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Select
                label="Obra"
                name="obraId"
                value={form.obraId}
                onChange={handleFormChange}
                disabled={loadingObras}
              >
                <option value="">Selecione a obra</option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.name}
                  </option>
                ))}
              </Select>

              {selectedObra?.contract && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 text-sm text-zinc-600">
                  Contrato vinculado: <span className="font-medium text-zinc-900">{selectedObra.contract.title}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Número da O.C."
                  name="number"
                  value={form.number}
                  onChange={handleFormChange}
                  placeholder="OC-0001"
                />

                <Select
                  label="CNPJ pagador"
                  name="payerCnpj"
                  value={form.payerCnpj}
                  onChange={handleFormChange}
                  disabled={payerCnpjOptions.length === 0}
                >
                  <option value="">
                    {payerCnpjOptions.length === 0
                      ? 'Nenhum CNPJ disponível'
                      : 'Selecione o CNPJ pagador'}
                  </option>

                  {payerCnpjOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              {payerCnpjOptions.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Para emitir uma O.C., cadastre um CNPJ na empresa selecionada pelo menu lateral.
                </div>
              )}

              <Input
                label="Fornecedor"
                name="supplier"
                value={form.supplier}
                onChange={handleFormChange}
                placeholder="Fornecedor de Materiais LTDA"
              />

              <Textarea
                label="Descrição"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Compra de materiais para execução da obra"
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Valor total"
                  name="totalValue"
                  type="number"
                  step="0.01"
                  value={form.totalValue}
                  onChange={handleFormChange}
                  placeholder="0,00"
                />

                <Select
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="ISSUED">Emitida</option>
                  <option value="APPROVED">Aprovada</option>
                  <option value="CANCELED">Cancelada</option>
                </Select>

                <Input
                  label="Data de emissão"
                  name="issuedAt"
                  type="date"
                  value={form.issuedAt}
                  onChange={handleFormChange}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving} className="!text-white">
                  {saving ? 'Salvando...' : 'Criar O.C.'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

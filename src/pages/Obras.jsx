import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  X
} from 'lucide-react';

import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';

const statusLabels = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizada',
  CANCELED: 'Cancelada'
};

const statusVariants = {
  PLANNING: 'default',
  IN_PROGRESS: 'warning',
  FINISHED: 'success',
  CANCELED: 'danger'
};

const costCategoryLabels = {
  MATERIAL: 'Material',
  LABOR: 'Mão de obra',
  EQUIPMENT: 'Equipamento',
  SERVICE: 'Serviço',
  OTHER: 'Outro'
};

function formatCurrency(value) {
  const number = Number(value || 0);

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('pt-BR');
}

function normalizeProgress(value) {
  const number = Number(value || 0);

  if (number < 0) return 0;
  if (number > 100) return 100;

  return number;
}

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedObra, setSelectedObra] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingCost, setCreatingCost] = useState(false);
  const [creatingVistoria, setCreatingVistoria] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [vistoriaFormOpen, setVistoriaFormOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    contractId: '',
    name: '',
    description: '',
    location: '',
    expectedBudget: '',
    startDate: '',
    endDate: ''
  });

  const [costForm, setCostForm] = useState({
    description: '',
    category: 'MATERIAL',
    amount: '',
    paidAt: ''
  });

  const [vistoriaForm, setVistoriaForm] = useState({
    type: 'INITIAL',
    description: '',
    performedAt: ''
  });

  const availableContracts = useMemo(() => {
    return contracts.filter((contract) => {
      return contract.status !== 'DRAFT' && contract.status !== 'CANCELED';
    });
  }, [contracts]);

  async function loadObras() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const query = params.toString();
      const response = await api.get(query ? `/obras?${query}` : '/obras');

      setObras(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar as obras.');
    } finally {
      setLoading(false);
    }
  }

  async function loadContracts() {
    try {
      setLoadingContracts(true);

      const response = await api.get('/contracts');

      setContracts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  }

  async function loadObraDetail(id) {
    try {
      setLoadingDetail(true);
      setError('');

      const response = await api.get(`/obras/${id}`);

      setSelectedObra(response.data);
      setCostFormOpen(false);
      setVistoriaFormOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar a obra.');
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadObras();
    loadContracts();
  }, []);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((state) => ({
      ...state,
      [name]: value
    }));
  }

  function handleCostFormChange(event) {
    const { name, value } = event.target;

    setCostForm((state) => ({
      ...state,
      [name]: value
    }));
  }

  function handleVistoriaFormChange(event) {
    const { name, value } = event.target;

    setVistoriaForm((state) => ({
      ...state,
      [name]: value
    }));
  }

  function resetMessages() {
    setError('');
    setSuccess('');
  }

  async function handleCreateObra(event) {
    event.preventDefault();

    if (!form.name) {
      setError('Informe o nome da obra.');
      return;
    }

    try {
      setSaving(true);
      resetMessages();

      await api.post('/obras', {
        contractId: form.contractId || null,
        name: form.name,
        description: form.description || null,
        location: form.location || null,
        expectedBudget: form.expectedBudget ? Number(form.expectedBudget) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null
      });

      setSuccess('Obra criada com sucesso.');
      setModalOpen(false);
      setForm({
        contractId: '',
        name: '',
        description: '',
        location: '',
        expectedBudget: '',
        startDate: '',
        endDate: ''
      });

      await loadObras();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível criar a obra.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteStep(stepId) {
    if (!selectedObra?.id) return;

    try {
      resetMessages();

      await api.patch(`/obras/${selectedObra.id}/steps/${stepId}/complete`);

      setSuccess('Etapa concluída com sucesso.');
      await loadObraDetail(selectedObra.id);
      await loadObras();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível concluir a etapa.');
    }
  }

  async function handleCreateCost(event) {
    event.preventDefault();

    if (!selectedObra?.id) return;

    if (!costForm.description || !costForm.amount) {
      setError('Informe a descrição e o valor do custo.');
      return;
    }

    try {
      setCreatingCost(true);
      resetMessages();

      await api.post(`/obras/${selectedObra.id}/custos`, {
        description: costForm.description,
        category: costForm.category,
        amount: Number(costForm.amount),
        paidAt: costForm.paidAt || null
      });

      setSuccess('Custo lançado com sucesso.');
      setCostForm({
        description: '',
        category: 'MATERIAL',
        amount: '',
        paidAt: ''
      });
      setCostFormOpen(false);

      await loadObraDetail(selectedObra.id);
      await loadObras();
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível lançar o custo.');
    } finally {
      setCreatingCost(false);
    }
  }

  async function handleCreateVistoria(event) {
    event.preventDefault();

    if (!selectedObra?.id) return;

    try {
      setCreatingVistoria(true);
      resetMessages();

      await api.post(`/obras/${selectedObra.id}/vistorias`, {
        type: vistoriaForm.type,
        description: vistoriaForm.description || null,
        performedAt: vistoriaForm.performedAt || null
      });

      setSuccess('Vistoria registrada com sucesso.');
      setVistoriaForm({
        type: 'INITIAL',
        description: '',
        performedAt: ''
      });
      setVistoriaFormOpen(false);

      await loadObraDetail(selectedObra.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível registrar a vistoria.');
    } finally {
      setCreatingVistoria(false);
    }
  }

  const selectedProgress = normalizeProgress(selectedObra?.progress);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Obras</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Gestão de obras
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Acompanhe obras vinculadas a contratos, etapas, custos e vistorias.
          </p>
        </div>

        <Button type="button" onClick={() => setModalOpen(true)} className="!text-white">
          <Plus size={17} strokeWidth={1.8} />
          Nova obra
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

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search
              size={17}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, local ou descrição"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-3 focus:ring-zinc-100"
            />
          </div>

          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="PLANNING">Planejamento</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="FINISHED">Finalizada</option>
            <option value="CANCELED">Cancelada</option>
          </Select>

          <Button type="button" variant="secondary" onClick={loadObras}>
            Filtrar
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_480px]">
        <Card className="p-0">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">
              Obras cadastradas
            </h2>

            <p className="text-sm text-zinc-500">
              Selecione uma obra para acompanhar detalhes.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-zinc-500">
              <Loader2 className="animate-spin" size={17} strokeWidth={1.8} />
              Carregando obras...
            </div>
          ) : obras.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Building2 className="mx-auto mb-3 text-zinc-300" size={34} strokeWidth={1.6} />

              <h3 className="text-sm font-semibold text-zinc-950">
                Nenhuma obra encontrada
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Crie uma obra vinculada a um contrato para começar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {obras.map((obra) => {
                const progress = normalizeProgress(obra.progress);

                return (
                  <button
                    key={obra.id}
                    type="button"
                    onClick={() => loadObraDetail(obra.id)}
                    className="block w-full px-5 py-4 text-left transition hover:bg-zinc-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-zinc-950">
                            {obra.name}
                          </h3>

                          <Badge variant={statusVariants[obra.status] || 'default'}>
                            {statusLabels[obra.status] || obra.status}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-zinc-500">
                          {obra.location || 'Sem local informado'}
                        </p>

                        {obra.contract && (
                          <p className="mt-1 text-xs text-zinc-400">
                            Contrato: {obra.contract.title}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium text-zinc-950">
                          {progress}% concluído
                        </p>

                        <p className="text-xs text-zinc-500">
                          Realizado: {formatCurrency(obra.realizedBudget)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-950"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          {!selectedObra ? (
            <div className="py-12 text-center">
              <Eye className="mx-auto mb-3 text-zinc-300" size={34} strokeWidth={1.6} />

              <h3 className="text-sm font-semibold text-zinc-950">
                Nenhuma obra selecionada
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Clique em uma obra para ver roteiro, custos e vistorias.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
              <Loader2 className="animate-spin" size={17} strokeWidth={1.8} />
              Carregando detalhes...
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                      {selectedObra.name}
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      {selectedObra.location || 'Sem local informado'}
                    </p>
                  </div>

                  <Badge variant={statusVariants[selectedObra.status] || 'default'}>
                    {statusLabels[selectedObra.status] || selectedObra.status}
                  </Badge>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-950"
                    style={{ width: `${selectedProgress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  Progresso da obra: {selectedProgress}%
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                    <p className="text-xs text-zinc-400">Orçamento previsto</p>
                    <p className="mt-1 text-base font-semibold text-zinc-950">
                      {formatCurrency(selectedObra.expectedBudget)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                    <p className="text-xs text-zinc-400">Orçamento realizado</p>
                    <p className="mt-1 text-base font-semibold text-zinc-950">
                      {formatCurrency(selectedObra.realizedBudget)}
                    </p>
                  </div>
                </div>
              </div>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                  <ClipboardList size={17} strokeWidth={1.8} />
                  Roteiro da obra
                </h3>

                <div className="space-y-2">
                  {selectedObra.steps?.length ? (
                    selectedObra.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-100 bg-white px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-950">
                            {step.title}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {step.phase} · {step.description || 'Sem descrição'}
                          </p>
                        </div>

                        {step.isCompleted ? (
                          <Badge variant="success">Concluída</Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCompleteStep(step.id)}
                            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl bg-zinc-950 px-3 text-xs font-medium text-white transition hover:bg-zinc-800"
                          >
                            <CheckCircle2 size={14} strokeWidth={1.8} />
                            Concluir
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-3 py-3 text-sm text-zinc-500">
                      Nenhuma etapa cadastrada.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <ReceiptText size={17} strokeWidth={1.8} />
                    Custos
                  </h3>

                  <button
                    type="button"
                    onClick={() => setCostFormOpen((state) => !state)}
                    className="text-xs font-medium text-zinc-950"
                  >
                    {costFormOpen ? 'Fechar' : 'Lançar custo'}
                  </button>
                </div>

                {costFormOpen && (
                  <form onSubmit={handleCreateCost} className="mb-3 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3">
                    <Input
                      label="Descrição"
                      name="description"
                      value={costForm.description}
                      onChange={handleCostFormChange}
                      placeholder="Compra de materiais"
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        label="Categoria"
                        name="category"
                        value={costForm.category}
                        onChange={handleCostFormChange}
                      >
                        <option value="MATERIAL">Material</option>
                        <option value="LABOR">Mão de obra</option>
                        <option value="EQUIPMENT">Equipamento</option>
                        <option value="SERVICE">Serviço</option>
                        <option value="OTHER">Outro</option>
                      </Select>

                      <Input
                        label="Valor"
                        name="amount"
                        type="number"
                        step="0.01"
                        value={costForm.amount}
                        onChange={handleCostFormChange}
                        placeholder="0,00"
                      />
                    </div>

                    <Input
                      label="Data de pagamento"
                      name="paidAt"
                      type="date"
                      value={costForm.paidAt}
                      onChange={handleCostFormChange}
                    />

                    <Button type="submit" disabled={creatingCost} className="!text-white">
                      {creatingCost ? 'Salvando...' : 'Salvar custo'}
                    </Button>
                  </form>
                )}

                <div className="space-y-2">
                  {selectedObra.custos?.length ? (
                    selectedObra.custos.map((cost) => (
                      <div key={cost.id} className="rounded-2xl border border-zinc-100 bg-white px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-950">
                              {cost.description}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {costCategoryLabels[cost.category] || cost.category} · {formatDate(cost.paidAt)}
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-zinc-950">
                            {formatCurrency(cost.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-3 py-3 text-sm text-zinc-500">
                      Nenhum custo lançado.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <ShoppingCart size={17} strokeWidth={1.8} />
                    Ordens de compra
                  </h3>

                  <Link
                    to={`/purchase-orders?obraId=${selectedObra.id}`}
                    className="text-xs font-medium text-zinc-950"
                  >
                    Criar O.C.
                  </Link>
                </div>

                <div className="space-y-2">
                  {selectedObra.purchaseOrders?.length ? (
                    selectedObra.purchaseOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-zinc-100 bg-white px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-950">
                              {order.number}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {order.supplier || 'Fornecedor não informado'} · {formatDate(order.issuedAt)}
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-zinc-950">
                            {formatCurrency(order.totalValue)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-3 py-3 text-sm text-zinc-500">
                      Nenhuma ordem de compra vinculada.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    <Building2 size={17} strokeWidth={1.8} />
                    Vistorias
                  </h3>

                  <button
                    type="button"
                    onClick={() => setVistoriaFormOpen((state) => !state)}
                    className="text-xs font-medium text-zinc-950"
                  >
                    {vistoriaFormOpen ? 'Fechar' : 'Registrar vistoria'}
                  </button>
                </div>

                {vistoriaFormOpen && (
                  <form onSubmit={handleCreateVistoria} className="mb-3 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3">
                    <Select
                      label="Tipo"
                      name="type"
                      value={vistoriaForm.type}
                      onChange={handleVistoriaFormChange}
                    >
                      <option value="INITIAL">Inicial</option>
                      <option value="FINAL">Final</option>
                    </Select>

                    <Textarea
                      label="Descrição"
                      name="description"
                      value={vistoriaForm.description}
                      onChange={handleVistoriaFormChange}
                      placeholder="Descreva o estado do local"
                    />

                    <Input
                      label="Data da vistoria"
                      name="performedAt"
                      type="date"
                      value={vistoriaForm.performedAt}
                      onChange={handleVistoriaFormChange}
                    />

                    <Button type="submit" disabled={creatingVistoria} className="!text-white">
                      {creatingVistoria ? 'Salvando...' : 'Salvar vistoria'}
                    </Button>
                  </form>
                )}

                <div className="space-y-2">
                  {selectedObra.vistorias?.length ? (
                    selectedObra.vistorias.map((vistoria) => (
                      <div key={vistoria.id} className="rounded-2xl border border-zinc-100 bg-white px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-950">
                              {vistoria.type === 'INITIAL' ? 'Vistoria inicial' : 'Vistoria final'}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {formatDate(vistoria.performedAt)}
                            </p>
                          </div>

                          <Badge>{vistoria.type === 'INITIAL' ? 'Inicial' : 'Final'}</Badge>
                        </div>

                        {vistoria.description && (
                          <p className="mt-2 text-sm text-zinc-600">
                            {vistoria.description}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-3 py-3 text-sm text-zinc-500">
                      Nenhuma vistoria registrada.
                    </p>
                  )}
                </div>
              </section>
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
                  Nova obra
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Vincule a obra a um contrato e inicie o roteiro de acompanhamento.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <form onSubmit={handleCreateObra} className="space-y-4">
              <Select
                label="Contrato vinculado"
                name="contractId"
                value={form.contractId}
                onChange={handleFormChange}
                disabled={loadingContracts}
              >
                <option value="">Sem contrato vinculado</option>
                {availableContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.title} - {contract.relatedParty}
                  </option>
                ))}
              </Select>

              <Input
                label="Nome da obra"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Reforma do imóvel Jardim Brasil"
              />

              <Textarea
                label="Descrição"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Descreva o escopo inicial da obra"
              />

              <Input
                label="Local"
                name="location"
                value={form.location}
                onChange={handleFormChange}
                placeholder="Rua, quadra, lote, bairro"
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Orçamento previsto"
                  name="expectedBudget"
                  type="number"
                  step="0.01"
                  value={form.expectedBudget}
                  onChange={handleFormChange}
                  placeholder="0,00"
                />

                <Input
                  label="Início"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleFormChange}
                />

                <Input
                  label="Encerramento"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleFormChange}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>

                <Button type="submit" disabled={saving} className="!text-white">
                  {saving ? 'Salvando...' : 'Criar obra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

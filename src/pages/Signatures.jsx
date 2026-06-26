import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Trash2
} from 'lucide-react';

import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const channelLabels = {
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
  BOTH: 'E-mail e WhatsApp'
};

function emptySigner() {
  return {
    name: '',
    email: '',
    phone: ''
  };
}

export default function Signatures() {
  const [searchParams] = useSearchParams();
  const initialContractId = searchParams.get('contractId') || '';

  const [contracts, setContracts] = useState([]);
  const [contractId, setContractId] = useState(initialContractId);
  const [channel, setChannel] = useState('EMAIL');
  const [signers, setSigners] = useState([emptySigner()]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [resultPanel, setResultPanel] = useState(null);

  const selectedContract = useMemo(() => {
    return contracts.find((contract) => contract.id === contractId);
  }, [contracts, contractId]);

  async function loadContracts() {
    try {
      setLoadingContracts(true);

      const response = await api.get('/contracts');

      const contractsData = Array.isArray(response.data) ? response.data : [];

      const contractsWithoutSignatureSend = contractsData.filter((contract) => {
        const hasSignatureRequests =
          Array.isArray(contract.signatureRequests) &&
          contract.signatureRequests.length > 0;

        const isAlreadySent = contract.status === 'WAITING_SIGNATURE';
        const isSigned = contract.status === 'SIGNED' || contract.archivedAt;
        const isCanceled = contract.status === 'CANCELED';
        const isExpired = contract.status === 'EXPIRED';

        return (
          !hasSignatureRequests &&
          !isAlreadySent &&
          !isSigned &&
          !isCanceled &&
          !isExpired
        );
      });

      setContracts(contractsWithoutSignatureSend);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar os contratos.');
    } finally {
      setLoadingContracts(false);
    }
  }

  useEffect(() => {
    loadContracts();
  }, []);

  function updateSigner(index, field, value) {
    setSigners((state) => {
      return state.map((signer, signerIndex) => {
        if (signerIndex !== index) return signer;
        return { ...signer, [field]: value };
      });
    });
  }

  function addSigner() {
    setSigners((state) => [...state, emptySigner()]);
  }

  function removeSigner(index) {
    setSigners((state) => {
      if (state.length === 1) return state;
      return state.filter((_, signerIndex) => signerIndex !== index);
    });
  }

  function resetForm() {
    setContractId('');
    setChannel('EMAIL');
    setSigners([emptySigner()]);
    setError('');
    setResultPanel(null);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      setError('Não foi possível copiar o link.');
    }
  }

  function validateForm() {
    if (!contractId) {
      return 'Selecione um contrato.';
    }

    const hasInvalidSigner = signers.some((signer) => {
      if (!signer.name.trim()) return true;
      if ((channel === 'EMAIL' || channel === 'BOTH') && !signer.email.trim()) return true;
      if ((channel === 'WHATSAPP' || channel === 'BOTH') && !signer.phone.trim()) return true;
      return false;
    });

    if (hasInvalidSigner) {
      return 'Preencha os dados obrigatórios de todos os assinantes.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSending(true);
      setError('');
      setResultPanel(null);

      const payload = {
        channel,
        signers: signers.map((signer) => ({
          name: signer.name.trim(),
          email: signer.email.trim() || undefined,
          phone: signer.phone.trim() || undefined
        }))
      };

      const response = await api.post(`/contracts/${contractId}/send-signature`, payload);

      setResultPanel({
        type: 'success',
        title: 'Contrato enviado para assinatura',
        message: response.data?.message || 'O contrato foi enviado para os assinantes informados.',
        data: response.data
      });
    } catch (err) {
      setResultPanel({
        type: 'error',
        title: 'Falha ao enviar assinatura',
        message: err.response?.data?.message || 'Não foi possível enviar o contrato para assinatura.',
        data: err.response?.data || null
      });
    } finally {
      setSending(false);
    }
  }

  const showResultPanel = Boolean(resultPanel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Assinaturas</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Enviar contrato para assinatura
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Envie o link de assinatura para um ou vários assinantes por e-mail, WhatsApp ou ambos.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-zinc-500 shadow-sm backdrop-blur">
          <Send size={16} strokeWidth={1.8} />
          Fluxo de assinatura
        </div>
      </div>

      {showResultPanel ? (
        <Card className="mx-auto max-w-3xl">
          <div className="text-center">
            <div
              className={
                resultPanel.type === 'success'
                  ? 'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600'
                  : 'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600'
              }
            >
              {resultPanel.type === 'success' ? (
                <CheckCircle2 size={24} strokeWidth={1.8} />
              ) : (
                <AlertCircle size={24} strokeWidth={1.8} />
              )}
            </div>

            <Badge variant={resultPanel.type === 'success' ? 'success' : 'danger'}>
              {resultPanel.type === 'success' ? 'Envio concluído' : 'Envio não realizado'}
            </Badge>

            <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">
              {resultPanel.title}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              {resultPanel.message}
            </p>
          </div>

          {resultPanel.type === 'success' && resultPanel.data?.signatureRequests?.length > 0 && (
            <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Links gerados
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Cada assinante recebeu um link individual de assinatura.
                  </p>
                </div>

                <Badge>{resultPanel.data.signatureRequests.length} assinante(s)</Badge>
              </div>

              <div className="space-y-3">
                {resultPanel.data.signatureRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">
                          {request.signerName}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {request.signerEmail || request.signerPhone || 'Contato não informado'}
                        </p>
                      </div>

                      <Badge variant="success">Enviado</Badge>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <p className="min-w-0 flex-1 break-all rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                        {request.signatureUrl}
                      </p>

                      <button
                        type="button"
                        onClick={() => copyText(request.signatureUrl)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        <Copy size={14} strokeWidth={1.8} />
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultPanel.type === 'error' && (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-sm text-red-700">
              Revise os dados do contrato, os assinantes e as configurações de envio. Depois tente novamente.
            </div>
          )}

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {resultPanel.type === 'error' && (
              <Button type="button" variant="secondary" onClick={() => setResultPanel(null)}>
                Voltar e corrigir
              </Button>
            )}

            <Button type="button" onClick={resetForm} className="!text-white">
              Enviar outro contrato
            </Button>

            <Link
              to="/contracts"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Ver contratos
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                <Select
                  label="Contrato"
                  value={contractId}
                  onChange={(event) => setContractId(event.target.value)}
                  disabled={loadingContracts}
                >
                  <option value="">
                    {loadingContracts ? 'Carregando contratos...' : 'Selecione um contrato'}
                  </option>

                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.title}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Canal de envio"
                  value={channel}
                  onChange={(event) => setChannel(event.target.value)}
                >
                  <option value="EMAIL">E-mail</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="BOTH">E-mail e WhatsApp</option>
                </Select>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-950">
                      Assinantes
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Cada assinante receberá um link individual de assinatura.
                    </p>
                  </div>

                  <Button type="button" variant="secondary" onClick={addSigner}>
                    <Plus size={16} strokeWidth={1.8} />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-3">
                  {signers.map((signer, index) => (
                    <div key={index} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-800">
                          Assinante {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeSigner(index)}
                          disabled={signers.length === 1}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={15} strokeWidth={1.8} />
                        </button>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-3">
                        <Input
                          label="Nome"
                          placeholder="Nome do assinante"
                          value={signer.name}
                          onChange={(event) => updateSigner(index, 'name', event.target.value)}
                        />

                        <Input
                          label="E-mail"
                          type="email"
                          placeholder="assinante@email.com"
                          value={signer.email}
                          onChange={(event) => updateSigner(index, 'email', event.target.value)}
                        />

                        <Input
                          label="WhatsApp"
                          placeholder="5562999999999"
                          value={signer.phone}
                          onChange={(event) => updateSigner(index, 'phone', event.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={sending} className="!text-white">
                  {sending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} strokeWidth={1.8} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} strokeWidth={1.8} />
                      Enviar para assinatura
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                {channel === 'WHATSAPP' ? (
                  <MessageCircle size={18} strokeWidth={1.8} />
                ) : (
                  <Mail size={18} strokeWidth={1.8} />
                )}
              </div>

              <h2 className="text-base font-semibold text-zinc-950">
                Resumo do envio
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-400">Contrato</p>
                  <p className="font-medium text-zinc-800">
                    {selectedContract?.title || 'Nenhum contrato selecionado'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Canal</p>
                  <p className="font-medium text-zinc-800">
                    {channelLabels[channel]}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Total de assinantes</p>
                  <p className="font-medium text-zinc-800">
                    {signers.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

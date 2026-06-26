import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Copy, Loader2, Mail, MessageCircle, Plus, Send, Trash2 } from 'lucide-react';

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

function canSendToSignature(contract) {
  const status = contract.currentStatus || contract.status;
  const hasSignatureRequests =
    Array.isArray(contract.signatureRequests) &&
    contract.signatureRequests.length > 0;

  return (
    !hasSignatureRequests &&
    status !== 'WAITING_SIGNATURE' &&
    status !== 'SIGNED' &&
    status !== 'EXPIRED' &&
    status !== 'CANCELED' &&
    status !== 'CLOSED' &&
    !contract.archivedAt
  );
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
      setError('');

      const response = await api.get('/contracts');
      const contractsData = Array.isArray(response.data) ? response.data : [];
      const contractsWithoutSignatureSend = contractsData.filter(canSendToSignature);

      setContracts(contractsWithoutSignatureSend);

      if (initialContractId) {
        const exists = contractsWithoutSignatureSend.some((contract) => contract.id === initialContractId);

        if (!exists) {
          setContractId('');
          setError('Este contrato não está disponível para envio. Ele pode já ter sido enviado, assinado, expirado ou cancelado.');
        }
      }
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
        title: 'Envio realizado',
        message: response.data?.message || 'Contrato enviado para assinatura.',
        data: response.data
      });

      await loadContracts();
    } catch (err) {
      setResultPanel({
        type: 'error',
        title: 'Erro no envio',
        message: err.response?.data?.message || 'Não foi possível enviar para assinatura.'
      });
    } finally {
      setSending(false);
    }
  }

  function resetForm() {
    setResultPanel(null);
    setError('');
    setContractId('');
    setChannel('EMAIL');
    setSigners([emptySigner()]);
  }

  async function copyLink(link) {
    await navigator.clipboard.writeText(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Assinaturas</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Enviar contrato para assinatura
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Aqui aparecem somente contratos que ainda não foram enviados para assinatura.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-zinc-500 shadow-sm backdrop-blur">
          <Send size={16} strokeWidth={1.8} />
          Fluxo de assinatura
        </div>
      </div>

      {resultPanel ? (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <div
              className={
                resultPanel.type === 'success'
                  ? 'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700'
                  : 'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600'
              }
            >
              {resultPanel.type === 'success' ? (
                <CheckCircle2 size={24} strokeWidth={1.8} />
              ) : (
                <AlertCircle size={24} strokeWidth={1.8} />
              )}
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              {resultPanel.title}
            </h2>

            <p className="mt-2 max-w-xl text-sm text-zinc-500">
              {resultPanel.message}
            </p>

            {resultPanel.type === 'success' && resultPanel.data?.signatureRequests?.length > 0 && (
              <div className="mt-6 w-full max-w-2xl space-y-3 text-left">
                {resultPanel.data.signatureRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-950">
                          {request.signerName}
                        </p>

                        <p className="mt-1 break-all text-xs text-zinc-500">
                          {request.signatureUrl}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyLink(request.signatureUrl)}
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
                      >
                        <Copy size={14} strokeWidth={1.8} />
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button type="button" onClick={resetForm} className="mt-6 !text-white">
              Novo envio
            </Button>
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
                    {loadingContracts ? 'Carregando contratos...' : 'Selecione um contrato sem envio de assinatura'}
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

              {!loadingContracts && contracts.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Nenhum contrato disponível para envio. Crie um contrato novo ou verifique se os contratos existentes já foram enviados, assinados, expirados ou cancelados.
                </div>
              )}

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
                <Button type="submit" disabled={sending || contracts.length === 0} className="!text-white">
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
      )}
    </div>
  );
}

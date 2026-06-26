import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, FileText, Loader2, PenLine } from 'lucide-react';

import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function SignatureView() {
  const { id } = useParams();

  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function loadSignature() {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/signatures/${id}/view`);
      setSignature(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar o contrato.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    try {
      setSigning(true);
      setError('');
      setResult(null);

      const response = await api.post(`/signatures/${id}/sign`);
      setResult({ type: 'success', ...response.data });

      await loadSignature();
    } catch (err) {
      setResult({
        type: 'error',
        message: err.response?.data?.message || 'Não foi possível assinar o contrato.'
      });
    } finally {
      setSigning(false);
    }
  }

  useEffect(() => {
    loadSignature();
  }, [id]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="animate-spin" size={18} strokeWidth={1.8} />
          Carregando contrato...
        </div>
      </div>
    );
  }

  if (error && !signature) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <FileText size={20} strokeWidth={1.8} />
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
            Link indisponível
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>
        </Card>
      </div>
    );
  }

  const contract = signature?.contract;
  const alreadySigned = signature?.status === 'SIGNED';
  const archived = Boolean(contract?.archivedAt || result?.contractArchived);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <PenLine size={20} strokeWidth={1.8} />
          </div>

          <Badge variant={alreadySigned ? 'success' : 'dark'}>
            {alreadySigned ? 'Contrato assinado' : 'Assinatura pendente'}
          </Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {contract?.title || 'Contrato'}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Revise o contrato abaixo antes de confirmar a assinatura.
          </p>
        </div>

        <Card>
          <div className="mb-5 grid gap-4 border-b border-zinc-100 pb-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Assinante
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900">
                {signature?.signerName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Parte relacionada
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900">
                {contract?.relatedParty || '-'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Tipo
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900">
                {contract?.type || '-'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-950">
              Conteúdo do contrato
            </h2>

            <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
              {contract?.content || 'Este contrato ainda não possui conteúdo preenchido.'}
            </div>
          </div>

          {result && (
            <div
              className={
                result.type === 'success'
                  ? 'mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
                  : 'mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600'
              }
            >
              <div className="flex items-start gap-2">
                {result.type === 'success' && <CheckCircle2 size={17} strokeWidth={1.8} />}
                <div>
                  <p className="font-medium">
                    {result.message}
                  </p>

                  {archived && (
                    <p className="mt-1 text-xs">
                      O contrato foi arquivado e ficará disponível no Gerenciador quando essa tela for criada.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-400">
              Ao clicar em assinar, você confirma ciência e aceite do conteúdo apresentado.
            </p>

            <Button
              type="button"
              onClick={handleSign}
              disabled={signing || alreadySigned}
              className="!text-white"
            >
              {alreadySigned
                ? 'Contrato já assinado'
                : signing
                  ? 'Assinando...'
                  : 'Assinar contrato'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

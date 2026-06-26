import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Save } from 'lucide-react';

import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';

const initialForm = {
  title: '',
  type: 'SERVICE',
  relatedParty: '',
  documentNumber: '',
  totalValue: '',
  monthlyValue: '',
  startDate: '',
  endDate: '',
  content: ''
};

const steps = [
  {
    id: 1,
    title: 'Dados principais',
    description: 'Tipo, título e parte relacionada.'
  },
  {
    id: 2,
    title: 'Valores e vigência',
    description: 'Valor, início e encerramento.'
  },
  {
    id: 3,
    title: 'Conteúdo',
    description: 'Texto base do contrato.'
  },
  {
    id: 4,
    title: 'Revisão',
    description: 'Conferência antes de salvar.'
  }
];

const typeLabels = {
  SERVICE: 'Prestação de serviço',
  WORK: 'Obra',
  RENT: 'Locação',
  EMPLOYMENT: 'Trabalho',
  OTHER: 'Outro'
};

function currencyToNumber(value) {
  if (!value) return null;

  const cleanValue = String(value)
    .replace(/\s/g, '')
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');

  const number = Number(cleanValue);

  return Number.isFinite(number) ? number : null;
}

function formatCurrencyInput(value) {
  const number = currencyToNumber(value);

  if (number === null) return '';

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatCurrency(value) {
  const number = currencyToNumber(value);

  if (number === null) return '-';

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(value) {
  if (!value) return '-';

  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

export default function NewContract() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const currentStepData = steps.find((step) => step.id === currentStep);

  const progress = useMemo(() => {
    return Math.round((currentStep / steps.length) * 100);
  }, [currentStep]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((state) => ({ ...state, [name]: value }));
    setFieldErrors((state) => ({ ...state, [name]: '' }));
  }

  function handleCurrencyChange(event) {
    const { name, value } = event.target;
    const onlyNumbers = value.replace(/\D/g, '');

    if (!onlyNumbers) {
      setForm((state) => ({ ...state, [name]: '' }));
      setFieldErrors((state) => ({ ...state, [name]: '' }));
      return;
    }

    const number = Number(onlyNumbers) / 100;

    setForm((state) => ({
      ...state,
      [name]: number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    }));

    setFieldErrors((state) => ({ ...state, [name]: '' }));
  }

  function handleCurrencyBlur(event) {
    const { name, value } = event.target;

    setForm((state) => ({
      ...state,
      [name]: formatCurrencyInput(value)
    }));
  }

  function validateStep(step = currentStep) {
    const errors = {};
    const totalValueNumber = currencyToNumber(form.totalValue);
    const monthlyValueNumber = currencyToNumber(form.monthlyValue);

    if (step === 1) {
      if (!form.title.trim()) errors.title = 'Informe o título do contrato.';
      if (!form.type) errors.type = 'Selecione o tipo do contrato.';
      if (!form.relatedParty.trim()) errors.relatedParty = 'Informe a parte relacionada.';
      if (!form.documentNumber.trim()) errors.documentNumber = 'Informe o CPF ou CNPJ da parte relacionada.';
    }

    if (step === 2) {
      if (totalValueNumber === null && monthlyValueNumber === null) {
        errors.totalValue = 'Informe o valor total ou o valor mensal.';
        errors.monthlyValue = 'Informe o valor mensal ou o valor total.';
      }

      if (totalValueNumber !== null && totalValueNumber <= 0) {
        errors.totalValue = 'O valor total deve ser maior que zero.';
      }

      if (monthlyValueNumber !== null && monthlyValueNumber <= 0) {
        errors.monthlyValue = 'O valor mensal deve ser maior que zero.';
      }

      if (!form.startDate) {
        errors.startDate = 'Informe a data de início.';
      }

      if (!form.endDate) {
        errors.endDate = 'Informe a data de encerramento.';
      }

      if (form.startDate && form.endDate && form.endDate < form.startDate) {
        errors.endDate = 'A data de encerramento deve ser maior que a data de início.';
      }
    }

    if (step === 3) {
      if (!form.content.trim()) {
        errors.content = 'Informe o conteúdo ou uma descrição inicial do contrato.';
      }

      if (form.content.trim() && form.content.trim().length < 20) {
        errors.content = 'O conteúdo precisa ter pelo menos 20 caracteres.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateAll() {
    const stepsToValidate = [1, 2, 3];

    for (const step of stepsToValidate) {
      const isValid = validateStep(step);

      if (!isValid) {
        setCurrentStep(step);
        return false;
      }
    }

    return true;
  }

  function handleNext() {
    setError('');

    if (!validateStep()) return;

    setCurrentStep((step) => Math.min(step + 1, steps.length));
  }

  function handleBack() {
    setError('');
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  async function handleCreateContract() {
    if (currentStep !== steps.length) {
      return;
    }

    if (!validateAll()) return;

    const totalValueNumber = currencyToNumber(form.totalValue);
    const monthlyValueNumber = currencyToNumber(form.monthlyValue);

    try {
      setLoading(true);
      setError('');

      await api.post('/contracts', {
        title: form.title.trim(),
        type: form.type,
        relatedParty: form.relatedParty.trim(),
        documentNumber: form.documentNumber.trim() || null,
        totalValue: totalValueNumber,
        monthlyValue: monthlyValueNumber,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        content: form.content.trim() || null,
        filledFields: {
          parteRelacionada: form.relatedParty.trim(),
          documento: form.documentNumber.trim() || null,
          valorTotal: totalValueNumber,
          valorMensal: monthlyValueNumber,
          inicio: form.startDate || null,
          encerramento: form.endDate || null
        }
      });

      navigate('/contracts');
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível criar o contrato.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="dark">Novo contrato</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Criar contrato guiado
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Preencha uma etapa por vez. O contrato será salvo como rascunho.
          </p>
        </div>

        <Link
          to="/contracts"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          <ArrowLeft size={16} strokeWidth={1.8} />
          Voltar
        </Link>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-950">
              Etapa {currentStep} de {steps.length}: {currentStepData?.title}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {currentStepData?.description}
            </p>
          </div>

          <div className="text-sm font-medium text-zinc-500">
            {progress}% concluído
          </div>
        </div>

        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-950 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
                className={
                  isActive
                    ? 'rounded-xl border border-zinc-950 bg-zinc-950 px-3 py-3 text-left text-white shadow-sm'
                    : isCompleted
                      ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-left text-emerald-700'
                      : 'rounded-xl border border-zinc-200 bg-white px-3 py-3 text-left text-zinc-500'
                }
              >
                <span className="flex items-start gap-3">
                  <span
                    className={
                      isActive
                        ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white'
                        : isCompleted
                          ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700'
                          : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500'
                    }
                  >
                    {isCompleted ? <Check size={13} strokeWidth={1.8} /> : step.id}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-xs font-semibold leading-4">
                      {step.title}
                    </span>
                    <span
                      className={
                        isActive
                          ? 'mt-1 block text-[11px] leading-4 text-white/70'
                          : 'mt-1 block text-[11px] leading-4 text-zinc-400'
                      }
                    >
                      {step.description}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <form onSubmit={(event) => event.preventDefault()} className="space-y-5">
        {currentStep === 1 && (
          <Card>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-zinc-950">Dados principais</h2>
              <p className="mt-1 text-sm text-zinc-500">Essas informações aparecem na listagem, assinatura e gestão do contrato.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Título"
                name="title"
                placeholder="Contrato de prestação de serviço"
                value={form.title}
                onChange={handleChange}
                error={fieldErrors.title}
              />

              <Select label="Tipo" name="type" value={form.type} onChange={handleChange} error={fieldErrors.type}>
                <option value="SERVICE">Prestação de serviço</option>
                <option value="WORK">Obra</option>
                <option value="RENT">Locação</option>
                <option value="EMPLOYMENT">Trabalho</option>
                <option value="OTHER">Outro</option>
              </Select>

              <Input
                label="Parte relacionada"
                name="relatedParty"
                placeholder="Nome ou razão social"
                value={form.relatedParty}
                onChange={handleChange}
                error={fieldErrors.relatedParty}
              />

              <Input
                label="Documento"
                name="documentNumber"
                placeholder="CPF ou CNPJ"
                value={form.documentNumber}
                onChange={handleChange}
                error={fieldErrors.documentNumber}
              />
            </div>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-zinc-950">Valores e vigência</h2>
              <p className="mt-1 text-sm text-zinc-500">Esses campos ajudam no acompanhamento financeiro e no cálculo da vigência restante.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Valor total"
                name="totalValue"
                inputMode="numeric"
                placeholder="R$ 5.000,00"
                value={form.totalValue}
                onChange={handleCurrencyChange}
                onBlur={handleCurrencyBlur}
                error={fieldErrors.totalValue}
              />

              <Input
                label="Valor mensal"
                name="monthlyValue"
                inputMode="numeric"
                placeholder="R$ 1.000,00"
                value={form.monthlyValue}
                onChange={handleCurrencyChange}
                onBlur={handleCurrencyBlur}
                error={fieldErrors.monthlyValue}
              />

              <Input
                label="Data de início"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                error={fieldErrors.startDate}
              />

              <Input
                label="Data de encerramento"
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
                error={fieldErrors.endDate}
              />
            </div>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-zinc-950">Conteúdo do contrato</h2>
              <p className="mt-1 text-sm text-zinc-500">Digite o texto base que será revisado antes do envio para assinatura.</p>
            </div>

            <Textarea
              name="content"
              placeholder="Digite o texto do contrato ou uma descrição inicial..."
              value={form.content}
              onChange={handleChange}
              error={fieldErrors.content}
            />
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <FileText size={18} strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-zinc-950">Revisar contrato</h2>
                <p className="mt-1 text-sm text-zinc-500">Confira os dados antes de salvar o rascunho.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Título</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{form.title || '-'}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Tipo</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{typeLabels[form.type] || '-'}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Parte relacionada</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{form.relatedParty || '-'}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Documento</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{form.documentNumber || '-'}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Valor total</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{formatCurrency(form.totalValue)}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Valor mensal</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{formatCurrency(form.monthlyValue)}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Data de início</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{formatDate(form.startDate)}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Data de encerramento</p>
                <p className="mt-1 text-sm font-medium text-zinc-950">{formatDate(form.endDate)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Conteúdo</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {form.content || '-'}
              </p>
            </div>
          </Card>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack}>
                <ArrowLeft size={15} strokeWidth={1.8} />
                Voltar etapa
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Link
              to="/contracts"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Cancelar
            </Link>

            {currentStep < steps.length ? (
              <Button type="button" onClick={handleNext} className="!text-white">
                {currentStep === steps.length - 1 ? 'Ir para revisão' : 'Próxima etapa'}
                <ArrowRight size={15} strokeWidth={1.8} />
              </Button>
            ) : (
              <Button type="button" onClick={handleCreateContract} disabled={loading} className="!text-white">
                <Save size={15} strokeWidth={1.8} />
                {loading ? 'Salvando...' : 'Criar contrato'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

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

export default function NewContract() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((state) => ({ ...state, [name]: value }));
    setFieldErrors((state) => ({ ...state, [name]: '' }));
  }

  function validate() {
    const errors = {};

    if (!form.title) errors.title = 'Informe o título do contrato.';
    if (!form.type) errors.type = 'Selecione o tipo do contrato.';
    if (!form.relatedParty) errors.relatedParty = 'Informe a parte relacionada.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      setError('');

      await api.post('/contracts', {
        title: form.title,
        type: form.type,
        relatedParty: form.relatedParty,
        documentNumber: form.documentNumber || null,
        totalValue: form.totalValue ? Number(form.totalValue) : null,
        monthlyValue: form.monthlyValue ? Number(form.monthlyValue) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        content: form.content || null,
        filledFields: {
          parteRelacionada: form.relatedParty,
          documento: form.documentNumber || null,
          valorTotal: form.totalValue || null,
          valorMensal: form.monthlyValue || null,
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
            Criar contrato
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Preencha os dados principais. O contrato começa como rascunho.
          </p>
        </div>

        <Link
          to="/contracts"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
          Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-950">Informações do contrato</h2>
            <p className="mt-1 text-sm text-zinc-500">Dados usados na listagem, assinatura e vínculo com obras.</p>
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
            />
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-950">Valores e vigência</h2>
            <p className="mt-1 text-sm text-zinc-500">Essas datas serão usadas para acompanhar vigência e vencimento.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Valor total"
              name="totalValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="5000"
              value={form.totalValue}
              onChange={handleChange}
            />

            <Input
              label="Valor mensal"
              name="monthlyValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="1000"
              value={form.monthlyValue}
              onChange={handleChange}
            />

            <Input
              label="Data de início"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
            />

            <Input
              label="Data de encerramento"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-950">Conteúdo do contrato</h2>
            <p className="mt-1 text-sm text-zinc-500">Pode ser simples nessa primeira versão. Depois ligamos isso aos templates.</p>
          </div>

          <Textarea
            name="content"
            placeholder="Digite o texto do contrato ou uma descrição inicial..."
            value={form.content}
            onChange={handleChange}
          />
        </Card>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Link
            to="/contracts"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Cancelar
          </Link>

          <Button disabled={loading}>
            <Save size={17} strokeWidth={1.8} />
            {loading ? 'Salvando...' : 'Salvar contrato'}
          </Button>
        </div>
      </form>
    </div>
  );
}

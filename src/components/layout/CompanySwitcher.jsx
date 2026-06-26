import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, Plus, X } from 'lucide-react';

import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function CompanySwitcher() {
  const { company, setCompany } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', phone: '' });

  const companyOptions = useMemo(() => {
    const base = company ? [company] : [];
    const all = [...base, ...companies];
    return all.filter((item, index, array) => item?.id && array.findIndex((x) => x.id === item.id) === index);
  }, [company, companies]);

  async function loadCompanies() {
    try {
      setLoading(true);
      const response = await api.get('/companies');
      setCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((state) => ({ ...state, [name]: value }));
  }

  async function handleCreateCompany(event) {
    event.preventDefault();

    if (!form.name) {
      setError('Informe o nome da empresa.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await api.post('/companies', {
        name: form.name,
        cnpj: form.cnpj || null,
        email: form.email || null,
        phone: form.phone || null
      });

      const createdCompany = response.data;
      setCompanies((state) => [createdCompany, ...state]);
      setCompany(createdCompany);
      setForm({ name: '', cnpj: '', email: '', phone: '' });
      setModalOpen(false);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível criar a empresa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative px-2">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2.5 text-left transition hover:border-zinc-300 hover:bg-white"
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <Building2 size={16} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-950">
              {company?.name || 'Selecionar empresa'}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {company?.cnpj || 'Ambiente atual'}
            </p>
          </div>
        </div>

        <ChevronDown size={16} className="shrink-0 text-zinc-400" strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="max-h-64 overflow-auto p-1.5">
            {loading && <p className="px-3 py-2 text-sm text-zinc-500">Carregando empresas...</p>}

            {!loading && companyOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-zinc-500">Nenhuma empresa encontrada.</p>
            )}

            {!loading && companyOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCompany(item);
                  setOpen(false);
                }}
                className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition hover:bg-zinc-50"
              >
                <span className="text-sm font-medium text-zinc-900">{item.name}</span>
                <span className="text-xs text-zinc-500">{item.cnpj || 'Sem CNPJ informado'}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-100 p-1.5">
            <button
              type="button"
              onClick={() => {
                setModalOpen(true);
                setOpen(false);
              }}
              className="flex h-10 w-full items-center gap-2 rounded-xl px-2.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              <Plus size={16} strokeWidth={1.8} />
              Adicionar empresa
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Adicionar empresa</h2>
                <p className="mt-1 text-sm text-zinc-500">Cadastre outra empresa para alternar o ambiente no sistema.</p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <Input label="Nome da empresa" name="name" placeholder="Empresa LTDA" value={form.name} onChange={handleChange} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="CNPJ" name="cnpj" placeholder="00000000000100" value={form.cnpj} onChange={handleChange} />
                <Input label="Telefone" name="phone" placeholder="62999999999" value={form.phone} onChange={handleChange} />
              </div>

              <Input label="E-mail" name="email" type="email" placeholder="contato@empresa.com" value={form.email} onChange={handleChange} />

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button disabled={saving}>{saving ? 'Salvando...' : 'Salvar empresa'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

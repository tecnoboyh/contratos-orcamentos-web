import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();

  const [form, setForm] = useState({ companyName: '', cnpj: '', name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((state) => ({ ...state, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/register', form);
      signIn(response.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <Building2 size={20} strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Criar conta da empresa</h1>
          <p className="mt-1 text-sm text-zinc-500">Cadastre a empresa e o primeiro usuário administrador.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nome da empresa" name="companyName" placeholder="Empresa LTDA" value={form.companyName} onChange={handleChange} />
              <Input label="CNPJ" name="cnpj" placeholder="00000000000100" value={form.cnpj} onChange={handleChange} />
            </div>

            <Input label="Seu nome" name="name" placeholder="Vinicius" value={form.name} onChange={handleChange} />
            <Input label="E-mail" name="email" type="email" placeholder="voce@empresa.com" value={form.email} onChange={handleChange} />
            <Input label="Senha" name="password" type="password" placeholder="Crie uma senha" value={form.password} onChange={handleChange} />

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <Button className="w-full" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</Button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Já tem conta? <Link to="/login" className="font-medium text-zinc-950">Entrar</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

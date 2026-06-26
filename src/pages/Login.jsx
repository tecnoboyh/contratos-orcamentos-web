import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
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
      const response = await api.post('/auth/login', form);
      signIn(response.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <FileText size={20} strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Acesse sua conta</h1>
          <p className="mt-1 text-sm text-zinc-500">Controle contratos, assinaturas e obras em um só lugar.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="E-mail" name="email" type="email" placeholder="voce@empresa.com" value={form.email} onChange={handleChange} />
            <Input label="Senha" name="password" type="password" placeholder="Digite sua senha" value={form.password} onChange={handleChange} />

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <Button className="w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Ainda não tem conta? <Link to="/register" className="font-medium text-zinc-950">Criar conta</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

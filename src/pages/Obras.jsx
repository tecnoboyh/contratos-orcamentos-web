import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Obras() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="dark">Obras</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">Gestão de obras</h1>
        <p className="mt-1 text-sm text-zinc-500">Obras vinculadas a contratos, custos, vistorias e roteiro de execução.</p>
      </div>

      <Card>
        <p className="text-sm text-zinc-500">Próxima etapa: listar obras reais e criar obra vinculada ao contrato.</p>
      </Card>
    </div>
  );
}

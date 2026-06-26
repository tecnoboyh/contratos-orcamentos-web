import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Signatures() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="dark">Assinaturas</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">Fila de assinaturas</h1>
        <p className="mt-1 text-sm text-zinc-500">Acompanhe contratos enviados por e-mail, WhatsApp ou ambos.</p>
      </div>

      <Card>
        <p className="text-sm text-zinc-500">Próxima etapa: criar tela para enviar contrato para vários assinantes.</p>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  Loader2,
  Printer,
  ReceiptText,
  ShoppingCart
} from 'lucide-react';

import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const obraStatusLabels = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizada',
  CANCELED: 'Cancelada'
};

const budgetVariants = {
  ON_TRACK: 'success',
  NEAR_LIMIT: 'warning',
  OVER_BUDGET: 'danger',
  WITHOUT_BUDGET: 'default'
};

const costCategoryLabels = {
  MATERIAL: 'Material',
  LABOR: 'Mão de obra',
  EQUIPMENT: 'Equipamento',
  SERVICE: 'Serviço',
  OTHER: 'Outro'
};

const purchaseStatusLabels = {
  DRAFT: 'Rascunho',
  ISSUED: 'Emitida',
  APPROVED: 'Aprovada',
  CANCELED: 'Cancelada'
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}


function addPdfFooter(doc) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Página ${page} de ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }
}

function safeText(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function InfoBox({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 print:rounded-none print:border-zinc-300 print:p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 print:text-[10px]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-zinc-950 print:text-sm">
        {value || '-'}
      </p>
      {helper && (
        <p className="mt-1 text-xs text-zinc-500">
          {helper}
        </p>
      )}
    </div>
  );
}

export default function ReportObraView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReport() {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/reports/obras/${id}`);
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível carregar o relatório da obra.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [id]);

  function handleDownloadPdf() {
    if (!report) return;

    const obra = report.obra || {};
    const summary = report.summary || {};
    const budget = summary.budget || {};

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    function ensureSpace(height = 20) {
      if (y + height > 276) {
        doc.addPage();
        y = 16;
      }
    }

    function sectionTitle(title) {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(24, 24, 27);
      doc.text(title, margin, y);
      y += 7;
    }

    function normalText(text, options = {}) {
      const maxWidth = options.maxWidth || pageWidth - margin * 2;
      const lines = doc.splitTextToSize(safeText(text), maxWidth);

      ensureSpace(lines.length * 5 + 4);
      doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
      doc.setFontSize(options.size || 10);
      doc.setTextColor(options.color || 82, options.color || 82, options.color || 91);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    }

    doc.setProperties({
      title: `Relatório de obra - ${safeText(obra.name)}`,
      subject: 'Relatório de obra',
      creator: 'Sistema de Controle de Contratos'
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 27);
    doc.text('Relatório de obra', margin, y);
    y += 8;

    doc.setFontSize(13);
    doc.text(safeText(obra.name), margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(82, 82, 91);
    doc.text(`Gerado em ${formatDateTime(report.generatedAt)}`, margin, y);
    y += 10;

    if (obra.description) {
      normalText(obra.description);
    }

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.6, overflow: 'linebreak' },
      headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
      body: [
        ['Empresa', safeText(report.company?.name)],
        ['CNPJ da empresa', safeText(report.company?.cnpj)],
        ['Contrato vinculado', safeText(report.contract?.title || 'Sem contrato vinculado')],
        ['Parte relacionada', safeText(report.contract?.relatedParty)],
        ['Local da obra', safeText(obra.location)],
        ['Status da obra', safeText(obraStatusLabels[obra.status] || obra.status)],
        ['Início', formatDate(obra.startDate)],
        ['Encerramento', formatDate(obra.endDate)]
      ]
    });

    y = doc.lastAutoTable.finalY + 10;
    sectionTitle('Resumo financeiro e operacional');

    autoTable(doc, {
      startY: y,
      theme: 'striped',
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.6, overflow: 'linebreak' },
      headStyles: { fillColor: [244, 244, 245], textColor: [39, 39, 42], fontStyle: 'bold' },
      head: [['Indicador', 'Valor']],
      body: [
        ['Progresso', `${summary.progress || 0}%`],
        ['Orçamento previsto', formatCurrency(summary.expectedBudget)],
        ['Orçamento realizado', formatCurrency(summary.realizedBudget)],
        ['Uso do orçamento', `${budget.usagePercent || 0}%`],
        ['Situação orçamentária', safeText(budget.label)],
        ['Saldo', formatCurrency(budget.difference)],
        ['Total de custos', safeText(summary.totalCosts)],
        ['Total de vistorias', safeText(summary.totalVistorias)],
        ['Total de O.C.', safeText(summary.totalPurchaseOrders)]
      ]
    });

    y = doc.lastAutoTable.finalY + 10;
    sectionTitle('Roteiro da obra');

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 2.4, overflow: 'linebreak' },
      headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
      head: [['Etapa', 'Fase', 'Status', 'Conclusão']],
      body: (report.steps || []).map((step) => [
        `${safeText(step.title)}\n${safeText(step.description)}`,
        safeText(step.phase),
        step.isCompleted ? 'Concluída' : 'Pendente',
        formatDate(step.completedAt)
      ])
    });

    y = doc.lastAutoTable.finalY + 10;
    sectionTitle('Custos por categoria');

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.6, overflow: 'linebreak' },
      headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
      head: [['Categoria', 'Lançamentos', 'Total']],
      body: (report.costs?.byCategory?.length ? report.costs.byCategory : []).map((item) => [
        safeText(costCategoryLabels[item.category] || item.category),
        safeText(item.items),
        formatCurrency(item.total)
      ])
    });

    y = doc.lastAutoTable.finalY + 10;
    sectionTitle('Vistorias');

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.6, overflow: 'linebreak' },
      headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
      head: [['Tipo', 'Descrição', 'Data']],
      body: [
        ['Inicial', safeText(report.vistorias?.initial?.description || 'Não registrada'), formatDate(report.vistorias?.initial?.performedAt)],
        ['Final', safeText(report.vistorias?.final?.description || 'Não registrada'), formatDate(report.vistorias?.final?.performedAt)]
      ]
    });

    y = doc.lastAutoTable.finalY + 10;
    sectionTitle('Ordens de compra');

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 2.4, overflow: 'linebreak' },
      headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: 'bold' },
      head: [['Número', 'Fornecedor', 'Status', 'Valor', 'Emissão']],
      body: (report.purchaseOrders?.items?.length ? report.purchaseOrders.items : []).map((order) => [
        safeText(order.number),
        safeText(order.supplier),
        safeText(purchaseStatusLabels[order.status] || order.status),
        formatCurrency(order.totalValue),
        formatDate(order.issuedAt)
      ])
    });

    addPdfFooter(doc);
    doc.save(`relatorio-obra-${safeText(obra.name).toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.pdf`);
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="animate-spin" size={18} strokeWidth={1.8} />
          Carregando relatório...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const obra = report?.obra || {};
  const summary = report?.summary || {};
  const budget = summary.budget || {};

  return (
    <div className="min-h-screen px-4 py-6 print:min-h-0 print:bg-white print:p-0">
      <style>
        {`
          @page {
            size: A4;
            margin: 12mm;
          }

          @media print {
            html,
            body,
            #root {
              width: auto !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
            }

            #root > div {
              display: block !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            aside,
            header,
            .no-print {
              display: none !important;
            }

            main,
            .report-page {
              overflow: visible !important;
            }

            .report-page {
              box-shadow: none !important;
              border: 0 !important;
              border-radius: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
            }

            .print-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            table {
              width: 100% !important;
              table-layout: fixed !important;
              page-break-inside: auto;
            }

            thead {
              display: table-header-group;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            td,
            th {
              word-break: break-word;
            }
          }
        `}
      </style>

      <div className="no-print mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" onClick={() => navigate('/reports')}>
          <ArrowLeft size={15} strokeWidth={1.8} />
          Voltar
        </Button>

        <Button type="button" onClick={handleDownloadPdf} className="!text-white">
          <Printer size={15} strokeWidth={1.8} />
          Baixar PDF
        </Button>
      </div>

      <div className="report-page mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] print:bg-white">
        <section className="print-section border-b border-zinc-200 pb-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white print:hidden">
                <FileBarChart size={21} strokeWidth={1.8} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Relatório de obra
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 print:text-2xl">
                {obra.name}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                {obra.description || 'Relatório operacional e financeiro da obra selecionada.'}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <Badge variant="dark">
                {obraStatusLabels[obra.status] || obra.status || 'Status'}
              </Badge>
              <p className="mt-3 text-xs text-zinc-500">
                Gerado em {formatDateTime(report?.generatedAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="print-section mt-6 grid gap-4 md:grid-cols-2">
          <InfoBox
            label="Empresa"
            value={report?.company?.name}
            helper={report?.company?.cnpj ? `CNPJ: ${report.company.cnpj}` : 'Sem CNPJ informado'}
          />

          <InfoBox
            label="Contrato vinculado"
            value={report?.contract?.title || 'Sem contrato vinculado'}
            helper={report?.contract?.relatedParty || ''}
          />
        </section>

        <section className="print-section mt-6 grid gap-4 md:grid-cols-4">
          <InfoBox label="Progresso" value={`${summary.progress || 0}%`} />
          <InfoBox label="Orçamento previsto" value={formatCurrency(summary.expectedBudget)} />
          <InfoBox label="Orçamento realizado" value={formatCurrency(summary.realizedBudget)} />
          <InfoBox label="Uso do orçamento" value={`${budget.usagePercent || 0}%`} helper={budget.label || ''} />
        </section>

        <section className="print-section mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 print:rounded-none print:bg-white print:p-4">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-950">
              <BarChart3 size={18} strokeWidth={1.8} />
              Situação financeira
            </h2>

            <Badge variant={budgetVariants[budget.status] || 'default'}>
              {budget.label || 'Sem análise'}
            </Badge>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-zinc-950"
              style={{ width: `${Math.min(budget.usagePercent || 0, 100)}%` }}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <p className="text-sm text-zinc-600">
              Previsto: <strong className="text-zinc-950">{formatCurrency(summary.expectedBudget)}</strong>
            </p>
            <p className="text-sm text-zinc-600">
              Realizado: <strong className="text-zinc-950">{formatCurrency(summary.realizedBudget)}</strong>
            </p>
            <p className="text-sm text-zinc-600">
              Saldo: <strong className="text-zinc-950">{formatCurrency(budget.difference)}</strong>
            </p>
          </div>
        </section>

        <section className="print-section mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950">
            <ClipboardList size={18} strokeWidth={1.8} />
            Roteiro da obra
          </h2>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 print:rounded-none">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 font-medium">Fase</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Conclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {report?.steps?.map((step) => (
                  <tr key={step.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-950">{step.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{step.description || 'Sem descrição'}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{step.phase}</td>
                    <td className="px-4 py-3">
                      <Badge variant={step.isCompleted ? 'success' : 'default'}>
                        {step.isCompleted ? 'Concluída' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(step.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="print-section mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950">
            <ReceiptText size={18} strokeWidth={1.8} />
            Custos por categoria
          </h2>

          {report?.costs?.byCategory?.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {report.costs.byCategory.map((item) => (
                <div key={item.category} className="rounded-2xl border border-zinc-200 bg-white p-4 print:rounded-none">
                  <p className="text-sm font-semibold text-zinc-950">
                    {costCategoryLabels[item.category] || item.category}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{item.items} lançamento(s)</p>
                  <p className="mt-3 text-lg font-semibold text-zinc-950">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 print:rounded-none">
              Nenhum custo lançado para esta obra.
            </p>
          )}
        </section>

        <section className="print-section mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950">
            <CheckCircle2 size={18} strokeWidth={1.8} />
            Vistorias
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 print:rounded-none">
              <p className="text-sm font-semibold text-zinc-950">Vistoria inicial</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {report?.vistorias?.initial?.description || 'Não registrada'}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Data: {formatDate(report?.vistorias?.initial?.performedAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 print:rounded-none">
              <p className="text-sm font-semibold text-zinc-950">Vistoria final</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {report?.vistorias?.final?.description || 'Não registrada'}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Data: {formatDate(report?.vistorias?.final?.performedAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="print-section mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950">
            <ShoppingCart size={18} strokeWidth={1.8} />
            Ordens de compra
          </h2>

          {report?.purchaseOrders?.items?.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 print:rounded-none">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Emissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {report.purchaseOrders.items.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-medium text-zinc-950">{order.number}</td>
                      <td className="px-4 py-3 text-zinc-600">{order.supplier || '-'}</td>
                      <td className="px-4 py-3 text-zinc-600">{purchaseStatusLabels[order.status] || order.status}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-950">{formatCurrency(order.totalValue)}</td>
                      <td className="px-4 py-3 text-zinc-600">{formatDate(order.issuedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 print:rounded-none">
              Nenhuma ordem de compra vinculada a esta obra.
            </p>
          )}
        </section>

        <section className="mt-8 border-t border-zinc-200 pt-5 text-xs text-zinc-400">
          Relatório gerado pelo sistema de controle de contratos e gestão orçamentária.
        </section>
      </div>
    </div>
  );
}

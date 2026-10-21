import React, { useState } from 'react';
import { StockMovement, EPIItem } from '../types/epi';
import { CURRENT_DATE_STR } from '../services/storage';
import { PrintReportHeader, PrintReportFooter } from '../components/PrintReportHeader';
import { AuditReportModal } from '../components/AuditReportModal';
import { PDFGenerator } from '../utils/pdfGenerator';
import {
  History,
  Download,
  RotateCcw,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  FileText,
  FileDown,
  Loader2,
} from 'lucide-react';

interface MovementsAuditViewProps {
  movements: StockMovement[];
  epis: EPIItem[];
  onResetData: () => void;
  onOpenNewMovement: () => void;
  onOpenHeaderConfig?: () => void;
}

export const MovementsAuditView: React.FC<MovementsAuditViewProps> = ({
  movements,
  epis,
  onResetData,
  onOpenNewMovement,
  onOpenHeaderConfig,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const filtered = movements.filter((mov) => {
    const matchesSearch =
      mov.epiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.invoiceNumber && mov.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (mov.supplier && mov.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (typeFilter !== 'todos' && mov.type !== typeFilter) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Tipo',
      'Equipamento',
      'Quantidade',
      'Nota Fiscal',
      'Fornecedor',
      'Responsável',
      'Justificativa',
    ];

    const rows = filtered.map((m) => [
      m.date,
      m.type,
      `"${m.epiName.replace(/"/g, '""')}"`,
      m.quantity,
      m.invoiceNumber ?? '',
      m.supplier ? `"${m.supplier.replace(/"/g, '""')}"` : '',
      `"${m.responsible.replace(/"/g, '""')}"`,
      m.reasonNotes ? `"${m.reasonNotes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_epi_movimentacoes_${CURRENT_DATE_STR}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((r) => setTimeout(r, 60));
      await PDFGenerator.generateMovementsAuditPDF(filtered, epis, typeFilter, searchTerm);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Official Print Header */}
      <PrintReportHeader
        title="RELATÓRIO TÉCNICO DE AUDITORIA DE MOVIMENTAÇÕES DE EPI — SESMT"
        subtitle="Registro cronológico oficial de entradas fiscais, custódia e baixas de EPI (NR-6 / Portaria MTP nº 2.175/2022 / eSocial S-2240)"
      />

      {/* Official Print Technical Summary KPI Block */}
      <div className="hidden print:grid print:grid-cols-4 gap-3 my-3 text-xs">
        <div className="border border-slate-300 p-2.5 rounded bg-slate-50">
          <span className="block text-[10px] text-slate-500 uppercase font-bold">Total Operações</span>
          <span className="text-sm font-bold font-mono text-slate-900">{filtered.length} registros</span>
        </div>
        <div className="border border-slate-300 p-2.5 rounded bg-emerald-50/50">
          <span className="block text-[10px] text-emerald-700 uppercase font-bold">Entradas / Compras</span>
          <span className="text-sm font-bold font-mono text-emerald-800">
            +{filtered.filter((m) => m.type === 'entrada' || m.type === 'devolucao').reduce((a, b) => a + b.quantity, 0)} un.
          </span>
        </div>
        <div className="border border-slate-300 p-2.5 rounded bg-blue-50/50">
          <span className="block text-[10px] text-blue-700 uppercase font-bold">Saídas / Entregas NR-6</span>
          <span className="text-sm font-bold font-mono text-blue-900">
            -{filtered.filter((m) => m.type === 'saida_entrega').reduce((a, b) => a + b.quantity, 0)} un.
          </span>
        </div>
        <div className="border border-slate-300 p-2.5 rounded bg-rose-50/50">
          <span className="block text-[10px] text-rose-700 uppercase font-bold">Baixas / Descarte</span>
          <span className="text-sm font-bold font-mono text-rose-800">
            {filtered.filter((m) => m.type === 'baixa_descarte').length} ocorrências
          </span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Livro de Movimentações e Auditoria SST
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rastreabilidade de entradas com NF-e, baixas por entrega e descartes para comprovação fiscal
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Button 'Gerar Relatório' */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/30 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Abrir prévia e relatório técnico completo de auditoria para impressão ou download em PDF"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Gerar Relatório</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Baixar diretamente o arquivo PDF oficial com todas as páginas"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{isGeneratingPDF ? 'Gerando PDF...' : 'Baixar PDF'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Imprimir visualização atual diretamente no navegador"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            CSV
          </button>
          <button
            onClick={onOpenNewMovement}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            Lançar Movimentação
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por item, responsável, NF ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todos os Tipos de Registro</option>
            <option value="entrada">Entradas / Compras</option>
            <option value="saida_entrega">Saídas por Entrega a Colaborador</option>
            <option value="baixa_descarte">Baixas por Descarte / Avaria</option>
            <option value="ajuste">Ajustes de Inventário</option>
            <option value="devolucao">Devoluções ao Estoque</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Equipamento de Proteção (EPI)</th>
                <th className="py-3 px-3 text-center">Quantidade</th>
                <th className="py-3 px-4">NF-e / Fornecedor</th>
                <th className="py-3 px-4">Responsável Técnico</th>
                <th className="py-3 px-4">Justificativa / Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((mov) => {
                const isEntry = mov.type === 'entrada' || mov.type === 'devolucao';

                return (
                  <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-700">
                      {mov.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {mov.type === 'entrada' && (
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                          Entrada / Compra
                        </span>
                      )}
                      {mov.type === 'saida_entrega' && (
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 inline-flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-slate-500" />
                          Saída Entrega
                        </span>
                      )}
                      {mov.type === 'baixa_descarte' && (
                        <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          Baixa / Descarte
                        </span>
                      )}
                      {mov.type === 'ajuste' && (
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Ajuste Inventário
                        </span>
                      )}
                      {mov.type === 'devolucao' && (
                        <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Devolução ao Estoque
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{mov.epiName}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span className={isEntry ? 'text-emerald-700' : 'text-slate-800'}>
                        {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {mov.invoiceNumber && (
                        <div className="font-mono text-slate-900 font-medium">
                          {mov.invoiceNumber}
                        </div>
                      )}
                      {mov.supplier && <div className="text-[11px] text-slate-500">{mov.supplier}</div>}
                      {!mov.invoiceNumber && !mov.supplier && <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{mov.responsible}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {mov.reasonNotes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo Reset Box */}
      <div className="no-print p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <strong className="text-slate-800 block">Ambiente de Demonstração e Testes SST</strong>
          <span className="text-slate-500">
            Os dados são mantidos em armazenamento local. Você pode reiniciar os dados padrão a qualquer momento.
          </span>
        </div>
        <button
          onClick={onResetData}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Dados Padrão (NR-6)
        </button>
      </div>

      {/* Official Print Report Footer */}
      <PrintReportFooter />

      {/* Technical Audit Report Modal */}
      <AuditReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        movements={filtered}
        epis={epis}
        filterType={typeFilter}
        searchTerm={searchTerm}
        onOpenHeaderConfig={onOpenHeaderConfig}
      />
    </div>
  );
};

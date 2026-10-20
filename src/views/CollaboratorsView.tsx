import React, { useState } from 'react';
import { Collaborator, EPIDelivery, EPIItem } from '../types/epi';
import { getDaysDifference, CURRENT_DATE_STR } from '../services/storage';
import { PrintReportHeader, PrintReportFooter } from '../components/PrintReportHeader';
import {
  Users,
  Search,
  UserPlus,
  FileText,
  Send,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Shield,
  Building,
  Printer,
  Download,
  FileDown,
  Loader2,
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';
import { PDFGenerator } from '../utils/pdfGenerator';

interface CollaboratorsViewProps {
  collaborators: Collaborator[];
  deliveries: EPIDelivery[];
  epis: EPIItem[];
  onOpenNewCollaborator: () => void;
  onEditCollaborator: (colab: Collaborator) => void;
  onViewFicha: (colab: Collaborator) => void;
  onNewDeliveryForColab: (colabId: string) => void;
}

export const CollaboratorsView: React.FC<CollaboratorsViewProps> = ({
  collaborators,
  deliveries,
  epis,
  onOpenNewCollaborator,
  onEditCollaborator,
  onViewFicha,
  onNewDeliveryForColab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('todos');

  // Unique departments
  const departments = Array.from(new Set(collaborators.map((c) => c.department)));

  const filteredCollaborators = collaborators.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf.includes(searchTerm) ||
      c.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (deptFilter !== 'todos' && c.department !== deptFilter) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Matrícula',
      'Nome Completo',
      'CPF',
      'Cargo / Função',
      'Setor / Departamento',
      'Turno',
      'Data de Admissão',
      'Status Cadastral',
      'Tamanho Calçado',
      'Tamanho Luva',
      'Tamanho Uniforme',
      'EPIs em Custódia (Uso)',
      'Trocas Periódicas Atrasadas',
    ];

    const rows = filteredCollaborators.map((colab) => {
      const colabDeliveries = deliveries.filter((d) => d.collaboratorId === colab.id);
      const activeDeliveries = colabDeliveries.filter((d) => d.status === 'em_uso');
      const overdueDeliveries = activeDeliveries.filter(
        (d) => getDaysDifference(d.expectedExchangeDate) < 0
      );

      return [
        colab.registration,
        colab.name,
        colab.cpf,
        colab.role,
        colab.department,
        colab.shift,
        colab.admissionDate,
        colab.status === 'ativo' ? 'Ativo' : colab.status === 'ferias' ? 'Férias' : 'Afastado',
        colab.shoeSize || '-',
        colab.gloveSize || '-',
        colab.uniformSize || '-',
        activeDeliveries.length,
        overdueDeliveries.length > 0 ? `Sim (${overdueDeliveries.length})` : 'Não (Em dia)',
      ];
    });

    downloadCSV(`relatorio_colaboradores_epi_${CURRENT_DATE_STR}.csv`, headers, rows);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((r) => setTimeout(r, 60));
      PDFGenerator.generateCollaboratorsPDF(filteredCollaborators, searchTerm);
    } catch (err) {
      console.error('Erro ao gerar PDF de colaboradores:', err);
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
        title="RELATÓRIO GERAL DE COLABORADORES E CONFORMIDADE DE EPIS"
        subtitle="Quadro de empregados ativos, matrículas, cargos e status de equipamentos fornecidos (NR-6)"
      />

      {/* Screen Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Colaboradores e Fichas de EPI (NR-6)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de trabalhadores, controle de equipamentos em uso e emissão de termos
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Exportar lista de colaboradores para planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Baixar relação de colaboradores em formato PDF"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>Baixar PDF</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Imprimir visualização em papel via impressora do navegador"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={onOpenNewCollaborator}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            Cadastrar Colaborador
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por nome, CPF, matrícula ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todos os Setores ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Workers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCollaborators.map((colab) => {
          const colabDeliveries = deliveries.filter((d) => d.collaboratorId === colab.id);
          const activeDeliveries = colabDeliveries.filter((d) => d.status === 'em_uso');

          // Check if any active delivery is overdue
          const overdueDeliveries = activeDeliveries.filter(
            (d) => getDaysDifference(d.expectedExchangeDate) < 0
          );

          return (
            <div
              key={colab.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-500">
                    {colab.registration}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                      colab.status === 'ativo'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {colab.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{colab.name}</h3>
                <div className="text-xs text-slate-600 font-medium">{colab.role}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {colab.department} · Turno: {colab.shift}
                </div>
              </div>

              {/* Status & Gear In Use */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">EPIs Ativos em Posse:</span>
                  <strong className="font-mono text-slate-900">
                    {activeDeliveries.length} itens
                  </strong>
                </div>

                {overdueDeliveries.length > 0 ? (
                  <div className="text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {overdueDeliveries.length} EPI com troca periódica atrasada!
                    </span>
                  </div>
                ) : (
                  <div className="text-emerald-700 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Equipamentos em dia e conformes</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                  <span>CPF: <strong className="font-mono text-slate-700">{colab.cpf}</strong></span>
                  <span>Calçado: <strong className="text-slate-700">{colab.shoeSize ?? '-'}</strong></span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewFicha(colab)}
                  className="flex-1 py-1.5 px-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Ficha NR-6
                </button>
                <button
                  onClick={() => onNewDeliveryForColab(colab.id)}
                  className="py-1.5 px-3 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3 text-amber-400" />
                  Entregar
                </button>
                <button
                  onClick={() => onEditCollaborator(colab)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title="Editar dados"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Print Table (for physical file) */}
      <div className="hidden print:block overflow-hidden border border-slate-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 font-semibold border-b border-slate-300">
            <tr>
              <th className="py-2 px-3">Matrícula</th>
              <th className="py-2 px-3">Nome do Empregado</th>
              <th className="py-2 px-3">CPF</th>
              <th className="py-2 px-3">Função / Cargo</th>
              <th className="py-2 px-3">Setor</th>
              <th className="py-2 px-2 text-center">EPIs Ativos</th>
              <th className="py-2 px-3">Conformidade NR-6</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCollaborators.map((colab) => {
              const colabDeliveries = deliveries.filter((d) => d.collaboratorId === colab.id);
              const activeDeliveries = colabDeliveries.filter((d) => d.status === 'em_uso');
              const overdue = activeDeliveries.filter(
                (d) => getDaysDifference(d.expectedExchangeDate) < 0
              );

              return (
                <tr key={colab.id}>
                  <td className="py-2 px-3 font-mono font-bold">{colab.registration}</td>
                  <td className="py-2 px-3 font-semibold">{colab.name}</td>
                  <td className="py-2 px-3 font-mono">{colab.cpf}</td>
                  <td className="py-2 px-3">{colab.role}</td>
                  <td className="py-2 px-3">{colab.department}</td>
                  <td className="py-2 px-2 text-center font-mono">{activeDeliveries.length}</td>
                  <td className="py-2 px-3">
                    {overdue.length > 0 ? (
                      <span className="font-bold text-rose-700">
                        {overdue.length} item(ns) com troca atrasada
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Regular (Conforme NR-6)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Official Print Report Footer */}
      <PrintReportFooter />
    </div>
  );
};

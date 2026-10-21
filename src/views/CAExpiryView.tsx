import React, { useState } from 'react';
import { EPIItem, EPIDelivery, Collaborator } from '../types/epi';
import { CURRENT_DATE_STR, getDaysDifference, CATEGORY_LABELS } from '../services/storage';
import { PrintReportHeader, PrintReportFooter } from '../components/PrintReportHeader';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  ExternalLink,
  ShieldAlert,
  FileCheck,
  Calendar,
  Building,
  Printer,
  Download,
  FileDown,
  Loader2,
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';
import { PDFGenerator } from '../utils/pdfGenerator';

interface CAExpiryViewProps {
  epis: EPIItem[];
  deliveries: EPIDelivery[];
  collaborators: Collaborator[];
  onViewCADetails: (epi: EPIItem) => void;
  onEditEPI: (epi: EPIItem) => void;
  onOpenNewDelivery: (colabId?: string, epiId?: string) => void;
}

export const CAExpiryView: React.FC<CAExpiryViewProps> = ({
  epis,
  deliveries,
  collaborators,
  onViewCADetails,
  onEditEPI,
  onOpenNewDelivery,
}) => {
  const [activeTab, setActiveTab] = useState<'ca' | 'colaborador' | 'consulta'>('ca');
  const [searchTerm, setSearchTerm] = useState('');
  const [caQueryNumber, setCaQueryNumber] = useState('');
  const [queriedEpi, setQueriedEpi] = useState<EPIItem | null>(null);
  const [hasQueried, setHasQueried] = useState(false);

  // CA List sorted by expiry date ascending (closest or expired first)
  const sortedEpis = [...epis].sort((a, b) => {
    return getDaysDifference(a.caExpiryDate) - getDaysDifference(b.caExpiryDate);
  });

  const filteredEpis = sortedEpis.filter((e) => {
    return (
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.caNumber.includes(searchTerm) ||
      e.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Active deliveries sorted by expected exchange date ascending
  const activeDeliveries = deliveries
    .filter((d) => d.status === 'em_uso')
    .sort((a, b) => {
      return getDaysDifference(a.expectedExchangeDate) - getDaysDifference(b.expectedExchangeDate);
    });

  const handleSimulateCaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasQueried(true);
    const found = epis.find((item) => item.caNumber.trim() === caQueryNumber.trim());
    setQueriedEpi(found ?? null);
  };

  const handleExportCSV = () => {
    if (activeTab === 'colaborador') {
      const headers = [
        'Colaborador',
        'CPF',
        'Matrícula',
        'Cargo / Função',
        'Setor',
        'Equipamento (EPI)',
        'C.A. (MTE)',
        'Data da Entrega',
        'Data Limite de Troca',
        'Dias Restantes / Atraso',
        'Situação da Troca',
      ];

      const rows = activeDeliveries.map((del) => {
        const daysLeft = getDaysDifference(del.expectedExchangeDate);
        const situation =
          daysLeft < 0
            ? `ATRASADO (${Math.abs(daysLeft)} dias)`
            : daysLeft <= 7
            ? `CRÍTICO (${daysLeft} dias)`
            : daysLeft <= 30
            ? `Atenção (${daysLeft} dias)`
            : 'Regular';

        return [
          del.collaboratorName,
          del.collaboratorCpf,
          del.collaboratorRegistration,
          del.collaboratorRole,
          del.collaboratorDepartment,
          del.epiName,
          del.caNumber,
          del.deliveryDate,
          del.expectedExchangeDate,
          daysLeft,
          situation,
        ];
      });

      downloadCSV(`cronograma_trocas_epi_${CURRENT_DATE_STR}.csv`, headers, rows);
    } else {
      const headers = [
        'Código',
        'Nome do Equipamento (EPI)',
        'Categoria',
        'Número do C.A.',
        'Data de Validade C.A.',
        'Dias até Vencimento',
        'Situação C.A. (MTE)',
        'Fabricante',
        'Saldo em Estoque',
      ];

      const rows = filteredEpis.map((epi) => {
        const days = getDaysDifference(epi.caExpiryDate);
        const caStatus =
          days < 0
            ? 'VENCIDO'
            : days <= 30
            ? `Vence em ${days} dias`
            : 'Válido';

        return [
          epi.code,
          epi.name,
          CATEGORY_LABELS[epi.category] || epi.category,
          epi.caNumber,
          epi.caExpiryDate,
          days,
          caStatus,
          epi.manufacturer,
          epi.stockQuantity,
        ];
      });

      downloadCSV(`relatorio_validade_ca_${CURRENT_DATE_STR}.csv`, headers, rows);
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((r) => setTimeout(r, 60));
      await PDFGenerator.generateCAExpiryPDF(filteredEpis, deliveries, activeTab, searchTerm);
    } catch (err) {
      console.error('Erro ao gerar PDF de C.A.:', err);
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
        title={
          activeTab === 'ca'
            ? 'RELATÓRIO DE MONITORAMENTO DE CERTIFICADOS DE APROVAÇÃO (MTE/CAEPI)'
            : 'CRONOGRAMA DE TROCA PERIÓDICA DE EQUIPAMENTOS EM OPERAÇÃO'
        }
        subtitle="Controle preventivo contra multas da fiscalização trabalhista e garantia da integridade do colaborador (NR-6)"
      />

      {/* Screen Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Painel de Validades, C.A. e Prazos de Troca
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle preventivo contra multas da fiscalização do trabalho e garantia de integridade do trabalhador
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Exportar dados atuais para planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Baixar relatório oficial de C.A. em formato PDF"
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
            title="Imprimir relatório físico via impressora do navegador"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir</span>
          </button>

          {/* Tab switch */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('ca')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'ca'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Validade dos C.A.s (MTE)
            </button>
            <button
              onClick={() => setActiveTab('colaborador')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'colaborador'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trocas por Colaborador
            </button>
            <button
              onClick={() => setActiveTab('consulta')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'consulta'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Consulta C.A.
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: C.A. Expirations */}
      {activeTab === 'ca' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por C.A., equipamento ou fabricante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-mono">
              <span className="flex items-center gap-1 text-rose-700 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {epis.filter((e) => e.caStatus === 'vencido').length} C.A. Vencido
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {epis.filter((e) => e.caStatus === 'a_vencer').length} C.A. a Vencer (&lt;30d)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">C.A. (MTE)</th>
                  <th className="py-3 px-4">Equipamento / Modelo</th>
                  <th className="py-3 px-4">Fabricante</th>
                  <th className="py-3 px-4">Data Vencimento C.A.</th>
                  <th className="py-3 px-4">Dias Restantes</th>
                  <th className="py-3 px-4">Situação MTE</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEpis.map((item) => {
                  const daysToCaExpiry = getDaysDifference(item.caExpiryDate);
                  const isExpired = daysToCaExpiry < 0;
                  const isSoon = daysToCaExpiry >= 0 && daysToCaExpiry <= 30;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpired ? 'bg-rose-50/30' : isSoon ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onViewCADetails(item)}
                          className="font-mono font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 text-xs"
                        >
                          C.A. {item.caNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.code}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{item.manufacturer}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.caExpiryDate}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {isExpired ? (
                          <span className="text-rose-700 font-bold">
                            Vencido há {Math.abs(daysToCaExpiry)} dias
                          </span>
                        ) : isSoon ? (
                          <span className="text-amber-700 font-semibold">
                            {daysToCaExpiry} dias restantes
                          </span>
                        ) : (
                          <span className="text-emerald-700">
                            {daysToCaExpiry} dias de vigência
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isExpired ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Não Conforme (NR-6)
                          </span>
                        ) : isSoon ? (
                          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Renovação Urgente
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            C.A. Regular
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewCADetails(item)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            Ver C.A.
                          </button>
                          <button
                            onClick={() => onEditEPI(item)}
                            className="px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                          >
                            Renovar Data
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Collaborator Exchange Schedule */}
      {activeTab === 'colaborador' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
            <div>
              <h2 className="font-semibold text-slate-900">
                Cronograma de Troca Periódica de EPIs em Operação
              </h2>
              <p className="text-slate-500 mt-0.5">
                Previsão de reposição calculada a partir da data de fornecimento e vida útil
              </p>
            </div>
            <span className="font-mono text-slate-500">
              {activeDeliveries.length} EPIs sob custódia
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Colaborador / Setor</th>
                  <th className="py-3 px-4">EPI em Uso</th>
                  <th className="py-3 px-4">C.A.</th>
                  <th className="py-3 px-4">Data Fornecimento</th>
                  <th className="py-3 px-4">Previsão da Troca</th>
                  <th className="py-3 px-4">Status da Periodicidade</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDeliveries.map((del) => {
                  const daysToExchange = getDaysDifference(del.expectedExchangeDate);
                  const isOverdue = daysToExchange < 0;
                  const isSoon = daysToExchange >= 0 && daysToExchange <= 7;

                  return (
                    <tr
                      key={del.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-rose-50/30' : isSoon ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {del.collaboratorName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {del.collaboratorRegistration} · {del.collaboratorDepartment}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{del.epiName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-800">
                        {del.caNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {del.deliveryDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {del.expectedExchangeDate}
                      </td>
                      <td className="py-3 px-4">
                        {isOverdue ? (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Atrasada ({Math.abs(daysToExchange)} dias)
                          </span>
                        ) : isSoon ? (
                          <span className="text-amber-700 font-semibold">
                            Substituir em {daysToExchange} dias
                          </span>
                        ) : (
                          <span className="text-emerald-700">
                            Vida útil regular ({daysToExchange}d)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenNewDelivery(del.collaboratorId, del.epiId)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          Realizar Troca
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Official CA Query Simulator */}
      {activeTab === 'consulta' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Consulta Rápida de Certificado de Aprovação (CAEPI)
              </h2>
              <p className="text-slate-500 mt-1">
                Verifique a situação cadastral do C.A. de qualquer EPI registrado na empresa
              </p>
            </div>

            <form onSubmit={handleSimulateCaSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o número do C.A. (ex: 15682, 38504, 32844, 20358...)"
                value={caQueryNumber}
                onChange={(e) => setCaQueryNumber(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                Consultar
              </button>
            </form>

            {hasQueried && (
              <div className="pt-4 border-t border-slate-200">
                {queriedEpi ? (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-amber-600" />
                        <span className="font-bold font-mono text-base text-slate-900">
                          C.A. {queriedEpi.caNumber}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                          queriedEpi.caStatus === 'valido'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        Status: {queriedEpi.caStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-slate-400 block">Equipamento:</span>
                        <strong>{queriedEpi.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Fabricante:</span>
                        <strong>{queriedEpi.manufacturer}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Validade no MTE:</span>
                        <strong className="font-mono">{queriedEpi.caExpiryDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Normas de Teste:</span>
                        <span className="font-mono">{queriedEpi.approvalNorms}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => onViewCADetails(queriedEpi)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
                      >
                        Ver Ficha Completa do C.A.
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-center">
                    C.A. não localizado no inventário ativo. Verifique a numeração digitada.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Print Report Footer */}
      <PrintReportFooter />
    </div>
  );
};

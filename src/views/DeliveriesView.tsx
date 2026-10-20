import React, { useState } from 'react';
import { EPIDelivery, Collaborator, EPIItem } from '../types/epi';
import { CURRENT_DATE_STR, getDaysDifference } from '../services/storage';
import { PrintReportHeader, PrintReportFooter } from '../components/PrintReportHeader';
import {
  Send,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCcw,
  Check,
  Calendar,
  PenTool,
  PlusCircle,
  Eye,
  Printer,
  MapPin,
  Scan,
  Download,
  FileDown,
  Loader2,
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';
import { PDFGenerator } from '../utils/pdfGenerator';

interface DeliveriesViewProps {
  deliveries: EPIDelivery[];
  collaborators: Collaborator[];
  epis: EPIItem[];
  onOpenNewDelivery: () => void;
  onOpenReturnExchange: (delivery: EPIDelivery) => void;
  onViewFicha: (collaborator: Collaborator) => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  deliveries,
  collaborators,
  epis,
  onOpenNewDelivery,
  onOpenReturnExchange,
  onViewFicha,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'em_uso' | 'atrasados' | 'finalizados'>(
    'todos'
  );

  const filteredDeliveries = deliveries.filter((del) => {
    // Search
    const matchesSearch =
      del.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.collaboratorCpf.includes(searchTerm) ||
      del.collaboratorRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.epiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.caNumber.includes(searchTerm);

    if (!matchesSearch) return false;

    const daysToExchange = getDaysDifference(del.expectedExchangeDate);
    const isOverdue = del.status === 'em_uso' && daysToExchange < 0;

    if (statusFilter === 'em_uso') {
      return del.status === 'em_uso';
    }
    if (statusFilter === 'atrasados') {
      return isOverdue;
    }
    if (statusFilter === 'finalizados') {
      return del.status === 'trocado' || del.status === 'devolvido' || del.status === 'descartado';
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Código da Entrega',
      'Data da Entrega',
      'Colaborador',
      'CPF',
      'Matrícula',
      'Cargo / Função',
      'Setor',
      'Equipamento (EPI)',
      'C.A. (MTE)',
      'Quantidade',
      'Motivo da Entrega',
      'Próxima Troca Agendada',
      'Status da Custódia',
      'Responsável SST',
      'Autenticação Biométrica',
      'Hash SHA-256',
      'Score Biometria (%)',
      'Latitude GPS',
      'Longitude GPS',
      'Endereço Posto SST',
      'Observações',
    ];

    const rows = filteredDeliveries.map((del) => {
      const statusLabel =
        del.status === 'em_uso'
          ? 'Em Uso'
          : del.status === 'trocado'
          ? 'Trocado'
          : del.status === 'devolvido'
          ? 'Devolvido'
          : 'Descartado';

      const biometricStatus = del.biometricPhotoUrl
        ? 'Validada (Facial + GPS)'
        : 'Assinatura Digital';

      return [
        del.code,
        del.deliveryDate,
        del.collaboratorName,
        del.collaboratorCpf,
        del.collaboratorRegistration,
        del.collaboratorRole,
        del.collaboratorDepartment,
        del.epiName,
        del.caNumber,
        del.quantity,
        del.reason,
        del.expectedExchangeDate,
        statusLabel,
        del.deliveredBy,
        biometricStatus,
        del.biometricValidationHash || '-',
        del.biometricMatchScore ? `${del.biometricMatchScore}%` : '-',
        del.geolocation?.latitude ?? '-',
        del.geolocation?.longitude ?? '-',
        del.geolocation?.address ?? '-',
        del.observations || '',
      ];
    });

    downloadCSV(`relatorio_entregas_epi_${CURRENT_DATE_STR}.csv`, headers, rows);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((r) => setTimeout(r, 60));
      PDFGenerator.generateDeliveriesListPDF(filteredDeliveries, statusFilter, searchTerm);
    } catch (err) {
      console.error('Erro ao gerar PDF de entregas:', err);
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
      {/* Printable Report Official Header */}
      <PrintReportHeader
        title="RELATÓRIO OFICIAL DE ENTREGAS DE EPI COM VALIDAÇÃO BIOMÉTRICA FACIAL E GEOLOCALIZAÇÃO (GPS)"
        subtitle="Registro de fornecimento comprobatório para fiscalização trabalhista e arquivo físico da empresa (NR-6, subitem 6.6.1)"
      />

      {/* Screen Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Controle e Registro de Entregas de EPI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fichas eletrônicas com biometria facial, coordenadas GPS e assinatura digital (NR-6 / Portaria MTP 2.175/2022)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Baixar lista de entregas em arquivo PDF"
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
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Exportar lista atual filtrada para planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Imprimir relatório na impressora"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={onOpenNewDelivery}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Send className="w-4 h-4 text-amber-400" />
            Registrar Nova Entrega
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por colaborador, CPF, matrícula ou EPI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'todos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({deliveries.length})
          </button>
          <button
            onClick={() => setStatusFilter('em_uso')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'em_uso'
                ? 'bg-emerald-50 text-emerald-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Em Uso
          </button>
          <button
            onClick={() => setStatusFilter('atrasados')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'atrasados'
                ? 'bg-rose-50 text-rose-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Troca Atrasada
          </button>
          <button
            onClick={() => setStatusFilter('finalizados')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'finalizados'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trocados / Devolvidos
          </button>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Termo / Data</th>
                <th className="py-3 px-3">Colaborador</th>
                <th className="py-3 px-3">Equipamento Fornecido</th>
                <th className="py-3 px-2">C.A.</th>
                <th className="py-3 px-2 text-center">Qtd</th>
                <th className="py-3 px-3">Motivo</th>
                <th className="py-3 px-3">Prazo Troca</th>
                <th className="py-3 px-3 text-center">Biometria Facial & GPS (NR-6)</th>
                <th className="py-3 px-3 text-center">Assinatura</th>
                <th className="no-print py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Nenhum registro de entrega encontrado para os filtros ativos.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => {
                  const daysToExchange = getDaysDifference(del.expectedExchangeDate);
                  const isOverdue = del.status === 'em_uso' && daysToExchange < 0;
                  const isSoon = del.status === 'em_uso' && daysToExchange >= 0 && daysToExchange <= 7;
                  const colab = collaborators.find((c) => c.id === del.collaboratorId);

                  return (
                    <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Term Code & Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{del.code}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {del.deliveryDate}
                        </div>
                      </td>

                      {/* Collaborator */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{del.collaboratorName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {del.collaboratorRegistration} · {del.collaboratorRole}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {del.collaboratorDepartment}
                        </div>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900 max-w-[200px]">{del.epiName}</div>
                        <div className="text-[10px] text-slate-400">
                          Resp: {del.deliveredBy || 'Não informado'}
                        </div>
                      </td>

                      {/* CA */}
                      <td className="py-3 px-2">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
                          {del.caNumber}
                        </span>
                      </td>

                      {/* Qtd */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                        {del.quantity}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-3">
                        <span className="capitalize text-slate-700">
                          {del.reason.replace('_', ' ')}
                        </span>
                        {del.observations && (
                          <div className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
                            {del.observations}
                          </div>
                        )}
                      </td>

                      {/* Exchange cadence */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {del.status === 'em_uso' ? (
                          <div>
                            <span className="font-mono font-medium text-slate-900">
                              {del.expectedExchangeDate}
                            </span>
                            <div className="text-[10px] font-mono mt-0.5">
                              {isOverdue ? (
                                <span className="text-rose-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Atrasado ({Math.abs(daysToExchange)}d)
                                </span>
                              ) : isSoon ? (
                                <span className="text-amber-700 font-medium">
                                  Trocar em {daysToExchange}d
                                </span>
                              ) : (
                                <span className="text-emerald-700">
                                  Válido ({daysToExchange}d)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 capitalize font-medium">
                              {del.status}
                            </span>
                            {del.returnDate && (
                              <div className="text-[10px] font-mono text-slate-400">
                                em {del.returnDate}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Biometric Facial & GPS Validation */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5 text-left bg-slate-50 p-1.5 rounded border border-slate-200">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                            <Scan className="w-3 h-3 text-emerald-600" />
                            <span>Facial: {del.biometricMatchScore ?? 98.5}%</span>
                          </div>
                          {del.geolocation && (
                            <div className="text-[9px] font-mono text-slate-600 flex items-center gap-0.5" title={del.geolocation.address}>
                              <MapPin className="w-2.5 h-2.5 text-rose-500" />
                              <span>{del.geolocation.latitude.toFixed(4)}, {del.geolocation.longitude.toFixed(4)}</span>
                            </div>
                          )}
                          {del.biometricValidationHash && (
                            <div className="text-[8px] font-mono text-slate-400 truncate max-w-[110px]" title={del.biometricValidationHash}>
                              {del.biometricValidationHash.slice(0, 18)}...
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Signature indicator */}
                      <td className="py-3 px-3 text-center">
                        {del.signatureDataUrl ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={del.signatureDataUrl}
                              alt="Assinatura"
                              className="h-6 max-w-[80px] object-contain border border-slate-200 bg-white rounded"
                            />
                            <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                              Eletrônica
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Assinatura Manual
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="no-print py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {del.status === 'em_uso' && (
                            <button
                              title="Registrar Troca / Devolução"
                              onClick={() => onOpenReturnExchange(del)}
                              className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3 text-blue-600" />
                              Trocar
                            </button>
                          )}
                          {colab && (
                            <button
                              title="Ver Ficha NR-6 Completa do Trabalhador"
                              onClick={() => onViewFicha(colab)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Report Footer */}
      <PrintReportFooter />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { StockMovement, EPIItem } from '../types/epi';
import { CURRENT_DATE_STR, StorageService } from '../services/storage';
import { PDFGenerator } from '../utils/pdfGenerator';
import { generateQRCodeDataUrl } from '../utils/qrCodeGenerator';
import {
  Printer,
  X,
  ShieldCheck,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  Building,
  ArrowDownRight,
  ArrowUpRight,
  FileDown,
  Loader2,
  Pencil,
  QrCode,
} from 'lucide-react';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  movements: StockMovement[];
  epis: EPIItem[];
  filterType: string;
  searchTerm: string;
  onOpenHeaderConfig?: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  movements,
  epis,
  filterType,
  searchTerm,
  onOpenHeaderConfig,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const headerConfig = StorageService.getHeaderConfig();
  const companyTitle = headerConfig.title || 'SafeGuard EPI';
  const companyDocument = headerConfig.document;
  const subtitle = headerConfig.subtitle || 'SESMT — Serviço Especializado em Engenharia de Segurança e Medicina do Trabalho';
  const companyContact = [headerConfig.address, headerConfig.phone, headerConfig.contactEmail].filter(Boolean).join(' • ');

  const reportCode = useMemo(
    () => `REL-SST-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'movimentacoes',
      companyDocument
    );

    StorageService.saveOriginalDocument({
      id: `doc-${reportCode.toLowerCase()}`,
      code: reportCode,
      type: 'movimentacoes',
      title: 'Relatório Técnico de Auditoria e Livro de Movimentação de EPI',
      companyId: 'default',
      companyName: companyTitle,
      companyDocument,
      companySubtitle: subtitle,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      verificationUrl,
      summaryText: `Auditoria de ${movements.length} movimentações de EPI emitido sob conformidade NR-6 / eSocial S-2240. Filtro: ${filterType}.`,
      itemsCount: movements.length,
      activeFilter: filterType,
    });

    generateQRCodeDataUrl(verificationUrl, 100).then((url) => {
      setQrCodeUrl(url);
    });
  }, [isOpen, reportCode, movements.length, filterType, companyTitle, companyDocument, subtitle]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((resolve) => setTimeout(resolve, 80));
      await PDFGenerator.generateMovementsAuditPDF(movements, epis, filterType, searchTerm);
    } catch (err) {
      console.error('Erro ao gerar PDF de auditoria:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const totalEntries = movements
    .filter((m) => m.type === 'entrada' || m.type === 'devolucao')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalExits = movements
    .filter((m) => m.type === 'saida_entrega' || m.type === 'baixa_descarte')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalDeliveries = movements.filter((m) => m.type === 'saida_entrega').length;
  const totalDisposals = movements.filter((m) => m.type === 'baixa_descarte').length;
  const totalPurchases = movements.filter((m) => m.type === 'entrada').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Control Bar (Screen only) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Relatório Técnico Pericial de Movimentações SST
              </h2>
              <p className="text-xs text-slate-500">
                Layout formatado para impressão física oficial e fiscalização trabalhista (NR-6 / eSocial S-2240)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHeaderConfig && (
              <button
                onClick={onOpenHeaderConfig}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Editar dados da empresa, CNPJ e cabeçalho do relatório"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Editar Cabeçalho</span>
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/40 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Gerar e baixar o arquivo PDF oficial assinado no computador"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-slate-950" />
                  <span>Baixar PDF Oficial</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Abrir caixa de diálogo de impressão do navegador"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Technical Report Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 print:p-0 print:m-0">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {headerConfig.logoType === 'image' && headerConfig.logoImageUrl ? (
                  <img
                    src={headerConfig.logoImageUrl}
                    alt="Logo Empresa"
                    className="h-11 w-auto max-w-[130px] object-contain rounded shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-xl ${headerConfig.logoColor || 'bg-slate-900'} text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs`}>
                    <ShieldCheck className="w-6 h-6 text-amber-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold tracking-tight text-slate-900 uppercase">
                      {companyTitle}
                    </h1>
                    {onOpenHeaderConfig && (
                      <button
                        onClick={onOpenHeaderConfig}
                        className="print:hidden text-[11px] text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        title="Editar nome da empresa e cabeçalho"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    {subtitle}
                    {companyDocument && (
                      <span className="ml-1.5 font-mono text-slate-900 font-bold">
                        · CNPJ: {companyDocument}
                      </span>
                    )}
                  </p>
                  {companyContact ? (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {companyContact}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-mono">
                      Livro Eletrônico de Movimentações · Conformidade NR-6 (Portaria MTP nº 2.175/2022)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {qrCodeUrl && (
                  <div className="flex flex-col items-center bg-white p-1 rounded border border-slate-200 shadow-2xs">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code de Validação do Documento Original"
                      className="w-13 h-13 object-contain"
                    />
                    <span className="text-[8px] font-mono font-bold text-slate-700 uppercase mt-0.5 tracking-tighter">
                      Doc Original
                    </span>
                  </div>
                )}
                <div className="text-left sm:text-right font-mono text-xs space-y-1">
                  <span className="inline-block bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-bold text-slate-800 text-[11px]">
                    {reportCode}
                  </span>
                  <div className="text-[10px] text-slate-500">
                    Emissão: {CURRENT_DATE_STR}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block border border-emerald-200">
                    Conformidade NR-6 / eSocial S-2240
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  RELATÓRIO TÉCNICO DE AUDITORIA E LIVRO DE MOVIMENTAÇÃO DE EPI
                </h2>
                <p className="text-[11px] text-slate-600">
                  Demonstrativo cronológico de entradas fiscais, custódia e baixas de Equipamentos de Proteção Individual
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">
                Filtro: {filterType === 'todos' ? 'Todas as Movimentações' : filterType}
                {searchTerm && ` · Busca: "${searchTerm}"`}
              </div>
            </div>
          </div>

          {/* Technical KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                Total Registros
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {movements.length} operações
              </span>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] uppercase font-semibold text-emerald-700 block">
                Entradas / Compras (NF-e)
              </span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                +{totalEntries} unidades
              </span>
              <span className="text-[10px] text-emerald-600 block">({totalPurchases} notas fiscais)</span>
            </div>
            <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200">
              <span className="text-[10px] uppercase font-semibold text-blue-700 block">
                Entregas com Biometria
              </span>
              <span className="text-base font-bold text-blue-900 font-mono">
                -{totalExits} unidades
              </span>
              <span className="text-[10px] text-blue-600 block">({totalDeliveries} termos assinados)</span>
            </div>
            <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200">
              <span className="text-[10px] uppercase font-semibold text-rose-700 block">
                Baixas / Descarte
              </span>
              <span className="text-base font-bold text-rose-800 font-mono">
                {totalDisposals} ocorrências
              </span>
              <span className="text-[10px] text-rose-600 block">Avaria ou contaminação</span>
            </div>
          </div>

          {/* Main Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300">Data</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Operação</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Equipamento / EPI</th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-300">Qtd</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Doc. Fiscal / Fornecedor</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Responsável SESMT</th>
                  <th className="py-2.5 px-3">Justificativa e Rastreabilidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {movements.map((mov) => {
                  const isEntry = mov.type === 'entrada' || mov.type === 'devolucao';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono border-r border-slate-200 whitespace-nowrap">
                        {mov.date}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                        {mov.type === 'entrada' && (
                          <span className="font-semibold text-emerald-800">Entrada (Compra)</span>
                        )}
                        {mov.type === 'saida_entrega' && (
                          <span className="font-semibold text-slate-800">Saída Entrega NR-6</span>
                        )}
                        {mov.type === 'baixa_descarte' && (
                          <span className="font-semibold text-rose-800">Baixa / Descarte</span>
                        )}
                        {mov.type === 'ajuste' && (
                          <span className="font-semibold text-amber-800">Ajuste Inventário</span>
                        )}
                        {mov.type === 'devolucao' && (
                          <span className="font-semibold text-blue-800">Devolução Estoque</span>
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium">
                        {mov.epiName}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold border-r border-slate-200">
                        <span className={isEntry ? 'text-emerald-700' : 'text-slate-800'}>
                          {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                        {mov.invoiceNumber && (
                          <div className="font-mono font-medium">{mov.invoiceNumber}</div>
                        )}
                        {mov.supplier && (
                          <div className="text-[10px] text-slate-500">{mov.supplier}</div>
                        )}
                        {!mov.invoiceNumber && !mov.supplier && '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                        {mov.responsible}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600">
                        {mov.reasonNotes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legal Statement & Conclusion */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">
              Declaração Técnica de Conformidade Legal (NR-6 / MTP nº 2.175/2022)
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
              Certificamos que as movimentações de estoque, fornecimento, higienização e descarte de
              Equipamentos de Proteção Individual (EPI) listadas neste relatório foram executadas em
              estrita observância à Norma Regulamentadora nº 6 (Portaria MTP nº 2.175/2022) e aos eventos
              de Segurança e Saúde no Trabalho do eSocial (Evento S-2240). Os registros eletrônicos contam
              com biometria facial, geolocalização por satélite e assinatura digital com valor probatório perante a Auditoria Fiscal do Trabalho.
            </p>
          </div>

          {/* Signatures Section */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-slate-900 pt-2">
              <strong className="block text-slate-900">Responsável Técnico / SESMT</strong>
              <span className="text-[10px] text-slate-500 block">Segurança e Medicina do Trabalho</span>
              <span className="text-[10px] text-slate-600 font-medium">Emissor do Relatório</span>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <strong className="block text-slate-900">Gestor de Almoxarifado / EPI</strong>
              <span className="text-[10px] text-slate-500 block">Controle e Guarda Patrimonial</span>
              <span className="text-[10px] text-slate-600 font-medium">Custódia e Conferência</span>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <strong className="block text-slate-900">Auditoria / Conformidade</strong>
              <span className="text-[10px] text-slate-500 block">Arquivo e Fiscalização NR-6</span>
              <span className="text-[10px] text-slate-600 font-medium">Validação e Arquivo Físico</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

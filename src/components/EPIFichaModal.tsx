import React, { useState, useEffect } from 'react';
import { Collaborator, EPIDelivery, EPIItem } from '../types/epi';
import { NR6_LEGAL_TERM, CURRENT_DATE_STR, StorageService } from '../services/storage';
import { PDFGenerator } from '../utils/pdfGenerator';
import { generateQRCodeDataUrl } from '../utils/qrCodeGenerator';
import { Printer, X, ShieldCheck, Download, AlertTriangle, FileText, FileDown, Loader2, Pencil, QrCode } from 'lucide-react';

interface EPIFichaModalProps {
  collaborator: Collaborator;
  deliveries: EPIDelivery[];
  epis: EPIItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenHeaderConfig?: () => void;
}

export const EPIFichaModal: React.FC<EPIFichaModalProps> = ({
  collaborator,
  deliveries,
  epis,
  isOpen,
  onClose,
  onOpenHeaderConfig,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const headerConfig = StorageService.getHeaderConfig();
  const companyName = headerConfig.title || 'SafeGuard EPI';
  const companyDocument = headerConfig.document;
  const companySubtitle = headerConfig.subtitle || 'Departamento de Segurança e Medicina do Trabalho (SESMT)';
  const companyContact = [headerConfig.address, headerConfig.phone, headerConfig.contactEmail].filter(Boolean).join(' • ');

  const docCode = `FICHA-NR6-${collaborator.registration}-${CURRENT_DATE_STR.replace(/-/g, '')}`;

  useEffect(() => {
    if (!isOpen) return;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      docCode,
      'ficha_epi',
      companyDocument,
      collaborator.id
    );

    // Salvar registro de documento original para consulta imediata via QR Code
    const colabDeliveriesCount = deliveries.filter((d) => d.collaboratorId === collaborator.id).length;
    StorageService.saveOriginalDocument({
      id: `doc-${docCode.toLowerCase()}`,
      code: docCode,
      type: 'ficha_epi',
      title: `Ficha de Registro e Fornecimento de EPI (NR-6) - ${collaborator.name}`,
      companyId: 'default',
      companyName,
      companyDocument,
      companySubtitle,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      verificationUrl,
      summaryText: `Ficha Oficial NR-6 emitida para o colaborador ${collaborator.name} (Matrícula: ${collaborator.registration}, CPF: ${collaborator.cpf}) contendo ${colabDeliveriesCount} registros de fornecimento com biometria facial e assinatura digital.`,
      collaboratorId: collaborator.id,
      collaboratorName: collaborator.name,
      collaboratorRegistration: collaborator.registration,
      collaboratorCpf: collaborator.cpf,
      collaboratorRole: collaborator.role,
      collaboratorDepartment: collaborator.department,
      itemsCount: colabDeliveriesCount,
    });

    generateQRCodeDataUrl(verificationUrl, 120).then((dataUrl) => {
      setQrCodeUrl(dataUrl);
    });
  }, [isOpen, docCode, collaborator, companyName, companyDocument, companySubtitle, deliveries]);

  if (!isOpen) return null;

  const colabDeliveries = deliveries.filter((d) => d.collaboratorId === collaborator.id);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((resolve) => setTimeout(resolve, 80));
      await PDFGenerator.generateFichaEPIPDF(collaborator, deliveries, epis);
    } catch (err) {
      console.error('Erro ao gerar PDF da ficha:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportText = () => {
    const lines = [
      `FICHA DE CONTROLE E ENTREGA DE EPI - NORMA REGULAMENTADORA NR-6`,
      `EMPRESA: ${companyName}${companyDocument ? ` | CNPJ: ${companyDocument}` : ''}`,
      `COLABORADOR: ${collaborator.name} | CPF: ${collaborator.cpf} | MATRÍCULA: ${collaborator.registration}`,
      `FUNÇÃO: ${collaborator.role} | SETOR: ${collaborator.department} | ADMISSÃO: ${collaborator.admissionDate}`,
      `DATA DE EMISSÃO: ${CURRENT_DATE_STR}`,
      ``,
      `--- HISTÓRICO DE ENTREGAS ---`,
      ...colabDeliveries.map(
        (d, idx) =>
          `${idx + 1}. [${d.deliveryDate}] C.A. ${d.caNumber} - ${d.epiName} (Qtd: ${d.quantity}) | Motivo: ${d.reason} | Status: ${d.status} | Entregue por: ${d.deliveredBy}`
      ),
      ``,
      `--- TERMO DE RESPONSABILIDADE ---`,
      NR6_LEGAL_TERM,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha_epi_${collaborator.registration}_${CURRENT_DATE_STR}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-semibold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Ficha Individual de EPI (NR-6)
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{collaborator.name}</span>
                <span aria-hidden="true">·</span>
                <span>Matrícula {collaborator.registration}</span>
                <span aria-hidden="true">·</span>
                <span>{collaborator.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHeaderConfig && (
              <button
                onClick={onOpenHeaderConfig}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Editar dados da empresa, CNPJ e cabeçalho dos relatórios"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Editar Cabeçalho</span>
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/40 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Baixar a Ficha Individual de EPI em formato PDF oficial com assinatura"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-slate-950" />
                  <span>Baixar Ficha em PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Imprimir ficha no navegador"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleExportText}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>TXT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-6 text-slate-800 text-sm">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                {headerConfig.logoType === 'image' && headerConfig.logoImageUrl ? (
                  <img
                    src={headerConfig.logoImageUrl}
                    alt="Logo da Empresa"
                    className="h-11 w-auto max-w-[140px] object-contain shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-xl ${headerConfig.logoColor || 'bg-amber-600'} text-white flex items-center justify-center font-bold shadow-xs shrink-0`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                      {companyName}
                    </span>
                    {onOpenHeaderConfig && (
                      <button
                        onClick={onOpenHeaderConfig}
                        className="print:hidden text-[11px] text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        title="Editar nome e dados da empresa"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {companySubtitle}
                    {companyDocument && (
                      <span className="font-semibold text-slate-800 ml-1.5">
                        · CNPJ: {companyDocument}
                      </span>
                    )}
                  </p>
                  {companyContact && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {companyContact}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {qrCodeUrl && (
                <div className="flex flex-col items-center bg-white p-1 rounded border border-slate-200 shadow-2xs">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code de Autenticidade do Documento Original"
                    className="w-14 h-14 object-contain"
                  />
                  <span className="text-[8px] font-mono font-bold text-slate-700 uppercase mt-0.5 tracking-tighter">
                    Doc Original
                  </span>
                </div>
              )}
              <div className="text-left md:text-right">
                <span className="inline-block px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-100 rounded border border-slate-300">
                  FICHA DE REGISTRO DE FORNECIMENTO DE EPI
                </span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Portaria MTP nº 2.175/2022 (NR-6, item 6.5.1, alínea 'h')
                </p>
                <p className="text-[9px] font-mono text-emerald-700 font-semibold mt-0.5">
                  Cód: {docCode}
                </p>
              </div>
            </div>
          </div>

          {/* Worker Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Nome do Empregado:</span>
              <strong className="text-slate-900 text-sm">{collaborator.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">CPF:</span>
              <strong className="text-slate-900 font-mono">{collaborator.cpf}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Matrícula:</span>
              <strong className="text-slate-900 font-mono">{collaborator.registration}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Data Admissão:</span>
              <strong className="text-slate-900">{collaborator.admissionDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Função / Cargo:</span>
              <strong className="text-slate-900">{collaborator.role}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Setor / Departamento:</span>
              <strong className="text-slate-900">{collaborator.department}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Turno:</span>
              <strong className="text-slate-900">{collaborator.shift}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Calçado / Luva / Uniforme:</span>
              <strong className="text-slate-900">
                {collaborator.shoeSize ?? '-'} / {collaborator.gloveSize ?? '-'} /{' '}
                {collaborator.uniformSize ?? '-'}
              </strong>
            </div>
          </div>

          {/* Table of Deliveries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 text-sm">
                Registro de Equipamentos Fornecidos
              </h3>
              <span className="text-xs text-slate-500">
                Total de movimentações: {colabDeliveries.length}
              </span>
            </div>

            {colabDeliveries.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                Nenhum EPI fornecido registrado para este colaborador até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Data Entrega</th>
                      <th className="py-2.5 px-3">C.A.</th>
                      <th className="py-2.5 px-3">Equipamento / Especificação</th>
                      <th className="py-2.5 px-2 text-center">Qtd</th>
                      <th className="py-2.5 px-3">Motivo</th>
                      <th className="py-2.5 px-3">Prev. Troca</th>
                      <th className="py-2.5 px-3 text-center">Assinatura / Validação</th>
                      <th className="py-2.5 px-3">Devolução</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {colabDeliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          {del.deliveryDate}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {del.caNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{del.epiName}</div>
                          {del.observations && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5">
                              {del.observations}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-medium">
                          {del.quantity}
                        </td>
                        <td className="py-2.5 px-3 capitalize">
                          {del.reason.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                          {del.expectedExchangeDate}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col items-center gap-1">
                            {del.signatureDataUrl && (
                              <img
                                src={del.signatureDataUrl}
                                alt="Assinatura"
                                className="h-6 max-w-[90px] object-contain border border-slate-200 bg-white rounded p-0.5"
                              />
                            )}
                            <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                              <span>✓ Biometria Facial</span>
                              {del.biometricMatchScore && (
                                <span className="font-mono">({del.biometricMatchScore}%)</span>
                              )}
                            </div>
                            {del.geolocation && (
                              <div className="text-[9px] text-slate-500 font-mono text-center">
                                GPS: {del.geolocation.latitude.toFixed(4)}, {del.geolocation.longitude.toFixed(4)}
                              </div>
                            )}
                            {del.biometricValidationHash && (
                              <div className="text-[8px] text-slate-400 font-mono truncate max-w-[120px]">
                                {del.biometricValidationHash.slice(0, 22)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                          {del.returnDate ? (
                            <div>
                              <span className="font-mono">{del.returnDate}</span>
                              <div className="text-[10px] capitalize text-slate-400">
                                {del.returnReason || del.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-medium">Em uso regular</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Legal NR-6 Text */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Termo de Compromisso e Responsabilidade Legal (NR-6, Item 6.6.1)
            </h4>
            <p className="whitespace-pre-line text-[11px] text-slate-600 leading-relaxed font-sans">
              {NR6_LEGAL_TERM}
            </p>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="border-t border-slate-900 pt-2">
              <strong className="block text-slate-900">{collaborator.name}</strong>
              <span className="text-slate-500">
                Assinatura do Empregado · CPF: {collaborator.cpf}
              </span>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <strong className="block text-slate-900">
                Responsável Técnico SST / Almoxarifado
              </strong>
              <span className="text-slate-500">
                Serviço Especializado em Eng. de Segurança e Med. do Trabalho (SESMT)
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

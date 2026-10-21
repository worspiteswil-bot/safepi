import React, { useState, useEffect } from 'react';
import { OriginalDocumentRecord, StorageService } from '../services/storage';
import { generateQRCodeDataUrl } from '../utils/qrCodeGenerator';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Search,
  Lock,
  Download,
  Printer,
  Sparkles,
} from 'lucide-react';

interface DocumentValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentCode?: string;
  onViewCollaboratorFicha?: (colabId: string) => void;
}

export const DocumentValidationModal: React.FC<DocumentValidationModalProps> = ({
  isOpen,
  onClose,
  documentCode,
  onViewCollaboratorFicha,
}) => {
  const [searchCode, setSearchCode] = useState<string>(documentCode || '');
  const [foundDoc, setFoundDoc] = useState<OriginalDocumentRecord | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Load document whenever modal opens or documentCode prop changes
  useEffect(() => {
    if (isOpen) {
      const codeToSearch = documentCode || searchCode;
      if (codeToSearch) {
        setSearchCode(codeToSearch);
        const doc = StorageService.getOriginalDocument(codeToSearch);
        setFoundDoc(doc);
        setHasSearched(true);
      } else {
        // List recent document if available
        const all = StorageService.getOriginalDocuments();
        if (all.length > 0) {
          setFoundDoc(all[0]);
          setSearchCode(all[0].code);
          setHasSearched(true);
        } else {
          setFoundDoc(null);
          setHasSearched(false);
        }
      }
    }
  }, [isOpen, documentCode]);

  // Generate QR code data URL whenever foundDoc changes
  useEffect(() => {
    if (foundDoc?.verificationUrl) {
      generateQRCodeDataUrl(foundDoc.verificationUrl, 200).then((url) => {
        setQrCodeUrl(url);
      });
    } else {
      setQrCodeUrl('');
    }
  }, [foundDoc]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    const doc = StorageService.getOriginalDocument(searchCode.trim());
    setFoundDoc(doc);
    setHasSearched(true);
  };

  const handleCopyLink = () => {
    if (foundDoc?.verificationUrl) {
      navigator.clipboard.writeText(foundDoc.verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const getTypeLabel = (type: OriginalDocumentRecord['type']) => {
    switch (type) {
      case 'ficha_epi':
        return 'Ficha Oficial de EPI (NR-6)';
      case 'entregas':
        return 'Relatório Oficial de Entregas & Biometria';
      case 'estoque':
        return 'Inventário Oficial de Estoque';
      case 'movimentacoes':
        return 'Relatório Técnico de Auditoria SST';
      case 'ca_validade':
        return 'Relatório de Conformidade de C.A.';
      case 'colaboradores':
        return 'Relação de Empregados & Fichas';
      case 'dashboard':
        return 'Relatório Executivo Geral de SST';
      default:
        return 'Documento Oficial SST';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Autenticidade do Documento Original
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NR-6 / Portaria 672
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verificação de fé pública, integridade criptográfica e validade jurídica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-700">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Insira o código do documento ou hash SHA-256 (Ex: FICHA-NR6-..., REL-SST-...)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verificar</span>
            </button>
          </form>

          {foundDoc ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Authenticity Certificate Banner */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl flex items-start gap-3.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-950 text-sm tracking-tight uppercase">
                      Documento Original Autêntico e Íntegro
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-200/60 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      REGISTRO CERTIFICADO
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Este documento foi gerado pelo sistema informatizado de controle da empresa e cumpre integralmente os requisitos da Norma Regulamentadora nº 6 (subitens 6.5.1, 'h' e 6.6.1) e Portarias MTP nº 672/2021 e nº 2.175/2022.
                  </p>
                </div>
              </div>

              {/* Main Document Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Left 2 Cols: Details */}
                <div className="sm:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Tipo de Documento</span>
                      <h3 className="font-bold text-slate-900 text-sm">{getTypeLabel(foundDoc.type)}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px] border border-amber-300">
                      {foundDoc.code}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-500">Empresa Emitente: </span>
                        <strong className="text-slate-900">{foundDoc.companyName}</strong>
                        {foundDoc.companyDocument && (
                          <span className="font-mono text-slate-600"> (CNPJ: {foundDoc.companyDocument})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-slate-500">Data e Hora de Emissão: </span>
                        <strong className="font-mono text-slate-800">
                          {new Date(foundDoc.generatedAt).toLocaleString('pt-BR')}
                        </strong>
                      </div>
                    </div>

                    {foundDoc.collaboratorName && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <User className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-slate-500">Colaborador Titular: </span>
                          <strong className="text-slate-900">{foundDoc.collaboratorName}</strong>
                          {foundDoc.collaboratorRegistration && (
                            <span className="font-mono text-slate-600"> • Matrícula: {foundDoc.collaboratorRegistration}</span>
                          )}
                          {foundDoc.collaboratorCpf && (
                            <span className="font-mono text-slate-600"> • CPF: {foundDoc.collaboratorCpf}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {foundDoc.summaryText && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700 font-mono">
                        {foundDoc.summaryText}
                      </div>
                    )}

                    {/* Cryptographic SHA-256 Hash */}
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1 mb-0.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        FINGERPRINT CRIPTOGRÁFICO SHA-256 (INTEGRIDADE ICP-BRASIL):
                      </span>
                      <div className="font-mono text-[10px] bg-slate-900 text-emerald-400 p-2 rounded-lg border border-slate-800 break-all select-all">
                        {foundDoc.sha256Hash}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: QR Code Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center justify-between text-center space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      QR Code de Validação
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Aponte a câmera para abrir este documento original
                    </span>
                  </div>

                  {qrCodeUrl ? (
                    <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs inline-block">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code de Autenticidade"
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <QrCode className="w-8 h-8" />
                    </div>
                  )}

                  <div className="w-full space-y-1.5">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                      <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Direto'}</span>
                    </button>

                    {foundDoc.collaboratorId && onViewCollaboratorFicha && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewCollaboratorFicha(foundDoc.collaboratorId!);
                        }}
                        className="w-full py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Abrir Ficha de EPI</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Reference & Proof Note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Validade Jurídica perante Auditoria Fiscal do Trabalho (SIT/MTE) e eSocial S-2240:
                </span>
                <p className="leading-relaxed">
                  Os dados apresentados acima correspondem ao registro digital original lavrado na data indicada. A autenticidade pode ser confirmada a qualquer momento através do QR Code gravado no cabeçalho e rodapé do documento impresso ou digital.
                </p>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Documento Não Localizado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não encontramos nenhum documento emitido com o código "<strong>{searchCode}</strong>". Verifique se o código ou hash foi digitado corretamente.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <QrCode className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="font-bold text-slate-900 text-sm">Consulte a Autenticidade de Qualquer Relatório</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos os relatórios gerados pelo SafeEPI Pro contêm um QR Code exclusivo que aponta para o registro digital original do documento. Digite o código no campo acima ou aponte a câmera do seu celular para validar.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            SafeEPI Pro • Portal de Validação Digital NR-6
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { EPIItem } from '../types/epi';
import { CATEGORY_LABELS, CURRENT_DATE_STR, getDaysDifference } from '../services/storage';
import { X, ShieldCheck, AlertTriangle, CheckCircle, ExternalLink, Info, Building2, Calendar, FileCheck } from 'lucide-react';

interface CADetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  epi: EPIItem | null;
  onOpenEdit?: (epi: EPIItem) => void;
}

export const CADetailsModal: React.FC<CADetailsModalProps> = ({
  isOpen,
  onClose,
  epi,
  onOpenEdit,
}) => {
  if (!isOpen || !epi) return null;

  const daysToCaExpiry = getDaysDifference(epi.caExpiryDate);
  const isCaExpired = daysToCaExpiry < 0;
  const isNearExpiry = daysToCaExpiry >= 0 && daysToCaExpiry <= 30;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold font-mono text-sm border border-amber-200">
              C.A.
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Certificado de Aprovação Nº {epi.caNumber}
                </h2>
                {isCaExpired ? (
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Vencido
                  </span>
                ) : isNearExpiry ? (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Expira em {daysToCaExpiry} dias
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Válido no MTE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Ministério do Trabalho e Previdência · Sistema CAEPI Oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Status Banner */}
          {isCaExpired && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">C.A. Vencido no Ministério do Trabalho</strong>
                <span>
                  O prazo deste C.A. encerrou-se em {epi.caExpiryDate}. Pelo item 6.5.1 da NR-6, a empresa não pode mais adquirir nem fornecer este lote como EPI regular até a renovação oficial pelo fabricante.
                </span>
              </div>
            </div>
          )}

          {/* Core Info Cards */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block mb-0.5">Equipamento:</span>
              <strong className="text-slate-900 text-xs block leading-tight">{epi.name}</strong>
              <span className="font-mono text-slate-400 text-[11px]">{epi.code}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Categoria:</span>
              <strong className="text-slate-900">{CATEGORY_LABELS[epi.category]}</strong>
              <span className="text-slate-500 block mt-1">Localização:</span>
              <span className="text-slate-700">{epi.locationShelf}</span>
            </div>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Fabricante / Titular:
              </span>
              <strong className="text-slate-900">{epi.manufacturer}</strong>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" /> Modelo / Referência:
              </span>
              <span className="text-slate-900 font-medium">{epi.model}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data de Validade do C.A.:
              </span>
              <span className="font-mono font-bold text-slate-900">{epi.caExpiryDate}</span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Lote e Validade Física:</span>
              <span className="font-mono text-slate-700">
                {epi.batchNumber} {epi.productExpiryDate ? `(Val: ${epi.productExpiryDate})` : ''}
              </span>
            </div>

            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Periodicidade Recomendada de Troca:</span>
              <strong className="text-slate-900 font-mono">
                {epi.standardReplacementDays} dias
              </strong>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 block mb-1">Normas Técnicas de Homologação:</span>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-slate-700 text-[11px]">
                {epi.approvalNorms}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 block mb-1">Proteção e Aplicação de Risco:</span>
              <p className="text-slate-700 leading-relaxed">{epi.protectionDetails}</p>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 block mb-1">Instruções de Conservação e NR-6:</span>
              <p className="text-slate-600 leading-relaxed italic">{epi.instructions}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Base oficial: NR-6 / CAEPI MTE
          </div>
          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(epi);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Editar C.A. / Dados
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

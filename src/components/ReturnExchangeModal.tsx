import React, { useState } from 'react';
import { EPIDelivery, StockMovement } from '../types/epi';
import { CURRENT_DATE_STR } from '../services/storage';
import { X, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface ReturnExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: EPIDelivery | null;
  onConfirmReturn: (
    updatedDelivery: EPIDelivery,
    movement?: StockMovement,
    returnStock?: boolean
  ) => void;
}

export const ReturnExchangeModal: React.FC<ReturnExchangeModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onConfirmReturn,
}) => {
  if (!isOpen || !delivery) return null;

  const [returnDate, setReturnDate] = useState<string>(CURRENT_DATE_STR);
  const [returnReason, setReturnReason] = useState<string>('Troca por desgaste operacional regular');
  const [returnCondition, setReturnCondition] = useState<EPIDelivery['returnCondition']>('desgastado');
  const [returnToStock, setReturnToStock] = useState<boolean>(false);
  const [inspector, setInspector] = useState<string>('Responsável Técnico / Almoxarifado');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedDelivery: EPIDelivery = {
      ...delivery,
      status: returnToStock ? 'devolvido' : 'trocado',
      returnDate,
      returnReason,
      returnCondition,
    };

    let movement: StockMovement | undefined;
    if (returnToStock) {
      movement = {
        id: `mov-${Date.now()}`,
        epiId: delivery.epiId,
        epiName: delivery.epiName,
        type: 'devolucao',
        quantity: delivery.quantity,
        date: returnDate,
        responsible: inspector,
        reasonNotes: `Devolução em bom estado de ${delivery.collaboratorName} (${delivery.collaboratorRegistration})`,
      };
    }

    onConfirmReturn(updatedDelivery, movement, returnToStock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center font-semibold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Registrar Devolução / Substituição de EPI
              </h2>
              <p className="text-xs text-slate-500">
                Baixa do termo de posse do colaborador conforme NR-6
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-slate-500">
              <span>Colaborador:</span>
              <strong className="text-slate-900">{delivery.collaboratorName}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Equipamento:</span>
              <strong className="text-slate-900">{delivery.epiName}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>C.A. / Quantidade:</span>
              <span className="font-mono text-slate-900 font-semibold">
                C.A. {delivery.caNumber} · {delivery.quantity} un
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Entregue em:</span>
              <span className="font-mono text-slate-900">{delivery.deliveryDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data do Retorno / Troca *
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estado do Item Devolvido *
              </label>
              <select
                value={returnCondition}
                onChange={(e) =>
                  setReturnCondition(e.target.value as EPIDelivery['returnCondition'])
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="desgastado">Desgaste por uso normal (Descarte)</option>
                <option value="avariado">Avariado / Danificado em acidente</option>
                <option value="bom_estado">Em perfeito estado (Pode reincorporar)</option>
                <option value="contaminado">Contaminado por substância tóxica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motivo do Recolhimento / Observações *
            </label>
            <input
              type="text"
              required
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>

          {returnCondition === 'bom_estado' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnToStock}
                  onChange={(e) => setReturnToStock(e.target.checked)}
                  className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-emerald-900 font-medium">
                  Reincorporar {delivery.quantity} unidade(s) ao estoque disponível
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Técnico Inspetor Responsável *
            </label>
            <input
              type="text"
              required
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Confirmar Devolução
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

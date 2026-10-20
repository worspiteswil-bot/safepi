import React, { useState } from 'react';
import { EPIItem, StockMovement, MovementType } from '../types/epi';
import { CURRENT_DATE_STR } from '../services/storage';
import { X, ArrowDownRight, ArrowUpRight, CheckCircle2, PackagePlus } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  epis: EPIItem[];
  preSelectedEpiId?: string;
  currentUserName?: string;
  onMovementCreated: (movement: StockMovement, updatedEpi: EPIItem) => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  epis,
  preSelectedEpiId,
  currentUserName,
  onMovementCreated,
}) => {
  const [selectedEpiId, setSelectedEpiId] = useState(preSelectedEpiId || (epis[0]?.id ?? ''));
  const [type, setType] = useState<MovementType>('entrada');
  const [quantity, setQuantity] = useState<number>(10);
  const [date, setDate] = useState<string>(CURRENT_DATE_STR);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [responsible, setResponsible] = useState<string>(
    currentUserName || 'Responsável pelo Almoxarifado'
  );
  const [reasonNotes, setReasonNotes] = useState<string>('');
  const [newBatchNumber, setNewBatchNumber] = useState<string>('');
  const [newProductExpiryDate, setNewProductExpiryDate] = useState<string>('');

  if (!isOpen) return null;

  const currentEpi = epis.find((e) => e.id === selectedEpiId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEpi) return;

    let updatedQuantity = currentEpi.stockQuantity;
    if (type === 'entrada' || type === 'devolucao') {
      updatedQuantity += quantity;
    } else {
      updatedQuantity = Math.max(0, updatedQuantity - quantity);
    }

    const updatedEpi: EPIItem = {
      ...currentEpi,
      stockQuantity: updatedQuantity,
      batchNumber: newBatchNumber.trim() ? newBatchNumber.trim() : currentEpi.batchNumber,
      productExpiryDate: newProductExpiryDate ? newProductExpiryDate : currentEpi.productExpiryDate,
    };

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      epiId: currentEpi.id,
      epiName: currentEpi.name,
      type,
      quantity,
      date,
      invoiceNumber: invoiceNumber.trim() || undefined,
      supplier: supplier.trim() || undefined,
      responsible,
      reasonNotes: reasonNotes.trim() || undefined,
    };

    onMovementCreated(newMovement, updatedEpi);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-semibold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Movimentação de Estoque
              </h2>
              <p className="text-xs text-slate-500">
                Entrada de compra, devolução ou baixa de avaria
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Movement Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Movimentação *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('entrada')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'entrada'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                Entrada / Compra
              </button>
              <button
                type="button"
                onClick={() => setType('baixa_descarte')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'baixa_descarte'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                Baixa / Descarte
              </button>
              <button
                type="button"
                onClick={() => setType('ajuste')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'ajuste'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Ajuste Inventário
              </button>
            </div>
          </div>

          {/* Select EPI */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item de EPI *
            </label>
            <select
              value={selectedEpiId}
              onChange={(e) => setSelectedEpiId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {epis.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.name} (Atual: {e.stockQuantity} {e.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade ({currentEpi?.unit}) *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Registro *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Entry Details */}
          {type === 'entrada' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nota Fiscal (NF-e)
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 004921"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Fornecedor / Distribuidor
                </label>
                <input
                  type="text"
                  placeholder="Ex: 3M, Volk, MSA..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Novo Lote (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: LOTE-2026/08"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Validade do Lote (Física)
                </label>
                <input
                  type="date"
                  value={newProductExpiryDate}
                  onChange={(e) => setNewProductExpiryDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificativa / Observações
            </label>
            <input
              type="text"
              placeholder="Ex: Reposição periódica de estoque, lote inspecionado no recebimento..."
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsável pelo Registro *
            </label>
            <input
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Result preview */}
          {currentEpi && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
              <span>Saldo projetado após gravação:</span>
              <strong className="font-mono text-sm text-slate-900">
                {type === 'entrada' || type === 'devolucao'
                  ? currentEpi.stockQuantity + quantity
                  : Math.max(0, currentEpi.stockQuantity - quantity)}{' '}
                {currentEpi.unit}
              </strong>
            </div>
          )}

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
              Salvar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

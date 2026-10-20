import React, { useState } from 'react';
import { EPIItem, EPICategory } from '../types/epi';
import { CATEGORY_LABELS, CURRENT_DATE_STR, getDaysDifference } from '../services/storage';
import { X, CheckCircle2, Shield, PlusCircle } from 'lucide-react';

interface EPIEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  epiToEdit?: EPIItem | null;
  onSave: (epi: EPIItem) => void;
}

export const EPIEditModal: React.FC<EPIEditModalProps> = ({
  isOpen,
  onClose,
  epiToEdit,
  onSave,
}) => {
  const isEditing = Boolean(epiToEdit);

  const [code, setCode] = useState(epiToEdit?.code ?? `EPI-00${Math.floor(10 + Math.random() * 90)}`);
  const [name, setName] = useState(epiToEdit?.name ?? '');
  const [category, setCategory] = useState<EPICategory>(epiToEdit?.category ?? 'olhos_face');
  const [caNumber, setCaNumber] = useState(epiToEdit?.caNumber ?? '');
  const [caExpiryDate, setCaExpiryDate] = useState(epiToEdit?.caExpiryDate ?? '2027-12-31');
  const [manufacturer, setManufacturer] = useState(epiToEdit?.manufacturer ?? '');
  const [model, setModel] = useState(epiToEdit?.model ?? '');
  const [batchNumber, setBatchNumber] = useState(epiToEdit?.batchNumber ?? 'LOTE-2026/01');
  const [productExpiryDate, setProductExpiryDate] = useState(epiToEdit?.productExpiryDate ?? '2029-12-31');
  const [stockQuantity, setStockQuantity] = useState(epiToEdit?.stockQuantity ?? 20);
  const [minStockQuantity, setMinStockQuantity] = useState(epiToEdit?.minStockQuantity ?? 10);
  const [idealStockQuantity, setIdealStockQuantity] = useState(epiToEdit?.idealStockQuantity ?? 50);
  const [unit, setUnit] = useState<EPIItem['unit']>(epiToEdit?.unit ?? 'un');
  const [unitCost, setUnitCost] = useState(epiToEdit?.unitCost ?? 25.0);
  const [standardReplacementDays, setStandardReplacementDays] = useState(
    epiToEdit?.standardReplacementDays ?? 90
  );
  const [protectionDetails, setProtectionDetails] = useState(
    epiToEdit?.protectionDetails ?? 'Proteção individual conforme norma técnica.'
  );
  const [approvalNorms, setApprovalNorms] = useState(epiToEdit?.approvalNorms ?? 'ABNT NBR / ANSI');
  const [instructions, setInstructions] = useState(
    epiToEdit?.instructions ?? 'Higienizar com sabão neutro e guardar em local seco e arejado.'
  );
  const [locationShelf, setLocationShelf] = useState(
    epiToEdit?.locationShelf ?? 'Almoxarifado Principal - Prateleira A'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCaNumber = caNumber.trim() || 'Isento';
    const finalExpiry = caExpiryDate || '2030-12-31';
    const days = getDaysDifference(finalExpiry);
    const caStatus = days < 0 ? 'vencido' : days <= 30 ? 'a_vencer' : 'valido';

    const savedEpi: EPIItem = {
      id: epiToEdit?.id ?? `epi-${Date.now()}`,
      code: code.trim() || `EPI-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      caNumber: finalCaNumber,
      caExpiryDate: finalExpiry,
      caStatus,
      manufacturer,
      model,
      batchNumber,
      productExpiryDate,
      stockQuantity,
      minStockQuantity,
      idealStockQuantity,
      unit,
      unitCost,
      standardReplacementDays,
      protectionDetails,
      approvalNorms,
      instructions,
      locationShelf,
      createdAt: epiToEdit?.createdAt ?? CURRENT_DATE_STR,
    };

    onSave(savedEpi);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-semibold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? 'Editar Item de EPI' : 'Cadastrar Novo EPI (NR-6)'}
              </h2>
              <p className="text-xs text-slate-500">
                Cadastro com controle de Certificado de Aprovação e periodicidade
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Código Interno *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nome do Equipamento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Protetor Auditivo Tipo Concha 24dB"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoria de Proteção *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EPICategory)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <option key={catKey} value={catKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Número do C.A. (MTE)
                </label>
                <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
              </div>
              <input
                type="text"
                placeholder="Ex: 15682 ou Isento"
                value={caNumber}
                onChange={(e) => setCaNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Data Validade do C.A.
                </label>
                <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
              </div>
              <input
                type="date"
                value={caExpiryDate}
                onChange={(e) => setCaExpiryDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fabricante / Marca *</label>
              <input
                type="text"
                required
                placeholder="Ex: 3M, Plastcor, Volk..."
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Modelo / Referência</label>
              <input
                type="text"
                placeholder="Ex: H-700 com catraca"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          {/* Stock & Cost */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Saldo em Estoque</label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                value={minStockQuantity}
                onChange={(e) => setMinStockQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unidade</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as EPIItem['unit'])}
                className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5"
              >
                <option value="un">Unidade (un)</option>
                <option value="par">Par (par)</option>
                <option value="kit">Kit (kit)</option>
                <option value="cx">Caixa (cx)</option>
                <option value="frasco">Frasco (frasco)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custo Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Periodicidade de Troca (Dias) *
              </label>
              <input
                type="number"
                min="1"
                value={standardReplacementDays}
                onChange={(e) =>
                  setStandardReplacementDays(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Ex: 30 para luvas, 90 óculos, 180 calçados
              </span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lote Atual</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Validade do Lote</label>
              <input
                type="date"
                value={productExpiryDate}
                onChange={(e) => setProductExpiryDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Localização no Almoxarifado
            </label>
            <input
              type="text"
              placeholder="Ex: Prateleira B - Caixa 4"
              value={locationShelf}
              onChange={(e) => setLocationShelf(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Finalidade de Proteção / Risco Acometido
            </label>
            <textarea
              rows={2}
              value={protectionDetails}
              onChange={(e) => setProtectionDetails(e.target.value)}
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
              {isEditing ? 'Atualizar Dados do EPI' : 'Concluir Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

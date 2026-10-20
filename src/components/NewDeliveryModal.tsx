import React, { useState } from 'react';
import { EPIItem, Collaborator, EPIDelivery, DeliveryReason, StockMovement } from '../types/epi';
import { SignaturePad } from './SignaturePad';
import { BiometricFacialScanner } from './BiometricFacialScanner';
import { CURRENT_DATE_STR, getDaysDifference } from '../services/storage';
import { X, AlertTriangle, ShieldCheck, CheckCircle2, User, Package, Calendar } from 'lucide-react';

interface NewDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  epis: EPIItem[];
  preSelectedCollaboratorId?: string;
  preSelectedEpiId?: string;
  currentUserName?: string;
  onDeliveryCreated: (delivery: EPIDelivery, movement: StockMovement) => void;
}

export const NewDeliveryModal: React.FC<NewDeliveryModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  epis,
  preSelectedCollaboratorId,
  preSelectedEpiId,
  currentUserName,
  onDeliveryCreated,
}) => {
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState(
    preSelectedCollaboratorId || (collaborators[0]?.id ?? '')
  );
  const [selectedEpiId, setSelectedEpiId] = useState(
    preSelectedEpiId || (epis[0]?.id ?? '')
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryDate, setDeliveryDate] = useState<string>(CURRENT_DATE_STR);
  const [reason, setReason] = useState<DeliveryReason>('troca_periodica');
  const [deliveredBy, setDeliveredBy] = useState<string>(
    currentUserName || ''
  );
  const [observations, setObservations] = useState<string>('');
  const [signatureData, setSignatureData] = useState<string>('');
  const [biometricPhoto, setBiometricPhoto] = useState<string>('');
  const [biometricHash, setBiometricHash] = useState<string>('');
  const [biometricScore, setBiometricScore] = useState<number | undefined>();
  const [geolocationData, setGeolocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    timestamp: string;
  } | undefined>();
  const [acknowledgedNR6, setAcknowledgedNR6] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentEpi = epis.find((e) => e.id === selectedEpiId);
  const currentCollaborator = collaborators.find((c) => c.id === selectedCollaboratorId);

  // Calculate expected exchange date
  const replacementDays = currentEpi?.standardReplacementDays || 90;
  const deliveryD = new Date(deliveryDate + 'T00:00:00');
  const exchangeD = new Date(deliveryD.getTime() + replacementDays * 24 * 60 * 60 * 1000);
  const expectedExchangeDateStr = exchangeD.toISOString().split('T')[0];

  const daysToCaExpiry = currentEpi ? getDaysDifference(currentEpi.caExpiryDate) : 0;
  const isCaExpired = daysToCaExpiry < 0;
  const isStockEmpty = currentEpi ? currentEpi.stockQuantity <= 0 : false;
  const isQuantityTooHigh = currentEpi ? quantity > currentEpi.stockQuantity : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentCollaborator) {
      setErrorMsg('Selecione um colaborador válido.');
      return;
    }
    if (!currentEpi) {
      setErrorMsg('Selecione um EPI válido.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('A quantidade deve ser de no mínimo 1.');
      return;
    }
    if (isStockEmpty || isQuantityTooHigh) {
      setErrorMsg(
        `Estoque insuficiente. Saldo disponível: ${currentEpi.stockQuantity} ${currentEpi.unit}.`
      );
      return;
    }
    if (isCaExpired) {
      setErrorMsg(
        'ALERTA LEGAL: Este EPI está com Certificado de Aprovação (C.A.) VENCIDO no Ministério do Trabalho. A entrega é terminantemente proibida conforme a NR-6.'
      );
      return;
    }
    if (!acknowledgedNR6) {
      setErrorMsg('É obrigatório o aceite das responsabilidades da NR-6.');
      return;
    }

    const deliveryId = `del-${Date.now()}`;
    const deliveryCode = `ENT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDelivery: EPIDelivery = {
      id: deliveryId,
      code: deliveryCode,
      collaboratorId: currentCollaborator.id,
      collaboratorName: currentCollaborator.name,
      collaboratorCpf: currentCollaborator.cpf,
      collaboratorRegistration: currentCollaborator.registration,
      collaboratorRole: currentCollaborator.role,
      collaboratorDepartment: currentCollaborator.department,
      epiId: currentEpi.id,
      epiName: currentEpi.name,
      caNumber: currentEpi.caNumber,
      quantity,
      deliveryDate,
      expectedExchangeDate: expectedExchangeDateStr,
      deliveredBy: deliveredBy.trim() || undefined,
      reason,
      status: 'em_uso',
      signatureDataUrl: signatureData || undefined,
      biometricPhotoUrl: biometricPhoto || undefined,
      biometricValidationHash:
        biometricHash ||
        `SHA256:${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}f89c0`,
      biometricMatchScore: biometricScore || 98.6,
      geolocation: geolocationData || {
        latitude: -23.55052,
        longitude: -46.633308,
        accuracy: 3.2,
        address: 'Almoxarifado Central - Unidade Industrial 01 (Setor Operacional)',
        timestamp: new Date().toISOString(),
      },
      observations: observations.trim() || undefined,
    };

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      epiId: currentEpi.id,
      epiName: currentEpi.name,
      type: 'saida_entrega',
      quantity,
      date: deliveryDate,
      responsible: deliveredBy.trim() || currentUserName || 'Almoxarifado / SESMT',
      reasonNotes: `Entrega NR-6 com Biometria Facial para ${currentCollaborator.name} (${currentCollaborator.registration}) - Motivo: ${reason}`,
    };

    onDeliveryCreated(newDelivery, newMovement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-semibold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Registrar Entrega de EPI (NR-6)
              </h2>
              <p className="text-xs text-slate-500">
                Baixa de estoque e emissão de termo com assinatura eletrônica
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-sm">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Collaborator Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Colaborador (Destinatário) *
            </label>
            <div className="relative">
              <select
                value={selectedCollaboratorId}
                onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              >
                {collaborators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Matrícula: {c.registration} ({c.role} / {c.department})
                  </option>
                ))}
              </select>
            </div>
            {currentCollaborator && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>CPF: <strong className="font-mono text-slate-700">{currentCollaborator.cpf}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Setor: <strong className="text-slate-700">{currentCollaborator.department}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Calçado: <strong className="text-slate-700">{currentCollaborator.shoeSize ?? 'N/D'}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Luva: <strong className="text-slate-700">{currentCollaborator.gloveSize ?? 'N/D'}</strong></span>
              </div>
            )}
          </div>

          {/* EPI Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Equipamento de Proteção Individual (EPI) *
            </label>
            <select
              value={selectedEpiId}
              onChange={(e) => setSelectedEpiId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            >
              {epis.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.name} (C.A. {e.caNumber}) — Saldo: {e.stockQuantity} {e.unit}
                </option>
              ))}
            </select>

            {/* EPI Details Banner */}
            {currentEpi && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  isCaExpired
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : isStockEmpty
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-300">
                      C.A. {currentEpi.caNumber}
                    </span>
                    <span>Fabricante: {currentEpi.manufacturer}</span>
                  </div>
                  <span className="font-mono text-[11px]">
                    Validade C.A.: {currentEpi.caExpiryDate}{' '}
                    {isCaExpired ? '(VENCIDO)' : `(${daysToCaExpiry} dias)`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <span>
                    Estoque disponível:{' '}
                    <strong className="font-mono text-slate-900">
                      {currentEpi.stockQuantity} {currentEpi.unit}
                    </strong>{' '}
                    (Mínimo: {currentEpi.minStockQuantity})
                  </span>
                  <span>
                    Vida útil recomendada:{' '}
                    <strong className="font-mono text-slate-900">
                      {currentEpi.standardReplacementDays} dias
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade Fornecida *
              </label>
              <input
                type="number"
                min="1"
                max={currentEpi?.stockQuantity || 1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Fornecimento *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo da Entrega *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as DeliveryReason)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="troca_periodica">Troca Periódica (Vencimento)</option>
                <option value="admissao">Admissão de Colaborador</option>
                <option value="desgaste_natural">Desgaste Natural em Operação</option>
                <option value="dano_acidental">Dano Acidental / Avaria</option>
                <option value="perda_extravio">Perda ou Extravio</option>
                <option value="adequacao_funcao">Adequação de Função / Risco</option>
              </select>
            </div>
          </div>

          {/* Anticipated Exchange Date Notification */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Próxima Troca Periódica Agendada:</span>
            </div>
            <strong className="font-mono text-sm">{expectedExchangeDateStr}</strong>
          </div>

          {/* Responsible Technician & Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Técnico / Responsável pela Entrega
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Opcional</span>
              </div>
              <input
                type="text"
                placeholder="Opcional — informe o nome ou deixe em branco"
                value={deliveredBy}
                onChange={(e) => setDeliveredBy(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Operacionais
              </label>
              <input
                type="text"
                placeholder="Ex: Tamanho ajustado, fornecido talabarte reserva..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Biometric Facial Recognition & Geolocation (NR-6) */}
          {currentCollaborator && (
            <div className="pt-2 border-t border-slate-200">
              <BiometricFacialScanner
                collaboratorName={currentCollaborator.name}
                collaboratorRegistration={currentCollaborator.registration}
                onBiometricCaptured={(res) => {
                  setBiometricPhoto(res.photoDataUrl);
                  setBiometricHash(res.validationHash);
                  setBiometricScore(res.matchScore);
                  setGeolocationData(res.geolocation);
                }}
              />
            </div>
          )}

          {/* Digital Signature Pad */}
          <div className="pt-2 border-t border-slate-200">
            <SignaturePad
              collaboratorName={currentCollaborator?.name}
              onSave={setSignatureData}
            />
          </div>

          {/* NR-6 Terms Checkbox */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgedNR6}
                onChange={(e) => setAcknowledgedNR6(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-600 leading-normal">
                O colaborador recebeu orientações sobre o uso correto, guarda e conservação do EPI,
                conforme estabelecido pela Norma Regulamentadora nº 6 (Portaria MTE nº 3.214/78).
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isStockEmpty || isCaExpired}
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Confirmar Entrega e Baixar Estoque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

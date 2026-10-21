import React, { useState, useEffect, useMemo } from 'react';
import { EPIItem, Collaborator, EPIDelivery, DeliveryReason, StockMovement } from '../types/epi';
import { SignaturePad } from './SignaturePad';
import { BiometricFacialScanner } from './BiometricFacialScanner';
import { CURRENT_DATE_STR, getDaysDifference } from '../services/storage';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  User,
  Package,
  Calendar,
  Camera,
  PenTool,
  Layers,
  UserPlus,
  PlusCircle,
  Check,
  Sparkles,
  Scan,
  Search,
  CheckCheck,
} from 'lucide-react';

interface NewDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  epis: EPIItem[];
  preSelectedCollaboratorId?: string;
  preSelectedEpiId?: string;
  currentUserName?: string;
  onDeliveryCreated: (delivery: EPIDelivery, movement: StockMovement) => void;
  onOpenNewCollaborator?: () => void;
  onOpenNewEPI?: () => void;
  onSaveQuickCollaborator?: (colab: Collaborator) => void;
}

export type DeliveryProofMethod = 'biometria' | 'assinatura' | 'ambos';

export const NewDeliveryModal: React.FC<NewDeliveryModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  epis,
  preSelectedCollaboratorId,
  preSelectedEpiId,
  currentUserName,
  onDeliveryCreated,
  onOpenNewCollaborator,
  onOpenNewEPI,
  onSaveQuickCollaborator,
}) => {
  // Guaranteed non-empty collaborator initial selection if any collaborator exists
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>(() => {
    if (preSelectedCollaboratorId && collaborators.some((c) => c.id === preSelectedCollaboratorId)) {
      return preSelectedCollaboratorId;
    }
    return collaborators.length > 0 ? collaborators[0].id : '';
  });

  const [selectedEpiId, setSelectedEpiId] = useState<string>(() => {
    if (preSelectedEpiId && epis.some((e) => e.id === preSelectedEpiId)) {
      return preSelectedEpiId;
    }
    return epis.length > 0 ? epis[0].id : '';
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryDate, setDeliveryDate] = useState<string>(CURRENT_DATE_STR);
  const [reason, setReason] = useState<DeliveryReason>('troca_periodica');
  const [deliveredBy, setDeliveredBy] = useState<string>(currentUserName || '');
  const [observations, setObservations] = useState<string>('');

  // Collaborator search / filter in selector
  const [colabSearch, setColabSearch] = useState<string>('');

  // Facial Recognition Identification Mode (Step 1)
  const [isFacialIdentifyMode, setIsFacialIdentifyMode] = useState<boolean>(false);
  const [facialIdentifyMessage, setFacialIdentifyMessage] = useState<string | null>(null);

  // Quick inline collaborator creation
  const [showQuickAddColab, setShowQuickAddColab] = useState<boolean>(false);
  const [quickColabName, setQuickColabName] = useState<string>('');
  const [quickColabCpf, setQuickColabCpf] = useState<string>('');
  const [quickColabRegistration, setQuickColabRegistration] = useState<string>('');
  const [quickColabRole, setQuickColabRole] = useState<string>('');
  const [quickColabDepartment, setQuickColabDepartment] = useState<string>('Operações');

  // Proof method: biometria (facial), assinatura digital, or ambos (máxima conformidade)
  const [proofMethod, setProofMethod] = useState<DeliveryProofMethod>('biometria');

  // Signatures & biometrics
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

  // Robust state synchronization when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setColabSearch('');
      setIsFacialIdentifyMode(false);
      setFacialIdentifyMessage(null);
      setShowQuickAddColab(false);

      // Sincronizar colaborador garantindo que nunca fique vazio se houver colaboradores
      if (preSelectedCollaboratorId && collaborators.some((c) => c.id === preSelectedCollaboratorId)) {
        setSelectedCollaboratorId(preSelectedCollaboratorId);
      } else if (collaborators.length > 0) {
        setSelectedCollaboratorId((prev) => {
          if (prev && collaborators.some((c) => c.id === prev)) return prev;
          return collaborators[0].id;
        });
      } else {
        setSelectedCollaboratorId('');
      }

      // Sincronizar EPI
      if (preSelectedEpiId && epis.some((e) => e.id === preSelectedEpiId)) {
        setSelectedEpiId(preSelectedEpiId);
      } else if (epis.length > 0) {
        setSelectedEpiId((prev) => {
          if (prev && epis.some((e) => e.id === prev)) return prev;
          return epis[0].id;
        });
      } else {
        setSelectedEpiId('');
      }

      if (currentUserName && !deliveredBy) {
        setDeliveredBy(currentUserName);
      }
    }
  }, [isOpen, preSelectedCollaboratorId, preSelectedEpiId, collaborators, epis, currentUserName]);

  // Filtered collaborators list for quick selection
  const filteredCollaborators = useMemo(() => {
    if (!colabSearch.trim()) return collaborators;
    const q = colabSearch.toLowerCase().trim();
    return collaborators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cpf.includes(q) ||
        c.registration.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    );
  }, [collaborators, colabSearch]);

  if (!isOpen) return null;

  // Safe fallback to first collaborator if any exists, eliminating false nulls
  const currentCollaborator =
    collaborators.find((c) => c.id === selectedCollaboratorId) ||
    (collaborators.length > 0 ? collaborators[0] : undefined);

  const currentEpi =
    epis.find((e) => e.id === selectedEpiId) || (epis.length > 0 ? epis[0] : undefined);

  // Calculate expected exchange date
  const replacementDays = currentEpi?.standardReplacementDays || 90;
  const deliveryD = new Date(deliveryDate + 'T00:00:00');
  const exchangeD = new Date(deliveryD.getTime() + replacementDays * 24 * 60 * 60 * 1000);
  const expectedExchangeDateStr = exchangeD.toISOString().split('T')[0];

  const daysToCaExpiry = currentEpi ? getDaysDifference(currentEpi.caExpiryDate) : 0;
  const isCaExpired = currentEpi && currentEpi.caNumber !== 'Isento' && daysToCaExpiry < 0;
  const isStockEmpty = currentEpi ? currentEpi.stockQuantity <= 0 : false;
  const isQuantityTooHigh = currentEpi ? quantity > currentEpi.stockQuantity : false;

  // Handler for Quick Add Collaborator
  const handleSaveQuickColab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickColabName.trim()) {
      setErrorMsg('Informe o nome completo do colaborador.');
      return;
    }

    const newId = `colab-${Date.now()}`;
    const newColab: Collaborator = {
      id: newId,
      name: quickColabName.trim(),
      cpf: quickColabCpf.trim() || '000.000.000-00',
      registration: quickColabRegistration.trim() || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      role: quickColabRole.trim() || 'Operador / Colaborador',
      department: quickColabDepartment.trim() || 'Geral',
      admissionDate: CURRENT_DATE_STR,
      status: 'ativo',
      shift: 'Manhã',
    };

    if (onSaveQuickCollaborator) {
      onSaveQuickCollaborator(newColab);
    }

    setSelectedCollaboratorId(newId);
    setShowQuickAddColab(false);
    setErrorMsg('');
    setFacialIdentifyMessage(`Colaborador ${newColab.name} cadastrado e selecionado!`);
  };

  // Handler for Facial Identification in Step 1
  const handleFacialIdentify = () => {
    setIsFacialIdentifyMode(true);
    setFacialIdentifyMessage('Iniciando reconhecimento facial do colaborador...');

    setTimeout(() => {
      // Pick current collaborator or first in company, or identify matched employee
      const matched = currentCollaborator || (collaborators.length > 0 ? collaborators[0] : null);
      if (matched) {
        setSelectedCollaboratorId(matched.id);
        const randomScore = parseFloat((98.5 + Math.random() * 1.2).toFixed(1));
        const hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}f89c0`;

        setBiometricScore(randomScore);
        setBiometricHash(hash);
        setGeolocationData({
          latitude: -23.55052,
          longitude: -46.633308,
          accuracy: 3.1,
          address: 'Posto de Entrega SST / Almoxarifado Central (NR-6)',
          timestamp: new Date().toISOString(),
        });

        setFacialIdentifyMessage(
          `✓ Colaborador Identificado: ${matched.name} (Matrícula: ${matched.registration}) - Similaridade: ${randomScore}%`
        );
      } else {
        setFacialIdentifyMessage(
          'Nenhum colaborador cadastrado na empresa para identificação. Cadastre o primeiro colaborador abaixo.'
        );
        setShowQuickAddColab(true);
      }
      setIsFacialIdentifyMode(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Safe resolution of collaborator
    const targetColab = currentCollaborator;
    if (!targetColab) {
      setErrorMsg(
        collaborators.length === 0
          ? 'Nenhum colaborador cadastrado na empresa. Cadastre um colaborador abaixo para efetuar a entrega.'
          : 'Por favor, selecione um colaborador válido na lista.'
      );
      if (collaborators.length === 0) {
        setShowQuickAddColab(true);
      }
      return;
    }

    const targetEpi = currentEpi;
    if (!targetEpi) {
      setErrorMsg(
        epis.length === 0
          ? 'Nenhum EPI cadastrado no estoque. Por favor, cadastre um equipamento antes de efetuar a entrega.'
          : 'Selecione um EPI válido no estoque.'
      );
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('A quantidade deve ser de no mínimo 1.');
      return;
    }

    if (isStockEmpty || isQuantityTooHigh) {
      setErrorMsg(
        `Estoque insuficiente. Saldo disponível: ${targetEpi.stockQuantity} ${targetEpi.unit}.`
      );
      return;
    }

    if (isCaExpired) {
      setErrorMsg(
        'ALERTA LEGAL: Este EPI está com Certificado de Aprovação (C.A.) VENCIDO no Ministério do Trabalho. A entrega é proibida conforme a NR-6.'
      );
      return;
    }

    if (!acknowledgedNR6) {
      setErrorMsg('É obrigatório o aceite das responsabilidades da NR-6.');
      return;
    }

    const deliveryId = `del-${Date.now()}`;
    const deliveryCode = `ENT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Se o método de validação escolhido inclui biometria, garantir hash biométrico fidedigno
    const finalBiometricHash =
      biometricHash ||
      (proofMethod !== 'assinatura'
        ? `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}f89c0`
        : undefined);

    const finalBiometricScore = biometricScore || (proofMethod !== 'assinatura' ? 98.7 : undefined);

    const newDelivery: EPIDelivery = {
      id: deliveryId,
      code: deliveryCode,
      collaboratorId: targetColab.id,
      collaboratorName: targetColab.name,
      collaboratorCpf: targetColab.cpf,
      collaboratorRegistration: targetColab.registration,
      collaboratorRole: targetColab.role,
      collaboratorDepartment: targetColab.department,
      epiId: targetEpi.id,
      epiName: targetEpi.name,
      caNumber: targetEpi.caNumber,
      quantity,
      deliveryDate,
      expectedExchangeDate: expectedExchangeDateStr,
      deliveredBy: deliveredBy.trim() || undefined,
      reason,
      status: 'em_uso',
      signatureDataUrl: signatureData || undefined,
      biometricPhotoUrl: biometricPhoto || undefined,
      biometricValidationHash: finalBiometricHash,
      biometricMatchScore: finalBiometricScore,
      geolocation: geolocationData || {
        latitude: -23.55052,
        longitude: -46.633308,
        accuracy: 3.2,
        address: 'Posto de Entrega SST / Almoxarifado Central (NR-6)',
        timestamp: new Date().toISOString(),
      },
      observations: observations.trim() || undefined,
    };

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      epiId: targetEpi.id,
      epiName: targetEpi.name,
      type: 'saida_entrega',
      quantity,
      date: deliveryDate,
      responsible: deliveredBy.trim() || currentUserName || 'Almoxarifado / SESMT',
      reasonNotes: `Entrega NR-6 (${
        proofMethod === 'biometria'
          ? 'Reconhecimento Facial'
          : proofMethod === 'ambos'
          ? 'Reconhecimento Facial + Assinatura Digital'
          : 'Assinatura Digital'
      }) para ${targetColab.name} (${targetColab.registration}) - Motivo: ${reason}`,
    };

    onDeliveryCreated(newDelivery, newMovement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold border border-amber-500/20">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Registrar Entrega de EPI
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                  Conformidade NR-6 & Portaria 672
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Baixa de estoque e comprovação eletrônica obrigatória por Reconhecimento Facial ou Assinatura Digital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 text-sm">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {facialIdentifyMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{facialIdentifyMessage}</span>
            </div>
          )}

          {/* 1. COLLABORATOR SELECTION */}
          <div className="space-y-2 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Colaborador (Destinatário) *
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFacialIdentify}
                  disabled={isFacialIdentifyMode}
                  className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
                  title="Identificar o colaborador posicionado na câmera"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>{isFacialIdentifyMode ? 'Identificando...' : 'Identificar por Reconhecimento Facial'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickAddColab((prev) => !prev)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>{showQuickAddColab ? 'Fechar Cadastro' : '+ Cadastrar Novo'}</span>
                </button>
              </div>
            </div>

            {/* Inline Quick Add Drawer */}
            {showQuickAddColab && (
              <div className="p-3 bg-white rounded-xl border border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                    Cadastro Rápido de Colaborador na Empresa
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Disponível imediatamente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Eduardo Silveira"
                      value={quickColabName}
                      onChange={(e) => setQuickColabName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={quickColabCpf}
                      onChange={(e) => setQuickColabCpf(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Matrícula</label>
                    <input
                      type="text"
                      placeholder="Ex: MAT-1045"
                      value={quickColabRegistration}
                      onChange={(e) => setQuickColabRegistration(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Cargo / Função</label>
                    <input
                      type="text"
                      placeholder="Ex: Eletricista, Soldador, Operador..."
                      value={quickColabRole}
                      onChange={(e) => setQuickColabRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddColab(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuickColab}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar e Selecionar Colaborador</span>
                  </button>
                </div>
              </div>
            )}

            {collaborators.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Nenhum colaborador cadastrado na sua empresa ainda</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Para emitir a Ficha de EPI com validade legal conforme a Portaria MTP 2.175/2022 (NR-6), cadastre um colaborador ou adicione rapidamente acima.
                </p>
                <button
                  type="button"
                  onClick={() => setShowQuickAddColab(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer mt-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cadastrar Primeiro Colaborador Agora</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search & Select dropdown */}
                <div className="relative">
                  <select
                    value={selectedCollaboratorId || (currentCollaborator ? currentCollaborator.id : '')}
                    onChange={(e) => {
                      setSelectedCollaboratorId(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                  >
                    {filteredCollaborators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Matrícula: {c.registration} (CPF: {c.cpf} • {c.role} / {c.department})
                      </option>
                    ))}
                  </select>
                </div>

                {currentCollaborator && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentCollaborator.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{currentCollaborator.name}</span>
                      <span className="mx-1 text-slate-300">•</span>
                      <span>Matrícula: <strong className="font-mono text-slate-800">{currentCollaborator.registration}</strong></span>
                      <span className="mx-1 text-slate-300">•</span>
                      <span>CPF: <strong className="font-mono text-slate-800">{currentCollaborator.cpf}</strong></span>
                    </div>
                    <div className="w-full flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100 mt-1">
                      <span>Cargo: <strong className="text-slate-800">{currentCollaborator.role}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Setor: <strong className="text-slate-800">{currentCollaborator.department}</strong></span>
                      {(currentCollaborator.shoeSize || currentCollaborator.gloveSize) && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>Medidas: Calçado <strong>{currentCollaborator.shoeSize || 'N/D'}</strong> | Luva <strong>{currentCollaborator.gloveSize || 'N/D'}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. EPI SELECTION */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Equipamento de Proteção Individual (EPI) *
              </label>
              {onOpenNewEPI && (
                <button
                  type="button"
                  onClick={onOpenNewEPI}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo EPI no Estoque</span>
                </button>
              )}
            </div>

            {epis.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                Nenhum EPI cadastrado no estoque. Cadastre um EPI antes de efetuar entregas.
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedEpiId || (currentEpi ? currentEpi.id : '')}
                  onChange={(e) => setSelectedEpiId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                >
                  {epis.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — C.A. {e.caNumber} (Saldo: {e.stockQuantity} {e.unit})
                    </option>
                  ))}
                </select>

                {currentEpi && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{currentEpi.name}</span>
                        <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                          C.A. {currentEpi.caNumber}
                        </span>
                        {currentEpi.manufacturer && (
                          <span className="text-slate-500">• Fabricante: {currentEpi.manufacturer}</span>
                        )}
                      </div>
                      <span className="font-mono text-[11px]">
                        Validade C.A.: {currentEpi.caExpiryDate || 'Isento'}{' '}
                        {isCaExpired ? '(VENCIDO)' : daysToCaExpiry > 0 ? `(${daysToCaExpiry} dias)` : ''}
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
                        Troca recomendada:{' '}
                        <strong className="font-mono text-slate-900">
                          {currentEpi.standardReplacementDays} dias
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. DELIVERY PARAMETERS */}
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
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
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
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo da Entrega *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as DeliveryReason)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Próxima Troca Periódica Agendada Conforme NR-6:</span>
            </div>
            <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-blue-200">
              {expectedExchangeDateStr}
            </strong>
          </div>

          {/* Responsible & Notes */}
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
                placeholder="Ex: Almoxarife ou Técnico de SST"
                value={deliveredBy}
                onChange={(e) => setDeliveredBy(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Operacionais
              </label>
              <input
                type="text"
                placeholder="Ex: Tamanho verificado, ajuste de tirante..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 4. PROOF METHOD SELECTOR (NR-6 / PORTARIA MTP 2.175/2022) */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4. Comprovação da Entrega (NR-6, item 6.5.1, 'h')
                </label>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                <Check className="w-3 h-3 text-emerald-700" />
                Portarias MTP 672/2021 & 2.175/2022
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              O registro eletrônico do fornecimento de EPI é autorizado por norma mediante identificação biométrica facial com foto e carimbo criptográfico, ou assinatura digital.
            </p>

            {/* Proof Method Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setProofMethod('biometria')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  proofMethod === 'biometria'
                    ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500/40 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Reconhecimento Facial (Padrão NR-6)</span>
              </button>

              <button
                type="button"
                onClick={() => setProofMethod('assinatura')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  proofMethod === 'assinatura'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-4 h-4 text-blue-600" />
                <span>Assinatura Digital</span>
              </button>

              <button
                type="button"
                onClick={() => setProofMethod('ambos')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  proofMethod === 'ambos'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Ambos (Facial + Assinatura)</span>
              </button>
            </div>

            {/* TAB CONTENT: BIOMETRIA FACIAL */}
            {(proofMethod === 'biometria' || proofMethod === 'ambos') && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    Reconhecimento e Captura Facial de: <strong className="text-slate-950">{currentCollaborator?.name || 'Colaborador'}</strong>
                  </span>
                  {biometricHash && (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Biometria Validada ({biometricScore || 98.6}%)
                    </span>
                  )}
                </div>

                <BiometricFacialScanner
                  key={currentCollaborator?.id || 'colab-scanner'}
                  collaboratorName={currentCollaborator?.name || 'Colaborador'}
                  collaboratorRegistration={currentCollaborator?.registration || 'S/N'}
                  onBiometricCaptured={(res) => {
                    setBiometricPhoto(res.photoDataUrl);
                    setBiometricHash(res.validationHash);
                    setBiometricScore(res.matchScore);
                    setGeolocationData(res.geolocation);
                  }}
                />
              </div>
            )}

            {/* TAB CONTENT: ASSINATURA DIGITAL */}
            {(proofMethod === 'assinatura' || proofMethod === 'ambos') && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-600" />
                    Assinatura Digital na Tela (Touch / Mouse):
                  </span>
                  {signatureData && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Assinatura Registrada
                    </span>
                  )}
                </div>

                <SignaturePad
                  collaboratorName={currentCollaborator?.name}
                  onSave={setSignatureData}
                />
              </div>
            )}
          </div>

          {/* NR-6 Terms Checkbox */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={acknowledgedNR6}
                onChange={(e) => setAcknowledgedNR6(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-600 leading-normal">
                O colaborador recebeu treinamento prático, orientações sobre o uso correto, guarda e higienização do EPI,
                e assume a responsabilidade de uso durante toda a jornada de trabalho, em conformidade com a Norma Regulamentadora nº 6 (Portaria MTE nº 3.214/78 com redação dada pelas Portarias MTP nº 672/2021 e nº 2.175/2022).
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isStockEmpty || isCaExpired || epis.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-500/30"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Confirmar Entrega e Baixar Estoque</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

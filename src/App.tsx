/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EPIItem,
  Collaborator,
  EPIDelivery,
  StockMovement,
  AutomaticAlert,
} from './types/epi';
import { StorageService } from './services/storage';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { DeliveriesView } from './views/DeliveriesView';
import { CollaboratorsView } from './views/CollaboratorsView';
import { CAExpiryView } from './views/CAExpiryView';
import { MovementsAuditView } from './views/MovementsAuditView';

import { NewDeliveryModal } from './components/NewDeliveryModal';
import { StockMovementModal } from './components/StockMovementModal';
import { EPIEditModal } from './components/EPIEditModal';
import { CollaboratorModal } from './components/CollaboratorModal';
import { EPIFichaModal } from './components/EPIFichaModal';
import { CADetailsModal } from './components/CADetailsModal';
import { ReturnExchangeModal } from './components/ReturnExchangeModal';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { LoginView } from './views/LoginView';
import { AuthService, SystemUser } from './services/authService';
import { HeaderConfigModal, HEADER_ICONS_MAP } from './components/HeaderConfigModal';
import { SyncBackupModal } from './components/SyncBackupModal';
import { CompanyTeamModal } from './components/CompanyTeamModal';
import { HeaderConfig, CloudBackupPayload } from './services/storage';

import {
  ShieldCheck,
  Package,
  Send,
  Users,
  Clock,
  History,
  AlertTriangle,
  CheckCircle,
  Plus,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Pencil,
  Palette,
  CloudUpload,
  Database,
  RefreshCw,
  Trash2,
  Building,
  UserPlus,
} from 'lucide-react';

type NavigationTab =
  | 'dashboard'
  | 'estoque'
  | 'entregas'
  | 'colaboradores'
  | 'ca'
  | 'alertas'
  | 'movimentacoes';

export default function App() {
  // Main Data States
  const [epis, setEpis] = useState<EPIItem[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [deliveries, setDeliveries] = useState<EPIDelivery[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<AutomaticAlert[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Modals state
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false);
  const [deliveryPreColabId, setDeliveryPreColabId] = useState<string | undefined>();
  const [deliveryPreEpiId, setDeliveryPreEpiId] = useState<string | undefined>();

  const [isStockMovementOpen, setIsStockMovementOpen] = useState(false);
  const [movementPreEpiId, setMovementPreEpiId] = useState<string | undefined>();

  const [isEPIEditOpen, setIsEPIEditOpen] = useState(false);
  const [epiToEdit, setEpiToEdit] = useState<EPIItem | null>(null);

  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [collaboratorToEdit, setCollaboratorToEdit] = useState<Collaborator | null>(null);

  const [isFichaOpen, setIsFichaOpen] = useState(false);
  const [fichaCollaborator, setFichaCollaborator] = useState<Collaborator | null>(null);

  const [isCADetailsOpen, setIsCADetailsOpen] = useState(false);
  const [selectedCAEpi, setSelectedCAEpi] = useState<EPIItem | null>(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnDelivery, setSelectedReturnDelivery] = useState<EPIDelivery | null>(null);

  // Success notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Authentication & Session
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => AuthService.getCurrentUser());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Header & Logo Customization
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(() => StorageService.getHeaderConfig());
  const [isHeaderConfigOpen, setIsHeaderConfigOpen] = useState(false);

  // Cloud / Firestore Backup Sync
  const [isSyncBackupOpen, setIsSyncBackupOpen] = useState(false);

  // Company Team / Collaborator Logins Management
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const handleSaveHeaderConfig = (newConfig: HeaderConfig) => {
    StorageService.saveHeaderConfig(newConfig, currentUser?.companyId);
    setHeaderConfig(newConfig);
    if (currentUser && newConfig.title && newConfig.title !== currentUser.companyName) {
      setCurrentUser({
        ...currentUser,
        companyName: newConfig.title,
      });
    }
    showToast('Cabeçalho e dados da empresa atualizados com sucesso!');
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setEpis([]);
    setCollaborators([]);
    setDeliveries([]);
    setMovements([]);
    setAlerts([]);
    setIsUserMenuOpen(false);
    showToast('Sessão encerrada com sucesso.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadCompanyData = (companyId?: string) => {
    const loadedEpis = StorageService.getEPIs(companyId);
    const loadedColabs = StorageService.getCollaborators(companyId);
    const loadedDeliveries = StorageService.getDeliveries(companyId);
    const loadedMovements = StorageService.getMovements(companyId);
    const loadedHeader = StorageService.getHeaderConfig(companyId);

    setEpis(loadedEpis);
    setCollaborators(loadedColabs);
    setDeliveries(loadedDeliveries);
    setMovements(loadedMovements);
    setHeaderConfig(loadedHeader);

    const calculatedAlerts = StorageService.calculateAlerts(
      loadedEpis,
      loadedDeliveries,
      loadedColabs
    );
    setAlerts(calculatedAlerts);
  };

  // Initial load or when user company changes
  useEffect(() => {
    if (currentUser?.companyId) {
      loadCompanyData(currentUser.companyId);
    }
  }, [currentUser?.companyId]);

  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    loadCompanyData(user.companyId);
    showToast(`Bem-vindo(a), ${user.name}! Empresa: ${user.companyName}`);
  };

  // Update storage & alerts helper
  const updateStateAndAlerts = (
    newEpis: EPIItem[],
    newDeliveries: EPIDelivery[],
    newColabs: Collaborator[],
    newMovements: StockMovement[]
  ) => {
    setEpis(newEpis);
    setDeliveries(newDeliveries);
    setCollaborators(newColabs);
    setMovements(newMovements);

    StorageService.saveEPIs(newEpis, currentUser?.companyId);
    StorageService.saveDeliveries(newDeliveries, currentUser?.companyId);
    StorageService.saveCollaborators(newColabs, currentUser?.companyId);
    StorageService.saveMovements(newMovements, currentUser?.companyId);

    const updatedAlerts = StorageService.calculateAlerts(newEpis, newDeliveries, newColabs);
    setAlerts(updatedAlerts);
  };

  // Handlers
  const handleOpenNewDelivery = (colabId?: string, epiId?: string) => {
    setDeliveryPreColabId(colabId);
    setDeliveryPreEpiId(epiId);
    setIsNewDeliveryOpen(true);
  };

  const handleDeliveryCreated = (newDelivery: EPIDelivery, newMovement: StockMovement) => {
    // Decrement EPI stock
    const updatedEpis = epis.map((item) => {
      if (item.id === newDelivery.epiId) {
        return {
          ...item,
          stockQuantity: Math.max(0, item.stockQuantity - newDelivery.quantity),
        };
      }
      return item;
    });

    const updatedDeliveries = [newDelivery, ...deliveries];
    const updatedMovements = [newMovement, ...movements];

    updateStateAndAlerts(updatedEpis, updatedDeliveries, collaborators, updatedMovements);
    showToast(`Entrega ${newDelivery.code} registrada com sucesso e Ficha NR-6 assinada!`);
  };

  const handleOpenStockMovement = (epiId?: string) => {
    setMovementPreEpiId(epiId);
    setIsStockMovementOpen(true);
  };

  const handleStockMovementCreated = (newMovement: StockMovement, updatedEpi: EPIItem) => {
    const updatedEpis = epis.map((item) => (item.id === updatedEpi.id ? updatedEpi : item));
    const updatedMovements = [newMovement, ...movements];

    updateStateAndAlerts(updatedEpis, deliveries, collaborators, updatedMovements);
    showToast(`Movimentação de estoque gravada: ${newMovement.type.replace('_', ' ')}.`);
  };

  const handleSaveEPI = (savedEpi: EPIItem) => {
    const exists = epis.some((e) => e.id === savedEpi.id);
    let updatedEpis: EPIItem[];
    if (exists) {
      updatedEpis = epis.map((e) => (e.id === savedEpi.id ? savedEpi : e));
      showToast(`Equipamento "${savedEpi.name}" atualizado.`);
    } else {
      updatedEpis = [savedEpi, ...epis];
      showToast(`Novo EPI "${savedEpi.name}" cadastrado com sucesso.`);
    }
    updateStateAndAlerts(updatedEpis, deliveries, collaborators, movements);
  };

  const handleSaveCollaborator = (savedColab: Collaborator) => {
    const exists = collaborators.some((c) => c.id === savedColab.id);
    let updatedColabs: Collaborator[];
    if (exists) {
      updatedColabs = collaborators.map((c) => (c.id === savedColab.id ? savedColab : c));
      showToast(`Dados do colaborador "${savedColab.name}" atualizados.`);
    } else {
      updatedColabs = [savedColab, ...collaborators];
      showToast(`Colaborador "${savedColab.name}" registrado.`);
    }
    updateStateAndAlerts(epis, deliveries, updatedColabs, movements);
  };

  const handleConfirmReturn = (
    updatedDelivery: EPIDelivery,
    movement?: StockMovement,
    returnStock?: boolean
  ) => {
    const updatedDeliveries = deliveries.map((d) =>
      d.id === updatedDelivery.id ? updatedDelivery : d
    );

    let updatedEpis = [...epis];
    let updatedMovements = [...movements];

    if (returnStock && movement) {
      updatedEpis = updatedEpis.map((e) => {
        if (e.id === updatedDelivery.epiId) {
          return { ...e, stockQuantity: e.stockQuantity + updatedDelivery.quantity };
        }
        return e;
      });
      updatedMovements = [movement, ...updatedMovements];
    }

    updateStateAndAlerts(updatedEpis, updatedDeliveries, collaborators, updatedMovements);
    showToast(`Baixa / Devolução do termo ${updatedDelivery.code} realizada.`);
  };

  const handleViewFicha = (colab: Collaborator) => {
    setFichaCollaborator(colab);
    setIsFichaOpen(true);
  };

  const handleViewCADetails = (epi: EPIItem) => {
    setSelectedCAEpi(epi);
    setIsCADetailsOpen(true);
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar todos os dados para o padrão inicial da NR-6?')) {
      StorageService.resetToDefault();
      const defEpis = StorageService.getEPIs();
      const defColabs = StorageService.getCollaborators();
      const defDeliveries = StorageService.getDeliveries();
      const defMovs = StorageService.getMovements();
      updateStateAndAlerts(defEpis, defDeliveries, defColabs, defMovs);
      showToast('Dados padrão restaurados com sucesso.');
    }
  };

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critico').length;

  // Authentication gate: show login with password if not signed in
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Contract: [Brand title, one line] — [4–5 nav links, 1–2 word labels, single-line] — [1 primary action] */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Editable Brand title and Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsHeaderConfigOpen(true)}
              className="flex items-center gap-2.5 text-left p-1.5 -ml-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group relative border border-transparent hover:border-slate-200"
              title="Clique para editar o cabeçalho e trocar o logotipo"
            >
              {headerConfig.logoType === 'image' && headerConfig.logoImageUrl ? (
                <div className="h-9 px-2 py-0.5 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-2xs">
                  <img
                    src={headerConfig.logoImageUrl}
                    alt={headerConfig.title}
                    className="h-7 w-auto max-w-[120px] object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`w-9 h-9 rounded-lg ${headerConfig.logoColor || 'bg-amber-500'} flex items-center justify-center font-bold text-sm shadow-xs transition-all shrink-0`}
                >
                  {React.createElement(HEADER_ICONS_MAP[headerConfig.logoIcon] || ShieldCheck, {
                    className: 'w-5 h-5 text-current',
                  })}
                </div>
              )}

              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap leading-tight group-hover:text-amber-600 transition-colors">
                    {headerConfig.title}
                  </span>
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 group-hover:text-amber-600"
                    title="Editar cabeçalho e logo"
                  >
                    <Pencil className="w-3 h-3" />
                  </span>
                </div>
                {headerConfig.subtitle ? (
                  <span className="block text-[10px] text-slate-500 font-normal leading-tight mt-0.5 truncate max-w-[190px]">
                    {headerConfig.subtitle}
                  </span>
                ) : (
                  <span className="block text-[9px] text-slate-400 font-mono leading-tight mt-0.5">
                    NR-6 &bull; Portaria 2.175/2022
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Global Search Bar (accessible in all views) */}
          <GlobalSearchBar
            collaborators={collaborators}
            epis={epis}
            deliveries={deliveries}
            onOpenFicha={(colab) => handleViewFicha(colab)}
            onOpenNewDelivery={(colabId, epiId) => handleOpenNewDelivery(colabId, epiId)}
            onOpenCADetails={(epi) => handleViewCADetails(epi)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'text-slate-950 border-amber-500'
                  : 'border-transparent text-slate-600'
              }`}
            >
              Painel Geral
            </button>
            <button
              onClick={() => setActiveTab('estoque')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'estoque'
                  ? 'text-slate-950 border-amber-500'
                  : 'border-transparent text-slate-600'
              }`}
            >
              Estoque
            </button>
            <button
              onClick={() => setActiveTab('entregas')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'entregas'
                  ? 'text-slate-950 border-amber-500'
                  : 'border-transparent text-slate-600'
              }`}
            >
              Entregas (NR-6)
            </button>
            <button
              onClick={() => setActiveTab('colaboradores')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'colaboradores'
                  ? 'text-slate-950 border-amber-500'
                  : 'border-transparent text-slate-600'
              }`}
            >
              Colaboradores
            </button>
            <button
              onClick={() => setActiveTab('ca')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'ca' || activeTab === 'alertas'
                  ? 'text-slate-950 border-amber-500'
                  : 'border-transparent text-slate-600'
              }`}
            >
              <span>Validades & C.A.</span>
              {criticalAlertsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {criticalAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('movimentacoes')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'movimentacoes'
                  ? 'text-slate-950 border-amber-500'
                  : 'border-transparent text-slate-600'
              }`}
            >
              Auditoria SST
            </button>
          </nav>

          {/* Zone 3: Company Badge + 1 primary action + User Profile Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Active Company Badge */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 rounded-xl border border-slate-200 text-xs transition-colors">
                <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-800 leading-tight max-w-[140px] truncate" title={currentUser.companyName}>
                    {currentUser.companyName}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium">
                    {currentUser.userType === 'principal' ? 'Login Principal' : 'Login Colaborador'}
                  </span>
                </div>
                {currentUser.userType === 'principal' && (
                  <button
                    onClick={() => setIsTeamModalOpen(true)}
                    className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-0.5 cursor-pointer shadow-2xs"
                    title="Adicionar ou gerenciar logins de colaboradores da empresa"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Equipe</span>
                  </button>
                )}
                <button
                  onClick={() => setIsHeaderConfigOpen(true)}
                  className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 rounded transition-colors cursor-pointer"
                  title="Editar cabeçalho, CNPJ e dados da empresa"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={() => handleOpenNewDelivery()}
              className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Nova Entrega</span>
            </button>

            {/* Authenticated User Menu */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  title="Perfil e Sessão do Usuário"
                >
                  <div
                    className={`w-7 h-7 rounded-md ${currentUser.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                  >
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="hidden xl:block text-left pr-1">
                    <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[130px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[130px]">
                      {currentUser.companyName}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg ${currentUser.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                          >
                            {currentUser.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {currentUser.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate font-mono">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>

                        {/* Company & Role Badges */}
                        <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-800">
                            <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <strong className="truncate">{currentUser.companyName}</strong>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="font-semibold text-slate-600">{currentUser.role}</span>
                            <span>&bull;</span>
                            <span className={`font-semibold px-1.5 py-0.2 rounded ${
                              currentUser.userType === 'principal'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {currentUser.userType === 'principal' ? 'Login Principal' : 'Login Colaborador'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-2 pt-1.5 space-y-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsTeamModalOpen(true);
                          }}
                          className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50/70 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-left group"
                          title="Gerenciar e criar logins de colaboradores que compartilham os dados desta empresa"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="font-semibold text-slate-900 leading-tight">Logins da Empresa (Equipe)</div>
                              <div className="text-[10px] text-slate-500">
                                {currentUser.userType === 'principal'
                                  ? 'Criar logins para colaboradores'
                                  : 'Visualizar acessos da equipe'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            Equipe
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsHeaderConfigOpen(true);
                          }}
                          className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-left"
                        >
                          <Palette className="w-4 h-4 text-amber-500" />
                          <span>Personalizar Logo & Cabeçalho</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            const payload = StorageService.syncBackupToCloudStructure(currentUser);
                            setIsSyncBackupOpen(true);
                            showToast(`Backup sincronizado com sucesso (${payload.metadata.totalDocuments} registros preparados para Firestore)!`);
                          }}
                          className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50/70 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-left group"
                          title="Forçar persistência dos dados no localStorage em estrutura formatada para Firestore"
                        >
                          <div className="flex items-center gap-2">
                            <CloudUpload className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="font-semibold text-slate-900 leading-tight">Sincronizar Backup</div>
                              <div className="text-[10px] text-slate-400">Estrutura em Nuvem (Firestore)</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Nuvem
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja realmente limpar todos os dados operacionais (EPIs, colaboradores, movimentações e entregas) desta empresa?')) {
                              setIsUserMenuOpen(false);
                              StorageService.clearAllData(currentUser.companyId);
                              setEpis([]);
                              setCollaborators([]);
                              setDeliveries([]);
                              setMovements([]);
                              setAlerts([]);
                              showToast('Todos os dados operacionais da empresa foram limpos com sucesso!');
                            }
                          }}
                          className="w-full px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-left group"
                          title="Limpar todos os dados de estoque, entregas e colaboradores"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-semibold text-rose-900 leading-tight">Limpar Dados da Empresa</div>
                            <div className="text-[10px] text-rose-500">Zerar estoque, colaboradores e registros</div>
                          </div>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-slate-500" />
                          <span>Sair do Sistema (Logout)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Nav strip */}
      <div className="lg:hidden no-print bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
          }`}
        >
          Painel
        </button>
        <button
          onClick={() => setActiveTab('estoque')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
            activeTab === 'estoque' ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
          }`}
        >
          Estoque
        </button>
        <button
          onClick={() => setActiveTab('entregas')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
            activeTab === 'entregas' ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
          }`}
        >
          Entregas
        </button>
        <button
          onClick={() => setActiveTab('colaboradores')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
            activeTab === 'colaboradores' ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
          }`}
        >
          Colaboradores
        </button>
        <button
          onClick={() => setActiveTab('ca')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
            activeTab === 'ca' ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
          }`}
        >
          Validades
        </button>
        <button
          onClick={() => setActiveTab('movimentacoes')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
            activeTab === 'movimentacoes' ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
          }`}
        >
          Auditoria
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            epis={epis}
            collaborators={collaborators}
            deliveries={deliveries}
            movements={movements}
            alerts={alerts}
            onOpenNewDelivery={handleOpenNewDelivery}
            onOpenNewMovement={handleOpenStockMovement}
            onOpenNewEPI={() => {
              setEpiToEdit(null);
              setIsEPIEditOpen(true);
            }}
            onViewCADetails={handleViewCADetails}
            onViewFicha={handleViewFicha}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'estoque' && (
          <InventoryView
            epis={epis}
            onOpenNewEPI={() => {
              setEpiToEdit(null);
              setIsEPIEditOpen(true);
            }}
            onEditEPI={(item) => {
              setEpiToEdit(item);
              setIsEPIEditOpen(true);
            }}
            onOpenMovement={handleOpenStockMovement}
            onViewCADetails={handleViewCADetails}
            onDeliverEPI={(epiId) => handleOpenNewDelivery(undefined, epiId)}
          />
        )}

        {activeTab === 'entregas' && (
          <DeliveriesView
            deliveries={deliveries}
            collaborators={collaborators}
            epis={epis}
            onOpenNewDelivery={() => handleOpenNewDelivery()}
            onOpenReturnExchange={(del) => {
              setSelectedReturnDelivery(del);
              setIsReturnModalOpen(true);
            }}
            onViewFicha={handleViewFicha}
          />
        )}

        {activeTab === 'colaboradores' && (
          <CollaboratorsView
            collaborators={collaborators}
            deliveries={deliveries}
            epis={epis}
            onOpenNewCollaborator={() => {
              setCollaboratorToEdit(null);
              setIsCollaboratorModalOpen(true);
            }}
            onEditCollaborator={(colab) => {
              setCollaboratorToEdit(colab);
              setIsCollaboratorModalOpen(true);
            }}
            onViewFicha={handleViewFicha}
            onNewDeliveryForColab={(colabId) => handleOpenNewDelivery(colabId)}
          />
        )}

        {(activeTab === 'ca' || activeTab === 'alertas') && (
          <CAExpiryView
            epis={epis}
            deliveries={deliveries}
            collaborators={collaborators}
            onViewCADetails={handleViewCADetails}
            onEditEPI={(item) => {
              setEpiToEdit(item);
              setIsEPIEditOpen(true);
            }}
            onOpenNewDelivery={handleOpenNewDelivery}
          />
        )}

        {activeTab === 'movimentacoes' && (
          <MovementsAuditView
            movements={movements}
            epis={epis}
            onResetData={handleResetData}
            onOpenNewMovement={() => handleOpenStockMovement()}
            onOpenHeaderConfig={() => setIsHeaderConfigOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-5 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-800">
              SafeGuard EPI · Sistema de Gestão e Controle de EPI
            </span>
            <span className="mx-2 text-slate-300">|</span>
            <span>Norma Regulamentadora nº 6 (Portaria MTE nº 3.214/78)</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Auditoria SST &bull; Em conformidade com eSocial Evento S-2240
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewDeliveryModal
        isOpen={isNewDeliveryOpen}
        onClose={() => setIsNewDeliveryOpen(false)}
        collaborators={collaborators}
        epis={epis}
        preSelectedCollaboratorId={deliveryPreColabId}
        preSelectedEpiId={deliveryPreEpiId}
        currentUserName={
          currentUser
            ? `${currentUser.name}${currentUser.registrationNumber ? ` (${currentUser.registrationNumber})` : ''}`
            : undefined
        }
        onDeliveryCreated={handleDeliveryCreated}
      />

      <StockMovementModal
        isOpen={isStockMovementOpen}
        onClose={() => setIsStockMovementOpen(false)}
        epis={epis}
        preSelectedEpiId={movementPreEpiId}
        currentUserName={currentUser?.name}
        onMovementCreated={handleStockMovementCreated}
      />

      <EPIEditModal
        isOpen={isEPIEditOpen}
        onClose={() => setIsEPIEditOpen(false)}
        epiToEdit={epiToEdit}
        onSave={handleSaveEPI}
      />

      <CollaboratorModal
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
        collaboratorToEdit={collaboratorToEdit}
        onSave={handleSaveCollaborator}
      />

      {fichaCollaborator && (
        <EPIFichaModal
          isOpen={isFichaOpen}
          onClose={() => setIsFichaOpen(false)}
          collaborator={fichaCollaborator}
          deliveries={deliveries}
          epis={epis}
          onOpenHeaderConfig={() => setIsHeaderConfigOpen(true)}
        />
      )}

      <CADetailsModal
        isOpen={isCADetailsOpen}
        onClose={() => setIsCADetailsOpen(false)}
        epi={selectedCAEpi}
        onOpenEdit={(item) => {
          setEpiToEdit(item);
          setIsEPIEditOpen(true);
        }}
      />

      <ReturnExchangeModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        delivery={selectedReturnDelivery}
        onConfirmReturn={handleConfirmReturn}
      />

      {/* Header & Logo Customization Modal */}
      <HeaderConfigModal
        isOpen={isHeaderConfigOpen}
        onClose={() => setIsHeaderConfigOpen(false)}
        currentConfig={headerConfig}
        onSave={handleSaveHeaderConfig}
      />

      {/* Cloud & Firestore Backup Sync Modal */}
      <SyncBackupModal
        isOpen={isSyncBackupOpen}
        onClose={() => setIsSyncBackupOpen(false)}
        currentUser={currentUser}
        onSyncCompleted={(payload) => {
          showToast(`Backup sincronizado com sucesso (${payload.metadata.totalDocuments} registros salvos no Firebase Firestore)!`);
        }}
        onReloadCompanyData={() => {
          if (currentUser?.companyId) {
            loadCompanyData(currentUser.companyId);
            showToast('Dados da empresa atualizados a partir do Firebase Firestore!');
          }
        }}
      />

      {/* Company Team & Collaborator Logins Modal */}
      {currentUser && (
        <CompanyTeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          currentUser={currentUser}
          collaboratorsList={collaborators}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}

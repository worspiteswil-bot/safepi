import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  Package,
  Send,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Command,
  Clock,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Collaborator, EPIItem, EPIDelivery } from '../types/epi';
import { CATEGORY_LABELS } from '../services/storage';

interface GlobalSearchBarProps {
  collaborators: Collaborator[];
  epis: EPIItem[];
  deliveries: EPIDelivery[];
  onOpenFicha: (collaborator: Collaborator) => void;
  onOpenNewDelivery: (collaboratorId?: string, epiId?: string) => void;
  onOpenCADetails: (epi: EPIItem) => void;
  onNavigateTab: (tab: 'dashboard' | 'estoque' | 'entregas' | 'colaboradores' | 'ca' | 'movimentacoes') => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  collaborators,
  epis,
  deliveries,
  onOpenFicha,
  onOpenNewDelivery,
  onOpenCADetails,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'todos' | 'colaboradores' | 'epis' | 'entregas'>('todos');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global keyboard shortcut: Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching items
  const cleanQ = query.trim().toLowerCase();

  const filteredCollaborators = useMemo(() => {
    if (!cleanQ) return [];
    const digitsOnly = cleanQ.replace(/\D/g, '');
    return collaborators.filter((c) => {
      const matchName = c.name.toLowerCase().includes(cleanQ);
      const matchRole = c.role.toLowerCase().includes(cleanQ);
      const matchDept = c.department.toLowerCase().includes(cleanQ);
      const matchReg = c.registration.toLowerCase().includes(cleanQ);
      const matchCpf = digitsOnly && c.cpf.replace(/\D/g, '').includes(digitsOnly);
      return matchName || matchRole || matchDept || matchReg || matchCpf;
    });
  }, [collaborators, cleanQ]);

  const filteredEPIs = useMemo(() => {
    if (!cleanQ) return [];
    return epis.filter((e) => {
      const catLabel = (CATEGORY_LABELS[e.category] || '').toLowerCase();
      const matchName = e.name.toLowerCase().includes(cleanQ);
      const matchCode = e.code.toLowerCase().includes(cleanQ);
      const matchCa = e.caNumber.toLowerCase().includes(cleanQ);
      const matchCat = e.category.toLowerCase().includes(cleanQ) || catLabel.includes(cleanQ);
      const matchManuf = e.manufacturer.toLowerCase().includes(cleanQ);
      return matchName || matchCode || matchCa || matchCat || matchManuf;
    });
  }, [epis, cleanQ]);

  const filteredDeliveries = useMemo(() => {
    if (!cleanQ) return [];
    return deliveries.filter((d) => {
      const matchCode = d.code.toLowerCase().includes(cleanQ);
      const matchColab = d.collaboratorName.toLowerCase().includes(cleanQ);
      const matchEpi = d.epiName.toLowerCase().includes(cleanQ);
      const matchCa = d.caNumber.toLowerCase().includes(cleanQ);
      return matchCode || matchColab || matchEpi || matchCa;
    });
  }, [deliveries, cleanQ]);

  const totalResults =
    filteredCollaborators.length + filteredEPIs.length + filteredDeliveries.length;

  const handleSelectCollaborator = (colab: Collaborator, action: 'ficha' | 'entrega' | 'view') => {
    setIsOpen(false);
    if (action === 'ficha') {
      onOpenFicha(colab);
    } else if (action === 'entrega') {
      onOpenNewDelivery(colab.id);
    } else {
      onNavigateTab('colaboradores');
    }
  };

  const handleSelectEPI = (epi: EPIItem, action: 'detalhes' | 'entrega' | 'view') => {
    setIsOpen(false);
    if (action === 'detalhes') {
      onOpenCADetails(epi);
    } else if (action === 'entrega') {
      onOpenNewDelivery(undefined, epi.id);
    } else {
      onNavigateTab('estoque');
    }
  };

  const handleSelectDelivery = (_delivery: EPIDelivery) => {
    setIsOpen(false);
    onNavigateTab('entregas');
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-lg mx-2 sm:mx-4">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Pesquisar colaborador (nome, CPF) ou EPI (nome, tipo, C.A.)..."
          className="w-full pl-9 pr-16 py-1.5 bg-slate-100 hover:bg-slate-100/90 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
        />

        {/* Clear or Shortcut badge */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Limpar pesquisa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 select-none pointer-events-none">
              <Command className="w-2.5 h-2.5" />K
            </span>
          )}
        </div>
      </div>

      {/* Results Dropdown Popover */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[80vh] flex flex-col animate-in fade-in slide-in-from-top-1">
          {/* Tabs Filter Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setActiveCategory('todos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeCategory === 'todos'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Todos ({totalResults})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('colaboradores')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeCategory === 'colaboradores'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3 h-3" />
              Colaboradores ({filteredCollaborators.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('epis')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeCategory === 'epis'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Package className="w-3 h-3" />
              EPIs & Estoque ({filteredEPIs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('entregas')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeCategory === 'entregas'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Send className="w-3 h-3" />
              Entregas ({filteredDeliveries.length})
            </button>
          </div>

          {/* Results List Body */}
          <div className="overflow-y-auto p-2 space-y-4 max-h-[60vh]">
            {totalResults === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">
                  Nenhum colaborador ou EPI encontrado para "{query}"
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Dica: Busque pelo primeiro nome, cargo (ex: soldador), tipo de EPI (ex: capacete, luva, óculos) ou número do C.A.
                </p>
              </div>
            ) : (
              <>
                {/* Collaborators Section */}
                {(activeCategory === 'todos' || activeCategory === 'colaboradores') &&
                  filteredCollaborators.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Colaboradores Encontrados ({filteredCollaborators.length})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {filteredCollaborators.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 hover:bg-slate-50 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                                {c.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-2">
                                  <span>{c.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Matrícula: {c.registration}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                  <span className="font-medium text-slate-700">{c.role}</span>
                                  <span>&bull;</span>
                                  <span>{c.department}</span>
                                  <span>&bull;</span>
                                  <span className="font-mono text-slate-400">CPF: {c.cpf}</span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions for Collaborator */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleSelectCollaborator(c, 'ficha')}
                                className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                                title="Ver Ficha de EPI (NR-6)"
                              >
                                <FileText className="w-3 h-3 text-amber-600" />
                                <span>Ficha NR-6</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectCollaborator(c, 'entrega')}
                                className="px-2 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                                title="Fazer Nova Entrega de EPI para este Colaborador"
                              >
                                <Send className="w-3 h-3 text-amber-400" />
                                <span>Entregar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectCollaborator(c, 'view')}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                title="Abrir cadastro de colaboradores"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* EPIs Section */}
                {(activeCategory === 'todos' || activeCategory === 'epis') &&
                  filteredEPIs.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <span>EPIs e Tipos de Proteção ({filteredEPIs.length})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {filteredEPIs.map((epi) => {
                          const isLowStock = epi.stockQuantity <= epi.minStockQuantity;
                          const isEmpty = epi.stockQuantity <= 0;

                          return (
                            <div
                              key={epi.id}
                              className="p-2 hover:bg-slate-50 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-2">
                                    <span>{epi.name}</span>
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                      C.A. {epi.caNumber}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                    <span className="font-medium text-slate-700">
                                      {CATEGORY_LABELS[epi.category] || epi.category}
                                    </span>
                                    <span>&bull;</span>
                                    <span>{epi.manufacturer}</span>
                                    <span>&bull;</span>
                                    <span
                                      className={`font-semibold ${
                                        isEmpty
                                          ? 'text-rose-600 font-bold'
                                          : isLowStock
                                          ? 'text-amber-600 font-bold'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      Estoque: {epi.stockQuantity} {epi.unit}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions for EPI */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleSelectEPI(epi, 'detalhes')}
                                  className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Ver Validade e Detalhes do C.A."
                                >
                                  <ExternalLink className="w-3 h-3 text-slate-500" />
                                  <span>C.A. {epi.caNumber}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isEmpty}
                                  onClick={() => handleSelectEPI(epi, 'entrega')}
                                  className="px-2 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Entregar este EPI"
                                >
                                  <Send className="w-3 h-3 text-amber-400" />
                                  <span>Entregar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectEPI(epi, 'view')}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                  title="Ver no Estoque"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Deliveries Section */}
                {(activeCategory === 'todos' || activeCategory === 'entregas') &&
                  filteredDeliveries.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Entregas Registradas ({filteredDeliveries.length})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {filteredDeliveries.map((del) => (
                          <div
                            key={del.id}
                            onClick={() => handleSelectDelivery(del)}
                            className="p-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-2">
                                <span className="font-mono text-slate-500">{del.code}</span>
                                <span>&bull;</span>
                                <span>{del.collaboratorName}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                <span>{del.epiName}</span>
                                <span>&bull;</span>
                                <span className="font-mono">C.A. {del.caNumber}</span>
                                <span>&bull;</span>
                                <span>{del.deliveryDate}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  del.status === 'em_uso'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {del.status === 'em_uso' ? 'Em Uso' : 'Devolvido'}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Mostrando resultados para: <strong className="text-slate-800">"{query}"</strong>
            </span>
            <span className="font-mono text-[10px] text-slate-400">Pressione ESC para fechar</span>
          </div>
        </div>
      )}
    </div>
  );
};

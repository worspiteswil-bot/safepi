import React from 'react';
import { StockMovement, EPIItem } from '../types/epi';
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  AlertTriangle,
  PlusCircle,
  FileText,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

interface RecentMovementsCardProps {
  movements: StockMovement[];
  epis?: EPIItem[];
  onOpenNewMovement: () => void;
  onNavigateToMovements: () => void;
}

export const RecentMovementsCard: React.FC<RecentMovementsCardProps> = ({
  movements,
  epis = [],
  onOpenNewMovement,
  onNavigateToMovements,
}) => {
  // Sort descending by date (and ID fallback for stability) and take top 5
  const recentMovements = [...movements]
    .sort((a, b) => {
      const dateCmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return b.id.localeCompare(a.id);
    })
    .slice(0, 5);

  const getMovementTypeBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'entrada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownRight className="w-3 h-3 text-emerald-600 shrink-0" />
            Entrada / Compra
          </span>
        );
      case 'saida_entrega':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <ArrowUpRight className="w-3 h-3 text-slate-500 shrink-0" />
            Saída Entrega
          </span>
        );
      case 'baixa_descarte':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
            Baixa / Descarte
          </span>
        );
      case 'ajuste':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600 shrink-0" />
            Ajuste Inventário
          </span>
        );
      case 'devolucao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RotateCcw className="w-3 h-3 text-blue-600 shrink-0" />
            Devolução
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 via-white to-amber-50/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/20 mt-0.5">
            <History className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Últimas 5 Movimentações de Estoque
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Auditoria Operacional
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisão rápida de entradas fiscais com NF-e, saídas para colaboradores e baixas por descarte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={onOpenNewMovement}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Registrar Movimento</span>
          </button>
          <button
            onClick={onNavigateToMovements}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 border border-amber-500/30 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ver Histórico Completo ({movements.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body / Table */}
      {recentMovements.length === 0 ? (
        <div className="p-8 text-center text-slate-500 space-y-2">
          <History className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-xs font-medium">Nenhuma movimentação de estoque registrada até o momento.</p>
          <button
            onClick={onOpenNewMovement}
            className="text-xs text-amber-600 hover:underline font-semibold"
          >
            Clique aqui para registrar a primeira entrada ou saída
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Data</th>
                <th className="py-2.5 px-4">Operação</th>
                <th className="py-2.5 px-4">Equipamento de Proteção (EPI)</th>
                <th className="py-2.5 px-3 text-center">Qtd</th>
                <th className="py-2.5 px-4">Documento / Origem</th>
                <th className="py-2.5 px-4">Responsável Técnico</th>
                <th className="py-2.5 px-4">Justificativa / Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMovements.map((mov) => {
                const isEntry = mov.type === 'entrada' || mov.type === 'devolucao';
                const relatedEpi = epis.find((e) => e.id === mov.epiId);

                return (
                  <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-medium text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formatDate(mov.date)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {mov.date}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getMovementTypeBadge(mov.type)}
                    </td>

                    {/* EPI Name & Details */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {mov.epiName}
                      </div>
                      {relatedEpi && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{relatedEpi.code}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                            C.A. {relatedEpi.caNumber}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block font-mono text-sm font-bold tabular-nums px-2 py-0.5 rounded ${
                          isEntry
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : mov.type === 'baixa_descarte'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                      </span>
                    </td>

                    {/* NF-e / Supplier */}
                    <td className="py-3 px-4 text-slate-600">
                      {mov.invoiceNumber ? (
                        <div>
                          <div className="font-mono font-bold text-slate-800 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400" />
                            {mov.invoiceNumber}
                          </div>
                          {mov.supplier && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {mov.supplier}
                            </div>
                          )}
                        </div>
                      ) : mov.supplier ? (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[180px]">{mov.supplier}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Interno</span>
                      )}
                    </td>

                    {/* Responsible */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      <div className="font-medium text-slate-800">{mov.responsible}</div>
                      <div className="text-[10px] text-slate-400">SESMT / Almoxarifado</div>
                    </td>

                    {/* Justification / Notes */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <p className="truncate text-xs text-slate-600" title={mov.reasonNotes || ''}>
                        {mov.reasonNotes || <span className="text-slate-400 italic">Sem observações</span>}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Quick Strip Footer */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rastreabilidade conforme NR-6 e eSocial S-2240</span>
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline font-mono text-[11px]">
            Total acumulado no livro: <strong>{movements.length}</strong> operações
          </span>
        </div>

        <button
          onClick={onNavigateToMovements}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
        >
          <span>Acessar Livro Completo de Auditoria SST</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

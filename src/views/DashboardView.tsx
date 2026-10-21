import React, { useState } from 'react';
import {
  EPIItem,
  Collaborator,
  EPIDelivery,
  StockMovement,
  AutomaticAlert,
  EPICategory,
} from '../types/epi';
import { CATEGORY_LABELS } from '../services/storage';
import { PrintReportHeader, PrintReportFooter } from '../components/PrintReportHeader';
import { MonthlyDeliveriesChart } from '../components/MonthlyDeliveriesChart';
import { NR6SafetyTipsCard } from '../components/NR6SafetyTipsCard';
import { RecentMovementsCard } from '../components/RecentMovementsCard';
import { PDFGenerator } from '../utils/pdfGenerator';
import {
  ShieldAlert,
  AlertTriangle,
  Package,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PlusCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Printer,
  History,
  FileDown,
  Loader2,
} from 'lucide-react';

interface DashboardViewProps {
  epis: EPIItem[];
  collaborators: Collaborator[];
  deliveries: EPIDelivery[];
  movements: StockMovement[];
  alerts: AutomaticAlert[];
  onOpenNewDelivery: (colabId?: string, epiId?: string) => void;
  onOpenNewMovement: (epiId?: string) => void;
  onOpenNewEPI: () => void;
  onViewCADetails: (epi: EPIItem) => void;
  onViewFicha: (colab: Collaborator) => void;
  onNavigateToTab: (
    tab: 'dashboard' | 'estoque' | 'entregas' | 'colaboradores' | 'alertas' | 'ca' | 'movimentacoes'
  ) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  epis,
  collaborators,
  deliveries,
  movements,
  alerts,
  onOpenNewDelivery,
  onOpenNewMovement,
  onOpenNewEPI,
  onViewCADetails,
  onViewFicha,
  onNavigateToTab,
}) => {
  const [alertFilter, setAlertFilter] = useState<'todos' | 'critico' | 'atencao'>('todos');

  // Stats calculation
  const totalStockUnits = epis.reduce((sum, item) => sum + item.stockQuantity, 0);
  const totalStockValue = epis.reduce(
    (sum, item) => sum + item.stockQuantity * item.unitCost,
    0
  );
  const criticalItemsCount = epis.filter(
    (e) => e.stockQuantity <= e.minStockQuantity || e.caStatus === 'vencido'
  ).length;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critico').length;
  const attentionAlertsCount = alerts.filter((a) => a.severity === 'atencao').length;

  const activeDeliveries = deliveries.filter((d) => d.status === 'em_uso');
  const activeCollaborators = collaborators.filter((c) => c.status === 'ativo');

  // Filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === 'todos') return true;
    return a.severity === alertFilter;
  });

  // Category counts
  const categorySummary = Object.keys(CATEGORY_LABELS).map((catKey) => {
    const cat = catKey as EPICategory;
    const catItems = epis.filter((e) => e.category === cat);
    const totalUnits = catItems.reduce((acc, curr) => acc + curr.stockQuantity, 0);
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      count: catItems.length,
      units: totalUnits,
    };
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((r) => setTimeout(r, 60));
      await PDFGenerator.generateDashboardExecutivePDF(epis, deliveries, collaborators, movements);
    } catch (err) {
      console.error('Erro ao gerar PDF do painel:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Official Print Header */}
      <PrintReportHeader
        title="RELATÓRIO EXECUTIVO DE INDICADORES SST, ESTOQUE E GESTÃO DE EPIS"
        subtitle="Quadro de conformidade legal com a Norma Regulamentadora nº 6 (Portaria MTP nº 2.175/2022)"
      />

      {/* Top Banner with Quick Actions */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Painel de Gestão e Conformidade NR-6
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Sistema Operacional Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoramento em tempo real de estoque, validade de C.A. junto ao MTE e entregas a colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Baixar arquivo PDF com resumo executivo de estoque e conformidade"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>Baixar Relatório (PDF)</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Imprimir
          </button>
          <button
            onClick={() => onOpenNewMovement()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Package className="w-3.5 h-3.5 text-slate-500" />
            Entrada de Estoque
          </button>
          <button
            onClick={() => onOpenNewEPI()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            Cadastrar Novo EPI
          </button>
          <button
            onClick={() => onOpenNewDelivery()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Nova Entrega de EPI
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Saldo Físico em Estoque</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {totalStockUnits}
            </span>
            <span className="text-xs text-slate-500">unidades</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Valor em Almoxarifado: R${' '}
            {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateToTab('alertas')}
          className={`bg-white p-4 rounded-xl border shadow-xs space-y-1 cursor-pointer transition-all hover:border-rose-400 ${
            criticalAlertsCount > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Alertas Críticos / Imediatos</span>
            <AlertTriangle
              className={`w-4 h-4 ${criticalAlertsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
                criticalAlertsCount > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {criticalAlertsCount}
            </span>
            <span className="text-xs text-slate-500">ações exigidas</span>
          </div>
          <div className="text-[11px] text-rose-600 flex items-center gap-1">
            <span>C.A. vencido, ruptura ou troca atrasada</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateToTab('entregas')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>EPIs Ativos em Uso</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {activeDeliveries.length}
            </span>
            <span className="text-xs text-slate-500">equipamentos</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Em posse de {collaborators.length} colaboradores
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateToTab('ca')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Conformidade C.A. (MTE)</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {epis.filter((e) => e.caStatus === 'valido').length} / {epis.length}
            </span>
            <span className="text-xs text-slate-500">válidos</span>
          </div>
          <div className="text-[11px] text-amber-700">
            {epis.filter((e) => e.caStatus === 'a_vencer').length} com C.A. vencendo em 30 dias
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts Column (Left) + Stock/Categories (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Automatic Alerts Engine */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Central de Alertas Automáticos de Validade e Estoque
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Regras automáticas recalculadas conforme a NR-6 e periodicidades de troca
              </p>
            </div>

            {/* Segmented Filter */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setAlertFilter('todos')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  alertFilter === 'todos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({alerts.length})
              </button>
              <button
                onClick={() => setAlertFilter('critico')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  alertFilter === 'critico'
                    ? 'bg-rose-50 text-rose-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Críticos ({criticalAlertsCount})
              </button>
              <button
                onClick={() => setAlertFilter('atencao')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  alertFilter === 'atencao'
                    ? 'bg-amber-50 text-amber-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Atenção ({attentionAlertsCount})
              </button>
            </div>
          </div>

          {/* Alert Cards List */}
          <div className="divide-y divide-slate-100 p-4 space-y-3 overflow-y-auto max-h-[460px]">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-medium text-slate-700">
                  Nenhum alerta pendente nesta categoria.
                </p>
                <p className="text-[11px] text-slate-400">
                  Todos os C.A.s e níveis de estoque estão em conformidade regular.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCrit = alert.severity === 'critico';
                const relatedEpi = epis.find((e) => e.id === alert.itemId);
                const relatedColab = collaborators.find((c) => c.id === alert.collaboratorId);

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-lg border text-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCrit
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-amber-50/30 border-amber-200'
                    }`}
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isCrit ? 'text-rose-900' : 'text-amber-900'
                          }`}
                        >
                          {alert.title}
                        </span>
                        {alert.daysRemaining !== undefined && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {alert.daysRemaining < 0
                              ? `(${Math.abs(alert.daysRemaining)}d em atraso)`
                              : `(${alert.daysRemaining}d restantes)`}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {alert.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {alert.actionType === 'ir_entrega' && (
                        <button
                          onClick={() => {
                            if (relatedColab) {
                              onOpenNewDelivery(relatedColab.id, alert.itemId);
                            } else {
                              onOpenNewDelivery();
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-xs whitespace-nowrap transition-colors"
                        >
                          Substituir EPI
                        </button>
                      )}

                      {alert.actionType === 'ir_estoque' && (
                        <button
                          onClick={() => onOpenNewMovement(alert.itemId)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-xs whitespace-nowrap transition-colors"
                        >
                          Repor Estoque
                        </button>
                      )}

                      {alert.actionType === 'renovar_ca' && relatedEpi && (
                        <button
                          onClick={() => onViewCADetails(relatedEpi)}
                          className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md whitespace-nowrap transition-colors"
                        >
                          Detalhes C.A.
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Category Inventory & Stock Health */}
        <div className="space-y-6">
          {/* Categories Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-semibold text-slate-900">
                Estoque por Categoria de Proteção
              </h3>
              <button
                onClick={() => onNavigateToTab('estoque')}
                className="text-[11px] text-amber-700 hover:underline font-medium"
              >
                Ver Catálogo
              </button>
            </div>

            <div className="space-y-2.5">
              {categorySummary.slice(0, 6).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{cat.label}</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {cat.units} un
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-800 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (cat.units / Math.max(1, totalStockUnits)) * 250)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NR-6 Quick Safety Culture Tips (Randomized on Load) */}
          <NR6SafetyTipsCard />
        </div>
      </div>

      {/* Monthly Deliveries Bar Chart Card (Last 6 Months) */}
      <MonthlyDeliveriesChart
        deliveries={deliveries}
        onNavigateToDeliveries={() => onNavigateToTab('entregas')}
      />

      {/* Recent Stock Movements Card (5 Latest Operations for Quick Supervision) */}
      <RecentMovementsCard
        movements={movements}
        epis={epis}
        onOpenNewMovement={() => onOpenNewMovement()}
        onNavigateToMovements={() => onNavigateToTab('movimentacoes')}
      />

      {/* Bottom Section: Recent Deliveries and Quick Workers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Últimas Entregas de EPI Registradas
            </h3>
            <p className="text-xs text-slate-500">
              Histórico recente de saídas com controle de assinatura e prazo de troca
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('entregas')}
            className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            Ver Todas ({deliveries.length})
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Código / Data</th>
                <th className="py-2.5 px-4">Colaborador</th>
                <th className="py-2.5 px-4">Setor</th>
                <th className="py-2.5 px-4">EPI Fornecido</th>
                <th className="py-2.5 px-4">C.A.</th>
                <th className="py-2.5 px-3 text-center">Qtd</th>
                <th className="py-2.5 px-4">Próxima Troca</th>
                <th className="py-2.5 px-4 text-center">Ficha Individual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.slice(0, 6).map((del) => {
                const colab = collaborators.find((c) => c.id === del.collaboratorId);
                return (
                  <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-slate-900">{del.code}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{del.deliveryDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{del.collaboratorName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        CPF: {del.collaboratorCpf}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{del.collaboratorDepartment}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 max-w-xs truncate">
                        {del.epiName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        {del.caNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {del.quantity}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {del.expectedExchangeDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {colab && (
                        <button
                          onClick={() => onViewFicha(colab)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          Ficha NR-6
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Report Footer */}
      <PrintReportFooter />
    </div>
  );
};

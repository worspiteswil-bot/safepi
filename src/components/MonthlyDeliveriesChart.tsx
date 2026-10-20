import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Package,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { EPIDelivery } from '../types/epi';
import { CURRENT_DATE_STR } from '../services/storage';

interface MonthlyDeliveriesChartProps {
  deliveries: EPIDelivery[];
  referenceDateStr?: string;
  onNavigateToDeliveries?: () => void;
}

interface MonthData {
  key: string;
  mes: string;
  nomeCompleto: string;
  ano: number;
  mesIndex: number;
  entregas: number;
  itensFornecidos: number;
  comBiometria: number;
  isCurrentMonth: boolean;
}

export const MonthlyDeliveriesChart: React.FC<MonthlyDeliveriesChartProps> = ({
  deliveries,
  referenceDateStr = CURRENT_DATE_STR,
  onNavigateToDeliveries,
}) => {
  const { monthlyData, totalDeliveries, totalItems, avgPerMonth, peakMonth, biometricPercentage } =
    useMemo(() => {
      const refDate = new Date(referenceDateStr + 'T12:00:00');
      const monthNamesShort = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];
      const monthNamesFull = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];

      const currentYear = refDate.getFullYear();
      const currentMonthIndex = refDate.getMonth();

      const months: MonthData[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonthIndex - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const mes = `${monthNamesShort[m]}/${String(y).slice(2)}`;
        const nomeCompleto = `${monthNamesFull[m]} de ${y}`;
        const isCurrentMonth = i === 0;

        // Count deliveries in this month
        const matched = deliveries.filter((del) => del.deliveryDate && del.deliveryDate.startsWith(key));
        const entregas = matched.length;
        const itensFornecidos = matched.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
        const comBiometria = matched.filter(
          (del) => Boolean(del.biometricPhotoUrl || del.biometricValidationHash)
        ).length;

        months.push({
          key,
          mes,
          nomeCompleto,
          ano: y,
          mesIndex: m,
          entregas,
          itensFornecidos,
          comBiometria,
          isCurrentMonth,
        });
      }

      const totalDeliveries = months.reduce((acc, curr) => acc + curr.entregas, 0);
      const totalItems = months.reduce((acc, curr) => acc + curr.itensFornecidos, 0);
      const totalBiometric = months.reduce((acc, curr) => acc + curr.comBiometria, 0);
      const avgPerMonth = (totalDeliveries / 6).toFixed(1);

      // Peak month
      let maxVal = -1;
      let peak = months[months.length - 1];
      for (const m of months) {
        if (m.entregas > maxVal) {
          maxVal = m.entregas;
          peak = m;
        }
      }

      const biometricPercentage =
        totalDeliveries > 0 ? Math.round((totalBiometric / totalDeliveries) * 100) : 100;

      return {
        monthlyData: months,
        totalDeliveries,
        totalItems,
        avgPerMonth,
        peakMonth: peak,
        biometricPercentage,
      };
    }, [deliveries, referenceDateStr]);

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthData = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-semibold text-slate-100">{data.nomeCompleto}</span>
            {data.isCurrentMonth && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                Mês Vigente
              </span>
            )}
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                Entregas Realizadas:
              </span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                {data.entregas} {data.entregas === 1 ? 'entrega' : 'entregas'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Package className="w-3 h-3 text-slate-400" />
                Equipamentos (Unidades):
              </span>
              <span className="font-mono text-slate-200">{data.itensFornecidos} un</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Biometria Facial + GPS:
              </span>
              <span className="text-emerald-400 font-semibold font-mono">
                {data.entregas > 0 ? `${Math.round((data.comBiometria / data.entregas) * 100)}%` : '100%'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Resumo de Entregas Mensais
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Últimos 6 Meses
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Histórico quantitativo de fornecimento de EPIs e conformidade com a NR-6
              </p>
            </div>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Total no Semestre:</span>
            <span className="font-bold font-mono text-slate-900">{totalDeliveries} entregas</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Média Mensal:</span>
            <span className="font-bold font-mono text-slate-900">{avgPerMonth}/mês</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">{biometricPercentage}% com Biometria</span>
          </div>

          {onNavigateToDeliveries && (
            <button
              onClick={onNavigateToDeliveries}
              className="text-xs text-slate-700 hover:text-slate-900 font-medium px-2.5 py-1.5 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 ml-auto sm:ml-0"
              title="Acessar listagem de entregas"
            >
              Ver Tabela
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-5 space-y-5">
        {/* Recharts Bar Chart */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 20, right: 16, left: -20, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="mes"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                allowDecimals={false}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="entregas"
                name="Quantidade de Entregas"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrentMonth ? '#f59e0b' : '#0f172a'}
                    className="transition-opacity hover:opacity-85 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Legend Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900 inline-block" />
              Meses Anteriores
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
              Mês Vigente (Em Andamento)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Pico semestral: <strong className="text-slate-700">{peakMonth.nomeCompleto}</strong> ({peakMonth.entregas} entregas)
          </div>
        </div>

        {/* 6-Month Data Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {monthlyData.map((item) => (
            <div
              key={item.key}
              className={`p-3 rounded-lg border text-center transition-all ${
                item.isCurrentMonth
                  ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-300'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-[11px] font-semibold text-slate-500">{item.mes}</span>
                {item.isCurrentMonth && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Mês atual" />
                )}
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1">
                {item.entregas}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {item.itensFornecidos} {item.itensFornecidos === 1 ? 'item' : 'itens'}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[10px] text-emerald-700">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>
                  {item.entregas > 0
                    ? `${Math.round((item.comBiometria / item.entregas) * 100)}% bio`
                    : '100% bio'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

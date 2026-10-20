import React, { useState } from 'react';
import { EPIItem, EPICategory } from '../types/epi';
import { CATEGORY_LABELS, CURRENT_DATE_STR, getDaysDifference } from '../services/storage';
import { PrintReportHeader, PrintReportFooter } from '../components/PrintReportHeader';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  ArrowDownRight,
  Edit,
  ShieldCheck,
  Send,
  Printer,
  Download,
  FileDown,
  Loader2,
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';
import { PDFGenerator } from '../utils/pdfGenerator';

interface InventoryViewProps {
  epis: EPIItem[];
  onOpenNewEPI: () => void;
  onEditEPI: (epi: EPIItem) => void;
  onOpenMovement: (epiId?: string) => void;
  onViewCADetails: (epi: EPIItem) => void;
  onDeliverEPI: (epiId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  epis,
  onOpenNewEPI,
  onEditEPI,
  onOpenMovement,
  onViewCADetails,
  onDeliverEPI,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'critico' | 'ca_risco' | 'esgotado'>('todos');

  // Filtering
  const filteredItems = epis.filter((item) => {
    // Search
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caNumber.includes(searchTerm) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Category
    if (selectedCategory !== 'todos' && item.category !== selectedCategory) {
      return false;
    }

    // Status filter
    const daysToExpiry = getDaysDifference(item.caExpiryDate);
    if (statusFilter === 'critico') {
      return item.stockQuantity <= item.minStockQuantity;
    }
    if (statusFilter === 'ca_risco') {
      return daysToExpiry <= 30;
    }
    if (statusFilter === 'esgotado') {
      return item.stockQuantity === 0;
    }

    return true;
  });

  const totalFilteredValue = filteredItems.reduce(
    (acc, curr) => acc + curr.stockQuantity * curr.unitCost,
    0
  );

  const handleExportCSV = () => {
    const headers = [
      'Código',
      'Nome do EPI',
      'Categoria',
      'Número do C.A.',
      'Validade do C.A.',
      'Fabricante',
      'Saldo em Estoque',
      'Estoque Mínimo',
      'Unidade',
      'Custo Unitário (R$)',
      'Valor Total em Estoque (R$)',
      'Troca Padrão (dias)',
      'Status do Estoque',
      'Situação do C.A.',
    ];

    const rows = filteredItems.map((item) => {
      const daysToExpiry = getDaysDifference(item.caExpiryDate);
      const isExpired = daysToExpiry < 0;
      const isExpiring = daysToExpiry >= 0 && daysToExpiry <= 30;
      const caStatus = isExpired
        ? 'VENCIDO'
        : isExpiring
        ? `Vence em ${daysToExpiry} dias`
        : 'Válido';

      const stockStatus =
        item.stockQuantity === 0
          ? 'Esgotado'
          : item.stockQuantity <= item.minStockQuantity
          ? 'Abaixo do Mínimo'
          : 'Normal';

      return [
        item.code,
        item.name,
        CATEGORY_LABELS[item.category] || item.category,
        item.caNumber,
        item.caExpiryDate,
        item.manufacturer,
        item.stockQuantity,
        item.minStockQuantity,
        item.unit,
        item.unitCost.toFixed(2),
        (item.stockQuantity * item.unitCost).toFixed(2),
        item.standardReplacementDays,
        stockStatus,
        caStatus,
      ];
    });

    downloadCSV(`inventario_estoque_epi_${CURRENT_DATE_STR}.csv`, headers, rows);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await new Promise((r) => setTimeout(r, 60));
      PDFGenerator.generateInventoryPDF(filteredItems, selectedCategory, searchTerm);
    } catch (err) {
      console.error('Erro ao gerar PDF do inventário:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Official Print Header */}
      <PrintReportHeader
        title="RELATÓRIO OFICIAL DE INVENTÁRIO, SALDOS E VIGÊNCIA DE CERTIFICADOS DE APROVAÇÃO (C.A.)"
        subtitle="Registro de almoxarifado de EPIs para conferência contábil, patrimonial e fiscalização do trabalho (NR-6)"
      />

      {/* Top Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Controle de Estoque e Almoxarifado de EPIs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de saldos físicos, ponto de reposição, validade de lote e C.A. do MTE
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Exportar lista atual filtrada para planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Baixar inventário completo em formato PDF oficial"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>Baixar PDF</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
            title="Imprimir relatório físico via impressora do navegador"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={() => onOpenMovement()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
            Movimentar Estoque
          </button>
          <button
            onClick={onOpenNewEPI}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            Cadastrar Novo EPI
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por nome, código, C.A. ou fabricante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Selects & Status Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todas as Categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({epis.length})
            </button>
            <button
              onClick={() => setStatusFilter('critico')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'critico'
                  ? 'bg-amber-50 text-amber-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Abaixo Mínimo
            </button>
            <button
              onClick={() => setStatusFilter('ca_risco')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'ca_risco'
                  ? 'bg-rose-50 text-rose-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              C.A. em Risco
            </button>
            <button
              onClick={() => setStatusFilter('esgotado')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'esgotado'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zerados
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3.5 flex-wrap">
            <span>
              Exibindo <strong className="text-slate-900 font-mono">{filteredItems.length}</strong>{' '}
              itens cadastrados
            </span>
            <div className="flex items-center gap-2 text-[11px] bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <span className="font-semibold text-slate-700">Barra de C.A.:</span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> OK
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Atenção (&le;30d)
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Vencido
              </span>
            </div>
          </div>
          <span className="font-mono">
            Valor Total em Estoque:{' '}
            <strong className="text-slate-900">
              R$ {totalFilteredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item / Código</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">C.A. (MTE) & Validade</th>
                <th className="py-3 px-4">Saldo Físico</th>
                <th className="py-3 px-4">Mínimo / Ideal</th>
                <th className="py-3 px-4">Custo Unitário</th>
                <th className="py-3 px-4">Troca Rec.</th>
                <th className="no-print py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum EPI encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const daysToExpiry = getDaysDifference(item.caExpiryDate);
                  const isCaExpired = daysToExpiry < 0;
                  const isCaNear = daysToExpiry >= 0 && daysToExpiry <= 30;
                  const isStockLow = item.stockQuantity <= item.minStockQuantity;
                  const isZero = item.stockQuantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-600">{item.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.manufacturer}</span>
                          <span aria-hidden="true">·</span>
                          <span className="italic">{item.locationShelf}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600">
                        {CATEGORY_LABELS[item.category]}
                      </td>

                      {/* CA & Expiry with Colored Proximity Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewCADetails(item)}
                            className="font-mono font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 text-xs transition-colors"
                          >
                            C.A. {item.caNumber}
                          </button>
                        </div>
                        <div className="text-[11px] font-mono mt-1">
                          {isCaExpired ? (
                            <span className="text-rose-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Vencido ({item.caExpiryDate})
                            </span>
                          ) : isCaNear ? (
                            <span className="text-amber-800 font-medium">
                              Vence em {daysToExpiry}d ({item.caExpiryDate})
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              Validade: {item.caExpiryDate}
                            </span>
                          )}
                        </div>

                        {/* Proximity Progress Bar (Verde = OK, Amarelo = Atenção, Vermelho = Vencido) */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Vigência C.A.:</span>
                            <span
                              className={`font-semibold ${
                                isCaExpired
                                  ? 'text-rose-600'
                                  : isCaNear
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {isCaExpired
                                ? 'Vencido'
                                : isCaNear
                                ? `${daysToExpiry}d (Atenção)`
                                : 'OK'}
                            </span>
                          </div>
                          <div
                            className="w-full max-w-[130px] bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50"
                            title={
                              isCaExpired
                                ? 'C.A. Vencido: proibido fornecimento conforme NR-6'
                                : isCaNear
                                ? `C.A. em Alerta: vence em ${daysToExpiry} dias`
                                : `C.A. Regular: válido por ${daysToExpiry} dias`
                            }
                          >
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                isCaExpired
                                  ? 'w-full bg-rose-500'
                                  : isCaNear
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: isCaExpired
                                  ? '100%'
                                  : isCaNear
                                  ? `${Math.max(15, Math.min(100, (daysToExpiry / 30) * 100))}%`
                                  : `${Math.min(100, Math.max(35, (daysToExpiry / 365) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`font-mono text-sm font-bold tabular-nums ${
                              isZero
                                ? 'text-rose-700'
                                : isStockLow
                                ? 'text-amber-700'
                                : 'text-slate-900'
                            }`}
                          >
                            {item.stockQuantity}
                          </span>
                          <span className="text-[11px] text-slate-500">{item.unit}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isZero
                                ? 'bg-rose-500'
                                : isStockLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (item.stockQuantity / Math.max(1, item.idealStockQuantity)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Minimum & Ideal */}
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <div>Mín: {item.minStockQuantity} {item.unit}</div>
                        <div className="text-slate-400">Ideal: {item.idealStockQuantity} {item.unit}</div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3 px-4 font-mono text-slate-800">
                        <div>R$ {item.unitCost.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">
                          Total: R$ {(item.stockQuantity * item.unitCost).toFixed(2)}
                        </div>
                      </td>

                      {/* Standard Replacement */}
                      <td className="py-3 px-4 font-mono text-slate-700 text-center">
                        {item.standardReplacementDays} dias
                      </td>

                      {/* Actions */}
                      <td className="no-print py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Nova Entrega deste EPI"
                            onClick={() => onDeliverEPI(item.id)}
                            disabled={item.stockQuantity <= 0 || isCaExpired}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          <button
                            title="Entrada / Ajuste de Estoque"
                            onClick={() => onOpenMovement(item.id)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                          <button
                            title="Editar Dados do Item"
                            onClick={() => onEditEPI(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Report Footer */}
      <PrintReportFooter />
    </div>
  );
};

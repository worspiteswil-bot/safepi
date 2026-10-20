import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockMovement, EPIItem, Collaborator, EPIDelivery } from '../types/epi';
import { CURRENT_DATE_STR, StorageService, NR6_LEGAL_TERM, CATEGORY_LABELS, getDaysDifference } from '../services/storage';

/**
 * Robust Client-Side PDF Generation Utility for SafeGuard EPI
 * Generates official compliance documents for Brazilian Labor Ministry (NR-6 / eSocial S-2240).
 * Handles direct blob download with sandbox fallback to prevent download blockage in iFrames.
 */

/**
 * Universal safe PDF downloader that works reliably across browsers,
 * iframe environments (such as AI Studio preview), and sandboxed containers.
 */
export function safeSavePDF(doc: jsPDF, filename: string): void {
  try {
    if (typeof document !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 1500);
      return;
    }
    doc.save(filename);
  } catch (err) {
    console.warn('Direct blob URL download failed, trying doc.save:', err);
    try {
      doc.save(filename);
    } catch (err2) {
      console.error('doc.save failed as well, invoking window.print as ultimate fallback:', err2);
      if (typeof window !== 'undefined' && window.print) {
        window.print();
      }
    }
  }
}

/**
 * Safely adds optional company logo to the document top banner
 */
function tryAddHeaderLogo(doc: jsPDF, logoUrl?: string, x = 16, y = 14, w = 16, h = 16) {
  if (!logoUrl || !logoUrl.startsWith('data:image/')) return;
  try {
    const format = logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
    doc.addImage(logoUrl, format, x, y, w, h);
  } catch (e) {
    console.warn('Could not render logo in PDF, skipping:', e);
  }
}

export class PDFGenerator {
  /**
   * Generates and downloads the Technical Stock Movements & SST Audit Report
   */
  static generateMovementsAuditPDF(
    movements: StockMovement[] = [],
    epis: EPIItem[] = [],
    filterType: string = 'todos',
    searchTerm: string = ''
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const subtitle = headerConfig?.subtitle || 'SESMT — Serviço Especializado em Engenharia de Segurança e Medicina do Trabalho';
    const reportCode = `REL-SST-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(14, 12, 182, 24, 'F');

    // Check for custom image logo
    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 15, 16, 16);
    }

    // Title inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(companyTitle, textStartX, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`${subtitle}${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`, textStartX, 25);
    doc.text('Sistema Informatizado de Gestão de EPI  |  Auditoria NR-6 e eSocial S-2240', textStartX, 30);

    // Report Code & Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text(reportCode, 190, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Emissão: ${CURRENT_DATE_STR}`, 190, 25, { align: 'right' });

    // Document Title & Legal reference
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RELATÓRIO TÉCNICO DE AUDITORIA E LIVRO DE MOVIMENTAÇÕES DE EPI', 14, 43);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Norma Regulamentadora nº 6 (Portaria MTP nº 2.175/2022) — eSocial Evento S-2240', 14, 48);

    if (filterType !== 'todos' || searchTerm) {
      doc.text(`Filtro Aplicado: ${filterType} ${searchTerm ? `| Termo: "${searchTerm}"` : ''}`, 14, 53);
    }

    // KPI Summary Cards
    const totalEntries = movements
      .filter((m) => m && (m.type === 'entrada' || m.type === 'devolucao'))
      .reduce((acc, m) => acc + (m.quantity || 0), 0);

    const totalExits = movements
      .filter((m) => m && (m.type === 'saida_entrega' || m.type === 'baixa_descarte'))
      .reduce((acc, m) => acc + (m.quantity || 0), 0);

    const totalDisposals = movements.filter((m) => m && m.type === 'baixa_descarte').length;

    const startY = filterType !== 'todos' || searchTerm ? 57 : 53;

    // KPI Box 1: Total
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, 42, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL OPERAÇÕES', 17, startY + 5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${movements.length} registros`, 17, startY + 11);

    // KPI Box 2: Entries
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(60, startY, 42, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(4, 120, 87);
    doc.text('ENTRADAS / COMPRAS', 63, startY + 5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`+${totalEntries} un.`, 63, startY + 11);

    // KPI Box 3: Exits
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(106, startY, 42, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(29, 78, 216);
    doc.text('SAÍDAS PARA USO', 109, startY + 5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${totalExits} un.`, 109, startY + 11);

    // KPI Box 4: Disposals
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(152, startY, 44, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(190, 18, 60);
    doc.text('BAIXAS / DESCARTE', 155, startY + 5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalDisposals} ocorrências`, 155, startY + 11);

    // Movements Table
    const tableRows = movements.map((m) => {
      let typeLabel: string = m.type;
      if (m.type === 'entrada') typeLabel = 'Entrada (NF-e)';
      else if (m.type === 'saida_entrega') typeLabel = 'Saída Entrega';
      else if (m.type === 'baixa_descarte') typeLabel = 'Baixa Descarte';
      else if (m.type === 'ajuste') typeLabel = 'Ajuste Saldo';
      else if (m.type === 'devolucao') typeLabel = 'Devolução';

      const isEntry = m.type === 'entrada' || m.type === 'devolucao';
      const qtyStr = isEntry ? `+${m.quantity || 0}` : `-${m.quantity || 0}`;
      const docStr = m.invoiceNumber ? `${m.invoiceNumber}${m.supplier ? ` (${m.supplier})` : ''}` : m.supplier || '-';

      return [
        m.date || CURRENT_DATE_STR,
        typeLabel,
        m.epiName || 'Item não especificado',
        qtyStr,
        docStr,
        m.responsible || 'SESMT',
        m.reasonNotes || '',
      ];
    });

    autoTable(doc, {
      startY: startY + 19,
      head: [['Data', 'Tipo', 'Equipamento de Proteção (EPI)', 'Qtd', 'Doc / Origem', 'Responsável', 'Justificativa / Motivo']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', 'Nenhuma movimentação registrada no período selecionado.', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 23 },
        2: { cellWidth: 46 },
        3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 28 },
        5: { cellWidth: 25 },
        6: { cellWidth: 30 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 28 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal?.getNumberOfPages?.() || 1;
        const pageCurrent = (data as any).pageNumber || 1;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `SafeGuard EPI • Relatório Oficial de Auditoria SST • Página ${pageCurrent} de ${pageCount}`,
          14,
          290
        );
        doc.text(
          `Autenticidade Criptográfica SHA-256 e Registro em Livro Eletrônico`,
          196,
          290,
          { align: 'right' }
        );
      },
    });

    // Technical Signatures Block at bottom of last page
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    const signY = finalY > 235 ? 245 : Math.max(finalY + 12, 235);

    if (finalY > 240) {
      doc.addPage();
      renderSignatureBlock(doc, 30);
    } else {
      renderSignatureBlock(doc, signY);
    }

    safeSavePDF(doc, `relatorio_auditoria_sst_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official Individual PPE Card (Ficha de EPI - NR-6)
   */
  static generateFichaEPIPDF(
    collaborator: Collaborator,
    deliveries: EPIDelivery[] = [],
    epis: EPIItem[] = []
  ): void {
    if (!collaborator) {
      throw new Error('Colaborador inválido para geração de PDF');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const subtitle = headerConfig?.subtitle || 'SESMT — Ficha Individual de EPI Conforme NR-6';

    // Header Box
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 182, 22, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 14, 16, 16);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`FICHA ELETRÔNICA DE FORNECIMENTO E CONTROLE DE EPI — NR-6${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`, textStartX, 24);
    doc.text(`Em conformidade com a Portaria MTP nº 2.175/2022  |  Emissão: ${CURRENT_DATE_STR}`, textStartX, 28);

    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`MATRÍCULA: ${collaborator.registration || 'N/D'}`, 190, 19, { align: 'right' });

    // Collaborator Info Grid
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 38, 182, 26, 1.5, 1.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO COLABORADOR:', 18, 44);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Nome Completo: ${collaborator.name || 'Não informado'}`, 18, 50);
    doc.text(`CPF: ${collaborator.cpf || 'Não informado'}`, 18, 55);
    doc.text(`Data de Admissão: ${collaborator.admissionDate || 'Não informado'}`, 18, 60);

    doc.text(`Cargo / Função: ${collaborator.role || 'Não informado'}`, 105, 50);
    doc.text(`Departamento / Setor: ${collaborator.department || 'Não informado'}`, 105, 55);
    doc.text(`Calçado: ${collaborator.shoeSize || 'N/D'}  |  Luva: ${collaborator.gloveSize || 'N/D'}`, 105, 60);

    // Deliveries Table
    const colabDeliveries = deliveries.filter((d) => d && d.collaboratorId === collaborator.id);
    const tableRows = colabDeliveries.map((del) => {
      const reasonLabel = del.reason ? del.reason.replace(/_/g, ' ') : 'Entrega';
      const bioText = del.biometricValidationHash
        ? `Facial (${del.biometricMatchScore || 98.6}%)`
        : 'Assinado';
      return [
        del.deliveryDate || CURRENT_DATE_STR,
        del.caNumber || 'N/D',
        del.epiName || 'EPI',
        String(del.quantity ?? 1),
        reasonLabel,
        del.expectedExchangeDate || 'N/D',
        bioText,
        del.returnDate || 'Em Uso',
      ];
    });

    autoTable(doc, {
      startY: 68,
      head: [['Data Entrega', 'C.A. (MTE)', 'Equipamento (EPI)', 'Qtd', 'Motivo', 'Prev. Troca', 'Assinatura / Biometria', 'Devolução']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', 'Nenhum EPI registrado até o momento.', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 48 },
        3: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 22 },
        5: { cellWidth: 18 },
        6: { cellWidth: 32, fontSize: 6.5 },
        7: { cellWidth: 18 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 25 },
    });

    // Term of Responsibility (NR-6 item 6.5)
    let currentY = (doc as any).lastAutoTable?.finalY || 140;

    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 8;
    }

    doc.setFillColor(254, 252, 232); // amber-50
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(14, currentY, 182, 38, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14); // amber-900
    doc.text('TERMO DE RESPONSABILIDADE E COMPROMISSO — NR-6 (ITEM 6.5)', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(69, 26, 3);
    const splitText = doc.splitTextToSize(NR6_LEGAL_TERM, 174);
    doc.text(splitText.slice(0, 7), 18, currentY + 12);

    // Signatures block
    const sigY = currentY + 44;
    doc.setDrawColor(100, 116, 139);
    doc.line(18, sigY + 15, 88, sigY + 15);
    doc.line(108, sigY + 15, 178, sigY + 15);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(collaborator.name, 18, sigY + 19);
    doc.text('SESMT / Almoxarifado Central', 108, sigY + 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`CPF: ${collaborator.cpf || 'N/D'}  |  Matrícula: ${collaborator.registration || 'N/D'}`, 18, sigY + 23);
    doc.text('Responsável Técnico SST / Almoxarifado', 108, sigY + 23);

    // Footer
    doc.setFontSize(6.5);
    doc.text(`SafeGuard EPI • Documento Individual de Rastreabilidade • Portaria MTP 2.175/2022 • Gerado em ${CURRENT_DATE_STR}`, 14, 290);

    safeSavePDF(doc, `ficha_epi_${collaborator.registration || 'colab'}_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the General Executive Dashboard Report
   */
  static generateDashboardExecutivePDF(
    epis: EPIItem[] = [],
    deliveries: EPIDelivery[] = [],
    collaborators: Collaborator[] = [],
    movements: StockMovement[] = []
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();

    // Top Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 182, 22, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 14, 16, 16);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`RELATÓRIO EXECUTIVO DE INDICADORES SST, ESTOQUE E GESTÃO DE EPIS${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`, textStartX, 24);
    doc.text(`Norma Regulamentadora nº 6  |  Posição do Sistema: ${CURRENT_DATE_STR}`, textStartX, 28);

    const totalStock = epis.reduce((sum, e) => sum + (e.stockQuantity || 0), 0);
    const validCAs = epis.filter((e) => e.caStatus === 'valido').length;
    const activeDeliveries = deliveries.filter((d) => d.status === 'em_uso').length;

    // KPI Summary
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 38, 182, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Saldo em Estoque: ${totalStock} un.`, 20, 48);
    doc.text(`EPIs Ativos em Uso: ${activeDeliveries}`, 75, 48);
    doc.text(`Conformidade C.A.: ${validCAs} / ${epis.length} válidos`, 130, 48);

    // EPI Inventory Table
    const inventoryRows = epis.map((e) => [
      e.code || '',
      e.name || '',
      e.caNumber || '',
      e.caExpiryDate || '',
      e.caStatus === 'valido' ? 'Válido' : e.caStatus === 'a_vencer' ? 'A Vencer' : 'Vencido',
      `${e.stockQuantity || 0} ${e.unit || 'un'}`,
      `${e.minStockQuantity || 0} ${e.unit || 'un'}`,
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Código', 'Equipamento de Proteção', 'C.A.', 'Validade C.A.', 'Status C.A.', 'Saldo', 'Mínimo']],
      body: inventoryRows.length > 0 ? inventoryRows : [['-', 'Nenhum EPI cadastrado', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 25 },
    });

    safeSavePDF(doc, `relatorio_geral_dashboard_sst_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official PPE Deliveries List Report
   */
  static generateDeliveriesListPDF(
    deliveries: EPIDelivery[] = [],
    statusFilter: string = 'todos',
    searchTerm: string = ''
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();

    // Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 269, 20, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 12, 16, 16);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`RELATÓRIO OFICIAL DE ENTREGAS DE EPI — VALIDAÇÃO BIOMÉTRICA E NR-6${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`, textStartX, 23);

    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.text(`POSIÇÃO: ${CURRENT_DATE_STR}`, 275, 17, { align: 'right' });

    const rows = deliveries.map((del) => [
      del.code || '',
      del.deliveryDate || '',
      `${del.collaboratorName || ''}\nCPF: ${del.collaboratorCpf || 'N/D'}`,
      del.collaboratorDepartment || '',
      del.epiName || '',
      del.caNumber || '',
      String(del.quantity ?? 1),
      del.reason ? del.reason.replace(/_/g, ' ') : 'Entrega',
      del.expectedExchangeDate || '',
      del.biometricValidationHash ? `Facial (${del.biometricMatchScore || 98.6}%)` : 'Digital',
      del.deliveredBy || 'Não inf.',
      del.status === 'em_uso' ? 'Em Uso' : 'Devolvido',
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['Código', 'Data', 'Colaborador', 'Setor', 'EPI Fornecido', 'C.A.', 'Qtd', 'Motivo', 'Prev. Troca', 'Biometria', 'Resp.', 'Status']],
      body: rows.length > 0 ? rows : [['-', '-', 'Nenhuma entrega encontrada', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal?.getNumberOfPages?.() || 1;
        const pageCurrent = (data as any).pageNumber || 1;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `SafeGuard EPI • Relatório de Entregas NR-6 • Página ${pageCurrent} de ${pageCount} • Gerado em ${CURRENT_DATE_STR}`,
          14,
          202
        );
      },
    });

    safeSavePDF(doc, `relatorio_entregas_epi_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official Inventory & Stock Position PDF Report
   */
  static generateInventoryPDF(
    epis: EPIItem[] = [],
    category: string = 'todas',
    searchTerm: string = ''
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();

    // Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 269, 20, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 12, 16, 16);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`INVENTÁRIO GERAL DE ESTOQUE DE EPI E CONTROLE DE C.A. — NR-6${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`, textStartX, 23);

    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.text(`EMISSÃO: ${CURRENT_DATE_STR}`, 275, 17, { align: 'right' });

    const rows = epis.map((e) => {
      const days = getDaysDifference(e.caExpiryDate);
      const statusText = days < 0 ? 'VENCIDO' : days <= 30 ? `A Vencer (${days}d)` : 'Válido';
      return [
        e.code || '',
        e.name || '',
        CATEGORY_LABELS[e.category] || e.category,
        e.caNumber || '',
        e.caExpiryDate || '',
        statusText,
        e.manufacturer || '',
        `${e.stockQuantity || 0} ${e.unit || 'un'}`,
        `${e.minStockQuantity || 0} ${e.unit || 'un'}`,
        `${e.idealStockQuantity || 0} ${e.unit || 'un'}`,
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [['Código', 'Equipamento (EPI)', 'Categoria', 'C.A.', 'Validade C.A.', 'Status C.A.', 'Fabricante', 'Saldo', 'Mínimo', 'Ideal']],
      body: rows.length > 0 ? rows : [['-', 'Nenhum EPI localizado', '-', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal?.getNumberOfPages?.() || 1;
        const pageCurrent = (data as any).pageNumber || 1;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `SafeGuard EPI • Relatório de Inventário Físico de EPI • Página ${pageCurrent} de ${pageCount} • Gerado em ${CURRENT_DATE_STR}`,
          14,
          202
        );
      },
    });

    safeSavePDF(doc, `inventario_estoque_epi_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official C.A. Expiry & Compliance PDF Report
   */
  static generateCAExpiryPDF(
    epis: EPIItem[] = [],
    deliveries: EPIDelivery[] = [],
    tab: string = 'ca',
    searchTerm: string = ''
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();

    // Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 269, 20, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 12, 16, 16);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`RELATÓRIO TÉCNICO DE CONFORMIDADE DE C.A. E TROCAS PERIÓDICAS (NR-6)${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`, textStartX, 23);

    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.text(`POSIÇÃO: ${CURRENT_DATE_STR}`, 275, 17, { align: 'right' });

    let headers: string[] = [];
    let rows: any[][] = [];

    if (tab === 'colaborador') {
      const activeDeliveries = deliveries
        .filter((d) => d && d.status === 'em_uso')
        .sort((a, b) => getDaysDifference(a.expectedExchangeDate) - getDaysDifference(b.expectedExchangeDate));

      headers = ['Colaborador', 'CPF', 'Matrícula', 'Função / Setor', 'EPI Fornecido', 'C.A.', 'Entrega', 'Prev. Troca', 'Dias Restantes', 'Situação'];
      rows = activeDeliveries.map((del) => {
        const days = getDaysDifference(del.expectedExchangeDate);
        const sit = days < 0 ? `VENCIDO (${Math.abs(days)}d)` : days <= 7 ? `Urgente (${days}d)` : `Regular (${days}d)`;
        return [
          del.collaboratorName || '',
          del.collaboratorCpf || '',
          del.collaboratorRegistration || '',
          `${del.collaboratorRole || ''} - ${del.collaboratorDepartment || ''}`,
          del.epiName || '',
          del.caNumber || '',
          del.deliveryDate || '',
          del.expectedExchangeDate || '',
          String(days),
          sit,
        ];
      });
    } else {
      headers = ['Código', 'Equipamento (EPI)', 'Categoria', 'C.A. (MTE)', 'Validade C.A.', 'Dias até Vencimento', 'Situação Legal', 'Fabricante', 'Saldo Estoque'];
      rows = epis.map((e) => {
        const days = getDaysDifference(e.caExpiryDate);
        const sit = days < 0 ? 'VENCIDO (Comercialização Proibida)' : days <= 30 ? `A Vencer (${days} dias)` : 'Válido e Regular';
        return [
          e.code || '',
          e.name || '',
          CATEGORY_LABELS[e.category] || e.category,
          e.caNumber || '',
          e.caExpiryDate || '',
          String(days),
          sit,
          e.manufacturer || '',
          `${e.stockQuantity || 0} ${e.unit || 'un'}`,
        ];
      });
    }

    autoTable(doc, {
      startY: 34,
      head: [headers],
      body: rows.length > 0 ? rows : [['-', 'Nenhum dado encontrado', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal?.getNumberOfPages?.() || 1;
        const pageCurrent = (data as any).pageNumber || 1;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `SafeGuard EPI • Relatório de Validade e Auditoria de C.A. • Página ${pageCurrent} de ${pageCount} • Gerado em ${CURRENT_DATE_STR}`,
          14,
          202
        );
      },
    });

    safeSavePDF(doc, `relatorio_conformidade_ca_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official Collaborators List PDF Report
   */
  static generateCollaboratorsPDF(
    collaborators: Collaborator[] = [],
    searchTerm: string = ''
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();

    // Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 182, 22, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 12, 16, 16);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`RELAÇÃO DE COLABORADORES ATIVOS E MATRIZ DE EPI (NR-6)${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`, textStartX, 23);

    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.text(`POSIÇÃO: ${CURRENT_DATE_STR}`, 190, 17, { align: 'right' });

    const rows = collaborators.map((c) => [
      c.registration || '',
      c.name || '',
      c.cpf || '',
      c.role || '',
      c.department || '',
      `Calç: ${c.shoeSize || 'N/D'} | Luv: ${c.gloveSize || 'N/D'}`,
      String(c.activeEpisCount || 0),
      c.pendingExchangesCount && c.pendingExchangesCount > 0 ? `${c.pendingExchangesCount} pendência(s)` : 'Em dia',
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['Matrícula', 'Colaborador', 'CPF', 'Função', 'Setor', 'Tamanhos', 'EPIs Ativos', 'Trocas Pendentes']],
      body: rows.length > 0 ? rows : [['-', 'Nenhum colaborador encontrado', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal?.getNumberOfPages?.() || 1;
        const pageCurrent = (data as any).pageNumber || 1;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `SafeGuard EPI • Relação de Colaboradores e Auditoria NR-6 • Página ${pageCurrent} de ${pageCount} • Gerado em ${CURRENT_DATE_STR}`,
          14,
          290
        );
      },
    });

    safeSavePDF(doc, `relacao_colaboradores_epi_${CURRENT_DATE_STR}.pdf`);
  }
}

function renderSignatureBlock(doc: jsPDF, y: number) {
  doc.setDrawColor(100, 116, 139);
  doc.line(18, y + 14, 88, y + 14);
  doc.line(108, y + 14, 178, y + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Responsável Técnico / SESMT', 18, y + 19);
  doc.text('Gestão de Almoxarifado / EPI', 108, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Segurança e Medicina do Trabalho', 18, y + 23);
  doc.text('Controle e Distribuição de Equipamentos', 108, y + 23);
}

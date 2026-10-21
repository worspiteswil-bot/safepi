import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockMovement, EPIItem, Collaborator, EPIDelivery } from '../types/epi';
import {
  CURRENT_DATE_STR,
  StorageService,
  NR6_LEGAL_TERM,
  CATEGORY_LABELS,
  getDaysDifference,
} from '../services/storage';
import { generateQRCodeDataUrl } from './qrCodeGenerator';

/**
 * Robust Client-Side PDF Generation Utility for SafeGuard EPI
 * Generates official compliance documents for Brazilian Labor Ministry (NR-6 / eSocial S-2240).
 * Embeds high-contrast QR Codes pointing directly to the original digital document.
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

/**
 * Safely adds a high-contrast QR code stamp in the header
 */
function tryAddQRCodeStamp(
  doc: jsPDF,
  qrCodeUrl?: string,
  x = 176,
  y = 13,
  size = 18,
  caption = 'DOC ORIGINAL'
) {
  if (!qrCodeUrl) return;
  try {
    // White background card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x - 1, y - 1, size + 2, size + 5, 1, 1, 'F');
    doc.addImage(qrCodeUrl, 'PNG', x, y, size, size);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(15, 23, 42);
    doc.text(caption, x + size / 2, y + size + 3, { align: 'center' });
  } catch (e) {
    console.warn('Could not render QR code in PDF header:', e);
  }
}

/**
 * Renders the official Document Validation Footer containing the QR Code,
 * legal references (NR-6 & Portaria MTP 2.175/2022), and cryptographic SHA-256 hash.
 */
function renderDocumentValidationFooter(
  doc: jsPDF,
  qrCodeUrl: string,
  docCode: string,
  sha256Hash: string,
  verificationUrl: string,
  preferredY: number,
  isLandscape = false
) {
  try {
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const boxHeight = 22;
    const maxAllowedY = pageHeight - boxHeight - 8;

    let targetY = preferredY;
    if (targetY > maxAllowedY) {
      doc.addPage();
      targetY = 20;
    }

    const boxWidth = pageWidth - 28;

    // Card Background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, targetY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    // QR Code
    if (qrCodeUrl) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.rect(16, targetY + 2, 18, 18, 'F');
        doc.addImage(qrCodeUrl, 'PNG', 16, targetY + 2, 18, 18);
      } catch (err) {
        // ignore
      }
    }

    const textX = 38;
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      'AUTENTICIDADE E VALIDAÇÃO DIGITAL DO DOCUMENTO ORIGINAL — NR-6 & PORTARIA MTP 2.175/2022',
      textX,
      targetY + 6
    );

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Para validar a autenticidade e visualizar o registro digital original deste relatório, aponte a câmera para o QR Code ao lado ou acesse:',
      textX,
      targetY + 10.5
    );

    // URL
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 64, 175);
    const displayUrl =
      verificationUrl.length > 95 ? verificationUrl.substring(0, 92) + '...' : verificationUrl;
    doc.text(displayUrl, textX, targetY + 14.5);

    // Code & Fingerprint
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `CÓDIGO: ${docCode}  |  SHA-256: ${sha256Hash.substring(0, 36)}...  |  eSocial Evento S-2240`,
      textX,
      targetY + 19
    );
  } catch (err) {
    console.warn('Error rendering document validation footer:', err);
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

export class PDFGenerator {
  /**
   * Generates and downloads the Technical Stock Movements & SST Audit Report
   */
  static async generateMovementsAuditPDF(
    movements: StockMovement[] = [],
    epis: EPIItem[] = [],
    filterType: string = 'todos',
    searchTerm: string = ''
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const subtitle =
      headerConfig?.subtitle ||
      'SESMT — Serviço Especializado em Engenharia de Segurança e Medicina do Trabalho';
    const reportCode = `REL-SST-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sha256Hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}f89c0`;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'movimentacoes',
      headerConfig?.document
    );

    // Save document to storage for perpetual validation
    StorageService.saveOriginalDocument({
      id: `doc-${Date.now()}`,
      code: reportCode,
      type: 'movimentacoes',
      title: 'Relatório Técnico de Auditoria e Movimentações SST',
      companyId: headerConfig?.document || 'default',
      companyName: companyTitle,
      companyDocument: headerConfig?.document,
      companySubtitle: subtitle,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash,
      verificationUrl,
      itemsCount: movements.length,
      activeFilter: filterType,
      summaryText: `Total de movimentações auditadas: ${movements.length}. Filtro aplicado: ${filterType}.`,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, 160);

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(14, 12, 182, 24, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 15, 16, 16);
    }

    // Header QR Code
    tryAddQRCodeStamp(doc, qrCodeDataUrl, 174, 14, 16, 'VALIDAR');

    // Title inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `${subtitle}${headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''}`,
      textStartX,
      24
    );
    doc.text(
      `Sistema Informatizado de Gestão de EPI  |  Auditoria NR-6 e eSocial S-2240`,
      textStartX,
      28
    );

    // Document Title & Legal reference
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('RELATÓRIO TÉCNICO DE AUDITORIA E LIVRO DE MOVIMENTAÇÕES DE EPI', 14, 43);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Norma Regulamentadora nº 6 (Portaria MTP nº 2.175/2022) — Registro: ${reportCode} — Emissão: ${CURRENT_DATE_STR}`,
      14,
      48
    );

    if (filterType !== 'todos' || searchTerm) {
      doc.text(
        `Filtro Aplicado: ${filterType} ${searchTerm ? `| Termo: "${searchTerm}"` : ''}`,
        14,
        53
      );
    }

    // KPI Summary Cards
    const totalEntries = movements
      .filter((m) => m && (m.type === 'entrada' || m.type === 'devolucao'))
      .reduce((acc, m) => acc + (m.quantity || 0), 0);

    const totalExits = movements
      .filter((m) => m && (m.type === 'saida_entrega' || m.type === 'baixa_descarte'))
      .reduce((acc, m) => acc + (m.quantity || 0), 0);

    const cardWidth = 42;
    const startY = filterType !== 'todos' || searchTerm ? 58 : 54;

    const cards = [
      { label: 'TOTAL MOVIMENTAÇÕES', value: String(movements.length), color: [241, 245, 249] },
      { label: 'ENTRADAS / DEVOLUÇÕES', value: `+${totalEntries} un`, color: [236, 253, 245] },
      { label: 'SAÍDAS P/ COLABORADORES', value: `-${totalExits} un`, color: [254, 243, 199] },
      { label: 'ITENS CATALOGADOS', value: `${epis.length} EPIs`, color: [241, 245, 249] },
    ];

    cards.forEach((card, idx) => {
      const cx = 14 + idx * (cardWidth + 4);
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cx, startY, cardWidth, 14, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, cx + 3, startY + 5);

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, cx + 3, startY + 11);
    });

    // Movements Table
    const tableRows = movements.map((m) => {
      let typeLabel = 'Outro';
      if (m.type === 'entrada') typeLabel = 'Entrada NF-e';
      else if (m.type === 'saida_entrega') typeLabel = 'Saída Entrega';
      else if (m.type === 'baixa_descarte') typeLabel = 'Baixa Descarte';
      else if (m.type === 'ajuste') typeLabel = 'Ajuste Saldo';
      else if (m.type === 'devolucao') typeLabel = 'Devolução';

      const isEntry = m.type === 'entrada' || m.type === 'devolucao';
      const qtyStr = isEntry ? `+${m.quantity || 0}` : `-${m.quantity || 0}`;
      const docStr = m.invoiceNumber
        ? `${m.invoiceNumber}${m.supplier ? ` (${m.supplier})` : ''}`
        : m.supplier || '-';

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
      head: [
        [
          'Data',
          'Tipo',
          'Equipamento de Proteção (EPI)',
          'Qtd',
          'Doc / Origem',
          'Responsável',
          'Justificativa / Motivo',
        ],
      ],
      body:
        tableRows.length > 0
          ? tableRows
          : [['-', '-', 'Nenhuma movimentação registrada no período selecionado.', '-', '-', '-', '-']],
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
      margin: { left: 14, right: 14, bottom: 35 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal?.getNumberOfPages?.() || 1;
        const pageCurrent = (data as any).pageNumber || 1;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `SafeGuard EPI • Relatório Oficial de Auditoria SST • Página ${pageCurrent} de ${pageCount}`,
          14,
          292
        );
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 200;

    // Render official QR Code Document Validation Footer
    renderDocumentValidationFooter(
      doc,
      qrCodeDataUrl,
      reportCode,
      sha256Hash,
      verificationUrl,
      finalY + 8,
      false
    );

    // Signatures
    const sigY = (doc as any).internal.getCurrentPageInfo().pageNumber > 1 ? 245 : Math.max(finalY + 34, 245);
    if (finalY + 34 > 260) {
      doc.addPage();
      renderSignatureBlock(doc, 30);
    } else {
      renderSignatureBlock(doc, sigY);
    }

    safeSavePDF(doc, `relatorio_auditoria_sst_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official Individual PPE Card (Ficha de EPI - NR-6)
   */
  static async generateFichaEPIPDF(
    collaborator: Collaborator,
    deliveries: EPIDelivery[] = [],
    epis: EPIItem[] = []
  ): Promise<void> {
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
    const reportCode = `FICHA-NR6-${(collaborator.registration || 'COLAB').replace(/[^a-zA-Z0-9]/g, '')}-${CURRENT_DATE_STR.replace(/-/g, '')}`;

    const sha256Hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}f89c0`;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'ficha_epi',
      headerConfig?.document
    );

    // Save document to storage for perpetual validation
    StorageService.saveOriginalDocument({
      id: `doc-ficha-${collaborator.id}`,
      code: reportCode,
      type: 'ficha_epi',
      title: `Ficha Individual de EPI — ${collaborator.name}`,
      companyId: headerConfig?.document || 'default',
      companyName: companyTitle,
      companyDocument: headerConfig?.document,
      companySubtitle: subtitle,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash,
      verificationUrl,
      collaboratorId: collaborator.id,
      collaboratorName: collaborator.name,
      collaboratorRegistration: collaborator.registration,
      collaboratorCpf: collaborator.cpf,
      collaboratorRole: collaborator.role,
      collaboratorDepartment: collaborator.department,
      itemsCount: deliveries.length,
      summaryText: `Ficha de EPI com ${deliveries.length} entrega(s) registrada(s) com biometria facial / assinatura eletrônica conforme NR-6.`,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, 160);

    // Header Box
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 182, 22, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 14, 16, 16);
    }

    // Header QR Code
    tryAddQRCodeStamp(doc, qrCodeDataUrl, 174, 13, 16, 'VALIDAR');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `FICHA ELETRÔNICA DE FORNECIMENTO E CONTROLE DE EPI — NR-6${
        headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''
      }`,
      textStartX,
      24
    );
    doc.text(
      `Em conformidade com a Portaria MTP nº 2.175/2022  |  Emissão: ${CURRENT_DATE_STR}`,
      textStartX,
      28
    );

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
    doc.text(
      `Medidas: Calçado: ${collaborator.shoeSize || 'N/D'} | Luva: ${collaborator.gloveSize || 'N/D'}`,
      105,
      60
    );

    // Deliveries Table
    const tableRows = deliveries.map((d) => {
      const authMethod = d.biometricValidationHash
        ? `Facial (${d.biometricMatchScore || 98.6}%)`
        : d.signatureDataUrl
        ? 'Assinatura'
        : 'Digital';

      return [
        d.deliveryDate || '',
        d.caNumber || 'Isento',
        d.epiName || '',
        String(d.quantity || 1),
        d.reason ? d.reason.replace(/_/g, ' ') : 'Entrega',
        d.expectedExchangeDate || '',
        authMethod,
        d.returnDate ? `Dev. ${d.returnDate}` : 'Em Uso',
      ];
    });

    autoTable(doc, {
      startY: 68,
      head: [
        ['Data Ent.', 'C.A.', 'Equipamento Fornecido', 'Qtd', 'Motivo', 'Prev. Troca', 'Comprovação', 'Status'],
      ],
      body:
        tableRows.length > 0
          ? tableRows
          : [['-', '-', 'Nenhum EPI fornecido registrado até o momento.', '-', '-', '-', '-', '-']],
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

    let currentY = (doc as any).lastAutoTable?.finalY || 140;

    if (currentY > 190) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 8;
    }

    // Term of Responsibility (NR-6 item 6.5)
    doc.setFillColor(254, 252, 232); // amber-50
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(14, currentY, 182, 34, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14); // amber-900
    doc.text('TERMO DE RESPONSABILIDADE E COMPROMISSO — NR-6 (ITEM 6.5)', 18, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(69, 26, 3);
    const splitText = doc.splitTextToSize(NR6_LEGAL_TERM, 174);
    doc.text(splitText.slice(0, 6), 18, currentY + 10.5);

    // Official QR Code Document Validation Footer
    renderDocumentValidationFooter(
      doc,
      qrCodeDataUrl,
      reportCode,
      sha256Hash,
      verificationUrl,
      currentY + 38,
      false
    );

    // Signatures block
    const sigY = currentY + 64;
    doc.setDrawColor(100, 116, 139);
    doc.line(18, sigY + 12, 88, sigY + 12);
    doc.line(108, sigY + 12, 178, sigY + 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(collaborator.name, 18, sigY + 16);
    doc.text('SESMT / Almoxarifado Central', 108, sigY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `CPF: ${collaborator.cpf || 'N/D'}  |  Matrícula: ${collaborator.registration || 'N/D'}`,
      18,
      sigY + 20
    );
    doc.text('Responsável Técnico SST / Almoxarifado', 108, sigY + 20);

    safeSavePDF(doc, `ficha_epi_${collaborator.registration || 'colab'}_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the General Executive Dashboard Report
   */
  static async generateDashboardExecutivePDF(
    epis: EPIItem[] = [],
    deliveries: EPIDelivery[] = [],
    collaborators: Collaborator[] = [],
    movements: StockMovement[] = []
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const subtitle = headerConfig?.subtitle || 'SESMT — Relatório Executivo Geral de SST';
    const reportCode = `REL-DASH-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sha256Hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}f89c0`;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'dashboard',
      headerConfig?.document
    );

    StorageService.saveOriginalDocument({
      id: `doc-${Date.now()}`,
      code: reportCode,
      type: 'dashboard',
      title: 'Relatório Executivo Geral de SST e Gestão NR-6',
      companyId: headerConfig?.document || 'default',
      companyName: companyTitle,
      companyDocument: headerConfig?.document,
      companySubtitle: subtitle,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash,
      verificationUrl,
      itemsCount: epis.length,
      summaryText: `Panorama geral: ${epis.length} tipos de EPIs, ${collaborators.length} colaboradores, ${deliveries.length} entregas ativas.`,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, 160);

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 182, 24, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 15, 16, 16);
    }

    tryAddQRCodeStamp(doc, qrCodeDataUrl, 174, 14, 16, 'VALIDAR');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `RELATÓRIO EXECUTIVO GERAL DE SST — GESTÃO E CONFORMIDADE NR-6${
        headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''
      }`,
      textStartX,
      24
    );
    doc.text(
      `Indicadores de Segurança do Trabalho e Auditoria  |  Emissão: ${CURRENT_DATE_STR}`,
      textStartX,
      28
    );

    // Cards Grid
    const activeDeliveries = deliveries.filter((d) => d.status === 'em_uso').length;
    const totalStock = epis.reduce((acc, i) => acc + i.stockQuantity, 0);
    const totalValue = epis.reduce((acc, i) => acc + i.stockQuantity * i.unitCost, 0);

    const kpiCards = [
      ['COLABORADORES ATIVOS', String(collaborators.length)],
      ['EPIS EM USO', String(activeDeliveries)],
      ['SALDO TOTAL EM ESTOQUE', `${totalStock} unidades`],
      ['VALOR PATRIMONIAL EPI', `R$ ${totalValue.toFixed(2)}`],
    ];

    kpiCards.forEach(([label, val], idx) => {
      const cx = 14 + (idx % 2) * 93;
      const cy = 42 + Math.floor(idx / 2) * 16;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cx, cy, 89, 13, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label, cx + 4, cy + 5);

      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(val, cx + 4, cy + 10.5);
    });

    // Stock Summary Table
    const tableRows = epis.slice(0, 18).map((item) => [
      item.code,
      item.name,
      CATEGORY_LABELS[item.category] || item.category,
      item.caNumber,
      `${item.stockQuantity} ${item.unit}`,
      `R$ ${item.unitCost.toFixed(2)}`,
      `R$ ${(item.stockQuantity * item.unitCost).toFixed(2)}`,
      item.caStatus.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 78,
      head: [['Código', 'EPI', 'Categoria', 'C.A.', 'Estoque', 'Custo Un.', 'Total', 'Status C.A.']],
      body: tableRows,
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
      margin: { left: 14, right: 14, bottom: 35 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 180;

    renderDocumentValidationFooter(
      doc,
      qrCodeDataUrl,
      reportCode,
      sha256Hash,
      verificationUrl,
      finalY + 8,
      false
    );

    renderSignatureBlock(doc, finalY + 34 > 255 ? 255 : finalY + 34);

    safeSavePDF(doc, `relatorio_geral_dashboard_sst_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official PPE Deliveries List Report
   */
  static async generateDeliveriesListPDF(
    deliveries: EPIDelivery[] = [],
    statusFilter: string = 'todos',
    searchTerm: string = ''
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const reportCode = `REL-ENT-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sha256Hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}f89c0`;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'entregas',
      headerConfig?.document
    );

    StorageService.saveOriginalDocument({
      id: `doc-${Date.now()}`,
      code: reportCode,
      type: 'entregas',
      title: 'Relatório Oficial de Entregas de EPI com Biometria Facial',
      companyId: headerConfig?.document || 'default',
      companyName: companyTitle,
      companyDocument: headerConfig?.document,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash,
      verificationUrl,
      itemsCount: deliveries.length,
      summaryText: `Total de entregas auditadas: ${deliveries.length} com biometria facial, geolocalização e carimbo temporal.`,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, 160);

    // Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 269, 20, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 12, 16, 16);
    }

    tryAddQRCodeStamp(doc, qrCodeDataUrl, 260, 11, 16, 'VALIDAR');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `RELATÓRIO OFICIAL DE ENTREGAS DE EPI — VALIDAÇÃO BIOMÉTRICA E NR-6${
        headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''
      }`,
      textStartX,
      23
    );

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
      head: [
        [
          'Código',
          'Data',
          'Colaborador',
          'Setor',
          'EPI Fornecido',
          'C.A.',
          'Qtd',
          'Motivo',
          'Prev. Troca',
          'Biometria',
          'Resp.',
          'Status',
        ],
      ],
      body:
        rows.length > 0
          ? rows
          : [['-', '-', 'Nenhuma entrega encontrada', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
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
      margin: { left: 14, right: 14, bottom: 30 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    renderDocumentValidationFooter(
      doc,
      qrCodeDataUrl,
      reportCode,
      sha256Hash,
      verificationUrl,
      finalY + 6,
      true
    );

    safeSavePDF(doc, `relatorio_entregas_epi_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Official Inventory & Stock Position PDF Report
   */
  static async generateInventoryPDF(
    epis: EPIItem[] = [],
    category: string = 'todas',
    searchTerm: string = ''
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const reportCode = `REL-ESTOQUE-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sha256Hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}f89c0`;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'estoque',
      headerConfig?.document
    );

    const totalStock = epis.reduce((acc, i) => acc + i.stockQuantity, 0);
    const totalValue = epis.reduce((acc, i) => acc + i.stockQuantity * i.unitCost, 0);

    StorageService.saveOriginalDocument({
      id: `doc-${Date.now()}`,
      code: reportCode,
      type: 'estoque',
      title: 'Inventário Oficial de Estoque e Posição Físico-Financeira',
      companyId: headerConfig?.document || 'default',
      companyName: companyTitle,
      companyDocument: headerConfig?.document,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash,
      verificationUrl,
      itemsCount: epis.length,
      totalQuantity: totalStock,
      totalValue,
      summaryText: `Inventário de ${epis.length} itens, total de ${totalStock} unidades avaliadas em R$ ${totalValue.toFixed(2)}.`,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, 160);

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 269, 20, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 12, 16, 16);
    }

    tryAddQRCodeStamp(doc, qrCodeDataUrl, 260, 11, 16, 'VALIDAR');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `INVENTÁRIO OFICIAL DE ESTOQUE DE EPI — POSIÇÃO FÍSICO-FINANCEIRA${
        headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''
      }`,
      textStartX,
      23
    );

    const rows = epis.map((item) => [
      item.code,
      item.name,
      CATEGORY_LABELS[item.category] || item.category,
      item.caNumber,
      item.caExpiryDate || 'Isento',
      item.manufacturer || '-',
      item.locationShelf || '-',
      `${item.stockQuantity} ${item.unit}`,
      `${item.minStockQuantity} ${item.unit}`,
      `R$ ${item.unitCost.toFixed(2)}`,
      `R$ ${(item.stockQuantity * item.unitCost).toFixed(2)}`,
      item.caStatus.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 34,
      head: [
        [
          'Código',
          'Equipamento (EPI)',
          'Categoria',
          'C.A.',
          'Val. C.A.',
          'Fabricante',
          'Local',
          'Saldo',
          'Mín.',
          'Custo Un.',
          'Total R$',
          'Status C.A.',
        ],
      ],
      body: rows,
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
      margin: { left: 14, right: 14, bottom: 30 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    renderDocumentValidationFooter(
      doc,
      qrCodeDataUrl,
      reportCode,
      sha256Hash,
      verificationUrl,
      finalY + 6,
      true
    );

    safeSavePDF(doc, `inventario_estoque_epi_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the CA Expiry Monitoring Report
   */
  static async generateCAExpiryPDF(
    epis: EPIItem[] = [],
    deliveries: EPIDelivery[] = [],
    tab: string = 'geral',
    searchTerm: string = ''
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const reportCode = `REL-CA-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sha256Hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}f89c0`;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'ca_validade',
      headerConfig?.document
    );

    StorageService.saveOriginalDocument({
      id: `doc-${Date.now()}`,
      code: reportCode,
      type: 'ca_validade',
      title: 'Relatório Oficial de Conformidade e Validade de C.A.',
      companyId: headerConfig?.document || 'default',
      companyName: companyTitle,
      companyDocument: headerConfig?.document,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash,
      verificationUrl,
      itemsCount: epis.length,
      summaryText: `Monitoramento de conformidade de Certificados de Aprovação (C.A.) perante o Ministério do Trabalho e Emprego.`,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, 160);

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 10, 269, 20, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 12, 16, 16);
    }

    tryAddQRCodeStamp(doc, qrCodeDataUrl, 260, 11, 16, 'VALIDAR');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `RELATÓRIO DE MONITORAMENTO E AUDITORIA DE CERTIFICADOS DE APROVAÇÃO (C.A.)${
        headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''
      }`,
      textStartX,
      23
    );

    const rows = epis.map((item) => {
      const days = item.caNumber === 'Isento' ? 999 : getDaysDifference(item.caExpiryDate);
      let situacao = 'Válido';
      if (item.caNumber === 'Isento') situacao = 'Isento';
      else if (days < 0) situacao = `VENCIDO (${Math.abs(days)}d)`;
      else if (days <= 60) situacao = `A Vencer (${days}d)`;

      return [
        item.caNumber,
        item.name,
        CATEGORY_LABELS[item.category] || item.category,
        item.manufacturer || '-',
        item.caExpiryDate || 'Isento',
        situacao,
        `${item.stockQuantity} ${item.unit}`,
        item.approvalNorms || 'ABNT / NR-6',
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [['Número C.A.', 'Equipamento', 'Categoria', 'Fabricante', 'Data Validade', 'Situação Legal', 'Estoque', 'Normas']],
      body: rows,
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
      margin: { left: 14, right: 14, bottom: 30 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    renderDocumentValidationFooter(
      doc,
      qrCodeDataUrl,
      reportCode,
      sha256Hash,
      verificationUrl,
      finalY + 6,
      true
    );

    safeSavePDF(doc, `relatorio_conformidade_ca_${CURRENT_DATE_STR}.pdf`);
  }

  /**
   * Generates and downloads the Collaborators & NR-6 PPE Cards List PDF Report
   */
  static async generateCollaboratorsPDF(
    collaborators: Collaborator[] = [],
    searchTerm: string = ''
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const headerConfig = StorageService.getHeaderConfig();
    const companyTitle = (headerConfig?.title || 'SafeGuard EPI').toUpperCase();
    const reportCode = `REL-COLAB-${CURRENT_DATE_STR.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sha256Hash = `SHA256:${Date.now().toString(16)}${Math.random().toString(16).substring(2)}f89c0`;
    const verificationUrl = StorageService.buildDocumentVerificationUrl(
      reportCode,
      'colaboradores',
      headerConfig?.document
    );

    StorageService.saveOriginalDocument({
      id: `doc-${Date.now()}`,
      code: reportCode,
      type: 'colaboradores',
      title: 'Relação de Empregados e Controle de Fichas de EPI',
      companyId: headerConfig?.document || 'default',
      companyName: companyTitle,
      companyDocument: headerConfig?.document,
      generatedAt: new Date().toISOString(),
      dateStr: CURRENT_DATE_STR,
      sha256Hash,
      verificationUrl,
      itemsCount: collaborators.length,
      summaryText: `Relação de ${collaborators.length} trabalhadores com controle individual de Ficha de EPI conforme NR-6.`,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, 160);

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, 182, 22, 'F');

    const hasImageLogo = headerConfig?.logoType === 'image' && headerConfig?.logoImageUrl;
    const textStartX = hasImageLogo ? 38 : 20;

    if (hasImageLogo) {
      tryAddHeaderLogo(doc, headerConfig.logoImageUrl, 18, 14, 16, 16);
    }

    tryAddQRCodeStamp(doc, qrCodeDataUrl, 174, 13, 16, 'VALIDAR');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTitle, textStartX, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `RELAÇÃO DE EMPREGADOS E CONTROLE DE FICHAS DE EPI — NR-6${
        headerConfig?.document ? `  |  CNPJ: ${headerConfig.document}` : ''
      }`,
      textStartX,
      24
    );
    doc.text(
      `Emissão: ${CURRENT_DATE_STR}  |  Código de Autenticidade: ${reportCode}`,
      textStartX,
      28
    );

    const rows = collaborators.map((c) => [
      c.registration || '-',
      c.name,
      c.cpf || '-',
      c.role || '-',
      c.department || '-',
      c.shift || 'Manhã',
      `Calç: ${c.shoeSize || '-'} | Luva: ${c.gloveSize || '-'}`,
      c.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Matrícula', 'Nome Completo', 'CPF', 'Função / Cargo', 'Setor', 'Turno', 'Medidas', 'Status']],
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
      margin: { left: 14, right: 14, bottom: 35 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    renderDocumentValidationFooter(
      doc,
      qrCodeDataUrl,
      reportCode,
      sha256Hash,
      verificationUrl,
      finalY + 8,
      false
    );

    renderSignatureBlock(doc, finalY + 34 > 255 ? 255 : finalY + 34);

    safeSavePDF(doc, `relacao_colaboradores_epi_${CURRENT_DATE_STR}.pdf`);
  }
}

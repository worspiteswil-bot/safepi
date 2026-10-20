import {
  EPIItem,
  Collaborator,
  EPIDelivery,
  StockMovement,
  AutomaticAlert,
  EPICategory,
} from '../types/epi';

export const CATEGORY_LABELS: Record<EPICategory, string> = {
  cabeca: 'Proteção para Cabeça',
  olhos_face: 'Olhos e Face',
  auditiva: 'Proteção Auditiva',
  respiratoria: 'Proteção Respiratória',
  membros_sup: 'Membros Superiores',
  membros_inf: 'Membros Inferiores',
  tronco: 'Tronco e Vestimentas',
  altura: 'Proteção Contra Quedas',
  cremes_outros: 'Dermatológicos e Outros',
};

export const NR6_LEGAL_TERM = `
DECLARAÇÃO DE RECEBIMENTO E TERMO DE COMPROMISSO DE GUARDA E USO DE EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL (EPI)
Em conformidade com a Norma Regulamentadora nº 6 (NR-6) da Portaria MTE nº 3.214/78 (redação dada pela Portaria MTP nº 2.175/2022), declaro ter recebido da empresa, gratuitamente, os Equipamentos de Proteção Individual (EPIs) listados neste documento, novos ou em perfeito estado de conservação e higienização, com Certificado de Aprovação (C.A.) válido emitido pelo Ministério do Trabalho e Previdência.

Assumo os seguintes compromissos:
1. Usar o EPI fornecido exclusivamente para a finalidade a que se destina durante toda a jornada de trabalho em áreas de risco;
2. Responsabilizar-me pela sua guarda e conservação;
3. Comunicar imediatamente à área de Segurança do Trabalho (SESMT/CIPA) ou à chefia imediata qualquer alteração, desgaste ou extravio que o torne impróprio para uso;
4. Cumprir as determinações do empregador sobre o uso adequado, conforme treinamento recebido;
5. Restituir os equipamentos em caso de rescisão de contrato de trabalho ou substituição periódica.
Estou ciente de que a recusa injustificada ao uso constitui ato faltoso, passível de sanções disciplinares previstas no artigo 482 da CLT.
`.trim();

// Demonstração limpa - sem dados mockados pré-carregados
export const INITIAL_EPIS: EPIItem[] = [];
export const INITIAL_COLLABORATORS: Collaborator[] = [];
export const INITIAL_DELIVERIES: EPIDelivery[] = [];
export const INITIAL_MOVEMENTS: StockMovement[] = [];

export interface HeaderConfig {
  title: string;              // Razão Social / Nome da Empresa
  subtitle?: string;          // Subtítulo / Departamento / Unidade (ex: SESMT — Gestão NR-6)
  document?: string;          // CNPJ / Inscrição da Empresa
  segment?: string;           // Ramo / Segmento de Atuação
  address?: string;           // Endereço / Cidade - UF / Unidade Operacional
  contactEmail?: string;      // E-mail de Contato / SESMT
  phone?: string;             // Telefone de Contato
  logoType: 'icon' | 'image';
  logoIcon: string;
  logoColor: string;
  logoImageUrl?: string;
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  title: 'SafeGuard EPI',
  subtitle: 'Gestão NR-6 & SST',
  document: '',
  segment: 'Indústria e Serviços',
  address: '',
  contactEmail: '',
  phone: '',
  logoType: 'icon',
  logoIcon: 'ShieldCheck',
  logoColor: 'bg-amber-500',
  logoImageUrl: '',
};

export interface CloudFirestoreDocument<T> {
  docId: string;
  collection: string;
  path: string;
  data: T;
  createdAt: string;
  updatedAt: string;
}

export interface CloudBackupPayload {
  _version: string;
  _schema: 'firestore_cloud_v1';
  _database: string;
  _syncedAt: string;
  _syncedAtFormatted: string;
  syncedBy: {
    uid: string;
    name: string;
    email: string;
    role: string;
    registrationNumber: string;
    department: string;
  };
  organization: {
    orgId: string;
    name: string;
    subtitle?: string;
    headerConfig: HeaderConfig;
  };
  collections: {
    epis: Array<CloudFirestoreDocument<EPIItem>>;
    collaborators: Array<CloudFirestoreDocument<Collaborator>>;
    deliveries: Array<CloudFirestoreDocument<EPIDelivery>>;
    movements: Array<CloudFirestoreDocument<StockMovement>>;
    systemSettings: CloudFirestoreDocument<{
      headerConfig: HeaderConfig;
      syncVersion: string;
      appVersion: string;
      lastSyncTimestamp: string;
    }>;
  };
  metadata: {
    totalEpis: number;
    totalCollaborators: number;
    totalDeliveries: number;
    totalMovements: number;
    totalDocuments: number;
    estimatedSizeBytes: number;
    targetCloudService: 'Firebase Firestore (Native NoSQL)';
    securityRulesReady: boolean;
    syncStatus: 'success';
  };
}

export const STORAGE_KEYS = {
  EPIS: 'safe_epi_items_v3',
  COLLABORATORS: 'safe_epi_colabs_v3',
  DELIVERIES: 'safe_epi_delivs_v3',
  MOVEMENTS: 'safe_epi_movs_v3',
  HEADER_CONFIG: 'safe_epi_header_v3',
  CLOUD_BACKUP: 'safe_epi_cloud_backup_v3',
  SYNC_METADATA: 'safe_epi_sync_metadata_v3',
  CLEAN_STATE: 'safe_epi_clean_state_v3',
};

const getCompanyKey = (base: string, explicitCompanyId?: string): string => {
  let companyId = explicitCompanyId;
  if (!companyId && typeof localStorage !== 'undefined') {
    try {
      const session = localStorage.getItem('safe_epi_auth_session_v3');
      if (session) {
        const user = JSON.parse(session);
        if (user && user.companyId) {
          companyId = user.companyId;
        }
      }
    } catch {
      // fallback
    }
  }
  return `${base}_${companyId || 'default'}`;
};

// Current system date simulation
export const CURRENT_DATE_STR = '2026-10-15';

export function getDaysDifference(targetDate: string, baseDate = CURRENT_DATE_STR): number {
  const target = new Date(targetDate + 'T00:00:00');
  const base = new Date(baseDate + 'T00:00:00');
  const diffTime = target.getTime() - base.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export class StorageService {
  static getEPIs(companyId?: string): EPIItem[] {
    try {
      const key = getCompanyKey('safe_epi_items_v3', companyId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveEPIs(items: EPIItem[], companyId?: string): void {
    const key = getCompanyKey('safe_epi_items_v3', companyId);
    localStorage.setItem(key, JSON.stringify(items));
  }

  static getCollaborators(companyId?: string): Collaborator[] {
    try {
      const key = getCompanyKey('safe_epi_colabs_v3', companyId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveCollaborators(items: Collaborator[], companyId?: string): void {
    const key = getCompanyKey('safe_epi_colabs_v3', companyId);
    localStorage.setItem(key, JSON.stringify(items));
  }

  static getDeliveries(companyId?: string): EPIDelivery[] {
    try {
      const key = getCompanyKey('safe_epi_delivs_v3', companyId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveDeliveries(items: EPIDelivery[], companyId?: string): void {
    const key = getCompanyKey('safe_epi_delivs_v3', companyId);
    localStorage.setItem(key, JSON.stringify(items));
  }

  static getMovements(companyId?: string): StockMovement[] {
    try {
      const key = getCompanyKey('safe_epi_movs_v3', companyId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveMovements(items: StockMovement[], companyId?: string): void {
    const key = getCompanyKey('safe_epi_movs_v3', companyId);
    localStorage.setItem(key, JSON.stringify(items));
  }

  static getHeaderConfig(companyId?: string): HeaderConfig {
    try {
      const activeKey = getCompanyKey('safe_epi_header_v3', companyId);
      let data = localStorage.getItem(activeKey);

      // Fallback para chave anterior se existir
      if (!data && companyId) {
        data = localStorage.getItem(`safe_epi_header_${companyId}`);
      }

      // Buscar informações cadastradas da empresa no multi-tenant
      let effectiveCompanyId = companyId;
      let sessionUser: any = null;
      if (typeof localStorage !== 'undefined') {
        try {
          const session = localStorage.getItem('safe_epi_auth_session_v3');
          if (session) {
            sessionUser = JSON.parse(session);
            if (!effectiveCompanyId && sessionUser?.companyId) {
              effectiveCompanyId = sessionUser.companyId;
            }
          }
        } catch {}
      }

      let companyObj: any = null;
      if (effectiveCompanyId && typeof localStorage !== 'undefined') {
        try {
          const companiesRaw = localStorage.getItem('safe_epi_companies_v3');
          if (companiesRaw) {
            const list = JSON.parse(companiesRaw);
            companyObj = list.find((c: any) => c.id === effectiveCompanyId);
          }
        } catch {}
      }

      const defaultTitle = companyObj?.name || sessionUser?.companyName || DEFAULT_HEADER_CONFIG.title;
      const defaultDocument = companyObj?.document || '';
      const defaultSegment = companyObj?.segment || DEFAULT_HEADER_CONFIG.segment;
      const defaultSubtitle = defaultSegment
        ? `SESMT & Gestão NR-6 • ${defaultSegment}`
        : DEFAULT_HEADER_CONFIG.subtitle;

      if (!data) {
        return {
          ...DEFAULT_HEADER_CONFIG,
          title: defaultTitle,
          document: defaultDocument,
          segment: defaultSegment,
          subtitle: defaultSubtitle,
        };
      }

      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_HEADER_CONFIG,
        title: parsed.title || defaultTitle,
        document: parsed.document !== undefined ? parsed.document : defaultDocument,
        segment: parsed.segment || defaultSegment,
        subtitle: parsed.subtitle || defaultSubtitle,
        address: parsed.address || '',
        contactEmail: parsed.contactEmail || '',
        phone: parsed.phone || '',
        ...parsed,
      };
    } catch {
      return DEFAULT_HEADER_CONFIG;
    }
  }

  static saveHeaderConfig(config: HeaderConfig, companyId?: string): void {
    const key = getCompanyKey('safe_epi_header_v3', companyId);
    localStorage.setItem(key, JSON.stringify(config));

    // Sincroniza dados da empresa em safe_epi_companies_v3 e na sessão ativa se houver
    if (typeof localStorage !== 'undefined') {
      try {
        let effectiveCompanyId = companyId;
        const sessionRaw = localStorage.getItem('safe_epi_auth_session_v3');
        let sessionUser: any = null;
        if (sessionRaw) {
          sessionUser = JSON.parse(sessionRaw);
          if (!effectiveCompanyId) effectiveCompanyId = sessionUser?.companyId;
        }

        if (effectiveCompanyId) {
          const companiesRaw = localStorage.getItem('safe_epi_companies_v3');
          if (companiesRaw) {
            const list = JSON.parse(companiesRaw);
            const updated = list.map((c: any) => {
              if (c.id === effectiveCompanyId) {
                return {
                  ...c,
                  name: config.title || c.name,
                  document: config.document !== undefined ? config.document : c.document,
                  segment: config.segment || c.segment,
                };
              }
              return c;
            });
            localStorage.setItem('safe_epi_companies_v3', JSON.stringify(updated));
          }

          if (sessionUser && sessionUser.companyId === effectiveCompanyId) {
            sessionUser.companyName = config.title || sessionUser.companyName;
            localStorage.setItem('safe_epi_auth_session_v3', JSON.stringify(sessionUser));
          }
        }
      } catch {}
    }
  }

  /**
   * Limpa integralmente todos os dados operacionais da empresa ativa
   */
  static clearAllData(companyId?: string): void {
    if (typeof localStorage === 'undefined') return;
    const epiKey = getCompanyKey('safe_epi_items_v3', companyId);
    const colabKey = getCompanyKey('safe_epi_colabs_v3', companyId);
    const delivKey = getCompanyKey('safe_epi_delivs_v3', companyId);
    const moveKey = getCompanyKey('safe_epi_movs_v3', companyId);
    const backupKey = getCompanyKey('safe_epi_cloud_backup_v3', companyId);
    const metaKey = getCompanyKey('safe_epi_sync_metadata_v3', companyId);

    localStorage.setItem(epiKey, JSON.stringify([]));
    localStorage.setItem(colabKey, JSON.stringify([]));
    localStorage.setItem(delivKey, JSON.stringify([]));
    localStorage.setItem(moveKey, JSON.stringify([]));
    localStorage.removeItem(backupKey);
    localStorage.removeItem(metaKey);
  }

  static resetToDefault(): void {
    this.clearAllData();
  }

  static cleanupOldDemoData(): void {
    if (typeof localStorage === 'undefined') return;
    const cleanFlag = localStorage.getItem('safe_epi_clean_state_v3');
    if (!cleanFlag) {
      this.clearAllData();
    }
  }

  /**
   * Sincroniza e formata os dados operacionais atuais em uma estrutura
   * hierárquica preparada para integração com Firebase Firestore (NoSQL)
   * e autenticação em nuvem.
   */
  static syncBackupToCloudStructure(user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    registrationNumber?: string;
    department?: string;
  } | null): CloudBackupPayload {
    const epis = this.getEPIs();
    const collaborators = this.getCollaborators();
    const deliveries = this.getDeliveries();
    const movements = this.getMovements();
    const headerConfig = this.getHeaderConfig();
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('pt-BR');

    const sessionRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('safe_epi_auth_session_v3') : null;
    const sessionObj = sessionRaw ? JSON.parse(sessionRaw) : null;
    const activeCompanyId = (user as any)?.companyId || sessionObj?.companyId || 'org_safeguard';
    const orgId = activeCompanyId.startsWith('comp-') ? activeCompanyId : `org_${activeCompanyId}`;

    const episDocs: Array<CloudFirestoreDocument<EPIItem>> = epis.map((epi) => ({
      docId: epi.id,
      collection: 'epis',
      path: `organizations/${orgId}/epis/${epi.id}`,
      data: epi,
      createdAt: epi.createdAt || nowIso,
      updatedAt: epi.updatedAt || nowIso,
    }));

    const colabDocs: Array<CloudFirestoreDocument<Collaborator>> = collaborators.map((c) => ({
      docId: c.id,
      collection: 'collaborators',
      path: `organizations/${orgId}/collaborators/${c.id}`,
      data: c,
      createdAt: c.admissionDate ? `${c.admissionDate}T08:00:00Z` : nowIso,
      updatedAt: nowIso,
    }));

    const delivDocs: Array<CloudFirestoreDocument<EPIDelivery>> = deliveries.map((d) => ({
      docId: d.id,
      collection: 'deliveries',
      path: `organizations/${orgId}/deliveries/${d.id}`,
      data: d,
      createdAt: d.deliveryDate ? `${d.deliveryDate}T08:00:00Z` : nowIso,
      updatedAt: d.returnDate ? `${d.returnDate}T17:00:00Z` : nowIso,
    }));

    const moveDocs: Array<CloudFirestoreDocument<StockMovement>> = movements.map((m) => ({
      docId: m.id,
      collection: 'movements',
      path: `organizations/${orgId}/movements/${m.id}`,
      data: m,
      createdAt: m.date ? `${m.date}T09:00:00Z` : nowIso,
      updatedAt: nowIso,
    }));

    const settingsDoc: CloudFirestoreDocument<{
      headerConfig: HeaderConfig;
      syncVersion: string;
      appVersion: string;
      lastSyncTimestamp: string;
    }> = {
      docId: 'general_config',
      collection: 'systemSettings',
      path: `organizations/${orgId}/systemSettings/general_config`,
      data: {
        headerConfig,
        syncVersion: '1.0.0',
        appVersion: 'SafeGuard EPI v1.2.0',
        lastSyncTimestamp: nowIso,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const totalDocs = episDocs.length + colabDocs.length + delivDocs.length + moveDocs.length + 1;

    const payload: CloudBackupPayload = {
      _version: '1.0.0',
      _schema: 'firestore_cloud_v1',
      _database: '(default)',
      _syncedAt: nowIso,
      _syncedAtFormatted: nowFormatted,
      syncedBy: {
        uid: user?.id || 'usr-system-admin',
        name: user?.name || 'Administrador do Sistema SST',
        email: user?.email || 'admin@safeguard.com',
        role: user?.role || 'Gestor de SST / Almoxarifado',
        registrationNumber: user?.registrationNumber || '',
        department: user?.department || 'Segurança do Trabalho',
      },
      organization: {
        orgId,
        name: headerConfig.title || 'SafeGuard EPI',
        subtitle: headerConfig.subtitle,
        headerConfig,
      },
      collections: {
        epis: episDocs,
        collaborators: colabDocs,
        deliveries: delivDocs,
        movements: moveDocs,
        systemSettings: settingsDoc,
      },
      metadata: {
        totalEpis: episDocs.length,
        totalCollaborators: colabDocs.length,
        totalDeliveries: delivDocs.length,
        totalMovements: moveDocs.length,
        totalDocuments: totalDocs,
        estimatedSizeBytes: 0,
        targetCloudService: 'Firebase Firestore (Native NoSQL)',
        securityRulesReady: true,
        syncStatus: 'success',
      },
    };

    const serialized = JSON.stringify(payload, null, 2);
    payload.metadata.estimatedSizeBytes = new Blob([serialized]).size;

    const backupKey = getCompanyKey(STORAGE_KEYS.CLOUD_BACKUP, activeCompanyId);
    const metaKey = getCompanyKey(STORAGE_KEYS.SYNC_METADATA, activeCompanyId);

    localStorage.setItem(backupKey, JSON.stringify(payload));
    localStorage.setItem(
      metaKey,
      JSON.stringify({
        lastSyncIso: nowIso,
        lastSyncFormatted: nowFormatted,
        totalDocuments: totalDocs,
        syncedBy: payload.syncedBy.name,
      })
    );

    return payload;
  }

  static getCloudBackup(companyId?: string): CloudBackupPayload | null {
    try {
      const key = getCompanyKey(STORAGE_KEYS.CLOUD_BACKUP, companyId);
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static getSyncMetadata(companyId?: string): {
    lastSyncIso: string;
    lastSyncFormatted: string;
    totalDocuments: number;
    syncedBy: string;
  } | null {
    try {
      const key = getCompanyKey(STORAGE_KEYS.SYNC_METADATA, companyId);
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Recalculates all automatic alerts in real time:
   * - C.A. vencido no Ministério do Trabalho
   * - C.A. a vencer nos próximos 30 ou 60 dias
   * - Estoque zerado (esgotado)
   * - Estoque crítico (abaixo do mínimo de reposição)
   * - Colaborador com troca periódica atrasada (risco legal NR-6)
   * - Colaborador com troca prevista nos próximos 7 dias
   */
  static calculateAlerts(
    epis: EPIItem[],
    deliveries: EPIDelivery[],
    collaborators: Collaborator[]
  ): AutomaticAlert[] {
    const alerts: AutomaticAlert[] = [];

    // 1. C.A. Expirations & Stock alerts
    for (const epi of epis) {
      const daysToCaExpiry = getDaysDifference(epi.caExpiryDate);

      if (daysToCaExpiry < 0) {
        alerts.push({
          id: `alert-ca-vencido-${epi.id}`,
          type: 'ca_vencido',
          severity: 'critico',
          title: `C.A. VENCIDO: ${epi.code} (C.A. ${epi.caNumber})`,
          description: `O Certificado de Aprovação deste item venceu há ${Math.abs(daysToCaExpiry)} dia(s) em ${epi.caExpiryDate}. Pela NR-6, é proibida a comercialização e fornecimento de EPI sem C.A. válido.`,
          itemId: epi.id,
          targetDate: epi.caExpiryDate,
          daysRemaining: daysToCaExpiry,
          actionType: 'renovar_ca',
        });
      } else if (daysToCaExpiry <= 30) {
        alerts.push({
          id: `alert-ca-avencer-${epi.id}`,
          type: 'ca_a_vencer',
          severity: 'atencao',
          title: `C.A. a Vencer em ${daysToCaExpiry} dias: ${epi.name}`,
          description: `O C.A. ${epi.caNumber} expira em ${epi.caExpiryDate}. Verifique renovação junto ao fabricante ${epi.manufacturer} ou consulte o sistema CAEPI do MTE.`,
          itemId: epi.id,
          targetDate: epi.caExpiryDate,
          daysRemaining: daysToCaExpiry,
          actionType: 'renovar_ca',
        });
      }

      // Stock alerts
      if (epi.stockQuantity === 0) {
        alerts.push({
          id: `alert-stock-zero-${epi.id}`,
          type: 'estoque_zerado',
          severity: 'critico',
          title: `ESTOQUE ZERADO: ${epi.name}`,
          description: `Não há unidades disponíveis em estoque. Ponto de pedido mínimo: ${epi.minStockQuantity} ${epi.unit}. Risco de desabastecimento nas frentes de trabalho.`,
          itemId: epi.id,
          actionType: 'ir_estoque',
        });
      } else if (epi.stockQuantity <= epi.minStockQuantity) {
        alerts.push({
          id: `alert-stock-baixo-${epi.id}`,
          type: 'estoque_baixo',
          severity: 'atencao',
          title: `Estoque Crítico (${epi.stockQuantity}/${epi.minStockQuantity} ${epi.unit}): ${epi.name}`,
          description: `Saldo atual atingiu o limite de reposição. Sugerida emissão imediata de pedido de compra de ${epi.idealStockQuantity - epi.stockQuantity} ${epi.unit}.`,
          itemId: epi.id,
          actionType: 'ir_estoque',
        });
      }
    }

    // 2. Collaborator periodic exchange alerts
    const activeDeliveries = deliveries.filter((d) => d.status === 'em_uso');
    for (const del of activeDeliveries) {
      const daysToExchange = getDaysDifference(del.expectedExchangeDate);

      if (daysToExchange < 0) {
        alerts.push({
          id: `alert-troca-atrasada-${del.id}`,
          type: 'troca_colaborador_atrasada',
          severity: 'critico',
          title: `Troca de EPI Vencida: ${del.collaboratorName}`,
          description: `O colaborador está com o item "${del.epiName}" vencido para troca desde ${del.expectedExchangeDate} (${Math.abs(daysToExchange)} dias de atraso).`,
          collaboratorId: del.collaboratorId,
          deliveryId: del.id,
          targetDate: del.expectedExchangeDate,
          daysRemaining: daysToExchange,
          actionType: 'ir_entrega',
        });
      } else if (daysToExchange <= 7) {
        alerts.push({
          id: `alert-troca-proxima-${del.id}`,
          type: 'troca_colaborador_proxima',
          severity: 'atencao',
          title: `Troca Periódica em ${daysToExchange} dia(s): ${del.collaboratorName}`,
          description: `Vencimento da vida útil do item "${del.epiName}" previsto para ${del.expectedExchangeDate}. Agende a substituição no almoxarifado.`,
          collaboratorId: del.collaboratorId,
          deliveryId: del.id,
          targetDate: del.expectedExchangeDate,
          daysRemaining: daysToExchange,
          actionType: 'ir_entrega',
        });
      }
    }

    // Sort: critico first, then atencao, then days remaining
    return alerts.sort((a, b) => {
      const severityRank = { critico: 0, atencao: 1, informativo: 2 };
      if (severityRank[a.severity] !== severityRank[b.severity]) {
        return severityRank[a.severity] - severityRank[b.severity];
      }
      return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
    });
  }
}

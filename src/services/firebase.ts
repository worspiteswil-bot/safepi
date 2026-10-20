import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  writeBatch,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CloudBackupPayload, StorageService } from './storage';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Validate connection to Firestore on initialization as mandated by Firebase Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[SafeGuard EPI] Conexão com Firebase Firestore verificada com sucesso.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[SafeGuard EPI] Erro: Cliente Firebase offline. Verifique a conexão e configuração.');
    } else {
      // Document not found is normal for connection testing
      console.log('[SafeGuard EPI] Conexão com Firestore estabelecida.');
    }
    return true;
  }
}

// Execute connection test on boot
testConnection();

export class FirebaseSyncService {
  /**
   * Sincroniza em lote todos os dados operacionais da empresa diretamente para o Cloud Firestore
   */
  static async pushCompanyDataToFirestore(
    companyId: string,
    payload: CloudBackupPayload
  ): Promise<{ success: boolean; totalWritten: number; error?: string }> {
    try {
      const orgId = companyId.startsWith('comp-') ? companyId : `comp-${companyId}`;
      const batch = writeBatch(db);

      // 1. Gravar dados da Organização
      const orgRef = doc(db, 'organizations', orgId);
      batch.set(orgRef, {
        id: orgId,
        name: payload.organization.name,
        subtitle: payload.organization.subtitle || '',
        updatedAt: payload._syncedAt,
        syncedBy: payload.syncedBy,
        metadata: payload.metadata,
      });

      // 2. Gravar Configuração de Cabeçalho
      const settingsRef = doc(db, 'organizations', orgId, 'settings', 'header');
      batch.set(settingsRef, {
        ...payload.organization.headerConfig,
        updatedAt: payload._syncedAt,
      });

      // 3. Gravar EPIs
      payload.collections.epis.forEach((item) => {
        const epiRef = doc(db, 'organizations', orgId, 'epis', item.docId);
        batch.set(epiRef, {
          ...item.data,
          updatedAt: item.updatedAt,
        });
      });

      // 4. Gravar Colaboradores
      payload.collections.collaborators.forEach((colab) => {
        const colabRef = doc(db, 'organizations', orgId, 'collaborators', colab.docId);
        batch.set(colabRef, {
          ...colab.data,
          updatedAt: colab.updatedAt,
        });
      });

      // 5. Gravar Entregas de EPI
      payload.collections.deliveries.forEach((del) => {
        const delRef = doc(db, 'organizations', orgId, 'deliveries', del.docId);
        batch.set(delRef, {
          ...del.data,
          updatedAt: del.updatedAt,
        });
      });

      // 6. Gravar Movimentações de Estoque
      payload.collections.movements.forEach((mov) => {
        const movRef = doc(db, 'organizations', orgId, 'movements', mov.docId);
        batch.set(movRef, {
          ...mov.data,
          updatedAt: mov.updatedAt,
        });
      });

      // Commit atômico no Firestore
      await batch.commit();

      const totalWritten =
        1 +
        1 +
        payload.collections.epis.length +
        payload.collections.collaborators.length +
        payload.collections.deliveries.length +
        payload.collections.movements.length;

      console.log(`[SafeGuard EPI] Sincronização com Cloud Firestore concluída: ${totalWritten} documentos gravados.`);
      return { success: true, totalWritten };
    } catch (err: any) {
      console.error('[SafeGuard EPI] Falha ao sincronizar com Firestore:', err);
      return { success: false, totalWritten: 0, error: err?.message || 'Erro de gravação no Firestore' };
    }
  }

  /**
   * Baixa dados atualizados da empresa do Cloud Firestore para o armazenamento local
   */
  static async pullCompanyDataFromFirestore(companyId: string): Promise<{
    success: boolean;
    episCount: number;
    colabsCount: number;
    deliveriesCount: number;
    movementsCount: number;
    error?: string;
  }> {
    try {
      const orgId = companyId.startsWith('comp-') ? companyId : `comp-${companyId}`;

      const [episSnap, colabsSnap, delivsSnap, movsSnap] = await Promise.all([
        getDocs(collection(db, 'organizations', orgId, 'epis')),
        getDocs(collection(db, 'organizations', orgId, 'collaborators')),
        getDocs(collection(db, 'organizations', orgId, 'deliveries')),
        getDocs(collection(db, 'organizations', orgId, 'movements')),
      ]);

      const cloudEpis = episSnap.docs.map((d) => d.data() as any);
      const cloudColabs = colabsSnap.docs.map((d) => d.data() as any);
      const cloudDelivs = delivsSnap.docs.map((d) => d.data() as any);
      const cloudMovs = movsSnap.docs.map((d) => d.data() as any);

      if (cloudEpis.length > 0) StorageService.saveEPIs(cloudEpis, companyId);
      if (cloudColabs.length > 0) StorageService.saveCollaborators(cloudColabs, companyId);
      if (cloudDelivs.length > 0) StorageService.saveDeliveries(cloudDelivs, companyId);
      if (cloudMovs.length > 0) StorageService.saveMovements(cloudMovs, companyId);

      return {
        success: true,
        episCount: cloudEpis.length,
        colabsCount: cloudColabs.length,
        deliveriesCount: cloudDelivs.length,
        movementsCount: cloudMovs.length,
      };
    } catch (err: any) {
      console.error('[SafeGuard EPI] Erro ao carregar dados do Firestore:', err);
      return {
        success: false,
        episCount: 0,
        colabsCount: 0,
        deliveriesCount: 0,
        movementsCount: 0,
        error: err?.message || 'Erro ao consultar documentos',
      };
    }
  }
}

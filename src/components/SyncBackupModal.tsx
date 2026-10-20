import React, { useState } from 'react';
import { CloudBackupPayload, StorageService } from '../services/storage';
import { SystemUser } from '../services/authService';
import { FirebaseSyncService } from '../services/firebase';
import {
  X,
  CloudUpload,
  CheckCircle2,
  Database,
  Download,
  Copy,
  Check,
  Layers,
  ShieldCheck,
  FileCode,
  HardDrive,
  RefreshCw,
  Clock,
  UserCheck,
  Cloud,
  CheckCircle,
} from 'lucide-react';

interface SyncBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser | null;
  onSyncCompleted?: (payload: CloudBackupPayload) => void;
  onReloadCompanyData?: () => void;
}

export const SyncBackupModal: React.FC<SyncBackupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSyncCompleted,
  onReloadCompanyData,
}) => {
  const [backupPayload, setBackupPayload] = useState<CloudBackupPayload | null>(() =>
    StorageService.getCloudBackup(currentUser?.companyId)
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  if (!isOpen) return null;

  const handleExecuteSync = async () => {
    setIsSyncing(true);
    setCloudMessage(null);
    try {
      const payload = StorageService.syncBackupToCloudStructure(currentUser);
      setBackupPayload(payload);

      const companyId = currentUser?.companyId || 'comp-default';
      const firestoreRes = await FirebaseSyncService.pushCompanyDataToFirestore(companyId, payload);

      if (firestoreRes.success) {
        setCloudMessage(`Sincronizado diretamente com Firebase Firestore (${firestoreRes.totalWritten} documentos gravados na nuvem).`);
      } else {
        setCloudMessage(`Backup local salvo. Firestore: ${firestoreRes.error}`);
      }

      if (onSyncCompleted) {
        onSyncCompleted(payload);
      }
    } catch (err: any) {
      setCloudMessage('Erro na sincronização: ' + (err?.message || 'Falha de conexão'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromFirestore = async () => {
    if (!currentUser?.companyId) return;
    setIsPulling(true);
    setCloudMessage(null);
    try {
      const res = await FirebaseSyncService.pullCompanyDataFromFirestore(currentUser.companyId);
      if (res.success) {
        setCloudMessage(`Dados recuperados do Firestore: ${res.episCount} EPIs, ${res.colabsCount} colaboradores, ${res.deliveriesCount} entregas.`);
        if (onReloadCompanyData) {
          onReloadCompanyData();
        }
      } else {
        setCloudMessage('Falha ao obter dados: ' + res.error);
      }
    } catch (err: any) {
      setCloudMessage('Erro ao conectar ao Firestore: ' + err.message);
    } finally {
      setIsPulling(false);
    }
  };

  const handleDownloadJson = () => {
    if (!backupPayload) return;
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safeguard_firestore_backup_${backupPayload._syncedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleCopyJson = () => {
    if (!backupPayload) return;
    navigator.clipboard.writeText(JSON.stringify(backupPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
              <CloudUpload className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Sincronização de Backup em Nuvem
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Firestore Ready
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Persistência relacional formatada para Firebase Firestore e autenticação em nuvem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Firebase Project Connection Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-blue-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">Firebase Cloud Firestore Ativo</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    Online
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Projeto: <strong>commanding-answer-wrrhs</strong> • Região: us-east1
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePullFromFirestore}
                disabled={isPulling || isSyncing}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Recuperar dados atualizados armazenados no Firestore"
              >
                <Download className={`w-3 h-3 ${isPulling ? 'animate-bounce' : ''}`} />
                <span>{isPulling ? 'Baixando...' : 'Recuperar da Nuvem'}</span>
              </button>
            </div>
          </div>

          {/* Cloud feedback alert */}
          {cloudMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cloudMessage}</span>
            </div>
          )}

          {/* Explanation Banner */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950 text-xs">
                Estrutura de Coleções NoSQL Preparada para Firestore
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Este processo agrupa e normaliza todos os registros locais (EPIs, Colaboradores, Entregas com biometria facial, Movimentações de estoque e Configuração de cabeçalho) em documentos independentes sob as coleções{' '}
                <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900 text-[10px]">epis</code>,{' '}
                <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900 text-[10px]">collaborators</code>,{' '}
                <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900 text-[10px]">deliveries</code> e{' '}
                <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900 text-[10px]">movements</code>, prontos para replicação bidirecional.
              </p>
            </div>
          </div>

          {backupPayload ? (
            <div className="space-y-4">
              {/* Sync Status Box */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      Backup Persistido no LocalStorage com Sucesso
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Status: Ativo & Íntegro
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Itens EPI</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {backupPayload.metadata.totalEpis}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Colaboradores</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {backupPayload.metadata.totalCollaborators}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Fichas / Entregas</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {backupPayload.metadata.totalDeliveries}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Auditoria Estoque</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {backupPayload.metadata.totalMovements}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Última sincronização: <strong className="text-slate-800">{backupPayload._syncedAtFormatted}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Por: <strong className="text-slate-800">{backupPayload.syncedBy.name}</strong></span>
                  </div>
                </div>
              </div>

              {/* Firestore Document Architecture Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Mapeamento de Rotas no Firestore
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Database: (default)
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold">organizations/{backupPayload.organization.orgId}/epis</span>
                    <span className="text-slate-400">{backupPayload.metadata.totalEpis} documentos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold">organizations/{backupPayload.organization.orgId}/collaborators</span>
                    <span className="text-slate-400">{backupPayload.metadata.totalCollaborators} documentos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold">organizations/{backupPayload.organization.orgId}/deliveries</span>
                    <span className="text-slate-400">{backupPayload.metadata.totalDeliveries} documentos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold">organizations/{backupPayload.organization.orgId}/movements</span>
                    <span className="text-slate-400">{backupPayload.metadata.totalMovements} documentos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold">organizations/{backupPayload.organization.orgId}/systemSettings</span>
                    <span className="text-slate-400">1 documento (identidade visual)</span>
                  </div>
                </div>
              </div>

              {/* Actions row: Download JSON, Copy, Toggle Preview */}
              <div className="flex items-center flex-wrap gap-2 pt-1">
                <button
                  onClick={handleDownloadJson}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Baixar arquivo JSON formatado no seu computador"
                >
                  <Download className="w-3.5 h-3.5 text-slate-700" />
                  <span>Baixar Backup JSON ({Math.round(backupPayload.metadata.estimatedSizeBytes / 1024)} KB)</span>
                </button>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Copiar estrutura JSON para área de transferência"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>{showJsonPreview ? 'Ocultar JSON' : 'Visualizar JSON'}</span>
                </button>
              </div>

              {/* JSON preview */}
              {showJsonPreview && (
                <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl max-h-56 overflow-y-auto border border-slate-800 leading-relaxed">
                  <pre>{JSON.stringify(backupPayload, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl space-y-3">
              <HardDrive className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="font-semibold text-slate-800 text-xs">
                  Nenhum backup em formato Firestore sincronizado ainda
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clique no botão abaixo para gerar e persistir a nova estrutura agora mesmo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            onClick={handleExecuteSync}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : backupPayload ? 'Forçar Nova Sincronização' : 'Sincronizar Backup Agora'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

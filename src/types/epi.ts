export type EPICategory =
  | 'cabeca'
  | 'olhos_face'
  | 'auditiva'
  | 'respiratoria'
  | 'membros_sup'
  | 'membros_inf'
  | 'tronco'
  | 'altura'
  | 'cremes_outros';

export interface EPIItem {
  id: string;
  code: string;
  name: string;
  category: EPICategory;
  caNumber: string;
  caExpiryDate: string; // YYYY-MM-DD
  caStatus: 'valido' | 'a_vencer' | 'vencido';
  manufacturer: string;
  model: string;
  batchNumber: string;
  productExpiryDate?: string; // Validade de fabricação/lote
  stockQuantity: number;
  minStockQuantity: number; // Ponto de reposição
  idealStockQuantity: number;
  unit: 'un' | 'par' | 'kit' | 'cx' | 'frasco';
  unitCost: number;
  standardReplacementDays: number; // Periodicidade de troca recomendada em dias
  protectionDetails: string; // Ex: "Proteção contra impactos de partículas volantes"
  approvalNorms: string; // Ex: "ANSI/ISEA Z87.1-2015, ABNT NBR 13712"
  instructions: string; // Instruções de higienização e guarda NR-6
  locationShelf: string; // Prateleira/Local no almoxarifado
  createdAt: string;
  updatedAt?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  cpf: string;
  registration: string; // Matrícula
  role: string;
  department: string;
  admissionDate: string;
  status: 'ativo' | 'afastado' | 'ferias' | 'desligado';
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Administrativo';
  email?: string;
  phone?: string;
  shoeSize?: string;
  gloveSize?: string;
  uniformSize?: string;
  activeEpisCount?: number;
  pendingExchangesCount?: number;
}

export type DeliveryReason =
  | 'admissao'
  | 'troca_periodica'
  | 'desgaste_natural'
  | 'dano_acidental'
  | 'perda_extravio'
  | 'adequacao_funcao';

export type DeliveryStatus = 'em_uso' | 'trocado' | 'devolvido' | 'descartado' | 'extraviado';

export interface EPIDelivery {
  id: string;
  code: string; // Ex: ENT-2026-001
  collaboratorId: string;
  collaboratorName: string;
  collaboratorCpf: string;
  collaboratorRegistration: string;
  collaboratorRole: string;
  collaboratorDepartment: string;
  epiId: string;
  epiName: string;
  caNumber: string;
  quantity: number;
  deliveryDate: string; // YYYY-MM-DD
  expectedExchangeDate: string; // YYYY-MM-DD
  deliveredBy?: string; // Nome do Técnico de Segurança (Opcional)
  reason: DeliveryReason;
  status: DeliveryStatus;
  signatureDataUrl?: string; // Assinatura digital do colaborador
  biometricPhotoUrl?: string; // Foto capturada pelo reconhecimento facial
  biometricValidationHash?: string; // Hash SHA-256 de validação biométrica
  biometricMatchScore?: number; // Score de similaridade facial (ex: 98.6%)
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    timestamp: string;
  };
  observations?: string;
  returnDate?: string;
  returnReason?: string;
  returnCondition?: 'bom_estado' | 'desgastado' | 'avariado' | 'contaminado';
  returnedToUserId?: string;
}

export type MovementType = 'entrada' | 'saida_entrega' | 'ajuste' | 'baixa_descarte' | 'devolucao';

export interface StockMovement {
  id: string;
  epiId: string;
  epiName: string;
  type: MovementType;
  quantity: number;
  date: string;
  invoiceNumber?: string;
  supplier?: string;
  responsible: string;
  reasonNotes?: string;
}

export type AlertSeverity = 'critico' | 'atencao' | 'informativo';
export type AlertType =
  | 'ca_vencido'
  | 'ca_a_vencer'
  | 'estoque_zerado'
  | 'estoque_baixo'
  | 'validade_lote'
  | 'troca_colaborador_atrasada'
  | 'troca_colaborador_proxima';

export interface AutomaticAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  itemId?: string;
  collaboratorId?: string;
  deliveryId?: string;
  daysRemaining?: number;
  targetDate?: string;
  actionType: 'ir_estoque' | 'ir_entrega' | 'ir_colaborador' | 'renovar_ca';
}

export interface RoleRequiredEPI {
  role: string;
  categories: EPICategory[];
  recommendedItemCodes: string[];
}

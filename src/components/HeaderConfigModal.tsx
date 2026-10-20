import React, { useState, useRef, useEffect } from 'react';
import { HeaderConfig, DEFAULT_HEADER_CONFIG } from '../services/storage';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  HardHat,
  Shield,
  Building2,
  Award,
  Activity,
  Flame,
  Wrench,
  HeartHandshake,
  PackageCheck,
  AlertCircle,
  Eye,
  Trash2,
  Link as LinkIcon,
  Building,
  FileText,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Layers,
} from 'lucide-react';

interface HeaderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: HeaderConfig;
  onSave: (config: HeaderConfig) => void;
}

// Map icon names to Lucide icon components
export const HEADER_ICONS_MAP: Record<string, React.FC<{ className?: string }>> = {
  ShieldCheck,
  HardHat,
  Shield,
  Building2,
  Award,
  Activity,
  Flame,
  Wrench,
  HeartHandshake,
  PackageCheck,
};

const COLOR_OPTIONS = [
  { id: 'bg-amber-500', label: 'Âmbar Segurança', class: 'bg-amber-500 text-slate-950' },
  { id: 'bg-blue-600', label: 'Azul Corporativo', class: 'bg-blue-600 text-white' },
  { id: 'bg-emerald-600', label: 'Esmeralda SST', class: 'bg-emerald-600 text-white' },
  { id: 'bg-orange-600', label: 'Laranja Industrial', class: 'bg-orange-600 text-white' },
  { id: 'bg-rose-600', label: 'Vermelho Prevenção', class: 'bg-rose-600 text-white' },
  { id: 'bg-slate-900', label: 'Ardósia / Escuro', class: 'bg-slate-900 text-amber-400' },
  { id: 'bg-indigo-600', label: 'Índigo Moderno', class: 'bg-indigo-600 text-white' },
  { id: 'bg-purple-600', label: 'Púrpura Gestão', class: 'bg-purple-600 text-white' },
];

export const HeaderConfigModal: React.FC<HeaderConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}) => {
  const [title, setTitle] = useState(currentConfig.title);
  const [document, setDocument] = useState(currentConfig.document || '');
  const [segment, setSegment] = useState(currentConfig.segment || '');
  const [subtitle, setSubtitle] = useState(currentConfig.subtitle || '');
  const [address, setAddress] = useState(currentConfig.address || '');
  const [contactEmail, setContactEmail] = useState(currentConfig.contactEmail || '');
  const [phone, setPhone] = useState(currentConfig.phone || '');

  const [logoType, setLogoType] = useState<'icon' | 'image'>(currentConfig.logoType);
  const [logoIcon, setLogoIcon] = useState(currentConfig.logoIcon);
  const [logoColor, setLogoColor] = useState(currentConfig.logoColor);
  const [logoImageUrl, setLogoImageUrl] = useState(currentConfig.logoImageUrl || '');
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [inputUrlMode, setInputUrlMode] = useState(false);
  const [previewTab, setPreviewTab] = useState<'navbar' | 'report'>('report');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state whenever modal opens with fresh currentConfig
  useEffect(() => {
    if (isOpen) {
      setTitle(currentConfig.title);
      setDocument(currentConfig.document || '');
      setSegment(currentConfig.segment || '');
      setSubtitle(currentConfig.subtitle || '');
      setAddress(currentConfig.address || '');
      setContactEmail(currentConfig.contactEmail || '');
      setPhone(currentConfig.phone || '');
      setLogoType(currentConfig.logoType);
      setLogoIcon(currentConfig.logoIcon);
      setLogoColor(currentConfig.logoColor);
      setLogoImageUrl(currentConfig.logoImageUrl || '');
      setImageUploadError(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setImageUploadError('A imagem deve ter no máximo 2.5 MB.');
      return;
    }

    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoImageUrl(dataUrl);
      setLogoType('image');
    };
    reader.onerror = () => {
      setImageUploadError('Erro ao carregar imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setLogoImageUrl('');
    setLogoType('icon');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    setTitle(DEFAULT_HEADER_CONFIG.title);
    setDocument(DEFAULT_HEADER_CONFIG.document || '');
    setSegment(DEFAULT_HEADER_CONFIG.segment || '');
    setSubtitle(DEFAULT_HEADER_CONFIG.subtitle || '');
    setAddress(DEFAULT_HEADER_CONFIG.address || '');
    setContactEmail(DEFAULT_HEADER_CONFIG.contactEmail || '');
    setPhone(DEFAULT_HEADER_CONFIG.phone || '');
    setLogoType(DEFAULT_HEADER_CONFIG.logoType);
    setLogoIcon(DEFAULT_HEADER_CONFIG.logoIcon);
    setLogoColor(DEFAULT_HEADER_CONFIG.logoColor);
    setLogoImageUrl('');
    setImageUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalConfig: HeaderConfig = {
      title: title.trim() || 'SafeGuard EPI',
      document: document.trim() || undefined,
      segment: segment.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      address: address.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      phone: phone.trim() || undefined,
      logoType: logoType === 'image' && logoImageUrl ? 'image' : 'icon',
      logoIcon,
      logoColor,
      logoImageUrl: logoImageUrl.trim() || undefined,
    };
    onSave(finalConfig);
    onClose();
  };

  const SelectedIconComp = HEADER_ICONS_MAP[logoIcon] || ShieldCheck;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-semibold border border-amber-500/20 shrink-0">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Editar Cabeçalho da Empresa & Relatórios
              </h2>
              <p className="text-xs text-slate-500">
                Configure os dados da sua empresa que aparecem no sistema, fichas individuais de EPI (NR-6) e relatórios de auditoria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
          {/* Live Preview Box with Viewport Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>Prévia em Tempo Real</span>
              </span>

              {/* View Switcher: Navbar vs Relatório */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('report')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                    previewTab === 'report'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Nos Relatórios / Ficha NR-6
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('navbar')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                    previewTab === 'navbar'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Na Barra Superior (App)
                </button>
              </div>
            </div>

            {/* PREVIEW: OFFICIAL REPORT HEADER */}
            {previewTab === 'report' ? (
              <div className="p-4 bg-white rounded-xl border-2 border-slate-300 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    {logoType === 'image' && logoImageUrl ? (
                      <img
                        src={logoImageUrl}
                        alt="Logo Prévia"
                        className="h-10 max-w-[120px] object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                        <SelectedIconComp className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        {title.trim() || 'NOME DA SUA EMPRESA'}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {subtitle.trim() || 'Departamento de Segurança e Medicina do Trabalho (SESMT)'}
                        {document.trim() && (
                          <span className="font-semibold text-slate-800 ml-1">
                            • CNPJ: {document.trim()}
                          </span>
                        )}
                      </p>
                      {(address.trim() || phone.trim() || contactEmail.trim()) && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {[address.trim(), phone.trim(), contactEmail.trim()].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold font-mono bg-slate-100 border border-slate-300 rounded text-slate-800">
                      FICHA OFICIAL NR-6
                    </span>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">
                      Portaria MTP 2.175/2022
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 italic flex items-center justify-between">
                  <span>Este modelo de cabeçalho será impresso em todas as Fichas de EPI e relatórios técnicos.</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Aplicado automaticamente
                  </span>
                </div>
              </div>
            ) : (
              /* PREVIEW: NAVBAR APP */
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-inner flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {logoType === 'image' && logoImageUrl ? (
                    <div className="h-10 px-2 py-1 bg-white rounded-lg flex items-center justify-center shadow-xs border border-slate-200/40 shrink-0">
                      <img
                        src={logoImageUrl}
                        alt="Logo Prévia"
                        className="h-8 max-w-[130px] object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-xl ${logoColor} flex items-center justify-center font-bold shadow-md transition-all shrink-0`}
                    >
                      <SelectedIconComp className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{title.trim() || 'SafeGuard EPI'}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        SST
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                      {subtitle.trim() || 'Gestão NR-6 & SST'}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 border border-slate-800 rounded-lg px-2.5 py-1 bg-slate-950/60 font-mono">
                  Portaria MTP 2.175/2022
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: DADOS DA EMPRESA E RELATÓRIO */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" />
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Dados da Empresa e Identificação Oficial
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social / Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Construtora Horizonte Sul S/A"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CNPJ / Inscrição da Empresa
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="Ex: 12.345.678/0001-90"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ramo / Segmento de Atuação
                </label>
                <input
                  type="text"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  placeholder="Ex: Construção Civil, Metalúrgica, Logística"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtítulo / Departamento / Unidade
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: SESMT & Gestão NR-6 — Unidade 01"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço / Unidade (Opcional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rodovia BR-101, Km 42 - SP"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail do SESMT / Contato
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="sesmt@empresa.com.br"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / Ramal
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 3456-7890"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: FORMATO DO LOGOTIPO */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Logotipo da Empresa
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setLogoType('image')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  logoType === 'image'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Upload de Imagem / Logo</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoType('icon')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  logoType === 'icon'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Emblema / Ícone SST</span>
              </button>
            </div>
          </div>

          {/* TAB 1: IMAGE LOGO UPLOAD */}
          {logoType === 'image' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Arquivo da Logomarca da Empresa
                </span>
                <button
                  type="button"
                  onClick={() => setInputUrlMode(!inputUrlMode)}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{inputUrlMode ? 'Fazer Upload de Arquivo' : 'Ou inserir link (URL)'}</span>
                </button>
              </div>

              {!inputUrlMode ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    id="header-logo-upload"
                  />
                  <label
                    htmlFor="header-logo-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/30 rounded-xl p-5 text-center cursor-pointer transition-all group"
                  >
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-amber-600 mb-2 transition-colors" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">
                      Clique para escolher o logotipo no computador
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Formatos suportados: PNG, JPG, SVG, WebP (Máx: 2.5 MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    URL direta da imagem:
                  </label>
                  <input
                    type="url"
                    value={logoImageUrl}
                    onChange={(e) => setLogoImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/logotipo-empresa.png"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {imageUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageUploadError}</span>
                </div>
              )}

              {logoImageUrl && (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoImageUrl}
                      alt="Logo carregada"
                      className="h-10 w-24 object-contain bg-slate-50 p-1 rounded border border-slate-200"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Logotipo carregado
                      </span>
                      <span className="text-[10px] text-slate-400">Pronto para salvar</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRESET SST ICONS */}
          {logoType === 'icon' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-2">
                  Escolha o Ícone SST / Operacional:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(HEADER_ICONS_MAP).map(([name, IconComponent]) => {
                    const isSelected = logoIcon === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setLogoIcon(name)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-[10px] truncate max-w-full font-mono">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-2">
                  Cor de Fundo do Emblema:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((col) => {
                    const isSelected = logoColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setLogoColor(col.id)}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-white ring-2 ring-amber-500/50 shadow-xs font-bold text-slate-950'
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${col.id} shrink-0 border border-black/10`} />
                        <span className="truncate text-[11px]">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500/30 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Cabeçalho</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

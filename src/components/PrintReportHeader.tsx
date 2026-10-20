import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { CURRENT_DATE_STR, StorageService } from '../services/storage';

interface PrintReportHeaderProps {
  title: string;
  subtitle?: string;
  reportCode?: string;
}

export const PrintReportHeader: React.FC<PrintReportHeaderProps> = ({
  title,
  subtitle = 'Sistema Informatizado de Gestão de EPI em conformidade com a NR-6 (Portaria MTP nº 2.175/2022)',
  reportCode,
}) => {
  const headerConfig = StorageService.getHeaderConfig();
  const companyName = headerConfig.title || 'SafeGuard EPI';
  const companyDocument = headerConfig.document;
  const companyContact = [headerConfig.address, headerConfig.phone, headerConfig.contactEmail].filter(Boolean).join(' • ');

  return (
    <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-xs text-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {headerConfig.logoType === 'image' && headerConfig.logoImageUrl ? (
            <img
              src={headerConfig.logoImageUrl}
              alt="Logo"
              className="h-10 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className={`w-9 h-9 rounded-lg ${headerConfig.logoColor || 'bg-slate-900'} text-white flex items-center justify-center font-bold`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 uppercase">
                {companyName}
              </h1>
              {companyDocument && (
                <span className="text-[11px] font-mono font-semibold text-slate-700">
                  (CNPJ: {companyDocument})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600">
              {headerConfig.subtitle || 'SESMT — Serviço Especializado em Engenharia de Segurança e Medicina do Trabalho'}
            </p>
            {companyContact ? (
              <p className="text-[10px] text-slate-500 font-mono">
                {companyContact}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 font-mono">
                Sistema de Gestão de EPIs · Norma Regulamentadora nº 6 (Portaria MTP nº 2.175/2022)
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-2 py-0.5 font-bold font-mono bg-slate-100 border border-slate-300 rounded text-[11px]">
            {reportCode ?? `REL-SST-${CURRENT_DATE_STR.replace(/-/g, '')}`}
          </span>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Data de Emissão: {CURRENT_DATE_STR}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-end">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase">{title}</h2>
          <p className="text-[11px] text-slate-600">{subtitle}</p>
        </div>
        <div className="text-[10px] text-slate-500 font-mono italic">
          Documento para Arquivo Físico e Fiscalização do Trabalho
        </div>
      </div>
    </div>
  );
};

export const PrintReportFooter: React.FC = () => {
  return (
    <div className="hidden print:block mt-8 pt-6 border-t border-slate-400 text-xs text-slate-700">
      <p className="text-[10px] text-slate-500 text-justify mb-8 leading-relaxed font-sans">
        Declaro, para os devidos fins de direito e fiscalização das autoridades trabalhistas e sanitárias,
        que os dados constantes deste relatório conferem com os lançamentos efetuados no sistema informatizado
        de controle, com comprovação eletrônica de entrega, biometria facial, geolocalização e guarda de EPIs conforme os subitens 6.5.1 e 6.6.1 da Norma Regulamentadora nº 6.
      </p>

      <div className="grid grid-cols-2 gap-12 text-center text-xs">
        <div className="border-t border-slate-900 pt-1.5">
          <strong className="block text-slate-900">Responsável Técnico / SESMT</strong>
          <span className="text-[10px] text-slate-500">
            Segurança e Medicina do Trabalho
          </span>
        </div>
        <div className="border-t border-slate-900 pt-1.5">
          <strong className="block text-slate-900">Gestor do Almoxarifado / EPI</strong>
          <span className="text-[10px] text-slate-500">
            Controle e Distribuição de Equipamentos
          </span>
        </div>
      </div>
    </div>
  );
};

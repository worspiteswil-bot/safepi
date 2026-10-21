import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode } from 'lucide-react';
import { CURRENT_DATE_STR, StorageService } from '../services/storage';
import { generateQRCodeDataUrl } from '../utils/qrCodeGenerator';

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

  const finalCode = reportCode ?? `REL-SST-${CURRENT_DATE_STR.replace(/-/g, '')}`;
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const url = StorageService.buildDocumentVerificationUrl(finalCode, 'relatorio', headerConfig?.document);
    generateQRCodeDataUrl(url, 100).then((dataUrl) => {
      setQrCodeUrl(dataUrl);
    });
  }, [finalCode, headerConfig?.document]);

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

        {/* QR Code and Document Code */}
        <div className="flex items-center gap-2.5 text-right">
          {qrCodeUrl && (
            <div className="flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="QR Code de Validação"
                className="w-12 h-12 border border-slate-300 rounded p-0.5 bg-white"
              />
              <span className="text-[7px] font-mono font-bold text-slate-600 uppercase mt-0.5">
                Doc Original
              </span>
            </div>
          )}
          <div>
            <span className="inline-block px-2 py-0.5 font-bold font-mono bg-slate-100 border border-slate-300 rounded text-[11px]">
              {finalCode}
            </span>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Data de Emissão: {CURRENT_DATE_STR}
            </p>
            <p className="text-[8px] text-emerald-800 font-mono font-semibold">
              ✓ Autenticidade NR-6
            </p>
          </div>
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
  const finalCode = `DOC-SST-${CURRENT_DATE_STR.replace(/-/g, '')}`;
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const url = StorageService.buildDocumentVerificationUrl(finalCode, 'relatorio');
    generateQRCodeDataUrl(url, 100).then((dataUrl) => {
      setQrCodeUrl(dataUrl);
    });
  }, [finalCode]);

  return (
    <div className="hidden print:block mt-8 pt-6 border-t border-slate-400 text-xs text-slate-700">
      {/* Official QR Code Legal Validation Banner in Physical Printout */}
      <div className="mb-6 p-2.5 bg-slate-50 border border-slate-300 rounded flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-12 h-12 border border-slate-300 rounded bg-white p-0.5 shrink-0"
            />
          )}
          <div className="text-[10px] space-y-0.5">
            <strong className="block text-slate-900 uppercase tracking-tight">
              Autenticidade e Fé Pública do Documento Original (Portaria MTP nº 2.175/2022 / NR-6)
            </strong>
            <p className="text-slate-600">
              Aponte a câmera do celular para o QR Code acima para validar o registro digital original, biometrias e histórico criptográfico.
            </p>
          </div>
        </div>
        <div className="text-right text-[9px] font-mono text-slate-500 shrink-0">
          <div>Certificação Digital SST</div>
          <div className="font-bold text-slate-700">Evento S-2240 eSocial</div>
        </div>
      </div>

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
          <strong className="block text-slate-900">Empregador / Representante Legal</strong>
          <span className="text-[10px] text-slate-500">
            Diretoria Operacional
          </span>
        </div>
      </div>

      <div className="mt-6 text-center text-[9px] text-slate-400 font-mono">
        Emissão do sistema SafeEPI Pro • Hash de Autenticidade Registrado • Página 1 de 1
      </div>
    </div>
  );
};

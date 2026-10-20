import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

export interface NR6Tip {
  id: number;
  itemNR: string;
  category: string;
  title: string;
  description: string;
  practicalAction: string;
  importance: 'alta' | 'obrigatoria';
}

export const NR6_SAFETY_TIPS: NR6Tip[] = [
  {
    id: 1,
    itemNR: 'NR-6 • Item 6.5.1',
    category: 'Obrigações da Empresa',
    title: 'Fornecimento Gratuito e Adequado aos Riscos',
    description:
      'A empresa é obrigada a fornecer aos empregados, gratuitamente, EPI adequado ao risco, em perfeito estado de conservação e funcionamento, sempre que as medidas de proteção coletiva não forem viáveis ou suficientes.',
    practicalAction:
      'Nunca desconte valores de EPI do salário do trabalhador e certifique-se de que o equipamento atende rigorosamente aos riscos previstos no PGR da empresa.',
    importance: 'obrigatoria',
  },
  {
    id: 2,
    itemNR: 'NR-6 • Item 6.6.1',
    category: 'Conformidade Jurídica & eSocial',
    title: 'Registro Formal com Validação Biométrica',
    description:
      'O fornecimento de EPI deve ser formalmente registrado em livro, ficha ou sistema eletrônico seguro. A biometria facial com carimbo de geolocalização e data/hora tem plena validade perante fiscalizações do MTE e evento S-2240.',
    practicalAction:
      'Audite periodicamente os termos de entrega para garantir que 100% dos empregados tenham comprovante formal assinado antes de assumir suas frentes de trabalho.',
    importance: 'obrigatoria',
  },
  {
    id: 3,
    itemNR: 'NR-6 • Item 6.5.1 "d"',
    category: 'Certificado de Aprovação (C.A.)',
    title: 'Validade do C.A. na Compra vs. no Fornecimento',
    description:
      'É proibido adquirir e fornecer EPI com C.A. vencido. Porém, entregue dentro da vigência do C.A., o trabalhador pode continuar utilizando-o até o fim da vida útil do produto, desde que mantidas as características de proteção.',
    practicalAction:
      'Sempre confira a data de vigência do C.A. no sistema do MTE (CAEPI) antes de aceitar remessas e registrar a entrada fiscal no almoxarifado.',
    importance: 'alta',
  },
  {
    id: 4,
    itemNR: 'NR-6 • Item 6.5.1 "e"',
    category: 'Higienização & Manutenção',
    title: 'Higienização e Conservação pelo Empregador',
    description:
      'A higienização e a manutenção periódica do EPI são responsabilidades legais da empresa, devendo ser executadas de acordo com as instruções do fabricante ou por lavanderias industriais credenciadas.',
    practicalAction:
      'Estabeleça cronogramas de limpeza para protetores auditivos tipo concha, capacetes e respiradores reutilizáveis para evitar contaminações e perdas auditivas.',
    importance: 'alta',
  },
  {
    id: 5,
    itemNR: 'NR-6 • Item 6.7.1 "a"',
    category: 'Deveres do Trabalhador',
    title: 'Uso Exclusivo para a Finalidade Prevista',
    description:
      'O trabalhador tem o dever de usar o EPI fornecido apenas para a finalidade a que se destina, durante toda a jornada nas áreas onde houver risco identificado.',
    practicalAction:
      'Aborde nos Diálogos Diários de Segurança (DDS) que a recusa injustificada ao uso constitui ato faltoso passível de advertência e justa causa (art. 482 da CLT).',
    importance: 'obrigatoria',
  },
  {
    id: 6,
    itemNR: 'NR-6 • Item 6.7.1 "b"',
    category: 'Comunicação de Avarias',
    title: 'Comunicação Imediata de Extravios ou Danos',
    description:
      'Cabe ao empregado comunicar imediatamente à chefia ou ao SESMT qualquer desgaste, trinca ou perda que torne o EPI impróprio para uso.',
    practicalAction:
      'Mantenha o almoxarifado ágil: o colaborador deve ter segurança de solicitar substituição imediata de item danificado sem burocracia ou constrangimento.',
    importance: 'alta',
  },
  {
    id: 7,
    itemNR: 'NR-6 • Item 6.5.1 "g"',
    category: 'Capacitação & Treinamento',
    title: 'Treinamento Obrigatório sobre Ajuste e Guarda',
    description:
      'O empregador deve orientar e treinar o trabalhador sobre o ajuste correto, guarda e conservação do EPI antes da entrega inicial ou quando houver mudança de modelo.',
    practicalAction:
      'Colete e arquive a ata com lista de presença do treinamento de colocação do EPI para comprovação em perícias trabalhistas e previdenciárias.',
    importance: 'obrigatoria',
  },
  {
    id: 8,
    itemNR: 'NR-6 • Item 6.5.1 "f"',
    category: 'Gestão de Almoxarifado',
    title: 'Substituição Imediata de Itens com Vida Útil Vencida',
    description:
      'A substituição do equipamento deve ser realizada de imediato quando danificado, extraviado ou após o término do período de validade/vida útil estabelecido pelo fabricante.',
    practicalAction:
      'Acompanhe o módulo de Alertas do SafeGuard EPI para programar a troca periódica antes que o empregado trabalhe desprotegido.',
    importance: 'obrigatoria',
  },
  {
    id: 9,
    itemNR: 'NR-6 • Item 6.8.1',
    category: 'Rastreabilidade de Fabricação',
    title: 'Marcação Indelével de C.A. e Lote na Peça',
    description:
      'Todo EPI entregue deve conter em caracteres indeléveis e bem visíveis: o nome comercial do fabricante, o lote de fabricação e o número do Certificado de Aprovação (C.A.).',
    practicalAction:
      'Ao receber mercadorias no almoxarifado, recuse lotes onde a numeração do C.A. esteja ilegível ou apagável.',
    importance: 'alta',
  },
  {
    id: 10,
    itemNR: 'NR-6 • Item 6.9.1',
    category: 'Inclusão & Ergonomia',
    title: 'Adaptação de EPIs para Trabalhadores com Deficiência (PcD)',
    description:
      'A organização deve disponibilizar EPI adaptado às características antropométricas de trabalhadores com deficiência, garantindo proteção sem gerar novos riscos.',
    practicalAction:
      'Consulte a equipe médica do trabalho e os fornecedores para ajustes ergonômicos de calçados, luvas e tirantes especiais.',
    importance: 'alta',
  },
  {
    id: 11,
    itemNR: 'Portaria MTP 2.175/2022',
    category: 'Guarda Documental',
    title: 'Guarda dos Registros por no Mínimo 20 Anos',
    description:
      'Os comprovantes de entrega de EPIs subsidiam o Perfil Profissiográfico Previdenciário (PPP) e devem ser conservados por no mínimo 20 anos para fins de fiscalização e aposentadoria especial.',
    practicalAction:
      'Utilize os recursos de exportação CSV e relatório pericial em PDF para manter cópias físicas e digitais de segurança anualmente.',
    importance: 'obrigatoria',
  },
  {
    id: 12,
    itemNR: 'NR-6 • Item 6.5.1 "h"',
    category: 'Engenharia de Segurança',
    title: 'Prioridade das Medidas de Proteção Coletiva (EPC)',
    description:
      'O EPI é uma medida de proteção complementar e de mitigação. A empresa deve priorizar sempre as medidas de proteção coletiva (EPC) na fonte geradora de risco antes de definir o EPI.',
    practicalAction:
      'Documente no PGR as razões técnicas que justifiquem o uso do EPI enquanto medidas de controle na fonte estiverem em fase de implantação.',
    importance: 'alta',
  },
];

export const NR6SafetyTipsCard: React.FC = () => {
  // Random tip initialized on every page reload / component mount
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    return Math.floor(Math.random() * NR6_SAFETY_TIPS.length);
  });
  const [isRotating, setIsRotating] = useState(false);

  const currentTip = NR6_SAFETY_TIPS[currentIndex];

  const handleNextTip = () => {
    setIsRotating(true);
    setCurrentIndex((prev) => (prev + 1) % NR6_SAFETY_TIPS.length);
    setTimeout(() => setIsRotating(false), 300);
  };

  const handleRandomTip = () => {
    setIsRotating(true);
    let next = Math.floor(Math.random() * NR6_SAFETY_TIPS.length);
    if (next === currentIndex && NR6_SAFETY_TIPS.length > 1) {
      next = (next + 1) % NR6_SAFETY_TIPS.length;
    }
    setCurrentIndex(next);
    setTimeout(() => setIsRotating(false), 300);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Cultura de Segurança NR-6
              </h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                Dica Rápida
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Norma Regulamentadora nº 6 (Portaria MTP 2.175/2022)
            </p>
          </div>
        </div>

        {/* Shuffle / Next Tip Button */}
        <button
          onClick={handleRandomTip}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-all flex items-center gap-1 text-xs shrink-0"
          title="Sortear outra dica da NR-6"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 transition-transform duration-300 ${isRotating ? 'rotate-180 text-amber-400' : ''}`}
          />
          <span className="hidden sm:inline text-[11px]">Nova Dica</span>
        </button>
      </div>

      {/* Tip Content */}
      <div className="py-3.5 space-y-3">
        {/* Category & Legal Reference */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            {currentTip.itemNR}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {currentTip.category}
          </span>
        </div>

        {/* Tip Title */}
        <h4 className="text-sm font-semibold text-white leading-snug">
          {currentTip.title}
        </h4>

        {/* Tip Body Text */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {currentTip.description}
        </p>

        {/* Actionable Practical Tip for SESMT */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aplicação Prática no SESMT:</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-normal pl-5">
            {currentTip.practicalAction}
          </p>
        </div>
      </div>

      {/* Footer / Pagination dots */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono text-slate-500 text-[10px]">
          Dica {currentIndex + 1} de {NR6_SAFETY_TIPS.length} • Atualizada a cada visita
        </span>

        <button
          onClick={handleNextTip}
          className="text-amber-400 hover:text-amber-300 font-medium text-[11px] flex items-center gap-1 transition-colors"
        >
          <span>Próxima</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

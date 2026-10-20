import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Building,
  UserCheck,
  ArrowRight,
  Shield,
  Briefcase,
  Users,
} from 'lucide-react';
import { AuthService, SystemUser } from '../services/authService';

interface LoginViewProps {
  onLoginSuccess: (user: SystemUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const existingUsers = AuthService.getUsers();
  const hasNoUsers = existingUsers.length === 0;

  const [mode, setMode] = useState<'login' | 'register'>(hasNoUsers ? 'register' : 'login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register form state (Empresa + Login Principal)
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [companySegment, setCompanySegment] = useState('Construção Civil & Engenharia');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('Gestor de SST / Almoxarifado');
  const [regNumber, setRegNumber] = useState('');
  const [regDepartment, setRegDepartment] = useState('SESMT');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = AuthService.login(loginIdentifier, loginPassword);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(
          res.error || 'Credenciais inválidas. Verifique os dados digitados ou crie uma nova empresa.'
        );
      }
    }, 250);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = AuthService.registerCompanyAndPrincipal({
        companyName,
        companyDocument,
        companySegment,
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        registrationNumber: regNumber,
        department: regDepartment,
      });
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Erro ao realizar cadastro da empresa e login principal.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 mb-3 ring-4 ring-amber-500/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          SafeGuard <span className="text-amber-400">EPI</span>
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Sistema Multi-Empresas de Gestão de Estoque, Almoxarifado e Fichas Eletrônicas de EPI (NR-6)
        </p>
      </div>

      {/* Card Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-5">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acessar Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Nova Empresa
            </button>
          </div>

          {/* First-time welcoming alert if no users exist */}
          {hasNoUsers && mode === 'login' && (
            <div className="p-3 bg-blue-950/60 border border-blue-800/80 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
              <Building className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-blue-300">Nenhum login cadastrado ainda</strong>
                <span>
                  Todos os logins anteriores foram redefinidos. Comece clicando na aba{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-bold underline text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    Criar Nova Empresa
                  </button>{' '}
                  para criar seu ambiente isolado e login principal.
                </span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail ou Usuário de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Deseja cadastrar uma nova empresa? <strong className="text-amber-400">Clique aqui</strong>
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER FORM (EMPRESA + LOGIN PRINCIPAL) */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* SECTION: EMPRESA */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 border-b border-slate-800 pb-1.5">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>1. Dados da Sua Empresa (Ambiente Independente)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome da Empresa / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Construtora Horizonte Ltda"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        CNPJ
                      </label>
                      <span className="text-[10px] text-slate-400">Opcional</span>
                    </div>
                    <input
                      type="text"
                      value={companyDocument}
                      onChange={(e) => setCompanyDocument(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Ramo / Segmento
                    </label>
                    <select
                      value={companySegment}
                      onChange={(e) => setCompanySegment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Construção Civil & Engenharia">Construção Civil & Engenharia</option>
                      <option value="Indústria Metalúrgica & Manufatura">Indústria & Manufatura</option>
                      <option value="Logística, Armazenamento & Transportes">Logística & Transportes</option>
                      <option value="Saúde & Hospitais">Saúde & Hospitalar</option>
                      <option value="Agronegócio & Alimentos">Agronegócio & Campo</option>
                      <option value="Prestação de Serviços Gerais">Serviços Gerais</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: LOGIN PRINCIPAL */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 border-b border-slate-800 pb-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>2. Login Principal (Administrador / Gestor SST)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Completo do Responsável *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silveira"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail de Acesso (Login Principal) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="carlos@empresa.com.br"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      placeholder="Gestor de SST / Almoxarifado"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Registro Profissional
                      </label>
                      <span className="text-[10px] text-slate-400">Opcional</span>
                    </div>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="Opcional — CREA ou MTE"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Confirme a senha"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative footer */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 flex items-start gap-2">
                <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Após cadastrar sua empresa, você poderá adicionar <strong>logins de colaboradores</strong> diretamente
                  no menu da empresa, permitindo que sua equipe opere os mesmos dados de estoque e entregas compartilhados.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Cadastrar Empresa e Acessar</span>
              </button>
            </form>
          )}
        </div>

        {/* Security & Compliance Footer Note */}
        <div className="mt-6 text-center space-y-1 text-slate-500 text-[11px]">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Tenant Seguro • Dados Isolados por Empresa • NR-6 (Portaria MTP 2.175/2022)</span>
          </p>
        </div>
      </div>
    </div>
  );
};

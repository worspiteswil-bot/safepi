import React, { useState } from 'react';
import { AuthService, SystemUser } from '../services/authService';
import { Collaborator } from '../types/epi';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  Building,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  UserCheck,
  Shield,
  Briefcase,
  Copy,
} from 'lucide-react';

interface CompanyTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser;
  collaboratorsList: Collaborator[];
  onShowToast: (msg: string) => void;
}

export const CompanyTeamModal: React.FC<CompanyTeamModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  collaboratorsList,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [users, setUsers] = useState<SystemUser[]>(() =>
    AuthService.getCompanyUsers(currentUser.companyId)
  );

  // New collaborator login form state
  const [colabName, setColabName] = useState('');
  const [colabEmail, setColabEmail] = useState('');
  const [colabPassword, setColabPassword] = useState('');
  const [colabRole, setColabRole] = useState('Almoxarife de EPI');
  const [colabDept, setColabDept] = useState('Almoxarifado');
  const [colabReg, setColabReg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSuccessCreds, setCreatedSuccessCreds] = useState<{
    name: string;
    email: string;
    pass: string;
  } | null>(null);

  if (!isOpen) return null;

  const refreshUsers = () => {
    setUsers(AuthService.getCompanyUsers(currentUser.companyId));
  };

  const handleSelectFromWorkerList = (workerId: string) => {
    if (!workerId) return;
    const worker = collaboratorsList.find((w) => w.id === workerId);
    if (worker) {
      setColabName(worker.name);
      setColabEmail(
        worker.email ||
          `${worker.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${currentUser.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      );
      setColabDept(worker.department || 'Operações');
      setColabRole(`Operador / ${worker.role}`);
    }
  };

  const handleCreateCollaboratorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = AuthService.createCollaboratorUser(currentUser, {
      name: colabName,
      email: colabEmail,
      password: colabPassword,
      role: colabRole,
      department: colabDept,
      registrationNumber: colabReg,
    });

    if (res.success && res.user) {
      setCreatedSuccessCreds({
        name: colabName,
        email: colabEmail,
        pass: colabPassword,
      });
      // Reset form
      setColabName('');
      setColabEmail('');
      setColabPassword('');
      setColabReg('');
      refreshUsers();
      onShowToast(`Login de colaborador criado para ${res.user.name}!`);
    } else {
      setErrorMessage(res.error || 'Erro ao criar login de colaborador.');
    }
  };

  const handleDeleteUser = (userToDelete: SystemUser) => {
    if (userToDelete.userType === 'principal') {
      alert('Não é possível excluir o login principal da empresa.');
      return;
    }

    if (
      window.confirm(
        `Deseja realmente revogar o acesso do colaborador ${userToDelete.name} (${userToDelete.email})?`
      )
    ) {
      const res = AuthService.deleteCollaboratorUser(userToDelete.id, currentUser);
      if (res.success) {
        refreshUsers();
        onShowToast(`Acesso de ${userToDelete.name} removido com sucesso.`);
      } else {
        alert(res.error || 'Erro ao remover colaborador.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{currentUser.companyName}</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Dados Compartilhados
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gerenciamento de acessos e logins de colaboradores da empresa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative banner */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 py-2.5 text-xs text-amber-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Cada login colaborador criado aqui acessa exatamente a <strong>mesma base de dados</strong> (EPIs,
            movimentações e colaboradores) do login principal, permitindo operação conjunta em tempo real.
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setCreatedSuccessCreds(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-amber-500 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Logins da Empresa ({users.length})</span>
          </button>
          {currentUser.userType === 'principal' && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('add');
                setCreatedSuccessCreds(null);
                setErrorMessage(null);
              }}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'border-amber-500 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Novo Login Colaborador</span>
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Usuários que possuem acesso a esta empresa:</span>
                {currentUser.userType === 'principal' && (
                  <button
                    onClick={() => setActiveTab('add')}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Adicionar colaborador</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {users.map((usr) => (
                  <div
                    key={usr.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${usr.avatarColor || 'bg-amber-600'} text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}
                      >
                        {usr.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{usr.name}</span>
                          {usr.userType === 'principal' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              Login Principal (Dono)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Colaborador (Compartilhado)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{usr.email}</span>
                          <span>&bull;</span>
                          <span>{usr.role}</span>
                          {usr.registrationNumber && (
                            <>
                              <span>&bull;</span>
                              <span>{usr.registrationNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {usr.id === currentUser.id && (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Você
                        </span>
                      )}

                      {currentUser.userType === 'principal' && usr.userType === 'colaborador' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(usr)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Revogar acesso do colaborador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <div>
              {createdSuccessCreds && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Login de Colaborador Criado com Sucesso!</span>
                  </div>
                  <p className="text-slate-700">
                    Compartilhe as credenciais abaixo com o colaborador para que ele possa acessar os dados da sua empresa:
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 font-mono space-y-1">
                    <div>
                      <strong className="text-slate-600 font-sans">E-mail: </strong>
                      <span className="text-slate-900">{createdSuccessCreds.email}</span>
                    </div>
                    <div>
                      <strong className="text-slate-600 font-sans">Senha: </strong>
                      <span className="text-slate-900">{createdSuccessCreds.pass}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Acesso SafeGuard EPI (${currentUser.companyName})\nE-mail: ${createdSuccessCreds.email}\nSenha: ${createdSuccessCreds.pass}`
                      );
                      onShowToast('Credenciais copiadas para a área de transferência!');
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5 cursor-pointer text-xs pt-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar dados de acesso</span>
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCreateCollaboratorSubmit} className="space-y-4 text-xs">
                {/* Optional prefill from workers list */}
                {collaboratorsList.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Vincular a um colaborador já cadastrado na empresa (opcional)
                    </label>
                    <select
                      onChange={(e) => handleSelectFromWorkerList(e.target.value)}
                      defaultValue=""
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="">Selecione para preencher automaticamente...</option>
                      {collaboratorsList.map((colab) => (
                        <option key={colab.id} value={colab.id}>
                          {colab.name} — Matrícula: {colab.registration} ({colab.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nome do Colaborador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={colabName}
                      onChange={(e) => setColabName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      E-mail de Acesso (Login) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="carlos@empresa.com.br"
                      value={colabEmail}
                      onChange={(e) => setColabEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Função / Perfil de Acesso
                    </label>
                    <select
                      value={colabRole}
                      onChange={(e) => setColabRole(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Almoxarife de EPI">Almoxarife (Entregas e Estoque)</option>
                      <option value="Técnico de Segurança do Trabalho">Técnico de SST</option>
                      <option value="Supervisor Operacional">Supervisor de Equipe</option>
                      <option value="Assistente de SESMT">Assistente Administrativo SST</option>
                      <option value="Auditor / Visualizador">Visualizador (Apenas Consulta)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Setor / Departamento
                    </label>
                    <input
                      type="text"
                      placeholder="Almoxarifado / SESMT"
                      value={colabDept}
                      onChange={(e) => setColabDept(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Senha de Acesso Provisória *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        placeholder="Mínimo 4 caracteres"
                        value={colabPassword}
                        onChange={(e) => setColabPassword(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        Registro Profissional
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Opcional (ex: Reg. MTE ou CREA)"
                      value={colabReg}
                      onChange={(e) => setColabReg(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Login Colaborador</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="font-mono text-[11px]">Empresa ID: {currentUser.companyId}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

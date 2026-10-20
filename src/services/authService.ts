/**
 * Authentication and Multi-Tenant Company Management Service for SafeGuard EPI
 * Allows each login to register an independent company (isolated data),
 * and allows the primary company account to create collaborator logins
 * who share the primary company's data.
 */

export interface Company {
  id: string;
  name: string;
  document?: string; // CNPJ ou inscrição
  segment?: string;
  createdAt: string;
  ownerId: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  registrationNumber?: string; // Opcional — NÃO é obrigatório possuir CREA ou MTE
  department: string;
  avatarColor: string;
  createdAt: string;
  userType: 'principal' | 'colaborador';
  companyId: string;
  companyName: string;
  principalUserId?: string; // ID do usuário principal caso seja colaborador
}

const STORAGE_KEYS = {
  USERS: 'safe_epi_users_v3',
  COMPANIES: 'safe_epi_companies_v3',
  SESSION: 'safe_epi_auth_session_v3',
  MIGRATION_FLAG: 'safe_epi_clean_logins_v3',
};

// Nenhum usuário de demonstração pré-carregado. Cada usuário cria sua empresa do zero.
export const INITIAL_SYSTEM_USERS: SystemUser[] = [];

export class AuthService {
  /**
   * Garante a exclusão de todos os logins legados na inicialização
   */
  static purgeLegacyLogins(): void {
    if (typeof localStorage === 'undefined') return;
    const isClean = localStorage.getItem(STORAGE_KEYS.MIGRATION_FLAG);
    if (!isClean) {
      localStorage.removeItem('safe_epi_users_v1');
      localStorage.removeItem('safe_epi_users_v2');
      localStorage.removeItem('safe_epi_auth_session');
      localStorage.removeItem('safe_epi_auth_session_v2');
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.COMPANIES);
      localStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, 'true');
    }
  }

  static getCompanies(): Company[] {
    try {
      this.purgeLegacyLogins();
      const data = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveCompanies(companies: Company[]): void {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  }

  static getCompany(companyId: string): Company | null {
    const list = this.getCompanies();
    return list.find((c) => c.id === companyId) || null;
  }

  static getUsers(): SystemUser[] {
    try {
      this.purgeLegacyLogins();
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveUsers(users: SystemUser[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getCurrentUser(): SystemUser | null {
    try {
      this.purgeLegacyLogins();
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!session) return null;
      return JSON.parse(session);
    } catch {
      return null;
    }
  }

  /**
   * Retorna todos os logins de colaboradores vinculados à empresa indicada
   */
  static getCollaboratorLogins(companyId: string): SystemUser[] {
    const all = this.getUsers();
    return all.filter((u) => u.companyId === companyId && u.userType === 'colaborador');
  }

  /**
   * Retorna todos os usuários (principal + colaboradores) de uma empresa
   */
  static getCompanyUsers(companyId: string): SystemUser[] {
    const all = this.getUsers();
    return all.filter((u) => u.companyId === companyId);
  }

  /**
   * Cadastro de nova empresa independente com seu respectivo Login Principal
   */
  static registerCompanyAndPrincipal(data: {
    companyName: string;
    companyDocument?: string;
    companySegment?: string;
    name: string;
    email: string;
    password: string;
    role: string;
    registrationNumber?: string;
    department?: string;
  }): { success: boolean; user?: SystemUser; error?: string } {
    const trimmedCompanyName = data.companyName.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedPass = data.password.trim();
    const trimmedName = data.name.trim();

    if (!trimmedCompanyName) {
      return { success: false, error: 'O nome da empresa é obrigatório.' };
    }
    if (!trimmedName) {
      return { success: false, error: 'O nome do responsável principal é obrigatório.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Informe um e-mail válido para acesso.' };
    }
    if (trimmedPass.length < 4) {
      return { success: false, error: 'A senha de acesso deve ter no mínimo 4 caracteres.' };
    }

    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'Já existe um login cadastrado com este e-mail.' };
    }

    const companyId = `comp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const userId = `usr-princ-${Date.now()}`;

    const newCompany: Company = {
      id: companyId,
      name: trimmedCompanyName,
      document: data.companyDocument?.trim() || undefined,
      segment: data.companySegment?.trim() || 'Indústria & Serviços',
      createdAt: new Date().toISOString(),
      ownerId: userId,
    };

    const colors = ['bg-amber-600', 'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-purple-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const principalUser: SystemUser = {
      id: userId,
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPass,
      role: data.role.trim() || 'Gestor de SST / Almoxarifado',
      registrationNumber: data.registrationNumber?.trim() || undefined,
      department: data.department?.trim() || 'SESMT',
      avatarColor: randomColor,
      createdAt: new Date().toISOString().split('T')[0],
      userType: 'principal',
      companyId: companyId,
      companyName: trimmedCompanyName,
    };

    // Salvar empresa e usuário
    const companies = this.getCompanies();
    this.saveCompanies([...companies, newCompany]);
    this.saveUsers([...users, principalUser]);

    // Inicializar configuração de cabeçalho da empresa
    const headerKey = `safe_epi_header_v3_${companyId}`;
    localStorage.setItem(
      headerKey,
      JSON.stringify({
        title: trimmedCompanyName,
        document: data.companyDocument?.trim() || '',
        segment: data.companySegment?.trim() || 'Indústria & Serviços',
        subtitle: `SESMT & Gestão NR-6 • ${data.companySegment?.trim() || 'Segurança do Trabalho'}`,
        logoType: 'icon',
        logoIcon: 'ShieldCheck',
        logoColor: 'bg-amber-500',
        logoImageUrl: '',
      })
    );

    // Salvar sessão ativa
    const sessionUser = { ...principalUser };
    delete sessionUser.password;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionUser));

    return { success: true, user: sessionUser };
  }

  /**
   * Criação de Login de Colaborador pela conta principal.
   * Esse colaborador terá acesso aos dados da empresa do login principal (dados compartilhados).
   */
  static createCollaboratorUser(
    principalUser: SystemUser,
    data: {
      name: string;
      email: string;
      password: string;
      role: string;
      registrationNumber?: string;
      department?: string;
    }
  ): { success: boolean; user?: SystemUser; error?: string } {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedPass = data.password.trim();

    if (!trimmedName) {
      return { success: false, error: 'O nome do colaborador é obrigatório.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Informe um e-mail válido para o colaborador.' };
    }
    if (trimmedPass.length < 4) {
      return { success: false, error: 'A senha provisória deve conter no mínimo 4 caracteres.' };
    }

    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'Já existe um login cadastrado com este e-mail no sistema.' };
    }

    const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-cyan-600', 'bg-slate-700'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCollaboratorUser: SystemUser = {
      id: `usr-colab-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPass,
      role: data.role.trim() || 'Almoxarife / Técnico de EPI',
      registrationNumber: data.registrationNumber?.trim() || undefined,
      department: data.department?.trim() || principalUser.department || 'Almoxarifado',
      avatarColor: randomColor,
      createdAt: new Date().toISOString().split('T')[0],
      userType: 'colaborador',
      companyId: principalUser.companyId,
      companyName: principalUser.companyName,
      principalUserId: principalUser.id,
    };

    this.saveUsers([...users, newCollaboratorUser]);

    const sessionUser = { ...newCollaboratorUser };
    delete sessionUser.password;
    return { success: true, user: sessionUser };
  }

  /**
   * Exclui um login de colaborador pertencente à empresa
   */
  static deleteCollaboratorUser(
    targetUserId: string,
    principalUser: SystemUser
  ): { success: boolean; error?: string } {
    const users = this.getUsers();
    const target = users.find((u) => u.id === targetUserId);

    if (!target) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (target.userType === 'principal') {
      return { success: false, error: 'Não é permitido excluir o usuário principal da empresa.' };
    }

    if (target.companyId !== principalUser.companyId) {
      return { success: false, error: 'Você não tem permissão para remover usuários de outra empresa.' };
    }

    const updated = users.filter((u) => u.id !== targetUserId);
    this.saveUsers(updated);
    return { success: true };
  }

  /**
   * Autenticação de qualquer login (seja login principal de empresa ou login de colaborador)
   */
  static login(
    emailOrName: string,
    passwordAttempt: string
  ): { success: boolean; user?: SystemUser; error?: string } {
    this.purgeLegacyLogins();
    const trimmedInput = emailOrName.trim().toLowerCase();
    const trimmedPassword = passwordAttempt.trim();

    if (!trimmedInput || !trimmedPassword) {
      return { success: false, error: 'Informe o e-mail cadastrado e a senha de acesso.' };
    }

    const users = this.getUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === trimmedInput ||
        u.name.toLowerCase() === trimmedInput ||
        (u.registrationNumber && u.registrationNumber.toLowerCase() === trimmedInput)
    );

    if (!found) {
      return {
        success: false,
        error: 'Login não encontrado. Verifique os dados ou crie uma nova conta com sua empresa.',
      };
    }

    if (found.password !== trimmedPassword) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    // Salvar sessão ativa
    const sessionUser = { ...found };
    delete sessionUser.password;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionUser));

    return { success: true, user: sessionUser };
  }

  static logout(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

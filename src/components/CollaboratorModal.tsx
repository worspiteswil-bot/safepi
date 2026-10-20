import React, { useState } from 'react';
import { Collaborator } from '../types/epi';
import { CURRENT_DATE_STR } from '../services/storage';
import { X, CheckCircle2, UserPlus } from 'lucide-react';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaboratorToEdit?: Collaborator | null;
  onSave: (collaborator: Collaborator) => void;
}

export const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaboratorToEdit,
  onSave,
}) => {
  const isEditing = Boolean(collaboratorToEdit);

  const [name, setName] = useState(collaboratorToEdit?.name ?? '');
  const [cpf, setCpf] = useState(collaboratorToEdit?.cpf ?? '');
  const [registration, setRegistration] = useState(
    collaboratorToEdit?.registration ?? `MAT-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [role, setRole] = useState(collaboratorToEdit?.role ?? '');
  const [department, setDepartment] = useState(collaboratorToEdit?.department ?? 'Operações');
  const [admissionDate, setAdmissionDate] = useState(
    collaboratorToEdit?.admissionDate ?? CURRENT_DATE_STR
  );
  const [status, setStatus] = useState<Collaborator['status']>(
    collaboratorToEdit?.status ?? 'ativo'
  );
  const [shift, setShift] = useState<Collaborator['shift']>(
    collaboratorToEdit?.shift ?? 'Manhã'
  );
  const [shoeSize, setShoeSize] = useState(collaboratorToEdit?.shoeSize ?? '41');
  const [gloveSize, setGloveSize] = useState(collaboratorToEdit?.gloveSize ?? 'M');
  const [uniformSize, setUniformSize] = useState(collaboratorToEdit?.uniformSize ?? 'G');
  const [phone, setPhone] = useState(collaboratorToEdit?.phone ?? '');
  const [email, setEmail] = useState(collaboratorToEdit?.email ?? '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved: Collaborator = {
      id: collaboratorToEdit?.id ?? `colab-${Date.now()}`,
      name: name.trim(),
      cpf: cpf.trim(),
      registration: registration.trim(),
      role: role.trim(),
      department: department.trim(),
      admissionDate,
      status,
      shift,
      shoeSize,
      gloveSize,
      uniformSize,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };
    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-semibold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? 'Editar Colaborador' : 'Cadastrar Colaborador'}
              </h2>
              <p className="text-xs text-slate-500">
                Cadastro de usuário para controle e Ficha de EPI NR-6
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              placeholder="Ex: João Carlos da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CPF *</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Matrícula Funcional *</label>
              <input
                type="text"
                required
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cargo / Função *</label>
              <input
                type="text"
                required
                placeholder="Ex: Eletricista, Soldador..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Setor / Departamento *</label>
              <input
                type="text"
                required
                placeholder="Ex: Manutenção, Produção..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data Admissão *</label>
              <input
                type="date"
                required
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Turno de Trabalho</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as Collaborator['shift'])}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Cadastral</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Collaborator['status'])}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="ativo">Ativo</option>
                <option value="afastado">Afastado / INSS</option>
                <option value="ferias">Férias</option>
                <option value="desligado">Desligado</option>
              </select>
            </div>
          </div>

          {/* Sizes specification */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="block font-semibold text-slate-700 mb-2">
              Medidas e Grades de EPI (Para Requisições Rápidas)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Calçado</label>
                <input
                  type="text"
                  placeholder="Ex: 41"
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Luvas</label>
                <input
                  type="text"
                  placeholder="Ex: M / G"
                  value={gloveSize}
                  onChange={(e) => setGloveSize(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Uniforme</label>
                <input
                  type="text"
                  placeholder="Ex: G / GG"
                  value={uniformSize}
                  onChange={(e) => setUniformSize(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEditing ? 'Atualizar Colaborador' : 'Salvar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import axios from 'axios';
import type {
  Family,
  Person,
  Transaction,
  TransactionType,
  FixedExpense,
  AuditLog,
  PersonReport,
  FamilyReport,
  AdminFamilyRow,
  AdminCredentials,
  MonthOption,
} from './types';

// Em desenvolvimento aponta pro backend local. Em produção (Netlify/Render), defina a
// variável de ambiente VITE_API_BASE_URL com a URL da API já publicada (ex.: Render).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5276/api';

const http = axios.create({
  baseURL: API_BASE_URL,
});

// Extrai uma mensagem de erro legível das respostas de erro da API (BadRequest { message }).
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  return 'Ocorreu um erro inesperado.';
}

export const familyApi = {
  create: (name: string) =>
    http.post<Family>('/finance/family', { name }).then((r) => r.data),
};

export const personApi = {
  create: (input: { familyId: string; name: string; birthDate: string; isPrincipal: boolean }) =>
    http.post<Person>('/finance/person', input).then((r) => r.data),

  listByFamily: (familyId: string) =>
    http.get<Person[]>(`/finance/person/family/${familyId}`).then((r) => r.data),

  // Exige informar quem está executando a exclusão (fica registrado no log com nome e data).
  remove: (personId: string, deletedByPersonId: string) =>
    http.delete(`/finance/person/${personId}`, { data: { deletedByPersonId } }),
};

export const transactionApi = {
  create: (input: { personId: string; description: string; amount: number; type: TransactionType }) =>
    http
      .post<Transaction>('/finance/transaction', {
        ...input,
        // O back-end espera o enum como número: 0 = Income, 1 = Expense
        type: input.type === 'Income' ? 0 : 1,
      })
      .then((r) => r.data),

  update: (id: string, input: { description: string; amount: number; type: TransactionType }) =>
    http
      .put<Transaction>(`/finance/transaction/${id}`, {
        ...input,
        type: input.type === 'Income' ? 0 : 1,
      })
      .then((r) => r.data),

  remove: (id: string) => http.delete(`/finance/transaction/${id}`),
};

export const fixedExpenseApi = {
  create: (input: { familyId: string; description: string; amount: number }) =>
    http.post<FixedExpense>('/finance/fixed-expense', input).then((r) => r.data),

  listByFamily: (familyId: string) =>
    http.get<FixedExpense[]>(`/finance/fixed-expense/family/${familyId}`).then((r) => r.data),

  markAsPaid: (id: string) => http.put(`/finance/fixed-expense/${id}/pay`),

  remove: (id: string) => http.delete(`/finance/fixed-expense/${id}`),
};

export const auditLogApi = {
  listByFamily: (familyId: string) =>
    http.get<AuditLog[]>(`/finance/audit-log/family/${familyId}`).then((r) => r.data),
};

export const reportApi = {
  person: (personId: string, month?: MonthOption) =>
    http
      .get<PersonReport>(`/finance/report/person/${personId}`, {
        params: month ? { year: month.year, month: month.month } : undefined,
      })
      .then((r) => r.data),

  family: (familyId: string, month?: MonthOption) =>
    http
      .get<FamilyReport>(`/finance/report/family/${familyId}`, {
        params: month ? { year: month.year, month: month.month } : undefined,
      })
      .then((r) => r.data),

  // Meses/anos com movimentação, usada para popular a aba "Histórico".
  availableMonths: (familyId: string) =>
    http
      .get<MonthOption[]>(`/finance/report/family/${familyId}/available-months`)
      .then((r) => r.data),
};

export const authApi = {
  register: (input: { name: string; city: string; memberCount: number; username: string }) =>
    http
      .post<Family & { defaultPassword: string }>('/auth/register', input)
      .then((r) => r.data),

  login: (input: { username: string; password: string }) =>
    http.post<Family>('/auth/login', input).then((r) => r.data),

  changePassword: (input: { familyId: string; newPassword: string }) =>
    http.post('/auth/change-password', { familyId: input.familyId, newPassword: input.newPassword }),
};

function adminHeaders(creds: AdminCredentials) {
  return {
    headers: {
      'X-Admin-Username': creds.username,
      'X-Admin-Password': creds.password,
    },
  };
}

export const adminApi = {
  login: (creds: AdminCredentials) => http.post('/admin/login', creds).then((r) => r.data),

  listFamilies: (creds: AdminCredentials) =>
    http
      .get<{ totalFamilies: number; families: AdminFamilyRow[] }>('/admin/families', adminHeaders(creds))
      .then((r) => r.data),

  resetPassword: (familyId: string, creds: AdminCredentials) =>
    http.post(`/admin/families/${familyId}/reset-password`, {}, adminHeaders(creds)).then((r) => r.data),

  deleteFamily: (familyId: string, creds: AdminCredentials) =>
    http.delete(`/admin/families/${familyId}`, adminHeaders(creds)),
};
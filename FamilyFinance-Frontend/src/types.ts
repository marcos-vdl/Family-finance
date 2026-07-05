export interface Family {
  id: string;
  name: string;
  city?: string;
  memberCount?: number;
  username?: string;
  mustChangePassword?: boolean;
}

export interface AdminFamilyRow {
  id: string;
  name: string;
  city: string;
  memberCount: number;
  username: string;
  mustChangePassword: boolean;
  createdAt: string;
  registeredPeopleCount: number;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface Person {
  id: string;
  familyId: string;
  name: string;
  birthDate: string;
  isPrincipal: boolean;
  isUnderAge: boolean;
}

export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: string;
  personId: string;
  description: string;
  amount: number;
  type: TransactionType;
  createdAt: string;
}

export interface FixedExpense {
  id: string;
  familyId: string;
  description: string;
  amount: number;
  isPaid: boolean;
  createdAt: string;
  paidAt: string | null;
}

export interface AuditLog {
  id: string;
  familyId: string;
  principalPersonId: string;
  principalName: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface PersonReport {
  personId: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    createdAt: string;
  }[];
}

export interface FamilyReportMember {
  personId: string;
  name: string;
  totalIncome: number;
  totalExpense: number;
}

export interface FamilyReport {
  familyId: string;
  year?: number | null;
  month?: number | null;
  totalFamilyIncome: number;
  totalFixedExpenses?: number;
  totalFamilyExpense: number;
  familyBalance: number;
  members: FamilyReportMember[];
}

// Mês/ano disponível no histórico (usado na aba "Histórico").
export interface MonthOption {
  year: number;
  month: number;
}

export interface ApiError {
  message: string;
}

export interface FeeDueGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  courseEnrollmentId: number;
  courseName?: string;
  studentId: number;
  studentName?: string;
  parentName?: string;
  period: string; // ör. "2026-09"
  title: string; // ör. "Eylül 2026 Kurs Aidatı"
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: number; // 0: Ödenmedi, 1: Kısmi Ödendi, 2: Tam Ödendi
  description?: string;
  isActive?: boolean;
}

export interface FeeDueGetByIdDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  courseEnrollmentId: number;
  courseName?: string;
  studentId: number;
  studentName?: string;
  period: string;
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: number;
  description?: string;
  isActive?: boolean;
}

export interface CreateFeeDueCommand {
  tenantId?: number;
  courseEnrollmentId: number;
  studentId: number;
  period: string;
  title: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  dueDate: string;
  status?: number;
  description?: string;
}

export interface UpdateFeeDueCommand {
  id: number;
  tenantId?: number;
  courseEnrollmentId: number;
  studentId: number;
  period: string;
  title: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  dueDate: string;
  status?: number;
  description?: string;
}

export interface DeleteFeeDueCommand {
  id: number;
}

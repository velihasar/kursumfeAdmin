export interface PaymentGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  feeDueId?: number;
  studentId: number;
  studentName?: string;
  parentId?: number;
  parentName?: string;
  amount: number;
  paymentDate: string;
  paymentType: number; // 1: Nakit, 2: Kredi/Banka Kartı, 3: Havale/EFT, 4: POS / Çek
  receiptNo?: string;
  transactionId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface PaymentGetByIdDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  feeDueId?: number;
  studentId: number;
  studentName?: string;
  parentId?: number;
  parentName?: string;
  amount: number;
  paymentDate: string;
  paymentType: number;
  receiptNo?: string;
  transactionId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CreatePaymentCommand {
  tenantId?: number;
  feeDueId?: number;
  studentId: number;
  parentId?: number;
  amount: number;
  paymentDate: string;
  paymentType: number;
  receiptNo?: string;
  transactionId?: string;
  notes?: string;
}

export interface UpdatePaymentCommand {
  id: number;
  tenantId?: number;
  feeDueId?: number;
  studentId: number;
  parentId?: number;
  amount: number;
  paymentDate: string;
  paymentType: number;
  receiptNo?: string;
  transactionId?: string;
  notes?: string;
}

export interface DeletePaymentCommand {
  id: number;
}

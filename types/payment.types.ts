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

export interface RecentPaymentItemDto {
  id: number;
  studentId: number;
  studentFullName: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  receiptNo?: string;
}

export interface FinancialDashboardMetricsDto {
  totalRevenue: number;
  totalWalletBalance: number;
  thisMonthTotalExpected: number;
  thisMonthPaid: number;
  thisMonthRemaining: number;
  collectionRate: number;
  overdueTotalAmount: number;
  overdueDuesCount: number;
  recentPayments: RecentPaymentItemDto[];
}


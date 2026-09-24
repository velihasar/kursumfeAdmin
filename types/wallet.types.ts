export interface StudentWalletGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  studentId: number;
  studentName?: string;
  studentNumber?: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  lastTransactionDate?: string;
  isActive?: boolean;
}

export interface StudentWalletTransactionGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  studentWalletId: number;
  studentId: number;
  canteenProductId?: number;
  studentName?: string;
  studentNumber?: string;
  transactionType: number; // 1: Bakiye Yükleme (Deposit), 2: Harcama (Spend), 3: İade (Refund)
  transactionTypeName?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  category?: string; // Su, Meşrubat, Kantin, Ekipman, vb.
  description?: string;
  paymentType?: number; // 1: Nakit, 2: Kredi Kartı, 3: Havale/EFT, 4: Diğer
  paymentTypeName?: string;
  receiptNo?: string;
  transactionDate: string;
  isActive?: boolean;
}

export interface StudentWalletGetByIdDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  studentId: number;
  studentName?: string;
  studentNumber?: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  lastTransactionDate?: string;
  isActive?: boolean;
  transactions: StudentWalletTransactionGetAllDto[];
}

export interface DepositStudentWalletCommand {
  tenantId?: number;
  studentId: number;
  amount: number;
  paymentType: number; // 1: Nakit, 2: Kredi Kartı, 3: Havale/EFT, 4: Diğer
  description?: string;
  receiptNo?: string;
  transactionDate?: string;
}

export interface SpendStudentWalletCommand {
  tenantId?: number;
  studentId: number;
  canteenProductId?: number;
  amount: number;
  category: string; // Su, Meşrubat, Kantin, Ekipman, vb.
  description?: string;
  transactionDate?: string;
}

export interface DeleteStudentWalletTransactionCommand {
  id: number;
}

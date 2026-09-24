import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  StudentWalletGetAllDto,
  StudentWalletGetByIdDto,
  StudentWalletTransactionGetAllDto,
  DepositStudentWalletCommand,
  SpendStudentWalletCommand,
  DeleteStudentWalletTransactionCommand,
} from "@/types/wallet.types";
import { ApiDataResult } from "@/types/branch.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const walletKeys = {
  all: ["studentWallets"] as const,
  lists: (params?: { tenantId?: number; searchTerm?: string }) =>
    [...walletKeys.all, "list", params] as const,
  byStudentId: (studentId: number) =>
    [...walletKeys.all, "byStudent", studentId] as const,
  transactions: (params?: {
    tenantId?: number;
    studentId?: number;
    studentWalletId?: number;
    transactionType?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => [...walletKeys.all, "transactions", params] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Cüzdan Listesi (Öğrenci Bakiyeleri)
 * GET /api/studentwallets/getall
 */
export function useStudentWallets(params?: {
  tenantId?: number;
  searchTerm?: string;
}) {
  return useQuery<StudentWalletGetAllDto[]>({
    queryKey: walletKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<StudentWalletGetAllDto[]>(
        "/api/studentwallets/getall",
        {
          params,
        }
      );
      return response.data;
    },
  });
}

/**
 * Öğrenciye Göre Cüzdan ve Hareket Detayı
 * GET /api/studentwallets/getbystudentid?studentId={studentId}
 */
export function useStudentWallet(studentId?: number) {
  return useQuery<StudentWalletGetByIdDto>({
    queryKey: walletKeys.byStudentId(studentId ?? 0),
    queryFn: async () => {
      const response = await axiosInstance.get<StudentWalletGetByIdDto>(
        "/api/studentwallets/getbystudentid",
        {
          params: { studentId },
        }
      );
      return response.data;
    },
    enabled: !!studentId && studentId > 0,
  });
}

/**
 * Cüzdan / Harcama / Yükleme Hareketleri Listesi
 * GET /api/studentwallets/transactions/getall
 */
export function useStudentWalletTransactions(params?: {
  tenantId?: number;
  studentId?: number;
  studentWalletId?: number;
  transactionType?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery<StudentWalletTransactionGetAllDto[]>({
    queryKey: walletKeys.transactions(params),
    queryFn: async () => {
      const response = await axiosInstance.get<
        StudentWalletTransactionGetAllDto[]
      >("/api/studentwallets/transactions/getall", {
        params,
      });
      return response.data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Bakiye Yükle
 * POST /api/studentwallets/deposit
 */
export function useDepositStudentWallet() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<StudentWalletGetAllDto>,
    Error,
    DepositStudentWalletCommand
  >({
    mutationFn: async (data: DepositStudentWalletCommand) => {
      const response = await axiosInstance.post<
        ApiDataResult<StudentWalletGetAllDto>
      >("/api/studentwallets/deposit", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: walletKeys.byStudentId(variables.studentId),
        });
      }
    },
  });
}

/**
 * Harcama Yap (Dolap / Kantin / Su vb.)
 * POST /api/studentwallets/spend
 */
export function useSpendStudentWallet() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<StudentWalletGetAllDto>,
    Error,
    SpendStudentWalletCommand
  >({
    mutationFn: async (data: SpendStudentWalletCommand) => {
      const response = await axiosInstance.post<
        ApiDataResult<StudentWalletGetAllDto>
      >("/api/studentwallets/spend", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: walletKeys.byStudentId(variables.studentId),
        });
      }
    },
  });
}

/**
 * Cüzdan İşlemi İptal Et / Sil
 * DELETE /api/studentwallets/transactions
 */
export function useDeleteStudentWalletTransaction() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteStudentWalletTransactionCommand>({
    mutationFn: async (data: DeleteStudentWalletTransactionCommand) => {
      const response = await axiosInstance.delete<string>(
        "/api/studentwallets/transactions",
        {
          data,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

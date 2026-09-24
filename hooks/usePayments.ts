import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  PaymentGetAllDto,
  PaymentGetByIdDto,
  CreatePaymentCommand,
  UpdatePaymentCommand,
  DeletePaymentCommand,
} from "@/types/payment.types";
import { ApiDataResult } from "@/types/branch.types";
import { feeDueKeys } from "./useFeeDues";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const paymentKeys = {
  all: ["payments"] as const,
  lists: (params?: {
    tenantId?: number;
    studentId?: number;
    feeDueId?: number;
    paymentType?: number;
  }) => [...paymentKeys.all, "list", params] as const,
  detail: (id: number) => [...paymentKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Ödeme / Tahsilat Listesi
 * GET /api/payments/getall
 */
export function usePayments(params?: {
  tenantId?: number;
  studentId?: number;
  feeDueId?: number;
  paymentType?: number;
}) {
  return useQuery<PaymentGetAllDto[]>({
    queryKey: paymentKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<PaymentGetAllDto[]>(
        "/api/payments/getall",
        {
          params,
        }
      );
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Ödeme Detayı
 * GET /api/payments/getbyid?id={id}
 */
export function usePayment(id: number) {
  return useQuery<PaymentGetByIdDto>({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<PaymentGetByIdDto>(
        "/api/payments/getbyid",
        {
          params: { id },
        }
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Ödeme / Tahsilat Kaydet
 * POST /api/payments
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<any>, Error, CreatePaymentCommand>({
    mutationFn: async (data: CreatePaymentCommand) => {
      const response = await axiosInstance.post<ApiDataResult<any>>(
        "/api/payments",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: feeDueKeys.all });
    },
  });
}

/**
 * Ödeme / Tahsilat Güncelle
 * PUT /api/payments
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<any>, Error, UpdatePaymentCommand>({
    mutationFn: async (data: UpdatePaymentCommand) => {
      const response = await axiosInstance.put<ApiDataResult<any>>(
        "/api/payments",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: feeDueKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: paymentKeys.detail(variables.id),
        });
      }
    },
  });
}

/**
 * Ödeme / Tahsilat Sil
 * DELETE /api/payments
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeletePaymentCommand>({
    mutationFn: async (data: DeletePaymentCommand) => {
      const response = await axiosInstance.delete<string>("/api/payments", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: feeDueKeys.all });
    },
  });
}

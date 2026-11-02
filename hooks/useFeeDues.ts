import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  FeeDueGetAllDto,
  FeeDueGetByIdDto,
  CreateFeeDueCommand,
  UpdateFeeDueCommand,
  DeleteFeeDueCommand,
  UnassignedFeeDuesSummaryDto,
  GenerateMonthlyFeeDuesCommand,
} from "@/types/feeDue.types";
import { ApiDataResult } from "@/types/branch.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const feeDueKeys = {
  all: ["feeDues"] as const,
  lists: (params?: {
    tenantId?: number;
    studentId?: number;
    courseEnrollmentId?: number;
    status?: number;
    period?: string;
  }) => [...feeDueKeys.all, "list", params] as const,
  detail: (id: number) => [...feeDueKeys.all, "detail", id] as const,
  unassigned: (params?: {
    period?: string;
    tenantId?: number;
    courseId?: number;
    search?: string;
  }) => [...feeDueKeys.all, "unassigned", params] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Belirli bir dönem için henüz aidatı oluşturulmamış aktif öğrencilerin listesi ve özeti
 * GET /api/feedues/unassigned-students
 */
export function useUnassignedFeeDueStudents(params?: {
  period?: string;
  tenantId?: number;
  courseId?: number;
  search?: string;
}) {
  return useQuery<UnassignedFeeDuesSummaryDto>({
    queryKey: feeDueKeys.unassigned(params),
    queryFn: async () => {
      const response = await axiosInstance.get<UnassignedFeeDuesSummaryDto>(
        "/api/feedues/unassigned-students",
        {
          params,
        }
      );
      return response.data;
    },
  });
}

/**
 * Aidat / Tahakkuk Listesi
 * GET /api/feedues/getall
 */
export function useFeeDues(params?: {
  tenantId?: number;
  studentId?: number;
  courseEnrollmentId?: number;
  status?: number;
  period?: string;
}) {
  return useQuery<FeeDueGetAllDto[]>({
    queryKey: feeDueKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<FeeDueGetAllDto[]>(
        "/api/feedues/getall",
        {
          params,
        }
      );
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Aidat Detayı
 * GET /api/feedues/getbyid?id={id}
 */
export function useFeeDue(id: number) {
  return useQuery<FeeDueGetByIdDto>({
    queryKey: feeDueKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<FeeDueGetByIdDto>(
        "/api/feedues/getbyid",
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
 * Aidat / Tahakkuk Ekle
 * POST /api/feedues
 */
export function useCreateFeeDue() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<any>, Error, CreateFeeDueCommand>({
    mutationFn: async (data: CreateFeeDueCommand) => {
      const response = await axiosInstance.post<ApiDataResult<any>>(
        "/api/feedues",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeDueKeys.all });
    },
  });
}

/**
 * Aidat / Tahakkuk Güncelle
 * PUT /api/feedues
 */
export function useUpdateFeeDue() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<any>, Error, UpdateFeeDueCommand>({
    mutationFn: async (data: UpdateFeeDueCommand) => {
      const response = await axiosInstance.put<ApiDataResult<any>>(
        "/api/feedues",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: feeDueKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: feeDueKeys.detail(variables.id),
        });
      }
    },
  });
}

/**
 * Aidat / Tahakkuk Sil
 * DELETE /api/feedues
 */
export function useDeleteFeeDue() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteFeeDueCommand>({
    mutationFn: async (data: DeleteFeeDueCommand) => {
      const response = await axiosInstance.delete<string>("/api/feedues", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeDueKeys.all });
    },
  });
}

/**
 * Aktif kurs kayıtları için toplu aylık aidat tahakkuku oluştur
 * POST /api/feedues/generate-monthly-dues
 */
export function useGenerateMonthlyFeeDues() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<number>,
    Error,
    GenerateMonthlyFeeDuesCommand
  >({
    mutationFn: async (data) => {
      const response = await axiosInstance.post<ApiDataResult<number>>(
        "/api/feedues/generate-monthly-dues",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeDueKeys.all });
    },
  });
}


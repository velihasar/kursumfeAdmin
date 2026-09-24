import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  CanteenProductGetAllDto,
  CanteenProductGetByIdDto,
  CreateCanteenProductCommand,
  UpdateCanteenProductCommand,
  DeleteCanteenProductCommand,
} from "@/types/canteenProduct.types";
import { ApiDataResult } from "@/types/branch.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const canteenProductKeys = {
  all: ["canteenProducts"] as const,
  lists: (params?: { tenantId?: number; category?: string; searchTerm?: string }) =>
    [...canteenProductKeys.all, "list", params] as const,
  detail: (id: number) => [...canteenProductKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Kantin Ürünleri Listesi
 * GET /api/canteenproducts/getall
 */
export function useCanteenProducts(params?: {
  tenantId?: number;
  category?: string;
  searchTerm?: string;
}) {
  return useQuery<CanteenProductGetAllDto[]>({
    queryKey: canteenProductKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<CanteenProductGetAllDto[]>(
        "/api/canteenproducts/getall",
        {
          params,
        }
      );
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Kantin Ürün Detayı
 * GET /api/canteenproducts/getbyid?id={id}
 */
export function useCanteenProduct(id?: number) {
  return useQuery<CanteenProductGetByIdDto>({
    queryKey: canteenProductKeys.detail(id ?? 0),
    queryFn: async () => {
      const response = await axiosInstance.get<CanteenProductGetByIdDto>(
        "/api/canteenproducts/getbyid",
        {
          params: { id },
        }
      );
      return response.data;
    },
    enabled: !!id && id > 0,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Kantin Ürünü Ekle
 * POST /api/canteenproducts
 */
export function useCreateCanteenProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<CanteenProductGetAllDto>,
    Error,
    CreateCanteenProductCommand
  >({
    mutationFn: async (data: CreateCanteenProductCommand) => {
      const response = await axiosInstance.post<
        ApiDataResult<CanteenProductGetAllDto>
      >("/api/canteenproducts", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canteenProductKeys.all });
    },
  });
}

/**
 * Kantin Ürünü Güncelle
 * PUT /api/canteenproducts
 */
export function useUpdateCanteenProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<CanteenProductGetAllDto>,
    Error,
    UpdateCanteenProductCommand
  >({
    mutationFn: async (data: UpdateCanteenProductCommand) => {
      const response = await axiosInstance.put<
        ApiDataResult<CanteenProductGetAllDto>
      >("/api/canteenproducts", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canteenProductKeys.all });
    },
  });
}

/**
 * Kantin Ürünü Sil
 * DELETE /api/canteenproducts
 */
export function useDeleteCanteenProduct() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteCanteenProductCommand>({
    mutationFn: async (data: DeleteCanteenProductCommand) => {
      const response = await axiosInstance.delete<string>(
        "/api/canteenproducts",
        {
          data,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canteenProductKeys.all });
    },
  });
}

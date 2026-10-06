import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  AnnouncementGetAllDto,
  AnnouncementGetByIdDto,
  CreateAnnouncementCommand,
  UpdateAnnouncementCommand,
  DeleteAnnouncementCommand,
  AnnouncementCreateResponseDto,
  AnnouncementUpdateResponseDto,
  ApiDataResult,
} from "@/types/announcement.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const announcementKeys = {
  all: ["announcements"] as const,
  lists: (params?: { tenantId?: number; branchId?: number }) =>
    [...announcementKeys.all, "list", params] as const,
  detail: (id: number) => [...announcementKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Duyuruları Listele
 * GET /api/announcements/getall
 */
export function useAnnouncements(params?: { tenantId?: number; branchId?: number }) {
  return useQuery<AnnouncementGetAllDto[]>({
    queryKey: announcementKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<AnnouncementGetAllDto[]>("/api/announcements/getall", {
        params,
      });
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Duyuru Detayını Getir
 * GET /api/announcements/getbyid?id={id}
 */
export function useAnnouncement(id: number) {
  return useQuery<AnnouncementGetByIdDto>({
    queryKey: announcementKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<AnnouncementGetByIdDto>("/api/announcements/getbyid", {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Yeni Duyuru Ekle
 * POST /api/announcements
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<AnnouncementCreateResponseDto>, Error, CreateAnnouncementCommand>({
    mutationFn: async (data: CreateAnnouncementCommand) => {
      const response = await axiosInstance.post<ApiDataResult<AnnouncementCreateResponseDto>>(
        "/api/announcements",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

/**
 * Duyuru Güncelle
 * PUT /api/announcements
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<AnnouncementUpdateResponseDto>, Error, UpdateAnnouncementCommand>({
    mutationFn: async (data: UpdateAnnouncementCommand) => {
      const response = await axiosInstance.put<ApiDataResult<AnnouncementUpdateResponseDto>>(
        "/api/announcements",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: announcementKeys.detail(variables.id) });
      }
    },
  });
}

/**
 * Duyuru Sil
 * DELETE /api/announcements
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteAnnouncementCommand>({
    mutationFn: async (data: DeleteAnnouncementCommand) => {
      const response = await axiosInstance.delete<string>("/api/announcements", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

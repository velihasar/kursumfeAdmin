import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  EventGetAllDto,
  EventGetByIdDto,
  CreateEventCommand,
  UpdateEventCommand,
  DeleteEventCommand,
  EventCreateResponseDto,
  EventUpdateResponseDto,
  ApiDataResult,
} from "@/types/event.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const eventKeys = {
  all: ["events"] as const,
  lists: (params?: { tenantId?: number; branchId?: number }) =>
    [...eventKeys.all, "list", params] as const,
  detail: (id: number) => [...eventKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Etkinlikleri Listele
 * GET /api/events/getall
 */
export function useEvents(params?: { tenantId?: number; branchId?: number }) {
  return useQuery<EventGetAllDto[]>({
    queryKey: eventKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<EventGetAllDto[]>("/api/events/getall", {
        params,
      });
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Etkinlik Detayını Getir
 * GET /api/events/getbyid?id={id}
 */
export function useEvent(id: number) {
  return useQuery<EventGetByIdDto>({
    queryKey: eventKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<EventGetByIdDto>("/api/events/getbyid", {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Yeni Etkinlik Ekle
 * POST /api/events
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<EventCreateResponseDto>, Error, CreateEventCommand>({
    mutationFn: async (data: CreateEventCommand) => {
      const response = await axiosInstance.post<ApiDataResult<EventCreateResponseDto>>(
        "/api/events",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/**
 * Etkinlik Güncelle
 * PUT /api/events
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<EventUpdateResponseDto>, Error, UpdateEventCommand>({
    mutationFn: async (data: UpdateEventCommand) => {
      const response = await axiosInstance.put<ApiDataResult<EventUpdateResponseDto>>(
        "/api/events",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
      }
    },
  });
}

/**
 * Etkinlik Sil
 * DELETE /api/events
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteEventCommand>({
    mutationFn: async (data: DeleteEventCommand) => {
      const response = await axiosInstance.delete<string>("/api/events", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

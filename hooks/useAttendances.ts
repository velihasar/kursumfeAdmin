import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  AttendanceGetAllDto,
  AttendanceGetByIdDto,
  CreateAttendanceCommand,
  UpdateAttendanceCommand,
  DeleteAttendanceCommand,
  AttendanceCreateResponseDto,
  AttendanceUpdateResponseDto,
} from "@/types/attendance.types";
import { ApiDataResult } from "@/types/branch.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const attendanceKeys = {
  all: ["attendances"] as const,
  lists: (params?: {
    tenantId?: number;
    courseId?: number;
    studentId?: number;
    attendanceDate?: string;
  }) => [...attendanceKeys.all, "list", params] as const,
  detail: (id: number) => [...attendanceKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Yoklama Kayıtlarını Listele
 * GET /api/attendances/getall
 */
export function useAttendances(params?: {
  tenantId?: number;
  courseId?: number;
  studentId?: number;
  attendanceDate?: string;
}) {
  return useQuery<AttendanceGetAllDto[]>({
    queryKey: attendanceKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<AttendanceGetAllDto[]>(
        "/api/attendances/getall",
        {
          params,
        }
      );
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Yoklama Detayı Getir
 * GET /api/attendances/getbyid?id={id}
 */
export function useAttendance(id: number) {
  return useQuery<AttendanceGetByIdDto>({
    queryKey: attendanceKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<AttendanceGetByIdDto>(
        "/api/attendances/getbyid",
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
 * Yoklama Kaydı Ekle
 * POST /api/attendances
 */
export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<AttendanceCreateResponseDto>,
    Error,
    CreateAttendanceCommand
  >({
    mutationFn: async (data: CreateAttendanceCommand) => {
      const response = await axiosInstance.post<
        ApiDataResult<AttendanceCreateResponseDto>
      >("/api/attendances", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

/**
 * Yoklama Kaydını Güncelle
 * PUT /api/attendances
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<AttendanceUpdateResponseDto>,
    Error,
    UpdateAttendanceCommand
  >({
    mutationFn: async (data: UpdateAttendanceCommand) => {
      const response = await axiosInstance.put<
        ApiDataResult<AttendanceUpdateResponseDto>
      >("/api/attendances", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.detail(variables.id),
        });
      }
    },
  });
}

/**
 * Yoklama Kaydını Sil
 * DELETE /api/attendances
 */
export function useDeleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteAttendanceCommand>({
    mutationFn: async (data: DeleteAttendanceCommand) => {
      const response = await axiosInstance.delete<string>("/api/attendances", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

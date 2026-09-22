import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  CourseEnrollmentGetAllDto,
  CourseEnrollmentGetByIdDto,
  CreateCourseEnrollmentCommand,
  UpdateCourseEnrollmentCommand,
  DeleteCourseEnrollmentCommand,
  CourseEnrollmentCreateResponseDto,
  CourseEnrollmentUpdateResponseDto,
} from "@/types/course.types";
import { ApiDataResult } from "@/types/branch.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const courseEnrollmentKeys = {
  all: ["courseEnrollments"] as const,
  lists: (params?: { tenantId?: number; courseId?: number; studentId?: number }) =>
    [...courseEnrollmentKeys.all, "list", params] as const,
  detail: (id: number) => [...courseEnrollmentKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Kurs Kayıtlarını (Enrollments) Listele
 * GET /api/courseenrollments/getall
 */
export function useCourseEnrollments(params?: {
  tenantId?: number;
  courseId?: number;
  studentId?: number;
}) {
  return useQuery<CourseEnrollmentGetAllDto[]>({
    queryKey: courseEnrollmentKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<CourseEnrollmentGetAllDto[]>(
        "/api/courseenrollments/getall",
        {
          params,
        }
      );
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Kurs Kayıt Detayı Getir
 * GET /api/courseenrollments/getbyid?id={id}
 */
export function useCourseEnrollment(id: number) {
  return useQuery<CourseEnrollmentGetByIdDto>({
    queryKey: courseEnrollmentKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<CourseEnrollmentGetByIdDto>(
        "/api/courseenrollments/getbyid",
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
 * Kursa Öğrenci Kaydet
 * POST /api/courseenrollments
 */
export function useCreateCourseEnrollment() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<CourseEnrollmentCreateResponseDto>,
    Error,
    CreateCourseEnrollmentCommand
  >({
    mutationFn: async (data: CreateCourseEnrollmentCommand) => {
      const response = await axiosInstance.post<
        ApiDataResult<CourseEnrollmentCreateResponseDto>
      >("/api/courseenrollments", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseEnrollmentKeys.all });
    },
  });
}

/**
 * Kurs Kaydını Güncelle
 * PUT /api/courseenrollments
 */
export function useUpdateCourseEnrollment() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDataResult<CourseEnrollmentUpdateResponseDto>,
    Error,
    UpdateCourseEnrollmentCommand
  >({
    mutationFn: async (data: UpdateCourseEnrollmentCommand) => {
      const response = await axiosInstance.put<
        ApiDataResult<CourseEnrollmentUpdateResponseDto>
      >("/api/courseenrollments", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseEnrollmentKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: courseEnrollmentKeys.detail(variables.id),
        });
      }
    },
  });
}

/**
 * Kurs Kaydını Sil
 * DELETE /api/courseenrollments
 */
export function useDeleteCourseEnrollment() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteCourseEnrollmentCommand>({
    mutationFn: async (data: DeleteCourseEnrollmentCommand) => {
      const response = await axiosInstance.delete<string>("/api/courseenrollments", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseEnrollmentKeys.all });
    },
  });
}

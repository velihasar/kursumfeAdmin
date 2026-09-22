import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import {
  CourseGetAllDto,
  CourseGetByIdDto,
  CreateCourseCommand,
  UpdateCourseCommand,
  DeleteCourseCommand,
  CourseCreateResponseDto,
  CourseUpdateResponseDto,
} from "@/types/course.types";
import { ApiDataResult } from "@/types/branch.types";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const courseKeys = {
  all: ["courses"] as const,
  lists: (params?: { tenantId?: number }) => [...courseKeys.all, "list", params] as const,
  detail: (id: number) => [...courseKeys.all, "detail", id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Kursları Listele
 * GET /api/courses/getall
 */
export function useCourses(params?: { tenantId?: number }) {
  return useQuery<CourseGetAllDto[]>({
    queryKey: courseKeys.lists(params),
    queryFn: async () => {
      const response = await axiosInstance.get<CourseGetAllDto[]>("/api/courses/getall", {
        params,
      });
      return response.data;
    },
  });
}

/**
 * ID'ye Göre Kurs Detayı Getir
 * GET /api/courses/getbyid?id={id}
 */
export function useCourse(id: number) {
  return useQuery<CourseGetByIdDto>({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<CourseGetByIdDto>("/api/courses/getbyid", {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Yeni Kurs Ekle
 * POST /api/courses
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<CourseCreateResponseDto>, Error, CreateCourseCommand>({
    mutationFn: async (data: CreateCourseCommand) => {
      const response = await axiosInstance.post<ApiDataResult<CourseCreateResponseDto>>(
        "/api/courses",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

/**
 * Kurs Güncelle
 * PUT /api/courses
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation<ApiDataResult<CourseUpdateResponseDto>, Error, UpdateCourseCommand>({
    mutationFn: async (data: UpdateCourseCommand) => {
      const response = await axiosInstance.put<ApiDataResult<CourseUpdateResponseDto>>(
        "/api/courses",
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
      }
    },
  });
}

/**
 * Kurs Sil
 * DELETE /api/courses
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, DeleteCourseCommand>({
    mutationFn: async (data: DeleteCourseCommand) => {
      const response = await axiosInstance.delete<string>("/api/courses", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

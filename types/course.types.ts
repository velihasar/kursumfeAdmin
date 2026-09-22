export interface CourseGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  branchId?: number;
  branchName?: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  feeType: number; // 1: Aylık, 2: Toplam
  capacity?: number;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: number;
  teacherName?: string;
  isActive?: boolean;
}

export interface CourseGetByIdDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  branchId?: number;
  branchName?: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  feeType: number;
  capacity?: number;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: number;
  teacherName?: string;
  isActive?: boolean;
}

export interface CreateCourseCommand {
  tenantId?: number;
  branchId?: number;
  name: string;
  code: string;
  description?: string;
  price: number;
  feeType: number;
  capacity?: number;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: number;
}

export interface UpdateCourseCommand {
  id: number;
  tenantId?: number;
  branchId?: number;
  name: string;
  code: string;
  description?: string;
  price: number;
  feeType: number;
  capacity?: number;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: number;
}

export interface DeleteCourseCommand {
  id: number;
}

export interface CourseCreateResponseDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  price: number;
  feeType: number;
  capacity?: number;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: number;
  branchId?: number;
}

export interface CourseUpdateResponseDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  price: number;
  feeType: number;
  capacity?: number;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: number;
  branchId?: number;
}

// ─── Course Enrollment Types ──────────────────────────────────────────────────
export interface CourseEnrollmentGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  studentId: number;
  studentName?: string;
  courseId: number;
  courseName?: string;
  enrollmentDate: string;
  customMonthlyFee?: number;
  dueDayOfMonth: number;
  status: number; // 1: Aktif, 2: Donduruldu, 3: Tamamlandı, 4: İptal
  notes?: string;
  isActive?: boolean;
}

export interface CourseEnrollmentGetByIdDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  studentId: number;
  studentName?: string;
  courseId: number;
  courseName?: string;
  enrollmentDate: string;
  customMonthlyFee?: number;
  dueDayOfMonth: number;
  status: number;
  notes?: string;
  isActive?: boolean;
}

export interface CreateCourseEnrollmentCommand {
  tenantId?: number;
  studentId: number;
  courseId: number;
  enrollmentDate: string;
  customMonthlyFee?: number;
  dueDayOfMonth: number;
  status: number;
  notes?: string;
}

export interface UpdateCourseEnrollmentCommand {
  id: number;
  tenantId?: number;
  studentId: number;
  courseId: number;
  enrollmentDate: string;
  customMonthlyFee?: number;
  dueDayOfMonth: number;
  status: number;
  notes?: string;
}

export interface DeleteCourseEnrollmentCommand {
  id: number;
}

export interface CourseEnrollmentCreateResponseDto {
  id: number;
  studentId: number;
  courseId: number;
  enrollmentDate: string;
  customMonthlyFee?: number;
  dueDayOfMonth: number;
  status: number;
  notes?: string;
}

export interface CourseEnrollmentUpdateResponseDto {
  id: number;
  studentId: number;
  courseId: number;
  enrollmentDate: string;
  customMonthlyFee?: number;
  dueDayOfMonth: number;
  status: number;
  notes?: string;
}

export interface AttendanceGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  courseId: number;
  courseName?: string;
  studentId: number;
  studentName?: string;
  attendanceDate: string;
  isPresent: boolean;
  reason?: string;
  isActive?: boolean;
}

export interface AttendanceGetByIdDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  courseId: number;
  courseName?: string;
  studentId: number;
  studentName?: string;
  attendanceDate: string;
  isPresent: boolean;
  reason?: string;
  isActive?: boolean;
}

export interface CreateAttendanceCommand {
  tenantId?: number;
  courseId: number;
  studentId: number;
  attendanceDate: string;
  isPresent: boolean;
  reason?: string;
}

export interface UpdateAttendanceCommand {
  id: number;
  tenantId?: number;
  courseId: number;
  studentId: number;
  attendanceDate: string;
  isPresent: boolean;
  reason?: string;
}

export interface DeleteAttendanceCommand {
  id: number;
}

export interface AttendanceCreateResponseDto {
  id: number;
  courseId: number;
  studentId: number;
  attendanceDate: string;
  isPresent: boolean;
  reason?: string;
}

export interface AttendanceUpdateResponseDto {
  id: number;
  courseId: number;
  studentId: number;
  attendanceDate: string;
  isPresent: boolean;
  reason?: string;
}

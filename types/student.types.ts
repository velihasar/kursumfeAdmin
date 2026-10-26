import { ApiDataResult } from "./branch.types";
import { PersonGetAllDto } from "./person.types";

export interface StudentGetAllDto {
  id: number;
  tenantId?: number;
  personId: number;
  studentNumber: string;
  parentAccessCode?: string;
  enrollmentDate: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

export interface StudentGetByIdDto {
  id: number;
  tenantId?: number;
  personId: number;
  studentNumber: string;
  parentAccessCode?: string;
  enrollmentDate: string;
}

export interface CreateStudentCommand {
  tenantId?: number;
  personId: number;
  studentNumber?: string;
  enrollmentDate: string;
}

export interface UpdateStudentCommand {
  id: number;
  tenantId?: number;
  personId: number;
  studentNumber?: string;
  enrollmentDate: string;
  isActive: boolean;
}

export interface DeleteStudentCommand {
  id: number;
}

export interface StudentCreateResponseDto {
  id: number;
  personId: number;
  studentNumber: string;
  parentAccessCode?: string;
  enrollmentDate: string;
}

export interface StudentUpdateResponseDto {
  id: number;
  personId: number;
  studentNumber: string;
  parentAccessCode?: string;
  enrollmentDate: string;
}

export interface StudentWithPersonDto extends StudentGetAllDto {
  person?: PersonGetAllDto;
}

export interface RegisterFullStudentRequestDto {
  tenantId?: number;
  existingPersonId?: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  photoUrl?: string;
  studentNumber?: string;
  enrollmentDate?: string;
  branchId?: number;
  includeParent?: boolean;
  existingParentPersonId?: number;
  parentFirstName?: string;
  parentLastName?: string;
  parentPhone?: string;
  parentEmail?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface RegisterFullStudentResponseDto {
  studentId: number;
  personId: number;
  studentNumber?: string;
  fullName: string;
  parentId?: number;
  parentFullName?: string;
  branchId?: number;
  branchName?: string;
  message: string;
}

export interface ExcelImportStudentRowDto {
  firstName: string;
  lastName: string;
  studentNumber?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  branchId?: number;
  branchName?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentPhone?: string;
  parentEmail?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface ExcelBulkImportRequestDto {
  tenantId?: number;
  importMode?: string;
  rows: ExcelImportStudentRowDto[];
}

export interface ExcelBulkImportResponseDto {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errorMessages: string[];
  importedStudentNames: string[];
}


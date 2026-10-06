/**
 * OkulBE Event (Etkinlik) DTO & Command Types
 */

export interface EventGetAllDto {
  id: number;
  tenantId?: number;
  tenantName?: string;
  title: string;
  description?: string;
  category?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  targetAudience?: string;
  targetRole?: number;
  capacity?: number;
  isRegistrationRequired?: boolean;
  imageUrl?: string;
  icon?: string;
  status?: number;
  branchId?: number;
  branchName?: string;
  isActive?: boolean;
}

export interface EventGetByIdDto {
  id: number;
  tenantId?: number;
  tenantName?: string;
  title: string;
  description?: string;
  category?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  targetAudience?: string;
  targetRole?: number;
  capacity?: number;
  isRegistrationRequired?: boolean;
  imageUrl?: string;
  icon?: string;
  status?: number;
  branchId?: number;
  branchName?: string;
  isActive?: boolean;
}

export interface CreateEventCommand {
  tenantId?: number;
  title: string;
  description?: string;
  category?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  targetAudience?: string;
  targetRole?: number;
  capacity?: number;
  isRegistrationRequired?: boolean;
  imageUrl?: string;
  icon?: string;
  status?: number;
  branchId?: number;
}

export interface UpdateEventCommand {
  id: number;
  tenantId?: number;
  title: string;
  description?: string;
  category?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  targetAudience?: string;
  targetRole?: number;
  capacity?: number;
  isRegistrationRequired?: boolean;
  imageUrl?: string;
  icon?: string;
  status?: number;
  branchId?: number;
}

export interface DeleteEventCommand {
  id: number;
}

export interface EventCreateResponseDto {
  id: number;
  title: string;
  category?: string;
  startDate: string;
  location?: string;
}

export interface EventUpdateResponseDto {
  id: number;
  title: string;
  category?: string;
  startDate: string;
  location?: string;
}

export interface ApiDataResult<T> {
  data: T;
  success: boolean;
  message?: string;
}

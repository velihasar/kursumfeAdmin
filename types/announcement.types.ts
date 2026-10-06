/**
 * OkulBE Announcement (Duyuru) DTO & Command Types
 */

export interface AnnouncementGetAllDto {
  id: number;
  tenantId?: number;
  tenantName?: string;
  title: string;
  summary?: string;
  content: string;
  author?: string;
  tag?: string;
  icon?: string;
  imageUrl?: string;
  isImportant?: boolean;
  isPublished?: boolean;
  publishDate?: string;
  expireDate?: string;
  targetAudience?: number;
  branchId?: number;
  branchName?: string;
  isActive?: boolean;
}

export interface AnnouncementGetByIdDto {
  id: number;
  tenantId?: number;
  tenantName?: string;
  title: string;
  summary?: string;
  content: string;
  author?: string;
  tag?: string;
  icon?: string;
  imageUrl?: string;
  isImportant?: boolean;
  isPublished?: boolean;
  publishDate?: string;
  expireDate?: string;
  targetAudience?: number;
  branchId?: number;
  branchName?: string;
  isActive?: boolean;
}

export interface CreateAnnouncementCommand {
  tenantId?: number;
  title: string;
  summary?: string;
  content: string;
  author?: string;
  tag?: string;
  icon?: string;
  imageUrl?: string;
  isImportant?: boolean;
  isPublished?: boolean;
  publishDate?: string;
  expireDate?: string;
  targetAudience?: number;
  branchId?: number;
}

export interface UpdateAnnouncementCommand {
  id: number;
  tenantId?: number;
  title: string;
  summary?: string;
  content: string;
  author?: string;
  tag?: string;
  icon?: string;
  imageUrl?: string;
  isImportant?: boolean;
  isPublished?: boolean;
  publishDate?: string;
  expireDate?: string;
  targetAudience?: number;
  branchId?: number;
}

export interface DeleteAnnouncementCommand {
  id: number;
}

export interface AnnouncementCreateResponseDto {
  id: number;
  title: string;
  summary?: string;
  author?: string;
  tag?: string;
  isImportant?: boolean;
}

export interface AnnouncementUpdateResponseDto {
  id: number;
  title: string;
  summary?: string;
  author?: string;
  tag?: string;
  isImportant?: boolean;
}

export interface ApiDataResult<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface CanteenProductGetAllDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  name: string;
  price: number;
  category: string;
  barcode?: string;
  stockQuantity?: number;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

export interface CanteenProductGetByIdDto {
  id: number;
  tenantId: number;
  tenantName?: string;
  name: string;
  price: number;
  category: string;
  barcode?: string;
  stockQuantity?: number;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateCanteenProductCommand {
  tenantId?: number;
  name: string;
  price: number;
  category: string;
  barcode?: string;
  stockQuantity?: number;
  icon?: string;
  description?: string;
}

export interface UpdateCanteenProductCommand {
  id: number;
  name: string;
  price: number;
  category: string;
  barcode?: string;
  stockQuantity?: number;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

export interface DeleteCanteenProductCommand {
  id: number;
}

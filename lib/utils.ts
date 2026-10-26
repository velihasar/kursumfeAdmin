import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMinioUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanPath;
}

export function getCategoryBreadcrumb(category: any, allCategories: any[] = []): string {
  if (!category) return "";
  const name = category.name || category.Name || "";
  const parentId = category.parentCategoryId ?? category.ParentCategoryId;

  if (!parentId || Number(parentId) === 0) {
    return name;
  }

  const parent = allCategories.find((c: any) => Number(c.id ?? c.Id) === Number(parentId));
  if (parent) {
    return `${getCategoryBreadcrumb(parent, allCategories)} > ${name}`;
  }

  return name;
}

export function getApiErrorMessage(err: any, fallback: string = "İşlem sırasında bir hata oluştu."): string {
  if (!err) return fallback;

  const data = err.response?.data;
  const status = err.response?.status;

  const translations: Record<string, string> = {
    // Backend Enum / Code Messages
    NameAlreadyExist: "Bu isimde bir kayıt zaten bulunmaktadır.",
    UserAlreadyExist: "Bu kullanıcı e-postası veya bilgisi zaten kayıtlı.",
    WrongPassword: "Hatalı şifre girdiniz.",
    PasswordError: "Hatalı şifre girdiniz.",
    UserNotFound: "Kullanıcı bulunamadı.",
    AuthorizationsDenied: "Bu işlem için yetkiniz bulunmamaktadır.",
    InvalidCode: "Geçersiz doğrulama kodu.",
    StringLengthMustBeGreaterThanThree: "Girilen metin en az 3 karakter olmalıdır.",
    SuccessfulLogin: "Giriş başarılı.",
    OperationClaimExists: "Bu yetki tanımı zaten mevcut.",
    TokenProviderException: "Kimlik doğrulama hatası oluştu.",
    Unknown: "Bilinmeyen bir hata oluştu.",
    Added: "Kayıt başarıyla eklendi.",
    Updated: "Kayıt başarıyla güncellendi.",
    Deleted: "Kayıt başarıyla silindi.",

    // HTTP / Common Messages
    "Network Error": "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.",
    "Internal Server Error": "Sunucuda iç hata oluştu.",
    "Bad Request": "Geçersiz veya eksik veri gönderildi.",
    "Unauthorized": "Oturum açmanız gerekmektedir.",
    "Forbidden": "Bu işlem için yetkiniz bulunmamaktadır.",
    "Not Found": "İstenen kayıt bulunamadı.",
  };

  if (status === 401) return "Oturum süreniz doldu. Lütfen tekrar giriş yapın.";
  if (status === 403) return "Bu işlem için yetkiniz bulunmamaktadır.";
  if (status === 404) return "Aranan kayıt veya kaynak bulunamadı.";
  if (status === 500) return "Sunucuda bir hata oluştu. Lütfen tekrar deneyin.";

  const extractMessage = (val: any): string | null => {
    if (typeof val === "string" && val.trim()) return val.trim();
    if (val && typeof val === "object") {
      const msg = val.message || val.Message || val.title || val.Title || val.data;
      if (typeof msg === "string" && msg.trim()) return msg.trim();
    }
    return null;
  };

  const rawMsg = extractMessage(data) || extractMessage(err);

  if (rawMsg) {
    if (translations[rawMsg]) return translations[rawMsg];

    if (rawMsg.includes("Network Error") || rawMsg.includes("Failed to fetch")) {
      return "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.";
    }
    if (rawMsg.includes("timeout") || rawMsg.includes("Timeout")) {
      return "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
    }
    if (rawMsg.includes("status code")) {
      return fallback;
    }
    return rawMsg;
  }

  return fallback;
}

export function checkIsSuperAdmin(user?: any): boolean {
  if (!user) return false;
  const userRole = (user.role || user.userRole || "").toString().trim().toLowerCase();
  const userTenantId = Number(user.tenantId ?? 0);
  const claims: string[] = Array.isArray(user.claims) ? user.claims : [];

  const hasSuperRole =
    userRole === "superadmin" ||
    userRole === "super_admin" ||
    claims.some((c) => typeof c === "string" && (c.toLowerCase() === "superadmin" || c.toLowerCase() === "super_admin"));

  return hasSuperRole && userTenantId === 0;
}

export function checkIsAdminOrOwner(user?: any): boolean {
  if (!user) return false;
  const userRole = (user.role || user.userRole || "").toString().trim().toLowerCase();
  const claims: string[] = Array.isArray(user.claims) ? user.claims : [];

  const isOwner =
    userRole === "kurumsahibi" ||
    userRole === "kurum sahibi" ||
    userRole === "superadmin" ||
    userRole === "super_admin";

  const hasOwnerClaim = claims.some((c) =>
    typeof c === "string" &&
    (c.toLowerCase() === "kurumsahibi" || c.toLowerCase() === "kurum sahibi" || c.toLowerCase() === "superadmin")
  );

  return isOwner || hasOwnerClaim;
}

export function checkIsTeacher(user?: any): boolean {
  if (!user) return false;
  const userRole = (user.role || user.userRole || "").toString().trim().toLowerCase();
  const claims: string[] = Array.isArray(user.claims) ? user.claims : [];

  const isTeacherRole =
    userRole === "öğretmen" ||
    userRole === "ogretmen" ||
    userRole === "teacher";

  const hasTeacherClaim = claims.some((c) =>
    typeof c === "string" &&
    (c.toLowerCase() === "öğretmen" || c.toLowerCase() === "ogretmen" || c.toLowerCase() === "teacher")
  );

  return isTeacherRole || hasTeacherClaim;
}

export function checkIsOnlyTeacher(user?: any): boolean {
  if (!user) return false;
  if (checkIsSuperAdmin(user)) return false;
  if (checkIsAdminOrOwner(user)) return false;

  return checkIsTeacher(user);
}

export function checkIsParent(user?: any): boolean {
  if (!user) return false;
  const userRole = (user.role || user.userRole || "").toString().trim().toLowerCase();
  const claims: string[] = Array.isArray(user.claims) ? user.claims : [];

  const isParentRole =
    userRole === "veli" ||
    userRole === "parent";

  const hasParentClaim = claims.some((c) =>
    typeof c === "string" && (c.toLowerCase() === "veli" || c.toLowerCase() === "parent")
  );

  return isParentRole || hasParentClaim;
}




/**
 * Sistemde veritabanında (Group tablosunda) kayıtlı resmi kullanıcı rolleri
 */
export const APP_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  KURUM_SAHIBI: "KurumSahibi",
  OGRETMEN: "Öğretmen",
  VELI: "Veli",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const SYSTEM_ROLES_INFO = [
  {
    name: APP_ROLES.SUPER_ADMIN,
    label: "Süper Yönetici (SuperAdmin)",
    badgeColor: "bg-red-500/10 text-red-600 border-red-500/20",
    description: "Tüm kurumlara, ayarlara ve sistem verilerine tam yetkili erişim.",
  },
  {
    name: APP_ROLES.KURUM_SAHIBI,
    label: "Kurum Sahibi",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Kurumun öğrenci, öğretmen, ders, tahsilat ve tüm yönetim operasyonları.",
  },
  {
    name: APP_ROLES.OGRETMEN,
    label: "Öğretmen",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    description: "Ders yoklaması alma, öğrenci listeleri ve ders programı görüntüleme.",
  },
  {
    name: APP_ROLES.VELI,
    label: "Veli",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Öğrencinin yoklama durumu, dersleri ve bakiye bilgileri (Mobil Uygulama).",
  },
] as const;

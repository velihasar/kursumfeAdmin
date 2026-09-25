import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sadece /admin ile başlayan rotaları koruyoruz
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/unauthorized") {
      return NextResponse.next();
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "haqanwear-secret-key-12345",
    });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (token.role as string) || (token.userRole as string) || "";
    const userTenantId = Number(token.tenantId ?? 0);
    const claims: string[] = Array.isArray(token.claims) ? (token.claims as string[]) : [];

    const isSuperAdmin =
      (userRole.toUpperCase() === "SUPER_ADMIN" ||
        userRole.toUpperCase() === "SUPERADMIN" ||
        claims.some((c) => /^superadmin$|^SUPER_ADMIN$/i.test(c))) &&
      userTenantId === 0;

    // Sadece SUPER_ADMIN için rota kısıtlaması uygula
    if (isSuperAdmin) {
      const superAdminAllowedPrefixes = [
        "/admin/tenants",
        "/admin/branches",
        "/admin/users",
        "/admin/roles",
        "/admin/profile",
        "/admin/unauthorized",
      ];

      const isExactAdminDashboard = pathname === "/admin" || pathname === "/admin/";
      const isAllowedPrefix = superAdminAllowedPrefixes.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (!isExactAdminDashboard && !isAllowedPrefix) {
        return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
      }
    } else {
      // SuperAdmin OLMAYAN kullanıcılar Roller & İzinler veya Kurumlar sayfalarına doğrudan erişemez
      if (pathname.startsWith("/admin/roles") || pathname.startsWith("/admin/tenants")) {
        return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
      }
    }

    // VELİ / PARENT kontrolü: Veli hesabı olanların yönetim paneline erişimini kesinlikle engelle
    const isParent =
      /^Veli$|^Parent$|^OgrenciVeli$|^ÖğrenciVeli$/i.test(userRole.trim()) ||
      claims.some((c) => typeof c === "string" && /^Veli$|^Parent$|^OgrenciVeli$|^ÖğrenciVeli$/i.test(c.trim()));

    // Yönetici / Kurum Sahibi kontrolü
    const isKurumAdmin =
      /^KurumSahibi$|^Kurum Sahibi$|^TenantAdmin$|^SubeYonetici$|^OKUL_ADMIN$|^ADMIN$|^EDITOR$/i.test(userRole.trim()) ||
      claims.some((c) => typeof c === "string" && /^KurumSahibi$|^Kurum Sahibi$|^TenantAdmin$|^SubeYonetici$|^OKUL_ADMIN$|^ADMIN$|^EDITOR$/i.test(c.trim()));

    const isTeacher =
      /^teacher$|^ogretmen$|^öğretmen$|^egitmen$|^eğitmen$/i.test(userRole.trim()) ||
      claims.some((c) => typeof c === "string" && /^teacher$|^ogretmen$|^öğretmen$|^egitmen$|^eğitmen$/i.test(c.trim()));

    if (isParent && !isSuperAdmin && !isKurumAdmin && !isTeacher) {
      return NextResponse.redirect(new URL("/login?error=VeliAccessDenied", req.url));
    }

    // SADECE ÖĞRETMEN olan (Kurum Sahibi veya Admin yetkisi bulunmayan) kullanıcılar için kısıtlama
    const isOnlyTeacher = isTeacher && !isSuperAdmin && !isKurumAdmin;

    if (isOnlyTeacher) {
      const teacherAllowedPrefixes = [
        "/admin/attendances",
        "/admin/profile",
        "/admin/unauthorized",
      ];

      const isAllowed = teacherAllowedPrefixes.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (!isAllowed) {
        if (pathname === "/admin" || pathname === "/admin/") {
          return NextResponse.redirect(new URL("/admin/attendances", req.url));
        }
        return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

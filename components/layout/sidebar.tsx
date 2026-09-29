"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, checkIsSuperAdmin, checkIsOnlyTeacher, getMinioUrl } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  GitFork,
  BookOpen,
  GraduationCap,
  UserCheck,
  Users,
  HeartHandshake,
  Contact,
  UserCog,
  ShieldCheck,
  ClipboardCheck,
  Banknote,
  Wallet,
  ChevronLeft,
  Menu,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useTenant } from "@/hooks/useTenants";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles?: string[];
  exact?: boolean;
  canAdd?: boolean;
  addHref?: string;
  addTitle?: string;
  hideForSuperAdmin?: boolean;
  superAdminOnly?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = checkIsSuperAdmin(session?.user);
  const isOnlyTeacher = checkIsOnlyTeacher(session?.user);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userTenantId = Number((session?.user as any)?.tenantId || 0);
  const { data: tenant } = useTenant(userTenantId);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Kurumlar / Okullar",
      href: "/admin/tenants",
      icon: Building2,
      superAdminOnly: true,
      canAdd: true,
      addHref: "/admin/tenants?action=new",
      addTitle: "Yeni Kurum Ekle",
    },
    {
      title: "Şubeler",
      href: "/admin/branches",
      icon: GitFork,
      canAdd: true,
      addHref: "/admin/branches?action=new",
      addTitle: "Yeni Şube Ekle",
    },
    {
      title: "Öğretmenler",
      href: "/admin/teachers",
      icon: UserCheck,
      canAdd: true,
      addHref: "/admin/teachers?action=new",
      addTitle: "Yeni Öğretmen Ekle",
    },
    {
      title: "Öğrenciler",
      href: "/admin/students",
      icon: GraduationCap,
      canAdd: true,
      addHref: "/admin/students?action=new",
      addTitle: "Yeni Öğrenci Kaydet",
    },
    {
      title: "Veliler",
      href: "/admin/parents",
      icon: Users,
      canAdd: true,
      addHref: "/admin/parents?action=new",
      addTitle: "Yeni Veli Kaydet",
    },
    {
      title: "Kurslar / Dersler",
      href: "/admin/courses",
      icon: BookOpen,
      canAdd: true,
      addHref: "/admin/courses?action=new",
      addTitle: "Yeni Kurs Ekle",
    },
    {
      title: "Yoklama & Devam",
      href: "/admin/attendances",
      icon: ClipboardCheck,
      canAdd: true,
      addHref: "/admin/attendances?action=new",
      addTitle: "Yeni Yoklama Al",
    },
    {
      title: "Aidat & Ödemeler",
      href: "/admin/payments",
      icon: Banknote,
      canAdd: true,
      addHref: "/admin/payments?action=new",
      addTitle: "Yeni Tahsilat Al",
    },
    {
      title: "Kantin & Cüzdan",
      href: "/admin/wallet",
      icon: Wallet,
      canAdd: true,
      addHref: "/admin/wallet?action=deposit",
      addTitle: "Bakiye Yükle",
    },
    {
      title: "Kullanıcılar",
      href: "/admin/users",
      icon: UserCog,
      canAdd: true,
      addHref: "/admin/users?action=new",
      addTitle: "Yeni Kullanıcı Ekle",
    },
    {
      title: "Roller & İzinler",
      href: "/admin/roles",
      icon: ShieldCheck,
      superAdminOnly: true,
      canAdd: true,
      addHref: "/admin/roles?action=new",
      addTitle: "Yeni Rol Ekle",
    },
  ];

  let visibleItems: NavItem[] = [];
  if (isSuperAdmin) {
    visibleItems = navItems.filter((item) =>
      ["/admin/tenants", "/admin/users", "/admin/roles"].includes(item.href)
    );
  } else if (isOnlyTeacher) {
    visibleItems = navItems.filter((item) =>
      item.href === "/admin/attendances"
    );
  } else {
    visibleItems = navItems.filter((item) => !item.superAdminOnly);
  }

  const logoHref = isSuperAdmin
    ? "/admin/tenants"
    : isOnlyTeacher
    ? "/admin/attendances"
    : "/admin";

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out h-screen sticky top-0 hidden md:flex select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border", isCollapsed ? "justify-center px-0" : "justify-between px-5")}>
        {!isCollapsed ? (
          userTenantId > 0 && tenant && !isSuperAdmin ? (
            <Link href={logoHref} className="flex items-center gap-2.5 min-w-0 max-w-[170px] cursor-pointer group">
              {tenant.logoUrl ? (
                <img
                  src={getMinioUrl(tenant.logoUrl)}
                  alt={tenant.name}
                  className="h-9 w-9 rounded-xl object-contain shrink-0 bg-muted/40 p-1 border border-border shadow-2xs group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  {tenant.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors" title={tenant.name}>
                  {tenant.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium truncate">
                  {tenant.code || "Kurum Paneli"}
                </span>
              </div>
            </Link>
          ) : (
            <Link href={logoHref} className="shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95">
              <Logo className="w-32 text-primary" />
            </Link>
          )
        ) : (
          userTenantId > 0 && tenant && !isSuperAdmin ? (
            <Link href={logoHref} className="cursor-pointer" title={tenant.name}>
              {tenant.logoUrl ? (
                <img
                  src={getMinioUrl(tenant.logoUrl)}
                  alt={tenant.name}
                  className="h-8 w-8 rounded-lg object-contain bg-muted/40 p-0.5 border"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  {tenant.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </Link>
          ) : null
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed ? "mx-auto" : "ml-auto")}
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className={cn(
                  "flex items-center justify-center rounded-lg p-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </Link>
            );
          }

          return (
            <div
              key={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Link
                href={item.href}
                className="flex items-center flex-1 min-w-0 py-0.5"
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 mr-3 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>

              {item.canAdd && (
                <Link
                  href={item.addHref!}
                  title={item.addTitle || "Yeni Ekle"}
                  className={cn(
                    "shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-all ml-1.5",
                    isActive
                      ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/30 hover:scale-105 active:scale-95"
                      : "bg-muted/70 text-muted-foreground/75 hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 shadow-2xs"
                  )}
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
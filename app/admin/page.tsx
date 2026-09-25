"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTenants } from "@/hooks/useTenants";
import { useBranches } from "@/hooks/useBranches";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useCourses } from "@/hooks/useCourses";
import { usePayments } from "@/hooks/usePayments";
import { useStudentWallets } from "@/hooks/useStudentWallets";
import { useAttendances } from "@/hooks/useAttendances";
import { useFeeDues } from "@/hooks/useFeeDues";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Building2,
  GitFork,
  UserCog,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  BookOpen,
  ClipboardCheck,
  Banknote,
  Wallet,
  ArrowRight,
  Plus,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  CalendarDays,
  Coins,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { checkIsSuperAdmin, checkIsOnlyTeacher } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const isSuperAdmin = checkIsSuperAdmin(session?.user);
  const isOnlyTeacher = checkIsOnlyTeacher(session?.user);

  // Super Admin Verileri
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants();
  const { data: branchesData, isLoading: branchesLoading } = useBranches();
  const { query: usersQuery } = useUsers(1, 1);
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  // Kurum Sahibi & Öğretmen Verileri
  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const { data: teachersData, isLoading: teachersLoading } = useTeachers();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments();
  const { data: walletsData, isLoading: walletsLoading } = useStudentWallets();
  const { data: attendancesData, isLoading: attendancesLoading } = useAttendances();
  const { data: feeDuesData, isLoading: feeDuesLoading } = useFeeDues();

  // Sayısal Değerler
  const totalTenants = Array.isArray(tenantsData) ? tenantsData.length : 0;
  const totalBranches = Array.isArray(branchesData) ? branchesData.length : 0;
  const usersDataRaw = usersQuery.data;
  const totalUsers = (usersDataRaw as any)?.totalRecords ?? (usersDataRaw as any)?.TotalRecords ?? (Array.isArray(usersDataRaw) ? usersDataRaw.length : (usersDataRaw as any)?.data?.length ?? 0);
  const totalRoles = Array.isArray(rolesData) ? rolesData.length : 0;

  const students = Array.isArray(studentsData) ? studentsData : (studentsData as any)?.data || [];
  const teachers = Array.isArray(teachersData) ? teachersData : (teachersData as any)?.data || [];
  const courses = Array.isArray(coursesData) ? coursesData : (coursesData as any)?.data || [];
  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData as any)?.data || [];
  const wallets = Array.isArray(walletsData) ? walletsData : (walletsData as any)?.data || [];
  const attendances = Array.isArray(attendancesData) ? attendancesData : (attendancesData as any)?.data || [];
  const feeDues = Array.isArray(feeDuesData) ? feeDuesData : (feeDuesData as any)?.data || [];

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const totalWalletBalance = wallets.reduce((sum: number, w: any) => sum + (Number(w.balance) || 0), 0);

  // Bu Ayki Tahsilat & Beklenen Ödemeler Hesabı
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthName = now.toLocaleString("tr-TR", { month: "long" });

  const thisMonthFeeDues = feeDues.filter((f: any) => {
    if (f.period && f.period.startsWith(currentYearMonth)) return true;
    if (f.dueDate && f.dueDate.startsWith(currentYearMonth)) return true;
    return false;
  });

  const activeDuesForCalculation = thisMonthFeeDues.length > 0 ? thisMonthFeeDues : feeDues;
  const thisMonthTotalExpected = activeDuesForCalculation.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
  const thisMonthPaid = activeDuesForCalculation.reduce((sum: number, f: any) => sum + (Number(f.paidAmount) || 0), 0);
  const thisMonthRemaining = activeDuesForCalculation.reduce((sum: number, f: any) => {
    const rem = Number(f.remainingAmount);
    if (!isNaN(rem) && rem > 0) return sum + rem;
    const calculatedRem = (Number(f.amount) || 0) - (Number(f.paidAmount) || 0);
    return sum + (calculatedRem > 0 ? calculatedRem : 0);
  }, 0);

  const collectionRate = thisMonthTotalExpected > 0
    ? Math.min(100, Math.round((thisMonthPaid / thisMonthTotalExpected) * 100))
    : (payments.length > 0 ? 100 : 0);

  // Vadesi geçmiş (Geciken) aidatlar
  const todayStr = now.toISOString().slice(0, 10);
  const overdueDues = feeDues.filter((f: any) => {
    if (!f.dueDate) return false;
    const isPast = f.dueDate.slice(0, 10) < todayStr;
    const isUnpaid = f.status !== 2 && (Number(f.remainingAmount) > 0 || ((Number(f.amount) || 0) > (Number(f.paidAmount) || 0)));
    return isPast && isUnpaid;
  });
  const overdueTotalAmount = overdueDues.reduce((sum: number, f: any) => sum + (Number(f.remainingAmount) || ((Number(f.amount) || 0) - (Number(f.paidAmount) || 0))), 0);

  const recentPayments = [...payments].slice(0, 5);
  const recentAttendances = [...attendances].slice(0, 5);
  const recentTenants = Array.isArray(tenantsData) ? [...tenantsData].slice(0, 5) : [];

  // =========================================================================
  // 1. SUPER ADMIN DASHBOARD GÖRÜNÜMÜ
  // =========================================================================
  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Sistem Yönetim Özeti</h1>
            <p className="text-sm text-muted-foreground">Kursum | Eğitim Kurumları Bilgi ve Yönetim Sistemi platform özeti.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/tenants?action=new">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-4 w-4 text-primary" /> Yeni Kurum Ekle
              </Button>
            </Link>
            <Link href="/admin/users?action=new">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Yeni Kullanıcı Ekle
              </Button>
            </Link>
          </div>
        </div>

        {/* Super Admin İstatistik Kartları */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kurumlar / Okullar</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalTenants}</div>
                  <p className="text-xs text-muted-foreground mt-1">Kayıtlı ana kurum sayısı</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Şubeler</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <GitFork className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {branchesLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalBranches}</div>
                  <p className="text-xs text-muted-foreground mt-1">Kurumlara bağlı alt şubeler</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem Kullanıcıları</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <UserCog className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {usersQuery.isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tanımlı kullanıcı hesabı</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roller & İzinler</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalRoles}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tanımlı erişim grupları</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Son Kurumlar & Hızlı Kısayollar */}
        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 lg:col-span-5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Kayıtlı Kurumlar
                </CardTitle>
                <CardDescription>Sistemde tanımlı olan kurumlar ve durumları</CardDescription>
              </div>
              <Link href="/admin/tenants">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                  Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : recentTenants.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Henüz kurum bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kurum Adı</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Yetkili</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTenants.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-semibold text-sm">
                            <Link href="/admin/tenants" className="hover:underline text-primary">
                              {t.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {t.phoneNumber || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {t.authorizedPerson || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={t.isActive !== false ? "default" : "secondary"}>
                              {t.isActive !== false ? "Aktif" : "Pasif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SuperAdmin Kısayolları */}
          <Card className="md:col-span-3 lg:col-span-2 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Hızlı İşlemler</CardTitle>
              <CardDescription>Platform yönetim kısayolları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/admin/tenants"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-primary transition">Kurum Yönetimi</div>
                    <div className="text-xs text-muted-foreground">{totalTenants} kayıtlı kurum</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <UserCog className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-primary transition">Kullanıcı İşlemleri</div>
                    <div className="text-xs text-muted-foreground">{totalUsers} sistem kullanıcısı</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>

              <Link
                href="/admin/roles"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-primary transition">Roller & Yetkiler</div>
                    <div className="text-xs text-muted-foreground">{totalRoles} tanımlı grup</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. ÖĞRETMEN DASHBOARD GÖRÜNÜMÜ (Sadece Öğretmen Rolü)
  // =========================================================================
  if (isOnlyTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Öğretmen Paneli</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Öğretmen Çalışma Paneli</h1>
            <p className="text-sm text-muted-foreground">Kursum Akademik Bilgi ve Devam Takip Sistemi.</p>
          </div>

          <Link href="/admin/attendances?action=new">
            <Button size="lg" className="gap-2 shadow-sm font-semibold">
              <ClipboardCheck className="h-5 w-5" /> Hemen Yoklama Al
            </Button>
          </Link>
        </div>

        {/* Öğretmen İstatistik Kartları */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kayıtlı Kurslar / Dersler</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <BookOpen className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tanımlı aktif ders sayısı</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <GraduationCap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{students.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Kayıtlı öğrenci mevcudu</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alınan Son Yoklamalar</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {attendancesLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{attendances.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">İşlenen yoklama kaydı</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Öğretmen Kursları & Son Yoklamalar */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Kurslar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Aktif Dersler & Sınıflar
                </CardTitle>
                <CardDescription>Sorumlu olduğunuz ders programı</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Henüz tanımlı ders bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition">
                      <div>
                        <div className="font-semibold text-sm">{c.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{c.branchName || "Ana Şube"}</span>
                          {c.code && <span>• Kod: {c.code}</span>}
                        </div>
                      </div>
                      <Link href="/admin/attendances?action=new">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Yoklama Al
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Son Yoklamalar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Son Alınan Yoklamalar
                </CardTitle>
                <CardDescription>En son işlenen yoklama çizelgeleri</CardDescription>
              </div>
              <Link href="/admin/attendances">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                  Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {attendancesLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : recentAttendances.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Henüz yoklama kaydı bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentAttendances.map((att: any) => (
                    <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{att.courseName || `Ders #${att.courseId}`}</div>
                          <div className="text-xs text-muted-foreground">
                            {att.attendanceDate ? new Date(att.attendanceDate).toLocaleDateString("tr-TR") : "-"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-muted/40">
                        {att.status || "Tamamlandı"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. KURUM SAHİBİ / ANA YÖNETİCİ DASHBOARD GÖRÜNÜMÜ
  // =========================================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Kurum Yönetim Özeti</h1>
          <p className="text-sm text-muted-foreground">Kursum | Eğitim Kurumları Bilgi ve Yönetim Sistemi operasyonel durum özeti.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/attendances?action=new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Yoklama Al
            </Button>
          </Link>
          <Link href="/admin/payments?action=new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Banknote className="h-4 w-4 text-emerald-600" /> Tahsilat Gir
            </Button>
          </Link>
          <Link href="/admin/students?action=new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Yeni Öğrenci
            </Button>
          </Link>
        </div>
      </div>

      {/* Kurum Sahibi İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Toplam Öğrenci */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <GraduationCap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Kayıtlı aktif öğrenci</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Toplam Öğretmen */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Öğretmen Kadrosu</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {teachersLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{teachers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Aktif eğitmen sayısı</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Toplam Tahsilat */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tahsilat</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Banknote className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalRevenue)}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  {payments.length} adet işlem kaydedildi
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Kantin & Cüzdan */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kantin & Cüzdan</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {walletsLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalWalletBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Öğrenci kartlarındaki toplam bakiye</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bu Ay Beklenen Ödemeler & Nakit Akışı Özeti */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.03] via-card to-background">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Coins className="h-5 w-5" />
                {currentMonthName.toUpperCase()} Ayı Beklenen Ödeme & Tahsilat Durumu
              </CardTitle>
              <CardDescription>
                Bu ay vadesi gelen taksit / aidat planı ve gerçekleşen tahsilat durumu
              </CardDescription>
            </div>
            {overdueDues.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                <AlertTriangle className="h-3.5 w-3.5" />
                {overdueDues.length} Gecikmiş Taksit ({new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(overdueTotalAmount)})
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {feeDuesLoading ? (
            <div className="py-4 flex justify-center">
              <Spinner size="default" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Beklenen Toplam */}
                <div className="p-3.5 rounded-lg border bg-card/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    Bu Ay Beklenen Toplam
                  </div>
                  <div className="text-xl font-bold mt-1 text-foreground">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(thisMonthTotalExpected)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {activeDuesForCalculation.length} taksit / aidat kaydı
                  </div>
                </div>

                {/* Tahsil Edilen */}
                <div className="p-3.5 rounded-lg border bg-card/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Bu Ay Tahsil Edilen
                  </div>
                  <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(thisMonthPaid)}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    %{collectionRate} Tahsilat Gerçekleşti
                  </div>
                </div>

                {/* Kalan Alacak */}
                <div className="p-3.5 rounded-lg border bg-card/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Kalan Beklenen Tahsilat
                  </div>
                  <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(thisMonthRemaining)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Ay sonuna kadar tahsil edilecek
                  </div>
                </div>
              </div>

              {/* İlerleme Barı */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tahsilat Gerçekleşme Oranı</span>
                  <span className="font-semibold text-foreground">%{collectionRate}</span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detay Tabloları & Hızlı İşlemler */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Son Tahsilatlar Tablosu */}
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Son Gelen Tahsilatlar
              </CardTitle>
              <CardDescription>Öğrencilerden alınan son ödeme ve aidat hareketleri</CardDescription>
            </div>
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Henüz tahsilat kaydı bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Öğrenci</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((p: any) => {
                      const studentName = p.studentName || (p.studentId ? `Öğrenci #${p.studentId}` : "Genel Ödeme");
                      const dateVal = p.paymentDate || p.createdAt || p.createdDate;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-semibold text-sm">
                            <Link href="/admin/payments" className="hover:underline text-primary">
                              {studentName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {dateVal ? new Date(dateVal).toLocaleDateString("tr-TR") : "-"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.amount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Tahsil Edildi
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hızlı İşlemler & Kısayollar */}
        <Card className="md:col-span-3 lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Hızlı İşlemler</CardTitle>
            <CardDescription>Sık kullanılan kurum sayfaları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/attendances"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-primary transition">Yoklama & Devam</div>
                  <div className="text-xs text-muted-foreground">{attendances.length} yoklama kaydı</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>

            <Link
              href="/admin/courses"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-primary transition">Kurslar & Dersler</div>
                  <div className="text-xs text-muted-foreground">{courses.length} aktif sınıf</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>

            <Link
              href="/admin/wallet"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-primary transition">Kantin & Cüzdan</div>
                  <div className="text-xs text-muted-foreground">Bakiye yükleme & harcamalar</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          </CardContent>
          <div className="p-4 border-t bg-muted/20 text-xs text-muted-foreground rounded-b-lg flex items-center justify-between">
            <span>Tanımlı Şube Sayısı: <span className="font-semibold text-foreground">{branchesLoading ? "..." : totalBranches}</span></span>
            <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
}


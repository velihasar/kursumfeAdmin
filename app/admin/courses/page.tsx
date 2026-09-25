"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  CreditCard,
  Edit2,
  Trash2,
  Filter,
  UserCheck,
  Building2,
  Sparkles,
  Layers,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, checkIsSuperAdmin } from "@/lib/utils";
import {
  CourseGetAllDto,
} from "@/types/course.types";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "@/hooks/useCourses";
import { useCourseEnrollments } from "@/hooks/useCourseEnrollments";
import { useTeachers } from "@/hooks/useTeachers";
import { useTenants } from "@/hooks/useTenants";
import { useBranches } from "@/hooks/useBranches";
import { CourseEnrollmentsDialog } from "@/components/admin/course-enrollments-dialog";

const DAYS_OF_WEEK_LIST = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function CoursesContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Role & Tenant
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // Queries
  const { data: courses, isLoading: isLoadingCourses, refetch: refetchCourses } = useCourses(
    !isSuperAdmin && userTenantId > 0 ? { tenantId: userTenantId } : undefined
  );
  const { data: enrollments, refetch: refetchEnrollments } = useCourseEnrollments(
    !isSuperAdmin && userTenantId > 0 ? { tenantId: userTenantId } : undefined
  );
  const { data: teachers } = useTeachers(
    !isSuperAdmin && userTenantId > 0 ? { tenantId: userTenantId } : undefined
  );
  const { data: branches } = useBranches(
    !isSuperAdmin && userTenantId > 0 ? { tenantId: userTenantId } : undefined
  );
  const { data: tenants } = useTenants();

  // Mutations
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>("all");

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseGetAllDto | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<CourseGetAllDto | null>(null);
  const [selectedCourseForEnrollments, setSelectedCourseForEnrollments] = useState<CourseGetAllDto | null>(null);

  // Form Fields
  const [formTenantId, setFormTenantId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [feeType, setFeeType] = useState<string>("1");
  const [capacity, setCapacity] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [teacherId, setTeacherId] = useState<string>("none");

  // Auto-open new modal if action=new in URL query
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedCourse(null);
    const initialTenant = userTenantId > 0 ? String(userTenantId) : (tenants && tenants.length > 0 ? String(tenants[0].id) : "");
    setFormTenantId(initialTenant);
    setBranchId("none");
    setName("");
    setCode("");
    setDescription("");
    setPrice("");
    setFeeType("1");
    setCapacity("20");
    setSelectedDays(["Pazartesi", "Çarşamba", "Cuma"]);
    setStartTime("14:00");
    setEndTime("15:30");
    setTeacherId("none");
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (course: CourseGetAllDto) => {
    setSelectedCourse(course);
    setFormTenantId(String(course.tenantId || userTenantId || (tenants && tenants.length > 0 ? tenants[0].id : "")));
    setBranchId(course.branchId ? String(course.branchId) : "none");
    setName(course.name || "");
    setCode(course.code || "");
    setDescription(course.description || "");
    setPrice(String(course.price || ""));
    setFeeType(String(course.feeType || "1"));
    setCapacity(course.capacity ? String(course.capacity) : "");
    
    // Parse days
    const daysArr = course.daysOfWeek
      ? course.daysOfWeek.split(",").map((d) => d.trim()).filter(Boolean)
      : [];
    setSelectedDays(daysArr);

    setStartTime(course.startTime || "09:00");
    setEndTime(course.endTime || "10:30");
    setTeacherId(course.teacherId ? String(course.teacherId) : "none");
    setIsFormOpen(true);
  };

  // Toggle Day Chip
  const handleToggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Handle Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Lütfen kurs/ders adını giriniz.");
      return;
    }

    const targetTenant = formTenantId
      ? Number(formTenantId)
      : (userTenantId > 0
          ? userTenantId
          : (tenants && tenants.length > 0 ? tenants[0].id : undefined));

    if (isSuperAdmin && (!targetTenant || targetTenant <= 0)) {
      toast.error("Lütfen bir kurum/okul seçiniz.");
      return;
    }

    try {
      const payload = {
        tenantId: targetTenant,
        branchId: branchId !== "none" ? Number(branchId) : undefined,
        name: name.trim(),
        code: code.trim() || `CRS-${Math.floor(1000 + Math.random() * 9000)}`,
        description: description.trim() || undefined,
        price: Number(price) || 0,
        feeType: Number(feeType) || 1,
        capacity: capacity ? Number(capacity) : undefined,
        daysOfWeek: selectedDays.join(", ") || undefined,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        teacherId: teacherId !== "none" ? Number(teacherId) : undefined,
      };

      if (selectedCourse) {
        // Update
        await updateMutation.mutateAsync({
          id: selectedCourse.id,
          ...payload,
        });
        toast.success("Kurs bilgileri başarıyla güncellendi.");
      } else {
        // Create
        await createMutation.mutateAsync(payload);
        toast.success("Yeni kurs başarıyla oluşturuldu.");
      }

      setIsFormOpen(false);
      refetchCourses();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Kurs kaydedilirken bir hata oluştu."));
    }
  };

  // Handle Delete Course
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: courseToDelete.id });
      toast.success("Kurs başarıyla silindi.");
      setCourseToDelete(null);
      refetchCourses();
      refetchEnrollments();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Kurs silinirken hata oluştu."));
    }
  };

  // Filtering
  const filteredCourses = (courses || []).filter((c) => {
    // Search query
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.branchName && c.branchName.toLowerCase().includes(q)) ||
      (c.teacherName && c.teacherName.toLowerCase().includes(q)) ||
      (c.daysOfWeek && c.daysOfWeek.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Tenant Filter
    if (tenantFilter !== "all" && String(c.tenantId) !== tenantFilter) {
      return false;
    }

    // Branch Filter
    if (branchFilter !== "all" && String(c.branchId) !== branchFilter) {
      return false;
    }

    // Teacher Filter
    if (teacherFilter !== "all" && String(c.teacherId) !== teacherFilter) {
      return false;
    }

    // Fee Type Filter
    if (feeTypeFilter !== "all" && String(c.feeType) !== feeTypeFilter) {
      return false;
    }

    return true;
  });

  // Calculate Summary Stats
  const totalCourses = courses?.length || 0;
  const totalEnrollments = enrollments?.length || 0;
  const totalCapacity = (courses || []).reduce((acc, c) => acc + (c.capacity || 0), 0);
  const totalTeachersAssigned = new Set((courses || []).map((c) => c.teacherId).filter(Boolean)).size;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
            Kurs & Ders Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kurumdaki kursları, ders programlarını, kontenjanları ve kursiyer kayıtlarını yönetin.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm shrink-0">
          <Plus className="h-4 w-4" />
          Yeni Kurs Ekle
        </Button>
      </div>

      {/* Metrics / Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Toplam Kurs / Ders
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{totalCourses}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sistemde tanımlı kurs</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Toplam Kursiyer Kaydı
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalEnrollments}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Aktif ve kayıtlı öğrenci</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Toplam Kontenjan Kapasitesi
            </CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalCapacity}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Maksimum öğrenci kapasitesi</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Görevli Eğitmenler
            </CardTitle>
            <UserCheck className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {totalTeachersAssigned}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Kurslara atanan öğretmen</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kurs ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {isSuperAdmin && (
                <Select value={tenantFilter} onValueChange={(val) => setTenantFilter(val || "all")}>
                  <SelectTrigger className="h-9 text-xs w-[160px]">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Tüm Kurumlar">
                      {tenantFilter === "all"
                        ? "Tüm Kurumlar"
                        : tenants?.find((t) => String(t.id) === tenantFilter)?.name || "Kurum Seçildi"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tüm Kurumlar</SelectItem>
                    {(tenants || []).map((t) => (
                      <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={branchFilter} onValueChange={(val) => setBranchFilter(val || "all")}>
                <SelectTrigger className="h-9 text-xs w-[150px]">
                  <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Tüm Şubeler">
                    {branchFilter === "all"
                      ? "Tüm Şubeler"
                      : (() => {
                          const br = branches?.find((b) => String(b.id) === branchFilter);
                          return br ? br.name : "Şube Seçildi";
                        })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Şubeler</SelectItem>
                  {(branches || []).map((b) => (
                    <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={teacherFilter} onValueChange={(val) => setTeacherFilter(val || "all")}>
                <SelectTrigger className="h-9 text-xs w-[150px]">
                  <UserCheck className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Tüm Eğitmenler">
                    {teacherFilter === "all"
                      ? "Tüm Eğitmenler"
                      : (() => {
                          const tc = teachers?.find((t) => String(t.id) === teacherFilter);
                          return tc ? `${tc.firstName} ${tc.lastName}` : "Eğitmen Seçildi";
                        })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Eğitmenler</SelectItem>
                  {(teachers || []).map((tc) => (
                    <SelectItem key={tc.id} value={String(tc.id)} className="text-xs">
                      {tc.firstName} {tc.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={feeTypeFilter} onValueChange={(val) => setFeeTypeFilter(val || "all")}>
                <SelectTrigger className="h-9 text-xs w-[130px]">
                  <CreditCard className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Ödeme Tipi">
                    {feeTypeFilter === "all" ? "Tüm Tipler" : feeTypeFilter === "1" ? "Aylık Ödeme" : "Toplam Ücret"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Tipler</SelectItem>
                  <SelectItem value="1" className="text-xs">Aylık</SelectItem>
                  <SelectItem value="2" className="text-xs">Toplam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingCourses ? (
            <div className="py-20 text-center text-xs text-muted-foreground">
              Kurslar yükleniyor...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchTerm || tenantFilter !== "all" || branchFilter !== "all" || teacherFilter !== "all"
                  ? "Filtre kriterlerine uygun kurs bulunamadı."
                  : "Henüz kayıtlı bir kurs bulunmamaktadır."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreate}
                className="mt-4 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Yeni Kurs Oluştur
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Kurs / Ders</TableHead>
                    {isSuperAdmin && <TableHead className="text-xs">Kurum</TableHead>}
                    <TableHead className="text-xs">Şube</TableHead>
                    <TableHead className="text-xs">Eğitmen</TableHead>
                    <TableHead className="text-xs">Ders Günleri & Saat</TableHead>
                    <TableHead className="text-xs">Standart Ücret</TableHead>
                    <TableHead className="text-xs">Kontenjan / Doluluk</TableHead>
                    <TableHead className="text-right text-xs">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((c) => {
                    const enrolledCount = (enrollments || []).filter((e) => e.courseId === c.id).length;
                    const cap = c.capacity || 0;
                    const fillPercent = cap > 0 ? Math.min(Math.round((enrolledCount / cap) * 100), 100) : 0;

                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30">
                        {/* Course Name & Code */}
                        <TableCell className="font-medium text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{c.name}</span>
                              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                                {c.code}
                              </Badge>
                            </div>
                            {c.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Tenant (if SuperAdmin) */}
                        {isSuperAdmin && (
                          <TableCell className="text-xs text-muted-foreground">
                            {c.tenantName || (tenants?.find((t) => t.id === c.tenantId)?.name) || `#${c.tenantId}`}
                          </TableCell>
                        )}

                        {/* Branch */}
                        <TableCell className="text-xs">
                          {c.branchName ? (
                            <Badge variant="outline" className="text-[10px] font-normal bg-muted/30 gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {c.branchName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px] italic">
                              Genel / Tümü
                            </span>
                          )}
                        </TableCell>

                        {/* Teacher */}
                        <TableCell className="text-xs">
                          {c.teacherName ? (
                            <span className="font-medium text-foreground flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-primary" />
                              {c.teacherName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px] italic">
                              Atanmadı
                            </span>
                          )}
                        </TableCell>

                        {/* Schedule & Days */}
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="space-y-1">
                            {c.daysOfWeek ? (
                              <div className="flex items-center gap-1 text-[11px] text-foreground font-medium flex-wrap">
                                <Calendar className="h-3 w-3 text-primary shrink-0" />
                                <span>{c.daysOfWeek}</span>
                              </div>
                            ) : null}
                            {c.startTime && c.endTime ? (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{c.startTime} - {c.endTime}</span>
                              </div>
                            ) : null}
                            {!c.daysOfWeek && !c.startTime && (
                              <span className="text-[11px] text-muted-foreground italic">Belirtilmedi</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Price & Fee Type */}
                        <TableCell className="text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground">
                              ₺{Number(c.price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                            <div>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 font-normal"
                              >
                                {c.feeType === 1 ? "Aylık Ödeme" : "Toplam Ücret"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {/* Capacity / Fill rate */}
                        <TableCell className="text-xs">
                          <div className="space-y-1.5 min-w-[120px] max-w-[150px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-foreground">
                                {enrolledCount} {cap > 0 ? `/ ${cap}` : "Öğrenci"}
                              </span>
                              {cap > 0 && (
                                <span className="text-muted-foreground text-[10px]">
                                  %{fillPercent}
                                </span>
                              )}
                            </div>
                            {cap > 0 && (
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    fillPercent >= 100
                                      ? "bg-rose-500"
                                      : fillPercent >= 75
                                      ? "bg-amber-500"
                                      : "bg-primary"
                                  }`}
                                  style={{ width: `${fillPercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCourseForEnrollments(c)}
                              title="Kursiyerleri Yönet"
                              className="h-8 px-2.5 text-xs gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Kursiyerler</span>
                              <Badge className="h-4.5 px-1 text-[10px] bg-primary text-primary-foreground ml-0.5">
                                {enrolledCount}
                              </Badge>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(c)}
                              title="Düzenle"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCourseToDelete(c)}
                              title="Sil"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      {/* Course Enrollments Dialog */}
      <CourseEnrollmentsDialog
        isOpen={!!selectedCourseForEnrollments}
        onClose={() => setSelectedCourseForEnrollments(null)}
        course={selectedCourseForEnrollments}
        tenantId={!isSuperAdmin && userTenantId > 0 ? userTenantId : undefined}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>{selectedCourse ? "Kursu Düzenle" : "Yeni Kurs / Ders Ekle"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kursun adını, ders programını, fiyatlandırmasını ve eğitmenini belirleyin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* SuperAdmin Tenant Selection */}
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <Label htmlFor="c-tenant" className="text-xs">Kurum / Okul *</Label>
                <Select value={formTenantId} onValueChange={(val) => setFormTenantId(val || "")}>
                  <SelectTrigger id="c-tenant" className="h-9 text-xs">
                    <SelectValue placeholder="Kurum seçiniz...">
                      {tenants?.find((t) => String(t.id) === formTenantId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(tenants || []).map((t) => (
                      <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Course Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="c-name" className="text-xs">Kurs / Ders Adı *</Label>
                <Input
                  id="c-name"
                  placeholder="Ders adını giriniz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-code" className="text-xs">Kurs Kodu</Label>
                <Input
                  id="c-code"
                  placeholder="Kurs kodunu giriniz"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="c-desc" className="text-xs">Kurs Açıklaması</Label>
              <Textarea
                id="c-desc"
                rows={2}
                placeholder="Kurs açıklamasını giriniz..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            {/* Branch and Teacher Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-branch" className="text-xs">Şube (Opsiyonel)</Label>
                <Select value={branchId} onValueChange={(val) => setBranchId(val || "none")}>
                  <SelectTrigger id="c-branch" className="h-9 text-xs">
                    <SelectValue placeholder="Şube seçiniz...">
                      {branchId === "none"
                        ? "-- Genel / Şube Yok --"
                        : (() => {
                            const br = branches?.find((b) => String(b.id) === branchId);
                            return br ? br.name : "-- Genel / Şube Yok --";
                          })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs italic text-muted-foreground">
                      -- Genel / Şube Yok --
                    </SelectItem>
                    {(branches || [])
                      .filter((b) => !formTenantId || String(b.tenantId) === formTenantId)
                      .map((b) => (
                        <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                          {b.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-teacher" className="text-xs">Görevli Eğitmen</Label>
                <Select value={teacherId} onValueChange={(val) => setTeacherId(val || "none")}>
                  <SelectTrigger id="c-teacher" className="h-9 text-xs">
                    <SelectValue placeholder="Eğitmen seçiniz...">
                      {teacherId === "none"
                        ? "-- Eğitmen Seçilmedi --"
                        : (() => {
                            const tc = teachers?.find((t) => String(t.id) === teacherId);
                            return tc ? `${tc.firstName} ${tc.lastName}` : "-- Eğitmen Seçilmedi --";
                          })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs italic text-muted-foreground">
                      -- Eğitmen Seçilmedi --
                    </SelectItem>
                    {(teachers || [])
                      .filter((tc) => !formTenantId || String(tc.tenantId) === formTenantId)
                      .map((tc) => (
                        <SelectItem key={tc.id} value={String(tc.id)} className="text-xs">
                          {tc.firstName} {tc.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing & Fee Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
              <div className="space-y-1.5">
                <Label htmlFor="c-price" className="text-xs font-semibold">Standart Ücret (₺) *</Label>
                <Input
                  id="c-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-9 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-feeType" className="text-xs">Ödeme Tipi</Label>
                <Select value={feeType} onValueChange={(val) => setFeeType(val || "1")}>
                  <SelectTrigger id="c-feeType" className="h-9 text-xs">
                    <SelectValue>
                      {feeType === "1" ? "Aylık Ödeme" : "Toplam / Dönemlik"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" className="text-xs">Aylık Ödeme</SelectItem>
                    <SelectItem value="2" className="text-xs">Toplam / Dönemlik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-capacity" className="text-xs">Kontenjan Kapasitesi</Label>
                <Input
                  id="c-capacity"
                  type="number"
                  min="1"
                  placeholder="Kontenjan giriniz"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Schedule: Days of Week */}
            <div className="space-y-2">
              <Label className="text-xs">Ders Günleri</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK_LIST.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-start" className="text-xs">Başlangıç Saati</Label>
                <Input
                  id="c-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-end" className="text-xs">Bitiş Saati</Label>
                <Input
                  id="c-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="text-xs"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="text-xs gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                {createMutation.isPending || updateMutation.isPending
                  ? "Kaydediliyor..."
                  : selectedCourse
                  ? "Değişiklikleri Kaydet"
                  : "Kursu Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Kursu Sil
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              <span className="font-semibold text-foreground">{courseToDelete?.name}</span> isimli kursu silmek istediğinize emin misiniz? Bu işlem kursiyer kayıtlarını da etkileyebilir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCourseToDelete(null)}
              className="text-xs"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteMutation.isPending ? "Siliniyor..." : "Evet, Kursu Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Yükleniyor...</div>}>
      <CoursesContent />
    </Suspense>
  );
}

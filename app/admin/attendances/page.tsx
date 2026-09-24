"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Calendar as CalendarIcon,
  BookOpen,
  UserCheck,
  Users,
  Building2,
  Filter,
  Trash2,
  Edit2,
  AlertCircle,
  Save,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, checkIsSuperAdmin } from "@/lib/utils";
import {
  AttendanceGetAllDto,
  CreateAttendanceCommand,
  UpdateAttendanceCommand,
} from "@/types/attendance.types";
import {
  useAttendances,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from "@/hooks/useAttendances";
import { useCourses } from "@/hooks/useCourses";
import { useCourseEnrollments } from "@/hooks/useCourseEnrollments";
import { useTenants } from "@/hooks/useTenants";
import { AttendanceDatePicker, parseCourseDays } from "@/components/admin/attendance-date-picker";

interface StudentAttendanceState {
  studentId: number;
  studentName: string;
  isPresent: boolean;
  reason: string;
  existingId?: number;
}

function AttendancesContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"take" | "history">("take");

  // Filter States
  const [selectedTenantId, setSelectedTenantId] = useState<number>(
    !isSuperAdmin && userTenantId > 0 ? userTenantId : 0
  );
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // History Tab Filters
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("ALL");
  const [historyCourseFilter, setHistoryCourseFilter] = useState<number>(0);

  // Edit / Delete State for History
  const [editingAttendance, setEditingAttendance] = useState<AttendanceGetAllDto | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ isPresent: boolean; reason: string }>({
    isPresent: true,
    reason: "",
  });

  const [deletingAttendance, setDeletingAttendance] = useState<AttendanceGetAllDto | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Queries
  const { data: tenants } = useTenants();
  const { data: courses, isLoading: isLoadingCourses } = useCourses(
    selectedTenantId > 0 ? { tenantId: selectedTenantId } : undefined
  );

  const selectedCourseObj = useMemo(
    () => courses?.find((c) => c.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  // All attendances query
  const {
    data: attendances,
    isLoading: isLoadingAttendances,
    refetch: refetchAttendances,
  } = useAttendances(
    selectedTenantId > 0 ? { tenantId: selectedTenantId } : undefined
  );

  // Enrollments for selected course
  const {
    data: courseEnrollments,
    isLoading: isLoadingEnrollments,
  } = useCourseEnrollments(
    selectedCourseId > 0 ? { courseId: selectedCourseId } : undefined
  );

  // Mutations
  const createAttendanceMutation = useCreateAttendance();
  const updateAttendanceMutation = useUpdateAttendance();
  const deleteAttendanceMutation = useDeleteAttendance();
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // State for "Take Attendance" Sheet
  const [attendanceSheet, setAttendanceSheet] = useState<StudentAttendanceState[]>([]);

  // Auto-select initial tenant
  useEffect(() => {
    if (!isSuperAdmin && userTenantId > 0) {
      setSelectedTenantId(userTenantId);
    } else if (isSuperAdmin && tenants && tenants.length > 0 && selectedTenantId === 0) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isSuperAdmin, userTenantId, tenants, selectedTenantId]);

  // Select Item options for Base UI dropdowns
  const tenantSelectItems = useMemo(() => {
    return (
      tenants?.map((t) => ({
        value: t.id.toString(),
        label: t.name,
      })) || []
    );
  }, [tenants]);

  const courseSelectItems = useMemo(() => {
    return (
      courses?.map((c) => ({
        value: c.id.toString(),
        label: `${c.name}${c.code ? ` (${c.code})` : ""}`,
      })) || []
    );
  }, [courses]);

  const historyCourseSelectItems = useMemo(() => {
    return [
      { value: "ALL", label: "Tüm Kurslar" },
      ...(courses?.map((c) => ({
        value: c.id.toString(),
        label: c.name,
      })) || []),
    ];
  }, [courses]);

  const historyStatusSelectItems = useMemo(
    () => [
      { value: "ALL", label: "Tüm Durumlar" },
      { value: "PRESENT", label: "Sadece Katılanlar (Geldi)" },
      { value: "ABSENT", label: "Sadece Devamsızlar (Gelmedi)" },
    ],
    []
  );

  // Auto-switch to most recent valid course date if selected course has daysOfWeek
  useEffect(() => {
    if (!selectedCourseObj?.daysOfWeek) return;
    const allowed = parseCourseDays(selectedCourseObj.daysOfWeek);
    if (!allowed.length) return;

    const currentD = new Date(attendanceDate + "T00:00:00");
    if (!isNaN(currentD.getTime()) && !allowed.includes(currentD.getDay())) {
      // Find latest valid date starting from today
      const today = new Date();
      const runner = new Date(today);
      for (let i = 0; i < 7; i++) {
        if (allowed.includes(runner.getDay())) {
          const yyyy = runner.getFullYear();
          const mm = String(runner.getMonth() + 1).padStart(2, "0");
          const dd = String(runner.getDate()).padStart(2, "0");
          setAttendanceDate(`${yyyy}-${mm}-${dd}`);
          break;
        }
        runner.setDate(runner.getDate() - 1);
      }
    }
  }, [selectedCourseId, selectedCourseObj]);

  // Handle URL query action
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      setActiveTab("take");
    }
  }, [searchParams]);

  // Filter active enrolled students for current course
  const activeEnrolledStudents = useMemo(() => {
    if (!courseEnrollments) return [];
    return courseEnrollments.filter((e) => e.status === 1); // 1: Aktif
  }, [courseEnrollments]);

  // Synchronize Attendance Sheet when Course, Date, or Enrollments change
  useEffect(() => {
    if (selectedCourseId <= 0 || !activeEnrolledStudents.length) {
      setAttendanceSheet([]);
      return;
    }

    // Existing attendances for this course & date
    const existingMap = new Map<number, AttendanceGetAllDto>();
    if (attendances) {
      attendances
        .filter(
          (a) =>
            a.courseId === selectedCourseId &&
            a.attendanceDate &&
            a.attendanceDate.startsWith(attendanceDate)
        )
        .forEach((a) => existingMap.set(a.studentId, a));
    }

    const initialSheet: StudentAttendanceState[] = activeEnrolledStudents.map((enrollment) => {
      const existing = existingMap.get(enrollment.studentId);
      if (existing) {
        return {
          studentId: enrollment.studentId,
          studentName: enrollment.studentName || `Öğrenci #${enrollment.studentId}`,
          isPresent: existing.isPresent,
          reason: existing.reason || "",
          existingId: existing.id,
        };
      }
      return {
        studentId: enrollment.studentId,
        studentName: enrollment.studentName || `Öğrenci #${enrollment.studentId}`,
        isPresent: true, // Default present
        reason: "",
      };
    });

    setAttendanceSheet(initialSheet);
  }, [selectedCourseId, attendanceDate, activeEnrolledStudents, attendances]);

  // Bulk Status Updaters
  const handleSetAll = (isPresent: boolean) => {
    setAttendanceSheet((prev) =>
      prev.map((item) => ({ ...item, isPresent, reason: isPresent ? "" : item.reason }))
    );
  };

  const handleStudentStatusChange = (studentId: number, isPresent: boolean) => {
    setAttendanceSheet((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, isPresent } : item))
    );
  };

  const handleStudentReasonChange = (studentId: number, reason: string) => {
    setAttendanceSheet((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, reason } : item))
    );
  };

  // Save All Attendance Sheet
  const handleSaveAttendance = async () => {
    if (selectedCourseId <= 0) {
      toast.error("Lütfen önce bir kurs/ders seçiniz.");
      return;
    }
    if (!attendanceDate) {
      toast.error("Lütfen geçerli bir tarih seçiniz.");
      return;
    }
    if (attendanceSheet.length === 0) {
      toast.error("Bu kursa kayıtlı aktif öğrenci bulunamadı.");
      return;
    }

    setIsSavingBulk(true);
    try {
      const promises = attendanceSheet.map((item) => {
        if (item.existingId && item.existingId > 0) {
          // Update
          const updateCmd: UpdateAttendanceCommand = {
            id: item.existingId,
            tenantId: selectedTenantId,
            courseId: selectedCourseId,
            studentId: item.studentId,
            attendanceDate: `${attendanceDate}T00:00:00`,
            isPresent: item.isPresent,
            reason: item.reason?.trim() || undefined,
          };
          return updateAttendanceMutation.mutateAsync(updateCmd);
        } else {
          // Create
          const createCmd: CreateAttendanceCommand = {
            tenantId: selectedTenantId,
            courseId: selectedCourseId,
            studentId: item.studentId,
            attendanceDate: `${attendanceDate}T00:00:00`,
            isPresent: item.isPresent,
            reason: item.reason?.trim() || undefined,
          };
          return createAttendanceMutation.mutateAsync(createCmd);
        }
      });

      await Promise.all(promises);
      toast.success("Yoklama başarıyla kaydedildi!");
      refetchAttendances();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Yoklama kaydedilirken hata oluştu."));
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Edit single from History
  const handleOpenEdit = (att: AttendanceGetAllDto) => {
    setEditingAttendance(att);
    setEditForm({
      isPresent: att.isPresent,
      reason: att.reason || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAttendance) return;
    try {
      await updateAttendanceMutation.mutateAsync({
        id: editingAttendance.id,
        tenantId: editingAttendance.tenantId,
        courseId: editingAttendance.courseId,
        studentId: editingAttendance.studentId,
        attendanceDate: editingAttendance.attendanceDate,
        isPresent: editForm.isPresent,
        reason: editForm.reason?.trim() || undefined,
      });
      toast.success("Yoklama kaydı güncellendi.");
      setIsEditOpen(false);
      refetchAttendances();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Güncelleme başarısız oldu."));
    }
  };

  // Delete single from History
  const handleDelete = async () => {
    if (!deletingAttendance) return;
    try {
      await deleteAttendanceMutation.mutateAsync({ id: deletingAttendance.id });
      toast.success("Yoklama kaydı silindi.");
      setIsDeleteOpen(false);
      refetchAttendances();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Silme işlemi başarısız oldu."));
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    if (!attendances || attendances.length === 0) {
      return { total: 0, present: 0, absent: 0, rate: 0 };
    }
    const total = attendances.length;
    const present = attendances.filter((a) => a.isPresent).length;
    const absent = total - present;
    const rate = Math.round((present / total) * 100);
    return { total, present, absent, rate };
  }, [attendances]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!attendances) return [];
    return attendances.filter((a) => {
      // Course filter
      if (historyCourseFilter > 0 && a.courseId !== historyCourseFilter) {
        return false;
      }
      // Status filter
      if (historyStatusFilter === "PRESENT" && !a.isPresent) return false;
      if (historyStatusFilter === "ABSENT" && a.isPresent) return false;

      // Search filter (student name or course name)
      if (historySearch.trim()) {
        const query = historySearch.toLowerCase().trim();
        const sName = a.studentName?.toLowerCase() || "";
        const cName = a.courseName?.toLowerCase() || "";
        return sName.includes(query) || cName.includes(query);
      }
      return true;
    });
  }, [attendances, historyCourseFilter, historyStatusFilter, historySearch]);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            Yoklama & Devam Durumu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kurs ve ders bazlı günlük yoklama alın, öğrenci devamsızlıklarını takip edin ve raporlayın.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === "take" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("take")}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Hızlı Yoklama Al
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("history")}
            className="gap-1.5"
          >
            <Clock className="h-4 w-4" />
            Yoklama Geçmişi
          </Button>
        </div>
      </div>

      {/* ─── Summary Stat Cards ─── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Sistemdeki tüm yoklama girdileri</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Katılım Oranı</CardTitle>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">%{stats.rate}</div>
            <p className="text-xs text-muted-foreground mt-1">Derslere genel devam yüzdesi</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mevcut (Geldi)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground mt-1">Katılım sağlanan ders adedi</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devamsız (Gelmedi)</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">Katılım sağlanmayan dersler</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── TAB 1: HIZLI YOKLAMA AL ─── */}
      {activeTab === "take" && (
        <div className="space-y-6">
          {/* Kurs ve Tarih Seçim Kartı */}
          <Card className="relative z-20 overflow-visible">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Yoklama Kriterleri
              </CardTitle>
              <CardDescription>
                Yoklama almak istediğiniz kurumu, kursu ve tarihi seçiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible">
              <div className="grid gap-4 md:grid-cols-3">
                {/* SuperAdmin Kurum Seçimi */}
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Kurum / Okul
                    </Label>
                    <Select
                      items={tenantSelectItems}
                      value={selectedTenantId > 0 ? selectedTenantId.toString() : ""}
                      onValueChange={(val) => {
                        setSelectedTenantId(Number(val));
                        setSelectedCourseId(0);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kurum Seçiniz">
                          {selectedTenantId > 0
                            ? tenants?.find((t) => t.id === selectedTenantId)?.name
                            : "Kurum Seçiniz"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {tenants?.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Kurs / Ders Seçimi */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    Kurs / Ders Seçiniz
                  </Label>
                  <Select
                    items={courseSelectItems}
                    value={selectedCourseId > 0 ? selectedCourseId.toString() : ""}
                    onValueChange={(val) => setSelectedCourseId(Number(val))}
                    disabled={isLoadingCourses}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingCourses
                            ? "Kurslar yükleniyor..."
                            : "Kurs / Sınıf Seçiniz"
                        }
                      >
                        {selectedCourseId > 0
                          ? (() => {
                              const c = courses?.find((c) => c.id === selectedCourseId);
                              return c ? `${c.name}${c.code ? ` (${c.code})` : ""}` : undefined;
                            })()
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {courses && courses.length > 0 ? (
                        courses.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name} {c.code ? `(${c.code})` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          Kayıtlı kurs bulunamadı
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Yoklama Tarihi */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Yoklama Tarihi
                  </Label>
                  <AttendanceDatePicker
                    value={attendanceDate}
                    onChange={(dateStr) => setAttendanceDate(dateStr)}
                    daysOfWeek={selectedCourseObj?.daysOfWeek}
                    startTime={selectedCourseObj?.startTime}
                    endTime={selectedCourseObj?.endTime}
                    disabled={selectedCourseId <= 0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Yoklama Listesi */}
          {selectedCourseId > 0 ? (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>{selectedCourseObj?.name}</span>
                    <Badge variant="outline" className="font-normal text-xs">
                      {activeEnrolledStudents.length} Kayıtlı Öğrenci
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {new Date(attendanceDate).toLocaleDateString("tr-TR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    tarihli yoklama çizelgesi.
                  </CardDescription>
                </div>

                {/* Toplu İşlem Butonları */}
                {attendanceSheet.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetAll(true)}
                      className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Tümünü Geldi Yap
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetAll(false)}
                      className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-300"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Tümünü Gelmedi Yap
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {isLoadingEnrollments ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Kayıtlı öğrenciler yükleniyor...
                  </div>
                ) : attendanceSheet.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-amber-500/80" />
                    <p className="font-medium text-foreground">
                      Bu kursa kayıtlı aktif öğrenci bulunamadı.
                    </p>
                    <p className="text-xs">
                      Kurs detayından veya Kurs Kayıtları ekranından öğrenci kaydı yapabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-12 text-center">#</TableHead>
                            <TableHead>Öğrenci Adı Soyadı</TableHead>
                            <TableHead className="w-64 text-center">Devam Durumu</TableHead>
                            <TableHead>Açıklama / Mazeret Notu</TableHead>
                            <TableHead className="w-24 text-center">Durum</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceSheet.map((item, index) => (
                            <TableRow
                              key={item.studentId}
                              className={
                                item.isPresent
                                  ? "hover:bg-emerald-50/40"
                                  : "bg-rose-50/20 hover:bg-rose-50/40"
                              }
                            >
                              <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                      item.isPresent
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    <Users className="h-3.5 w-3.5" />
                                  </div>
                                  <span>{item.studentName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={item.isPresent ? "default" : "outline"}
                                    onClick={() => handleStudentStatusChange(item.studentId, true)}
                                    className={`h-8 px-3 text-xs gap-1 transition-all ${
                                      item.isPresent
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
                                        : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 border-muted"
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Geldi
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={!item.isPresent ? "default" : "outline"}
                                    onClick={() => handleStudentStatusChange(item.studentId, false)}
                                    className={`h-8 px-3 text-xs gap-1 transition-all ${
                                      !item.isPresent
                                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-semibold"
                                        : "text-muted-foreground hover:bg-rose-50 hover:text-rose-700 border-muted"
                                    }`}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Gelmedi
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder={
                                    item.isPresent
                                      ? "İsteğe bağlı not..."
                                      : "Mazeret / devamsızlık sebebi giriniz..."
                                  }
                                  value={item.reason}
                                  onChange={(e) =>
                                    handleStudentReasonChange(item.studentId, e.target.value)
                                  }
                                  className="h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                {item.existingId ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    Kayıtlı
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                                  >
                                    Yeni
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Kaydet Butonu */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span>
                          Değişikliklerin kaydedilmesi için aşağıdaki <strong>Yoklamayı Kaydet</strong>{" "}
                          butonuna basınız.
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSaveAttendance}
                        disabled={isSavingBulk}
                        className="gap-2 px-6 shadow-sm"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingBulk ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <BookOpen className="h-10 w-10 text-muted-foreground/60" />
                <div>
                  <h3 className="font-semibold text-foreground text-base">
                    Lütfen Yukarıdan Bir Kurs Seçiniz
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yoklama listesini görüntülemek ve yoklama almak için bir kurs/ders seçimi yapmalısınız.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── TAB 2: YOKLAMA GEÇMİŞİ ─── */}
      {activeTab === "history" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Yoklama Kayıtları ve Devamsızlık Listesi
                </CardTitle>
                <CardDescription>
                  Geçmiş yoklama girdilerini filtreleyebilir, düzenleyebilir veya silebilirsiniz.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filtreleme Çubuğu */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Öğrenci veya kurs ara..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Kurs Filtresi */}
              <div>
                <Select
                  items={historyCourseSelectItems}
                  value={historyCourseFilter > 0 ? historyCourseFilter.toString() : "ALL"}
                  onValueChange={(val) => setHistoryCourseFilter(val === "ALL" ? 0 : Number(val))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Tüm Kurslar">
                      {historyCourseFilter > 0
                        ? courses?.find((c) => c.id === historyCourseFilter)?.name || "Tüm Kurslar"
                        : "Tüm Kurslar"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Kurslar</SelectItem>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Durum Filtresi */}
              <div>
                <Select
                  items={historyStatusSelectItems}
                  value={historyStatusFilter}
                  onValueChange={(val) => setHistoryStatusFilter(val || "ALL")}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Tüm Durumlar">
                      {historyStatusFilter === "PRESENT"
                        ? "Sadece Katılanlar (Geldi)"
                        : historyStatusFilter === "ABSENT"
                        ? "Sadece Devamsızlar (Gelmedi)"
                        : "Tüm Durumlar"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                    <SelectItem value="PRESENT">Sadece Katılanlar (Geldi)</SelectItem>
                    <SelectItem value="ABSENT">Sadece Devamsızlar (Gelmedi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tablo */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Kurs / Ders</TableHead>
                    <TableHead>Öğrenci</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                    <TableHead>Mazeret / Açıklama</TableHead>
                    <TableHead className="w-24 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAttendances ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                        Yoklama kayıtları yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                        Kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.attendanceDate ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {new Date(row.attendanceDate).toLocaleDateString("tr-TR", {
                                  day: "numeric",
                                  month: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-medium">
                                {new Date(row.attendanceDate).toLocaleDateString("tr-TR", {
                                  weekday: "long",
                                })}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="font-normal bg-background">
                            {row.courseName || `Kurs #${row.courseId}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {row.studentName || `Öğrenci #${row.studentId}`}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.isPresent ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              Geldi
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
                              <XCircle className="h-3 w-3" />
                              Gelmedi
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.reason || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(row)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="Düzenle"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingAttendance(row);
                                setIsDeleteOpen(true);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Sil"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── DÜZENLEME MODALİ ─── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Yoklama Kaydını Düzenle
            </DialogTitle>
            <DialogDescription>
              {editingAttendance?.studentName} - {editingAttendance?.courseName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Devam Durumu</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={editForm.isPresent ? "default" : "outline"}
                  onClick={() => setEditForm((prev) => ({ ...prev, isPresent: true }))}
                  className={`flex-1 gap-2 ${
                    editForm.isPresent ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Geldi (Mevcut)
                </Button>
                <Button
                  type="button"
                  variant={!editForm.isPresent ? "default" : "outline"}
                  onClick={() => setEditForm((prev) => ({ ...prev, isPresent: false }))}
                  className={`flex-1 gap-2 ${
                    !editForm.isPresent ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  Gelmedi (Devamsız)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Açıklama / Mazeret Notu</Label>
              <Input
                placeholder="Mazeret veya not giriniz..."
                value={editForm.reason}
                onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateAttendanceMutation.isPending}>
              {updateAttendanceMutation.isPending ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── SİLME ONAY MODALİ ─── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Yoklama Kaydını Sil
            </DialogTitle>
            <DialogDescription>
              Bu yoklama kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          {deletingAttendance && (
            <div className="p-3 bg-muted rounded-md text-xs space-y-1">
              <div>
                <strong>Öğrenci:</strong> {deletingAttendance.studentName}
              </div>
              <div>
                <strong>Kurs:</strong> {deletingAttendance.courseName}
              </div>
              <div>
                <strong>Tarih:</strong>{" "}
                {deletingAttendance.attendanceDate
                  ? new Date(deletingAttendance.attendanceDate).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      weekday: "long",
                    })
                  : "-"}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteAttendanceMutation.isPending}
            >
              {deleteAttendanceMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AttendancesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AttendancesContent />
    </Suspense>
  );
}

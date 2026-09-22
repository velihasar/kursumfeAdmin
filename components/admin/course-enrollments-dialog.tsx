"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CourseGetAllDto,
  CourseEnrollmentGetAllDto,
} from "@/types/course.types";
import { StudentGetAllDto } from "@/types/student.types";
import {
  useCourseEnrollments,
  useCreateCourseEnrollment,
  useUpdateCourseEnrollment,
  useDeleteCourseEnrollment,
} from "@/hooks/useCourseEnrollments";
import { useStudents } from "@/hooks/useStudents";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  Calendar,
  CreditCard,
} from "lucide-react";

interface CourseEnrollmentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseGetAllDto | null;
  tenantId?: number;
}

const STATUS_OPTIONS = [
  { value: 1, label: "Aktif", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { value: 2, label: "Donduruldu", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { value: 3, label: "Tamamlandı", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { value: 4, label: "İptal", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
];

export function CourseEnrollmentsDialog({
  isOpen,
  onClose,
  course,
  tenantId,
}: CourseEnrollmentsDialogProps) {
  const [activeTab, setActiveTab] = useState<"list" | "new">("list");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State for new enrollment
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [customFee, setCustomFee] = useState<string>("");
  const [dueDay, setDueDay] = useState<string>("1");
  const [status, setStatus] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");

  // Queries
  const { data: allEnrollments, refetch: refetchEnrollments, isLoading } = useCourseEnrollments({
    tenantId: course?.tenantId || tenantId,
  });

  const { data: allStudents } = useStudents(
    (course?.tenantId || tenantId) ? { tenantId: course?.tenantId || tenantId } : undefined
  );

  // Mutations
  const createMutation = useCreateCourseEnrollment();
  const updateMutation = useUpdateCourseEnrollment();
  const deleteMutation = useDeleteCourseEnrollment();

  if (!course) return null;

  // Filter enrollments for this specific course
  const courseEnrollments = (allEnrollments || []).filter(
    (e) => e.courseId === course.id
  );

  const enrolledStudentIds = courseEnrollments.map((e) => e.studentId);

  // Filter available students who are not yet enrolled in this course
  const availableStudents = (allStudents || []).filter(
    (s) => !enrolledStudentIds.includes(s.id)
  );

  // Search in enrolled students
  const filteredEnrollments = courseEnrollments.filter((e) => {
    const student = allStudents?.find((s) => s.id === e.studentId);
    const sName = (e.studentName || `${student?.firstName || ""} ${student?.lastName || ""}`).toLowerCase();
    const sNumber = (student?.studentNumber || "").toLowerCase();
    const q = searchTerm.toLowerCase();
    return sName.includes(q) || sNumber.includes(q);
  });

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error("Lütfen bir öğrenci seçiniz.");
      return;
    }

    try {
      const targetTenantId = course.tenantId || tenantId;
      await createMutation.mutateAsync({
        tenantId: targetTenantId,
        studentId: Number(selectedStudentId),
        courseId: course.id,
        enrollmentDate: new Date().toISOString(),
        customMonthlyFee: customFee.trim() ? Number(customFee) : undefined,
        dueDayOfMonth: Number(dueDay) || 1,
        status: Number(status) || 1,
        notes: notes.trim() || undefined,
      });

      toast.success("Öğrenci kursa başarıyla kaydedildi.");
      setSelectedStudentId("");
      setCustomFee("");
      setNotes("");
      setActiveTab("list");
      refetchEnrollments();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Kayıt işlemi başarısız oldu."));
    }
  };

  const handleUpdateStatus = async (enrollment: CourseEnrollmentGetAllDto, newStatus: number) => {
    try {
      await updateMutation.mutateAsync({
        id: enrollment.id,
        tenantId: enrollment.tenantId,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        enrollmentDate: enrollment.enrollmentDate,
        customMonthlyFee: enrollment.customMonthlyFee,
        dueDayOfMonth: enrollment.dueDayOfMonth,
        status: newStatus,
        notes: enrollment.notes,
      });
      toast.success("Kursiyer durumu güncellendi.");
      refetchEnrollments();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Durum güncellenemedi."));
    }
  };

  const handleDeleteEnrollment = async (id: number) => {
    if (!confirm("Bu öğrencinin kurs kaydını silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Kurs kaydı başarıyla silindi.");
      refetchEnrollments();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Silme işlemi başarısız oldu."));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{course.name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {course.code}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    ₺{Number(course.price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    <span className="text-[11px] text-muted-foreground font-normal">
                      ({course.feeType === 1 ? "Aylık" : "Toplam"})
                    </span>
                  </span>
                  {course.capacity ? (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Kapasite: {courseEnrollments.length} / {course.capacity}
                    </span>
                  ) : null}
                  {course.daysOfWeek ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {course.daysOfWeek}
                    </span>
                  ) : null}
                  {course.startTime && course.endTime ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.startTime} - {course.endTime}
                    </span>
                  ) : null}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Tabs & Content */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "list" | "new")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-4 pb-2 border-b border-border bg-muted/20">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="list" className="gap-2 text-xs">
                <Users className="h-3.5 w-3.5" />
                Kayıtlılar ({courseEnrollments.length})
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2 text-xs">
                <UserPlus className="h-3.5 w-3.5" />
                Kursa Ekle
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Enrolled Students List */}
          <TabsContent value="list" className="flex-1 overflow-y-auto p-6 m-0 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Öğrenci adı veya numarası ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("new")}
                className="gap-1.5 text-xs shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5 text-primary" />
                Yeni Kursiyer Ekle
              </Button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Kayıtlar yükleniyor...
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="py-12 text-center border rounded-xl border-dashed border-border bg-muted/10">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  {searchTerm ? "Arama kriterine uygun kursiyer bulunamadı." : "Bu kursa henüz kayıtlı öğrenci yok."}
                </p>
                {!searchTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("new")}
                    className="mt-3 text-xs"
                  >
                    Hemen Öğrenci Ekle
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs">Öğrenci</TableHead>
                      <TableHead className="text-xs">Kayıt Tarihi</TableHead>
                      <TableHead className="text-xs">Ücret</TableHead>
                      <TableHead className="text-xs">Vade Günü</TableHead>
                      <TableHead className="text-xs">Durum</TableHead>
                      <TableHead className="text-right text-xs">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((item) => {
                      const student = allStudents?.find((s) => s.id === item.studentId);
                      const currentStatus = STATUS_OPTIONS.find((s) => s.value === item.status) || STATUS_OPTIONS[0];
                      const fee = item.customMonthlyFee ?? course.price;

                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-xs">
                            <div>
                              <p className="font-semibold text-foreground">
                                {item.studentName || `${student?.firstName || ""} ${student?.lastName || ""}`}
                              </p>
                              {student?.studentNumber && (
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  #{student.studentNumber}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.enrollmentDate
                              ? new Date(item.enrollmentDate).toLocaleDateString("tr-TR")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">
                            ₺{Number(fee || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            {item.customMonthlyFee !== undefined && item.customMonthlyFee !== null && item.customMonthlyFee !== course.price && (
                              <span className="block text-[10px] text-primary font-normal">
                                (Özel Ücret)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            Her ayın {item.dueDayOfMonth || 1}. günü
                          </TableCell>
                          <TableCell>
                            <Select
                              value={String(item.status || 1)}
                              onValueChange={(val) => handleUpdateStatus(item, Number(val))}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-28">
                                <SelectValue>
                                  {STATUS_OPTIONS.find((o) => o.value === item.status)?.label || "Aktif"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEnrollment(item.id)}
                              title="Kaydı Sil"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Enroll New Student */}
          <TabsContent value="new" className="flex-1 overflow-y-auto p-6 m-0">
            <form onSubmit={handleCreateEnrollment} className="space-y-4 max-w-lg mx-auto">
              <div className="space-y-1.5">
                <Label htmlFor="enroll-student" className="text-xs">Öğrenci Seçiniz *</Label>
                <Select
                  value={selectedStudentId}
                  onValueChange={(val) => setSelectedStudentId(val || "")}
                >
                  <SelectTrigger id="enroll-student" className="h-9 text-xs">
                    <SelectValue placeholder="Öğrenci seçiniz...">
                      {(() => {
                        const st = allStudents?.find((s) => String(s.id) === selectedStudentId);
                        return st ? `${st.firstName} ${st.lastName}` : undefined;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableStudents.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        Kursa eklenebilecek yeni öğrenci bulunamadı.
                      </div>
                    ) : (
                      availableStudents.map((st) => (
                        <SelectItem key={st.id} value={String(st.id)} className="text-xs">
                          {st.firstName} {st.lastName} {st.studentNumber ? `(#${st.studentNumber})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="custom-fee" className="text-xs">
                    Özel Ücret (₺)
                    <span className="text-[10px] text-muted-foreground font-normal ml-1">
                      (Varsayılan: ₺{course.price})
                    </span>
                  </Label>
                  <Input
                    id="custom-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`₺${course.price}`}
                    value={customFee}
                    onChange={(e) => setCustomFee(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="due-day" className="text-xs">Ödeme Vade Günü (1-31)</Label>
                  <Input
                    id="due-day"
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enroll-status" className="text-xs">Başlangıç Durumu</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || "1")}>
                  <SelectTrigger id="enroll-status" className="h-9 text-xs">
                    <SelectValue>
                      {STATUS_OPTIONS.find((o) => String(o.value) === String(status))?.label || "Aktif"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enroll-notes" className="text-xs">Notlar / Açıklama</Label>
                <Textarea
                  id="enroll-notes"
                  rows={3}
                  placeholder="Kayıtla ilgili özel şartlar, burs/indirim detayı vb."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("list")}
                  className="text-xs"
                >
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!selectedStudentId || createMutation.isPending}
                  className="text-xs gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {createMutation.isPending ? "Kaydediliyor..." : "Öğrenciyi Kursa Kaydet"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

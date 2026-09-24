"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { checkIsSuperAdmin, getApiErrorMessage } from "@/lib/utils";
import { useTenants } from "@/hooks/useTenants";
import { useCourseEnrollments } from "@/hooks/useCourseEnrollments";
import { useStudents } from "@/hooks/useStudents";
import { useCreateFeeDue, useUpdateFeeDue } from "@/hooks/useFeeDues";
import { FeeDueGetAllDto } from "@/types/feeDue.types";
import { Building2, Receipt, Calendar, CreditCard, User, BookOpen } from "lucide-react";

interface FeeDueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeDue?: FeeDueGetAllDto | null;
  onSuccess?: () => void;
}

export function FeeDueDialog({
  open,
  onOpenChange,
  feeDue,
  onSuccess,
}: FeeDueDialogProps) {
  const { data: session } = useSession();
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  const isEdit = !!feeDue;

  // Tenant State
  const [tenantId, setTenantId] = useState<string>("");
  const effectiveTenantId = useMemo(() => {
    return tenantId ? Number(tenantId) : (!isSuperAdmin && userTenantId > 0 ? userTenantId : 0);
  }, [tenantId, isSuperAdmin, userTenantId]);

  // Form States
  const [courseEnrollmentId, setCourseEnrollmentId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [title, setTitle] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split("T")[0];
  });
  const [description, setDescription] = useState<string>("");

  // Queries
  const { data: tenants } = useTenants();
  const { data: enrollments, isLoading: isLoadingEnrollments } = useCourseEnrollments(
    effectiveTenantId > 0 ? { tenantId: effectiveTenantId } : undefined
  );
  const { data: students } = useStudents(
    effectiveTenantId > 0 ? { tenantId: effectiveTenantId } : undefined
  );

  // Mutations
  const createMutation = useCreateFeeDue();
  const updateMutation = useUpdateFeeDue();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Active Enrollments
  const activeEnrollments = useMemo(() => {
    return enrollments?.filter((e) => e.status === 1) || [];
  }, [enrollments]);

  // Populate when editing or resetting
  useEffect(() => {
    if (open) {
      if (feeDue) {
        setTenantId(feeDue.tenantId ? String(feeDue.tenantId) : "");
        setCourseEnrollmentId(feeDue.courseEnrollmentId ? String(feeDue.courseEnrollmentId) : "");
        setStudentId(feeDue.studentId ? String(feeDue.studentId) : "");
        setPeriod(feeDue.period || "");
        setTitle(feeDue.title || "");
        setAmount(String(feeDue.amount || ""));
        setDueDate(feeDue.dueDate ? feeDue.dueDate.split("T")[0] : "");
        setDescription(feeDue.description || "");
      } else {
        const now = new Date();
        const curPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const monthName = now.toLocaleDateString("tr-TR", { month: "long" });

        setTenantId(!isSuperAdmin && userTenantId > 0 ? String(userTenantId) : "");
        setCourseEnrollmentId("");
        setStudentId("");
        setPeriod(curPeriod);
        setTitle(`${monthName} ${now.getFullYear()} Kurs Aidatı`);
        setAmount("");
        setDueDate(new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split("T")[0]);
        setDescription("");
      }
    }
  }, [open, feeDue, isSuperAdmin, userTenantId]);

  // When Course Enrollment is selected, auto-select Student and default fee
  const handleEnrollmentChange = (enrollIdStr: string | null) => {
    const val = enrollIdStr || "";
    setCourseEnrollmentId(val);
    const enroll = activeEnrollments.find((e) => String(e.id) === val);
    if (enroll) {
      setStudentId(String(enroll.studentId));
      if (enroll.customMonthlyFee && enroll.customMonthlyFee > 0) {
        setAmount(String(enroll.customMonthlyFee));
      }
      if (enroll.dueDayOfMonth && enroll.dueDayOfMonth > 0) {
        const parts = period.split("-");
        if (parts.length === 2) {
          const y = parts[0];
          const m = parts[1];
          const d = String(Math.min(28, enroll.dueDayOfMonth)).padStart(2, "0");
          setDueDate(`${y}-${m}-${d}`);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetTenant = effectiveTenantId;
    if (isSuperAdmin && (!targetTenant || targetTenant <= 0)) {
      toast.error("Lütfen bir kurum/okul seçiniz.");
      return;
    }

    if (!courseEnrollmentId || Number(courseEnrollmentId) <= 0) {
      toast.error("Lütfen bir kurs kaydı seçiniz.");
      return;
    }

    if (!studentId || Number(studentId) <= 0) {
      toast.error("Lütfen öğrenci seçiniz.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Lütfen geçerli bir aidat tutarı giriniz.");
      return;
    }

    if (!dueDate) {
      toast.error("Lütfen son ödeme tarihini giriniz.");
      return;
    }

    try {
      if (isEdit && feeDue) {
        await updateMutation.mutateAsync({
          id: feeDue.id,
          tenantId: targetTenant,
          courseEnrollmentId: Number(courseEnrollmentId),
          studentId: Number(studentId),
          period: period.trim(),
          title: title.trim(),
          amount: Number(amount),
          dueDate: `${dueDate}T00:00:00`,
          description: description.trim() || undefined,
        });
        toast.success("Aidat/tahakkuk kaydı güncellendi.");
      } else {
        await createMutation.mutateAsync({
          tenantId: targetTenant,
          courseEnrollmentId: Number(courseEnrollmentId),
          studentId: Number(studentId),
          period: period.trim(),
          title: title.trim(),
          amount: Number(amount),
          paidAmount: 0,
          remainingAmount: Number(amount),
          dueDate: `${dueDate}T00:00:00`,
          status: 0,
          description: description.trim() || undefined,
        });
        toast.success("Yeni aidat/tahakkuk kaydı oluşturuldu.");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "İşlem sırasında bir hata oluştu."));
    }
  };

  // Select items
  const tenantSelectItems = useMemo(() => {
    return tenants?.map((t) => ({ value: String(t.id), label: t.name })) || [];
  }, [tenants]);

  const enrollmentSelectItems = useMemo(() => {
    return (
      activeEnrollments.map((e) => ({
        value: String(e.id),
        label: `${e.studentName} — ${e.courseName || `Kurs #${e.courseId}`}`,
      })) || []
    );
  }, [activeEnrollments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {isEdit ? "Aidat / Tahakkuk Düzenle" : "Yeni Aidat / Tahakkuk Ekle"}
          </DialogTitle>
          <DialogDescription>
            Öğrenci ve kurs bazlı aidat borç kaydı oluşturun veya düzenleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* SuperAdmin Kurum Seçimi */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Kurum / Okul <span className="text-destructive">*</span>
              </Label>
              <Select
                items={tenantSelectItems}
                value={tenantId}
                onValueChange={(val) => {
                  setTenantId(val || "");
                  setCourseEnrollmentId("");
                  setStudentId("");
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Kurum seçiniz...">
                    {tenantId ? tenants?.find((t) => String(t.id) === tenantId)?.name : "Kurum seçiniz..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenants?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Kurs Kaydı Seçimi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              Öğrenci & Kurs Kaydı <span className="text-destructive">*</span>
            </Label>
            <Select
              items={enrollmentSelectItems}
              value={courseEnrollmentId}
              onValueChange={handleEnrollmentChange}
              disabled={isLoadingEnrollments}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Öğrencinin kurs kaydını seçiniz...">
                  {courseEnrollmentId
                    ? (() => {
                        const en = activeEnrollments.find((e) => String(e.id) === courseEnrollmentId);
                        return en ? `${en.studentName} — ${en.courseName}` : undefined;
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeEnrollments.length > 0 ? (
                  activeEnrollments.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.studentName} — {e.courseName || `Kurs #${e.courseId}`}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    Aktif kurs kaydı bulunamadı
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Dönem (YYYY-MM) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Dönem (Yıl-Ay) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            {/* Vade / Son Ödeme Tarihi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Son Ödeme Tarihi <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Başlık */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                Aidat Başlığı <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Örn: Eylül 2026 Kurs Aidatı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            {/* Tutar */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Tutar (₺) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="text-xs font-semibold text-primary"
              />
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Açıklama / Notlar</Label>
            <Textarea
              placeholder="Aidat veya ödeme planı ile ilgili ek açıklama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Kaydediliyor..."
                : isEdit
                ? "Güncelle"
                : "Aidat Kaydını Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

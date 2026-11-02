"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Search,
  Sparkles,
  Users,
  Coins,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import {
  useUnassignedFeeDueStudents,
  useGenerateMonthlyFeeDues,
} from "@/hooks/useFeeDues";

interface BulkFeeDueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: number;
  initialPeriod?: string;
  onSuccess?: () => void;
}

export function BulkFeeDueDialog({
  open,
  onOpenChange,
  tenantId,
  initialPeriod,
  onSuccess,
}: BulkFeeDueDialogProps) {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [period, setPeriod] = useState<string>(initialPeriod || defaultPeriod);
  const [search, setSearch] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [customDueDate, setCustomDueDate] = useState<string>("");

  useEffect(() => {
    if (initialPeriod) {
      setPeriod(initialPeriod);
    }
  }, [initialPeriod]);

  // Backend Query: Aidatı olmayan öğrencileri backend'de filtrele
  const {
    data: summaryData,
    isLoading,
    refetch,
  } = useUnassignedFeeDueStudents(
    open
      ? {
          period,
          tenantId: tenantId && tenantId > 0 ? tenantId : undefined,
          search: search.trim() ? search.trim() : undefined,
        }
      : undefined
  );

  const students = summaryData?.students || [];

  // Öğrenci listesi değiştiğinde varsayılan olarak hepsini seçili yap
  useEffect(() => {
    if (summaryData?.students) {
      setSelectedIds(new Set(summaryData.students.map((s) => s.courseEnrollmentId)));
    }
  }, [summaryData]);

  const generateMutation = useGenerateMonthlyFeeDues();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(students.map((s) => s.courseEnrollmentId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedStudents = useMemo(() => {
    return students.filter((s) => selectedIds.has(s.courseEnrollmentId));
  }, [students, selectedIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedStudents.reduce((sum, s) => sum + (s.suggestedAmount || 0), 0);
  }, [selectedStudents]);

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Lütfen aidat tanımlanacak en az bir öğrenci seçiniz.");
      return;
    }

    try {
      const res = await generateMutation.mutateAsync({
        period,
        tenantId: tenantId && tenantId > 0 ? tenantId : undefined,
        courseEnrollmentIds: Array.from(selectedIds),
        dueDate: customDueDate ? new Date(customDueDate).toISOString() : undefined,
      });

      toast.success(res.message || `${selectedIds.size} adet aidat borcu başarıyla oluşturuldu.`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Aidatlar oluşturulurken bir hata oluştu."));
    }
  };

  const isAllSelected = students.length > 0 && selectedIds.size === students.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <Receipt className="h-6 w-6 text-primary" />
            Toplu Aidat Tanımlama
          </DialogTitle>
          <DialogDescription>
            Seçilen dönem için henüz aidat tahakkuku oluşturulmamış aktif öğrencilere tek tıkla borç yansıtın.
          </DialogDescription>
        </DialogHeader>

        {/* ─── Kontrol & Filtre Alanı ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Dönem Seçimi */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Dönem (Yıl-Ay)
            </Label>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Vade Tarihi (Opsiyonel) */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Son Ödeme Tarihi (İsteğe Bağlı)
            </Label>
            <Input
              type="date"
              value={customDueDate}
              onChange={(e) => setCustomDueDate(e.target.value)}
              placeholder="Varsayılan kayıt günü"
              className="h-9 text-xs"
            />
          </div>

          {/* Arama */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Öğrenci veya Kurs Ara
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim, numara, kurs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* ─── Özet Bilgi Çubuğu ─── */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>
                Bulunan: <strong className="text-primary">{students.length}</strong> Öğrenci
              </span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                Seçili: <strong className="text-emerald-600">{selectedIds.size}</strong>
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Coins className="h-4 w-4 text-amber-500" />
            <span>
              Toplam Tutar:{" "}
              <span className="text-emerald-600 font-extrabold">
                ₺{selectedTotalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </span>
          </div>
        </div>

        {/* ─── Öğrenci Tablosu ─── */}
        <div className="flex-1 overflow-y-auto rounded-md border border-border max-h-[380px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-xs z-10">
              <TableRow>
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                    aria-label="Tümünü Seç"
                  />
                </TableHead>
                <TableHead>Öğrenci</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>Veli</TableHead>
                <TableHead className="text-right">Aidat Tutarı</TableHead>
                <TableHead className="text-center">Önerilen Vade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                    Aidatı olmayan öğrenciler taranıyor...
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                      <div className="text-sm font-semibold text-foreground">
                        Harika! Bu dönem için aidatı tanımlanmamış öğrenci kalmadı.
                      </div>
                      <p className="text-xs">
                        {period} dönemine ait tüm aktif kurs kayıtlarının aidat borçları daha önce oluşturulmuş.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const isChecked = selectedIds.has(student.courseEnrollmentId);
                  return (
                    <TableRow
                      key={student.courseEnrollmentId}
                      className={isChecked ? "bg-primary/[0.02]" : "opacity-60"}
                    >
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(student.courseEnrollmentId)}
                          className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground">{student.studentName}</div>
                        {student.studentNumber && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            No: {student.studentNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <BookOpen className="h-3 w-3 text-primary shrink-0" />
                          <span>{student.courseName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="text-foreground">{student.parentName || "-"}</div>
                        {student.parentPhoneNumber && (
                          <div className="text-[10px] text-muted-foreground">
                            {student.parentPhoneNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-foreground">
                        ₺{student.suggestedAmount?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {customDueDate
                            ? new Date(customDueDate).toLocaleDateString("tr-TR")
                            : student.suggestedDueDate
                            ? new Date(student.suggestedDueDate).toLocaleDateString("tr-TR")
                            : `Ayın ${student.dueDayOfMonth}. günü`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {selectedIds.size > 0 ? (
              <span>
                <strong>{selectedIds.size}</strong> öğrenciye <strong>{period}</strong> dönemi aidatı yansıtılacak.
              </span>
            ) : (
              <span>Herhangi bir öğrenci seçilmedi.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0 || generateMutation.isPending}
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              {generateMutation.isPending
                ? "Borçlar Oluşturuluyor..."
                : `Seçili (${selectedIds.size}) Öğrenciye Aidat Yansıt`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

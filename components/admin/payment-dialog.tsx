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
import { Badge } from "@/components/ui/badge";
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
import { useStudents } from "@/hooks/useStudents";
import { useParents } from "@/hooks/useParents";
import { useFeeDues } from "@/hooks/useFeeDues";
import { useCreatePayment, useUpdatePayment } from "@/hooks/usePayments";
import { PaymentGetAllDto } from "@/types/payment.types";
import { FeeDueGetAllDto } from "@/types/feeDue.types";
import {
  Building2,
  Receipt,
  Calendar,
  CreditCard,
  User,
  Banknote,
  Sparkles,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: PaymentGetAllDto | null;
  initialFeeDue?: FeeDueGetAllDto | null;
  initialStudentId?: number | null;
  onSuccess?: () => void;
}

const PAYMENT_TYPES = [
  { value: "1", label: "Nakit", icon: "💵" },
  { value: "2", label: "Kredi / Banka Kartı", icon: "💳" },
  { value: "3", label: "Havale / EFT", icon: "🏦" },
  { value: "4", label: "POS / Çek", icon: "📄" },
];

export function PaymentDialog({
  open,
  onOpenChange,
  payment,
  initialFeeDue,
  initialStudentId,
  onSuccess,
}: PaymentDialogProps) {
  const { data: session } = useSession();
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  const isEdit = !!payment;

  // Tenant State
  const [tenantId, setTenantId] = useState<string>("");
  const effectiveTenantId = useMemo(() => {
    return tenantId ? Number(tenantId) : (!isSuperAdmin && userTenantId > 0 ? userTenantId : 0);
  }, [tenantId, isSuperAdmin, userTenantId]);

  // Form States
  const [studentId, setStudentId] = useState<string>("");
  const [feeDueId, setFeeDueId] = useState<string>("none");
  const [parentId, setParentId] = useState<string>("none");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [paymentType, setPaymentType] = useState<string>("1");
  const [receiptNo, setReceiptNo] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Queries
  const { data: tenants } = useTenants();
  const { data: students, isLoading: isLoadingStudents } = useStudents(
    effectiveTenantId > 0 ? { tenantId: effectiveTenantId } : undefined
  );
  const { data: parents } = useParents(
    effectiveTenantId > 0 ? { tenantId: effectiveTenantId } : undefined
  );
  const { data: feeDues } = useFeeDues(
    effectiveTenantId > 0 ? { tenantId: effectiveTenantId } : undefined
  );

  // Filter Unpaid/Partially paid FeeDues for selected student
  const studentFeeDues = useMemo(() => {
    if (!feeDues) return [];
    if (!studentId) return feeDues.filter((f) => f.status !== 2); // Show all open fee dues
    return feeDues.filter((f) => String(f.studentId) === studentId && (f.status !== 2 || String(f.id) === feeDueId));
  }, [feeDues, studentId, feeDueId]);

  // Mutations
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Populate form
  useEffect(() => {
    if (open) {
      if (payment) {
        setTenantId(payment.tenantId ? String(payment.tenantId) : "");
        setStudentId(payment.studentId ? String(payment.studentId) : "");
        setFeeDueId(payment.feeDueId ? String(payment.feeDueId) : "none");
        setParentId(payment.parentId ? String(payment.parentId) : "none");
        setAmount(String(payment.amount || ""));
        setPaymentDate(payment.paymentDate ? payment.paymentDate.split("T")[0] : new Date().toISOString().split("T")[0]);
        setPaymentType(String(payment.paymentType || "1"));
        setReceiptNo(payment.receiptNo || "");
        setTransactionId(payment.transactionId || "");
        setNotes(payment.notes || "");
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        setTenantId(!isSuperAdmin && userTenantId > 0 ? String(userTenantId) : "");
        setStudentId(initialStudentId ? String(initialStudentId) : (initialFeeDue ? String(initialFeeDue.studentId) : ""));
        setFeeDueId(initialFeeDue ? String(initialFeeDue.id) : "none");
        setParentId("none");
        setAmount(initialFeeDue ? String(initialFeeDue.remainingAmount || initialFeeDue.amount) : "");
        setPaymentDate(todayStr);
        setPaymentType("1");
        setReceiptNo(`MAK-${Math.floor(100000 + Math.random() * 900000)}`);
        setTransactionId("");
        setNotes(initialFeeDue ? `${initialFeeDue.title} ödemesi` : "");
      }
    }
  }, [open, payment, initialFeeDue, initialStudentId, isSuperAdmin, userTenantId]);

  // When FeeDue is selected, auto-fill amount with remaining balance
  const handleFeeDueChange = (val: string | null) => {
    const v = val || "none";
    setFeeDueId(v);
    if (v && v !== "none") {
      const selectedDue = feeDues?.find((f) => String(f.id) === v);
      if (selectedDue) {
        if (!studentId) {
          setStudentId(String(selectedDue.studentId));
        }
        setAmount(String(selectedDue.remainingAmount || selectedDue.amount));
        if (!notes) {
          setNotes(`${selectedDue.title} tahsilatı`);
        }
      }
    }
  };

  const handleGenerateReceipt = () => {
    setReceiptNo(`MAK-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetTenant = effectiveTenantId;
    if (isSuperAdmin && (!targetTenant || targetTenant <= 0)) {
      toast.error("Lütfen bir kurum/okul seçiniz.");
      return;
    }

    if (!studentId || Number(studentId) <= 0) {
      toast.error("Lütfen ödeme yapan öğrenciyi seçiniz.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Lütfen geçerli bir ödeme tutarı giriniz.");
      return;
    }

    if (!paymentDate) {
      toast.error("Lütfen ödeme tarihini giriniz.");
      return;
    }

    try {
      if (isEdit && payment) {
        await updateMutation.mutateAsync({
          id: payment.id,
          tenantId: targetTenant,
          feeDueId: feeDueId !== "none" ? Number(feeDueId) : undefined,
          studentId: Number(studentId),
          parentId: parentId !== "none" ? Number(parentId) : undefined,
          amount: Number(amount),
          paymentDate: `${paymentDate}T00:00:00`,
          paymentType: Number(paymentType),
          receiptNo: receiptNo.trim() || undefined,
          transactionId: transactionId.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Ödeme kaydı güncellendi.");
      } else {
        await createMutation.mutateAsync({
          tenantId: targetTenant,
          feeDueId: feeDueId !== "none" ? Number(feeDueId) : undefined,
          studentId: Number(studentId),
          parentId: parentId !== "none" ? Number(parentId) : undefined,
          amount: Number(amount),
          paymentDate: `${paymentDate}T00:00:00`,
          paymentType: Number(paymentType),
          receiptNo: receiptNo.trim() || undefined,
          transactionId: transactionId.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Tahsilat / Ödeme başarıyla kaydedildi.");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Ödeme kaydedilirken hata oluştu."));
    }
  };

  // Select items
  const tenantSelectItems = useMemo(() => {
    return tenants?.map((t) => ({ value: String(t.id), label: t.name })) || [];
  }, [tenants]);

  const studentSelectItems = useMemo(() => {
    return (
      students?.map((s) => ({
        value: String(s.id),
        label: `${s.firstName} ${s.lastName} ${s.studentNumber ? `(${s.studentNumber})` : ""}`,
      })) || []
    );
  }, [students]);

  const feeDueSelectItems = useMemo(() => {
    return [
      { value: "none", label: "Bağımsız Tahsilat (Aidat Bağlantısı Yok)" },
      ...(studentFeeDues.map((f) => ({
        value: String(f.id),
        label: `${f.title} — Kalan: ₺${f.remainingAmount.toLocaleString("tr-TR")}`,
      })) || []),
    ];
  }, [studentFeeDues]);

  const parentSelectItems = useMemo(() => {
    return [
      { value: "none", label: "Veli Seçilmedi (Öğrenci Doğrudan Ödedi)" },
      ...(parents?.map((p) => ({
        value: String(p.id),
        label: `${p.firstName} ${p.lastName} ${p.phone ? `(${p.phone})` : ""}`,
      })) || []),
    ];
  }, [parents]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            {isEdit ? "Ödeme Kaydını Düzenle" : "Tahsilat / Ödeme Al"}
          </DialogTitle>
          <DialogDescription>
            Öğrenci veya veliden yapılan aidat/kurs tahsilatını sisteme işleyin.
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
                  setStudentId("");
                  setFeeDueId("none");
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

          {/* Öğrenci Seçimi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Öğrenci <span className="text-destructive">*</span>
            </Label>
            <Select
              items={studentSelectItems}
              value={studentId}
              onValueChange={(val) => {
                setStudentId(val || "");
                setFeeDueId("none");
              }}
              disabled={isLoadingStudents}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Öğrenci seçiniz...">
                  {studentId
                    ? (() => {
                        const st = students?.find((s) => String(s.id) === studentId);
                        return st ? `${st.firstName} ${st.lastName}` : undefined;
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {students?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.firstName} {s.lastName} {s.studentNumber ? `(${s.studentNumber})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kapatılacak Aidat (FeeDue) Seçimi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                İlişkili Aidat / Tahakkuk Borcu (Opsiyonel)
              </Label>
              {feeDueId !== "none" && (
                <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-300 font-normal">
                  Kalan bakiye güncellenecektir
                </Badge>
              )}
            </div>
            <Select
              items={feeDueSelectItems}
              value={feeDueId}
              onValueChange={handleFeeDueChange}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Aidat borcu seçiniz...">
                  {feeDueId === "none"
                    ? "Bağımsız Tahsilat (Aidat Bağlantısı Yok)"
                    : (() => {
                        const fd = feeDues?.find((f) => String(f.id) === feeDueId);
                        return fd ? `${fd.title} — Kalan: ₺${fd.remainingAmount.toLocaleString("tr-TR")}` : undefined;
                      })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bağımsız Tahsilat (Aidat Bağlantısı Yok)</SelectItem>
                {studentFeeDues.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.title} — Kalan: ₺{f.remainingAmount.toLocaleString("tr-TR")} ({f.period})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tutar & Ödeme Yöntemi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Tahsil Edilen Tutar (₺) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="text-xs font-bold text-emerald-600 text-base h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Ödeme Tarihi <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Ödeme Türü Seçimi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ödeme Yöntemi</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_TYPES.map((pt) => {
                const isSelected = paymentType === pt.value;
                return (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setPaymentType(pt.value)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-input hover:bg-accent text-muted-foreground"
                    }`}
                  >
                    <span>{pt.icon}</span>
                    <span className="truncate">{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ödemeyi Yapan Veli (Opsiyonel) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Ödemeyi Yapan Veli (Opsiyonel)
            </Label>
            <Select
              items={parentSelectItems}
              value={parentId}
              onValueChange={(val) => setParentId(val || "none")}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Veli seçiniz (opsiyonel)...">
                  {parentId === "none"
                    ? "Veli Seçilmedi (Öğrenci Doğrudan Ödedi)"
                    : (() => {
                        const pr = parents?.find((p) => String(p.id) === parentId);
                        return pr ? `${pr.firstName} ${pr.lastName}` : undefined;
                      })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Veli Seçilmedi (Öğrenci Doğrudan Ödedi)</SelectItem>
                {parents?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.firstName} {p.lastName} {p.phone ? `(${p.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Makbuz & İşlem / Dekont No */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Makbuz / Fiş No
                </Label>
                <button
                  type="button"
                  onClick={handleGenerateReceipt}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Otomatik Üret
                </button>
              </div>
              <Input
                placeholder="Örn: MAK-102938"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Banka / POS İşlem No</Label>
              <Input
                placeholder="Örn: TX-9847192 (opsiyonel)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ödeme Notu / Açıklama</Label>
            <Textarea
              placeholder="Dekont açıklaması veya özel ödeme notu..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Tahsilatı Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

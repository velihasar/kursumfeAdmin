"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepositStudentWallet } from "@/hooks/useStudentWallets";
import { useStudents } from "@/hooks/useStudents";
import { toast } from "sonner";
import { Wallet, ArrowDownLeft, Sparkles } from "lucide-react";

interface DepositWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStudentId?: number;
  preSelectedStudentName?: string;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const PAYMENT_METHODS = [
  { value: "1", label: "Nakit", icon: "💵" },
  { value: "2", label: "Kredi Kartı", icon: "💳" },
  { value: "3", label: "Havale / EFT", icon: "🏦" },
  { value: "4", label: "Diğer", icon: "✨" },
];

export function DepositWalletDialog({
  open,
  onOpenChange,
  preSelectedStudentId,
  preSelectedStudentName,
}: DepositWalletDialogProps) {
  const [studentId, setStudentId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("1"); // 1: Nakit
  const [description, setDescription] = useState<string>("");
  const [receiptNo, setReceiptNo] = useState<string>("");

  const { data: students = [], isLoading: isLoadingStudents } = useStudents();
  const depositMutation = useDepositStudentWallet();

  const studentSelectItems = students.map((s) => ({
    value: String(s.id),
    label: `${s.firstName} ${s.lastName} ${s.studentNumber ? `(${s.studentNumber})` : ""}`.trim(),
  }));

  useEffect(() => {
    if (open) {
      if (preSelectedStudentId) {
        setStudentId(String(preSelectedStudentId));
      } else {
        setStudentId("");
      }
      setAmount("");
      setPaymentType("1");
      setDescription("");
      setReceiptNo(`MAK-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [open, preSelectedStudentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sId = Number(studentId);
    const amt = Number(amount);

    if (!sId || sId <= 0) {
      toast.error("Lütfen bir öğrenci seçiniz.");
      return;
    }

    if (!amt || amt <= 0) {
      toast.error("Lütfen geçerli bir bakiye tutarı giriniz.");
      return;
    }

    try {
      await depositMutation.mutateAsync({
        studentId: sId,
        amount: amt,
        paymentType: Number(paymentType),
        description: description.trim() || undefined,
        receiptNo: receiptNo.trim() || undefined,
      });

      toast.success(`₺${amt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} bakiye başarıyla yüklendi.`);
      onOpenChange(false);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.message ||
        "Bakiye yüklenirken bir hata oluştu.";
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Bakiye Yükle</DialogTitle>
              <DialogDescription>
                Öğrenci cüzdanına kantin / dolap harcamaları için avans bakiye yükleyin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Öğrenci Seçimi */}
          <div className="space-y-1.5">
            <Label htmlFor="student" className="font-semibold text-sm">
              Öğrenci <span className="text-red-500">*</span>
            </Label>
            {preSelectedStudentId ? (
              <div className="p-2.5 rounded-lg border bg-muted/40 font-medium text-sm flex items-center justify-between">
                <span>{preSelectedStudentName || `Öğrenci #${preSelectedStudentId}`}</span>
                <span className="text-xs text-muted-foreground">Seçili Öğrenci</span>
              </div>
            ) : (
              <Select
                items={studentSelectItems}
                value={studentId}
                onValueChange={(val) => setStudentId(val ?? "")}
                disabled={isLoadingStudents}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingStudents ? "Yükleniyor..." : "Öğrenci Seçiniz"}>
                    {studentId
                      ? (() => {
                          const st = students.find((s) => String(s.id) === studentId);
                          return st ? `${st.firstName} ${st.lastName} ${st.studentNumber ? `(${st.studentNumber})` : ""}` : undefined;
                        })()
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.firstName} {s.lastName} {s.studentNumber ? `(${s.studentNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Hızlı Tutar Butonları */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Hızlı Tutar Seçimi</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {QUICK_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant={amount === String(amt) ? "default" : "outline"}
                  size="sm"
                  className={amount === String(amt) ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" : ""}
                  onClick={() => setAmount(String(amt))}
                >
                  ₺{amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Yüklenecek Tutar */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="font-semibold text-sm">
              Yüklenecek Tutar (₺) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₺</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg font-semibold"
                required
              />
            </div>
          </div>

          {/* Ödeme Yöntemi */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">
              Ödeme Yöntemi <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentType === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentType(pm.value)}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-semibold shadow-xs"
                        : "border-input bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{pm.icon}</span>
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Makbuz / Fiş No & Açıklama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="receiptNo" className="font-semibold text-sm">
                  Makbuz / Fiş No
                </Label>
                <button
                  type="button"
                  onClick={() => setReceiptNo(`MAK-${Math.floor(100000 + Math.random() * 900000)}`)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline font-medium cursor-pointer"
                >
                  Otomatik Üret
                </button>
              </div>
              <Input
                id="receiptNo"
                placeholder="Örn: MAK-1024"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="font-semibold text-sm">
                Açıklama / Not
              </Label>
              <Input
                id="description"
                placeholder="Örn: Veli elden teslim etti"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={depositMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? "Yükleniyor..." : "Bakiyeyi Yükle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
      setReceiptNo("");
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
      <DialogContent className="sm:max-w-[480px]">
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
                value={studentId}
                onValueChange={(val) => setStudentId(val ?? "")}
                disabled={isLoadingStudents}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingStudents ? "Yükleniyor..." : "Öğrenci Seçiniz"} />
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
                  className={amount === String(amt) ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
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

          {/* Ödeme Türü */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paymentType" className="font-semibold text-sm">
                Ödeme Yöntemi
              </Label>
              <Select value={paymentType} onValueChange={(val) => setPaymentType(val ?? "1")}>
                <SelectTrigger id="paymentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">💵 Nakit</SelectItem>
                  <SelectItem value="2">💳 Kredi / Banka Kartı</SelectItem>
                  <SelectItem value="3">🏦 Havale / EFT</SelectItem>
                  <SelectItem value="4">✨ Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receiptNo" className="font-semibold text-sm">
                Makbuz / Fiş No
              </Label>
              <Input
                id="receiptNo"
                placeholder="Örn: MK-1024"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
              />
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="font-semibold text-sm">
              Açıklama / Not
            </Label>
            <Input
              id="description"
              placeholder="Örn: Veli elden teslim etti (Su/Dolap bakiye)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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

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
import { useSpendStudentWallet, useStudentWallets } from "@/hooks/useStudentWallets";
import { useStudents } from "@/hooks/useStudents";
import { useCanteenProducts } from "@/hooks/useCanteenProducts";
import { CanteenProductDialog } from "@/components/admin/canteen-product-dialog";
import { toast } from "sonner";
import {
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Plus,
  Tag,
  PackageOpen,
} from "lucide-react";

interface QuickSpendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedStudentId?: number;
  preSelectedStudentName?: string;
  preSelectedBalance?: number;
  onOpenCreateProduct?: () => void;
}

export function QuickSpendDialog({
  open,
  onOpenChange,
  preSelectedStudentId,
  preSelectedStudentName,
  preSelectedBalance,
  onOpenCreateProduct,
}: QuickSpendDialogProps) {
  const [studentId, setStudentId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Su & İçecek");
  const [description, setDescription] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<number | "custom">("custom");
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);

  const { data: students = [], isLoading: isLoadingStudents } = useStudents();
  const { data: wallets = [] } = useStudentWallets();
  const { data: dbProducts = [], isLoading: isLoadingProducts } = useCanteenProducts();
  const spendMutation = useSpendStudentWallet();

  const activeProducts = dbProducts.filter((p) => p.isActive !== false);

  // Find active student's balance
  const activeStudentId = Number(studentId || preSelectedStudentId);
  const matchedWallet = wallets.find((w) => w.studentId === activeStudentId);
  const currentBalance = preSelectedBalance !== undefined && activeStudentId === preSelectedStudentId
    ? preSelectedBalance
    : (matchedWallet?.balance ?? 0);

  const numericAmount = Number(amount) || 0;
  const isInsufficient = numericAmount > currentBalance;
  const remainingAfter = currentBalance - numericAmount;

  useEffect(() => {
    if (open) {
      if (preSelectedStudentId) {
        setStudentId(String(preSelectedStudentId));
      } else {
        setStudentId("");
      }

      if (activeProducts.length > 0) {
        const first = activeProducts[0];
        setSelectedProductId(first.id);
        setAmount(String(first.price));
        setCategory(first.category);
        setDescription(first.name);
      } else {
        setSelectedProductId("custom");
        setAmount("");
        setCategory("Su & İçecek");
        setDescription("");
      }
    }
  }, [open, preSelectedStudentId, dbProducts]);

  const handleSelectProduct = (prodId: number) => {
    const prod = activeProducts.find((p) => p.id === prodId);
    if (!prod) return;

    setSelectedProductId(prod.id);
    setAmount(String(prod.price));
    setCategory(prod.category);
    setDescription(prod.name);
  };

  const handleCustomCategorySelect = (val: string) => {
    setSelectedProductId("custom");
    setCategory(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sId = Number(studentId);
    const amt = Number(amount);

    if (!sId || sId <= 0) {
      toast.error("Lütfen bir öğrenci seçiniz.");
      return;
    }

    if (!amt || amt <= 0) {
      toast.error("Lütfen geçerli bir harcama tutarı giriniz.");
      return;
    }

    if (amt > currentBalance) {
      toast.error(`Yetersiz bakiye! Mevcut bakiye: ₺${currentBalance.toFixed(2)}, Tutar: ₺${amt.toFixed(2)}`);
      return;
    }

    try {
      await spendMutation.mutateAsync({
        studentId: sId,
        canteenProductId: typeof selectedProductId === "number" ? selectedProductId : undefined,
        amount: amt,
        category: category || "Kantin",
        description: description.trim() || undefined,
      });

      toast.success(`₺${amt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} tutarında harcama düşüldü.`);
      onOpenChange(false);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.message ||
        "Harcama işlemi sırasında bir hata oluştu.";
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-indigo-600">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Hızlı Dolap & Kantin Satışı</DialogTitle>
                <DialogDescription>
                  Öğrencinin aldığı su, meşrubat veya ürünleri tanımlı fiyat listesinden anında düşün.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Öğrenci Seçimi ve Mevcut Bakiye Bilgisi */}
            <div className="space-y-1.5">
              <Label htmlFor="student" className="font-semibold text-sm">
                Öğrenci <span className="text-red-500">*</span>
              </Label>
              {preSelectedStudentId ? (
                <div className="p-3 rounded-lg border bg-muted/40 font-medium text-sm flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">
                      {preSelectedStudentName || `Öğrenci #${preSelectedStudentId}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Seçili Öğrenci</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Mevcut Bakiye</div>
                    <div className={`text-base font-bold ${currentBalance <= 0 ? "text-red-500" : "text-emerald-600"}`}>
                      ₺{currentBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
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

                  {activeStudentId > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 text-sm">
                      <span className="text-muted-foreground">Öğrencinin Mevcut Bakiyesi:</span>
                      <span className={`font-bold ${currentBalance <= 0 ? "text-red-500" : "text-emerald-600"}`}>
                        ₺{currentBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dinamik Ürün Fiyat Listesi veya Ürün Yok Uyarısı */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm">Kayıtlı Ürün Seçimi</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddProductOpen(true)}
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1 p-1"
                >
                  <Plus className="h-3 w-3" /> Yeni Ürün Ekle
                </Button>
              </div>

              {isLoadingProducts ? (
                <div className="p-4 border rounded-xl bg-muted/30 text-center text-xs text-muted-foreground">
                  Ürün listesi yükleniyor...
                </div>
              ) : activeProducts.length === 0 ? (
                /* Ürün Tanımlı Değilse Uyarı ve Ekleme Kutusu */
                <div className="p-4 border border-dashed border-amber-300 dark:border-amber-800/60 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                    <AlertCircle className="h-4 w-4" />
                    Henüz tanımlı kantin/dolap ürünü bulunmamaktadır.
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Hızlı satış yapabilmek için lütfen önce ürün ve fiyat tanımlayınız (Örn: 0.5L Su: ₺10, Meşrubat: ₺25).
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsAddProductOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Şimdi İlk Ürünü Ekle
                  </Button>
                </div>
              ) : (
                /* Tanımlı Ürün Butonları */
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {activeProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        selectedProductId === prod.id
                          ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
                          : "border-border hover:border-muted-foreground/30 bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{prod.icon || "🛒"}</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-foreground/5 text-foreground">
                          ₺{prod.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="font-medium text-xs text-foreground truncate mt-1.5" title={prod.name}>
                        {prod.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tutar & Kategori (Manuel Düzenleme/Özel Giriş) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="font-semibold text-sm">
                  Kategori
                </Label>
                <Select value={category} onValueChange={(val) => handleCustomCategorySelect(val ?? "Kantin & Atıştırmalık")}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Su & İçecek">💧 Su & İçecek</SelectItem>
                    <SelectItem value="Meşrubat">🧃 Meşrubat</SelectItem>
                    <SelectItem value="Kantin & Atıştırmalık">🍫 Kantin & Atıştırmalık</SelectItem>
                    <SelectItem value="Ekipman & Malzeme">🥋 Ekipman & Malzeme</SelectItem>
                    <SelectItem value="Giyim & Aksesuar">🧦 Giyim & Aksesuar</SelectItem>
                    <SelectItem value="Diğer">✨ Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount" className="font-semibold text-sm">
                  Harcama Tutarı (₺) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₺</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setSelectedProductId("custom");
                      setAmount(e.target.value);
                    }}
                    className="pl-8 text-base font-semibold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="font-semibold text-sm">
                Açıklama / Ürün Notu
              </Label>
              <Input
                id="description"
                placeholder="Örn: 1 adet soğuk su"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Bakiye Durumu & Uyarı */}
            {activeStudentId > 0 && numericAmount > 0 && (
              <div
                className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                  isInsufficient
                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
                    : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isInsufficient ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <span className="font-medium">
                    {isInsufficient
                      ? `Yetersiz bakiye! (Fark: ₺${(numericAmount - currentBalance).toFixed(2)})`
                      : `İşlem sonrası kalan bakiye:`}
                  </span>
                </div>
                <span className="font-bold text-sm">
                  ₺{Math.max(0, remainingAfter).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={spendMutation.isPending}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                disabled={spendMutation.isPending || isInsufficient || !activeStudentId || numericAmount <= 0}
              >
                {spendMutation.isPending ? "Düşülüyor..." : "Bakiyeden Düş"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* İç İçe Ürün Ekleme Dialogu */}
      <CanteenProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
      />
    </>
  );
}

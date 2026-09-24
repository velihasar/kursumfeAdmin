"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useStudentWallet,
  useDeleteStudentWalletTransaction,
} from "@/hooks/useStudentWallets";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Trash2,
  Calendar,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

interface WalletDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: number;
  onDepositClick: (studentId: number, studentName?: string) => void;
  onSpendClick: (studentId: number, studentName?: string, balance?: number) => void;
}

export function WalletDetailDialog({
  open,
  onOpenChange,
  studentId,
  onDepositClick,
  onSpendClick,
}: WalletDetailDialogProps) {
  const { data: wallet, isLoading } = useStudentWallet(studentId);
  const deleteTransactionMutation = useDeleteStudentWalletTransaction();

  const handleDeleteTransaction = async (txId: number) => {
    if (!confirm("Bu işlemi iptal etmek istediğinize emin misiniz? Bakiye otomatik olarak geri ayarlanacaktır.")) {
      return;
    }

    try {
      await deleteTransactionMutation.mutateAsync({ id: txId });
      toast.success("İşlem başarıyla iptal edildi.");
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.message ||
        "İşlem iptal edilirken bir hata oluştu.";
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {wallet?.studentName || "Öğrenci Cüzdan Detayı"}
                </DialogTitle>
                <DialogDescription>
                  {wallet?.studentNumber ? `Öğrenci No: ${wallet.studentNumber}` : "Bakiye ve Harcama Özeti"}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                onClick={() => {
                  if (studentId) onDepositClick(studentId, wallet?.studentName);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Bakiye
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1"
                onClick={() => {
                  if (studentId) onSpendClick(studentId, wallet?.studentName, wallet?.balance);
                }}
              >
                <Minus className="h-3.5 w-3.5" /> Harcama
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Bakiye Kartları */}
        <div className="grid grid-cols-3 gap-3 my-2">
          <div className="p-3.5 rounded-xl border bg-card/60 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground">Mevcut Bakiye</div>
            <div className={`text-xl font-bold mt-1 ${(wallet?.balance ?? 0) > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
              ₺{(wallet?.balance ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-card/60 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground">Toplam Yüklenen</div>
            <div className="text-lg font-bold text-foreground mt-1">
              ₺{(wallet?.totalDeposited ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-card/60 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-muted-foreground">Toplam Harcanan</div>
            <div className="text-lg font-bold text-foreground mt-1">
              ₺{(wallet?.totalSpent ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* İşlem Geçmişi Listesi */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            İşlem Geçmişi ({wallet?.transactions?.length ?? 0})
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Yükleniyor...</div>
          ) : !wallet?.transactions || wallet.transactions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl bg-muted/20">
              Henüz bir yükleme veya harcama hareketi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-1.5">
              {wallet.transactions.map((tx) => {
                const isDeposit = tx.transactionType === 1;
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isDeposit
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                        }`}
                      >
                        {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{tx.description || tx.category || (isDeposit ? "Bakiye Yükleme" : "Harcama")}</span>
                          {tx.category && (
                            <Badge variant="outline" className="text-[10px] font-normal py-0">
                              {tx.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>
                            {tx.transactionDate
                              ? new Date(tx.transactionDate).toLocaleString("tr-TR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </span>
                          {tx.paymentTypeName && <span>• {tx.paymentTypeName}</span>}
                          {tx.receiptNo && <span>• Fiş: {tx.receiptNo}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className={`font-bold text-sm ${isDeposit ? "text-emerald-600" : "text-foreground"}`}>
                          {isDeposit ? "+" : "-"}₺
                          {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Bakiye: ₺{tx.balanceAfter.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        title="İşlemi İptal Et"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        disabled={deleteTransactionMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

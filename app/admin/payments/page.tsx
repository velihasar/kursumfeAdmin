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
  Receipt,
  Banknote,
  Plus,
  Search,
  Building2,
  Filter,
  Trash2,
  Edit2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  FileText,
  User,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, checkIsSuperAdmin } from "@/lib/utils";
import { useTenants } from "@/hooks/useTenants";
import { useCourses } from "@/hooks/useCourses";
import {
  useFeeDues,
  useDeleteFeeDue,
  useGenerateMonthlyFeeDues,
} from "@/hooks/useFeeDues";
import {
  usePayments,
  useDeletePayment,
} from "@/hooks/usePayments";
import { FeeDueGetAllDto } from "@/types/feeDue.types";
import { PaymentGetAllDto } from "@/types/payment.types";
import { FeeDueDialog } from "@/components/admin/fee-due-dialog";
import { PaymentDialog } from "@/components/admin/payment-dialog";

function PaymentsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // Active View Tab: "feedues" (Aidatlar / Borçlar) | "payments" (Tahsilatlar / Ödemeler)
  const [activeTab, setActiveTab] = useState<"feedues" | "payments">("feedues");

  // Filter States
  const [selectedTenantId, setSelectedTenantId] = useState<number>(
    !isSuperAdmin && userTenantId > 0 ? userTenantId : 0
  );

  // FeeDue Filters
  const [feeDueSearch, setFeeDueSearch] = useState("");
  const [feeDueStatusFilter, setFeeDueStatusFilter] = useState<string>("ALL");
  const [feeDueCourseFilter, setFeeDueCourseFilter] = useState<string>("ALL");

  // Payment Filters
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("ALL");

  // Dialog States
  const [isFeeDueDialogOpen, setIsFeeDueDialogOpen] = useState(false);
  const [editingFeeDue, setEditingFeeDue] = useState<FeeDueGetAllDto | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentGetAllDto | null>(null);
  const [prefilledFeeDue, setPrefilledFeeDue] = useState<FeeDueGetAllDto | null>(null);

  // Delete States
  const [deletingFeeDue, setDeletingFeeDue] = useState<FeeDueGetAllDto | null>(null);
  const [isDeleteFeeDueOpen, setIsDeleteFeeDueOpen] = useState(false);

  const [deletingPayment, setDeletingPayment] = useState<PaymentGetAllDto | null>(null);
  const [isDeletePaymentOpen, setIsDeletePaymentOpen] = useState(false);

  // Queries
  const { data: tenants } = useTenants();
  const { data: courses } = useCourses(
    selectedTenantId > 0 ? { tenantId: selectedTenantId } : undefined
  );
  const {
    data: feeDues,
    isLoading: isLoadingFeeDues,
    refetch: refetchFeeDues,
  } = useFeeDues(selectedTenantId > 0 ? { tenantId: selectedTenantId } : undefined);

  const {
    data: payments,
    isLoading: isLoadingPayments,
    refetch: refetchPayments,
  } = usePayments(selectedTenantId > 0 ? { tenantId: selectedTenantId } : undefined);

  // Mutations
  const deleteFeeDueMutation = useDeleteFeeDue();
  const deletePaymentMutation = useDeletePayment();
  const generateMonthlyMutation = useGenerateMonthlyFeeDues();

  const handleGenerateMonthlyDues = async () => {
    try {
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const res = await generateMonthlyMutation.mutateAsync({
        period: currentPeriod,
        tenantId: selectedTenantId > 0 ? selectedTenantId : undefined,
      });
      toast.success(res.message || "Aylık aidat tahakkukları başarıyla oluşturuldu.");
      refetchFeeDues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Tahakkuk oluşturulurken hata meydana geldi."));
    }
  };

  // Auto-select initial tenant
  useEffect(() => {
    if (!isSuperAdmin && userTenantId > 0) {
      setSelectedTenantId(userTenantId);
    } else if (isSuperAdmin && tenants && tenants.length > 0 && selectedTenantId === 0) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isSuperAdmin, userTenantId, tenants, selectedTenantId]);

  // Handle URL action
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      setEditingPayment(null);
      setPrefilledFeeDue(null);
      setIsPaymentDialogOpen(true);
    } else if (action === "new-fee") {
      setEditingFeeDue(null);
      setIsFeeDueDialogOpen(true);
    }
  }, [searchParams]);

  // Financial Stats
  const stats = useMemo(() => {
    const totalDue = feeDues?.reduce((acc, f) => acc + (f.amount || 0), 0) || 0;
    const totalPaidOnDues = feeDues?.reduce((acc, f) => acc + (f.paidAmount || 0), 0) || 0;
    const totalRemaining = feeDues?.reduce((acc, f) => acc + (f.remainingAmount || 0), 0) || 0;
    const totalPaymentsReceived = payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
    const paymentCount = payments?.length || 0;
    const rate = totalDue > 0 ? Math.round((totalPaidOnDues / totalDue) * 100) : 0;

    return {
      totalDue,
      totalPaidOnDues,
      totalRemaining,
      totalPaymentsReceived,
      paymentCount,
      rate,
    };
  }, [feeDues, payments]);

  // Filtered Fee Dues
  const filteredFeeDues = useMemo(() => {
    if (!feeDues) return [];
    return feeDues.filter((f) => {
      // Status
      if (feeDueStatusFilter !== "ALL" && String(f.status) !== feeDueStatusFilter) {
        return false;
      }
      // Course
      if (feeDueCourseFilter !== "ALL" && String(f.courseEnrollmentId) !== feeDueCourseFilter) {
        return false;
      }
      // Search
      if (feeDueSearch.trim()) {
        const q = feeDueSearch.toLowerCase().trim();
        const sName = f.studentName?.toLowerCase() || "";
        const title = f.title?.toLowerCase() || "";
        const cName = f.courseName?.toLowerCase() || "";
        const period = f.period?.toLowerCase() || "";
        return sName.includes(q) || title.includes(q) || cName.includes(q) || period.includes(q);
      }
      return true;
    });
  }, [feeDues, feeDueStatusFilter, feeDueCourseFilter, feeDueSearch]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      // Payment Type
      if (paymentTypeFilter !== "ALL" && String(p.paymentType) !== paymentTypeFilter) {
        return false;
      }
      // Search
      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase().trim();
        const sName = p.studentName?.toLowerCase() || "";
        const prName = p.parentName?.toLowerCase() || "";
        const rec = p.receiptNo?.toLowerCase() || "";
        const tx = p.transactionId?.toLowerCase() || "";
        const notes = p.notes?.toLowerCase() || "";
        return (
          sName.includes(q) ||
          prName.includes(q) ||
          rec.includes(q) ||
          tx.includes(q) ||
          notes.includes(q)
        );
      }
      return true;
    });
  }, [payments, paymentTypeFilter, paymentSearch]);

  // Handlers
  const handleDeleteFeeDue = async () => {
    if (!deletingFeeDue) return;
    try {
      await deleteFeeDueMutation.mutateAsync({ id: deletingFeeDue.id });
      toast.success("Aidat kaydı silindi.");
      setIsDeleteFeeDueOpen(false);
      refetchFeeDues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Silme işlemi başarısız oldu."));
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;
    try {
      await deletePaymentMutation.mutateAsync({ id: deletingPayment.id });
      toast.success("Ödeme kaydı silindi.");
      setIsDeletePaymentOpen(false);
      refetchPayments();
      refetchFeeDues();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Silme işlemi başarısız oldu."));
    }
  };

  const handleOpenPaymentForFeeDue = (fee: FeeDueGetAllDto) => {
    setEditingPayment(null);
    setPrefilledFeeDue(fee);
    setIsPaymentDialogOpen(true);
  };

  // Select item options
  const tenantSelectItems = useMemo(() => {
    return tenants?.map((t) => ({ value: String(t.id), label: t.name })) || [];
  }, [tenants]);

  const feeDueStatusItems = [
    { value: "ALL", label: "Tüm Durumlar" },
    { value: "0", label: "Ödenmedi" },
    { value: "1", label: "Kısmi Ödendi" },
    { value: "2", label: "Tam Ödendi" },
  ];

  const paymentTypeItems = [
    { value: "ALL", label: "Tüm Ödeme Türleri" },
    { value: "1", label: "💵 Nakit" },
    { value: "2", label: "💳 Kredi / Banka Kartı" },
    { value: "3", label: "🏦 Havale / EFT" },
    { value: "4", label: "📄 POS / Çek" },
  ];

  const getPaymentTypeBadge = (type: number) => {
    switch (type) {
      case 1:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 text-[11px]">
            💵 Nakit
          </Badge>
        );
      case 2:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 gap-1 text-[11px]">
            💳 Kredi Kartı
          </Badge>
        );
      case 3:
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 gap-1 text-[11px]">
            🏦 Havale / EFT
          </Badge>
        );
      case 4:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1 text-[11px]">
            📄 POS / Çek
          </Badge>
        );
      default:
        return <Badge variant="secondary">Diğer</Badge>;
    }
  };

  const getStatusBadge = (status: number, dueDate?: string) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 2;

    switch (status) {
      case 2:
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]">
            <CheckCircle2 className="h-3 w-3" />
            Tam Ödendi
          </Badge>
        );
      case 1:
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-[11px]">
            <Clock className="h-3 w-3" />
            Kısmi Ödendi
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="gap-1 text-[11px]">
            {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {isOverdue ? "Gecikmiş Borç" : "Ödenmedi"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Banknote className="h-7 w-7 text-emerald-600" />
            Aidat & Ödeme Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Öğrenci aidat tahakkuklarını (FeeDue) ve tahsilatları (Payment) takip edin, yeni ödeme ve borç kaydı oluşturun.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingFeeDue(null);
              setIsFeeDueDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Receipt className="h-4 w-4 text-primary" />
            + Yeni Aidat Ekle
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingPayment(null);
              setPrefilledFeeDue(null);
              setIsPaymentDialogOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          >
            <Banknote className="h-4 w-4" />
            Tahsilat / Ödeme Al
          </Button>
        </div>
      </div>

      {/* ─── Financial Summary Cards ─── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tahakkuk</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{stats.totalDue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm aidat ve borç kayıtları</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tahsilat</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ₺{stats.totalPaymentsReceived.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              <span>%{stats.rate} Tahsilat Başarısı ({stats.paymentCount} İşlem)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Alacak</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              ₺{stats.totalRemaining.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Kalan tahsil edilecek bakiye</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kurum Seçimi</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSuperAdmin ? (
              <Select
                items={tenantSelectItems}
                value={selectedTenantId > 0 ? String(selectedTenantId) : ""}
                onValueChange={(val) => setSelectedTenantId(Number(val))}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Kurum Seçiniz">
                    {selectedTenantId > 0
                      ? tenants?.find((t) => t.id === selectedTenantId)?.name
                      : "Kurum Seçiniz"}
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
            ) : (
              <div className="text-sm font-semibold truncate mt-1">
                {tenants?.find((t) => t.id === userTenantId)?.name || "Kurumum"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Veriler bu kuruma göre filtrelenir</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Main Content Tabs ─── */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
              <Button
                variant={activeTab === "feedues" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("feedues")}
                className="gap-1.5 text-xs"
              >
                <Receipt className="h-4 w-4" />
                Aidat & Tahakkuklar ({feeDues?.length || 0})
              </Button>
              <Button
                variant={activeTab === "payments" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("payments")}
                className="gap-1.5 text-xs"
              >
                <Banknote className="h-4 w-4" />
                Tahsilat & Ödeme Geçmişi ({payments?.length || 0})
              </Button>
            </div>

            {/* Sub Info */}
            <div className="text-xs text-muted-foreground">
              {activeTab === "feedues"
                ? "Öğrenci bazlı aidat borçları ve tahakkuk durumu."
                : "Yapılan tüm tahsilat makbuzları ve ödeme kayıtları."}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* ═══════════ TAB 1: AIDATLAR & TAHAKKUKLAR (FEEDUES) ═══════════ */}
          {activeTab === "feedues" && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="grid gap-3 sm:grid-cols-2 flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Öğrenci, başlık, kurs veya dönem ara..."
                      value={feeDueSearch}
                      onChange={(e) => setFeeDueSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Select
                      items={feeDueStatusItems}
                      value={feeDueStatusFilter}
                      onValueChange={(val) => setFeeDueStatusFilter(val || "ALL")}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Tüm Durumlar">
                          {feeDueStatusItems.find((s) => s.value === feeDueStatusFilter)?.label || "Tüm Durumlar"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {feeDueStatusItems.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateMonthlyDues}
                  disabled={generateMonthlyMutation.isPending}
                  className="h-9 text-xs gap-1.5 border-primary/40 hover:bg-primary/10 text-primary font-medium shrink-0 shadow-2xs"
                  title="Tüm aktif kurs kayıtları için mevcut ayın aidatlarını otomatik oluşturur"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  {generateMonthlyMutation.isPending
                    ? "Tahakkuklar Oluşturuluyor..."
                    : "⚡ Dönem Aidatlarını Otomatik Oluştur"}
                </Button>
              </div>

              {/* FeeDues Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Aidat Başlığı / Kurs</TableHead>
                      <TableHead>Öğrenci</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="text-right">Ödenen</TableHead>
                      <TableHead className="text-right font-semibold">Kalan</TableHead>
                      <TableHead>Son Ödeme (Vade)</TableHead>
                      <TableHead className="text-center">Durum</TableHead>
                      <TableHead className="w-32 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingFeeDues ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-xs text-muted-foreground">
                          Aidat ve tahakkuk kayıtları yükleniyor...
                        </TableCell>
                      </TableRow>
                    ) : filteredFeeDues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-xs text-muted-foreground">
                          Kayıtlı aidat/tahakkuk bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFeeDues.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            <Badge variant="outline" className="font-mono text-[11px] bg-background">
                              {row.period}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-foreground">{row.title}</div>
                            {row.courseName && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <BookOpen className="h-3 w-3" />
                                {row.courseName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {row.studentName || `Öğrenci #${row.studentId}`}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">
                            ₺{row.amount?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs text-right text-emerald-600 font-medium">
                            ₺{row.paidAmount?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold text-rose-600">
                            ₺{row.remainingAmount?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex flex-col">
                              <span>
                                {row.dueDate
                                  ? new Date(row.dueDate).toLocaleDateString("tr-TR", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "-"}
                              </span>
                              {row.dueDate && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(row.dueDate).toLocaleDateString("tr-TR", { weekday: "short" })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(row.status, row.dueDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {row.status !== 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenPaymentForFeeDue(row)}
                                  className="h-8 px-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
                                  title="Tahsilat Al"
                                >
                                  <Banknote className="h-3.5 w-3.5 mr-1" />
                                  Ödeme Al
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingFeeDue(row);
                                  setIsFeeDueDialogOpen(true);
                                }}
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
                                  setDeletingFeeDue(row);
                                  setIsDeleteFeeDueOpen(true);
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
            </div>
          )}

          {/* ═══════════ TAB 2: TAHSİLAT & ÖDEME GEÇMİŞİ (PAYMENTS) ═══════════ */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Öğrenci, veli, makbuz no veya not ara..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div>
                  <Select
                    items={paymentTypeItems}
                    value={paymentTypeFilter}
                    onValueChange={(val) => setPaymentTypeFilter(val || "ALL")}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Tüm Ödeme Türleri">
                        {paymentTypeItems.find((p) => p.value === paymentTypeFilter)?.label || "Tüm Ödeme Türleri"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypeItems.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payments Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Makbuz / Tarih</TableHead>
                      <TableHead>Öğrenci & Veli</TableHead>
                      <TableHead className="text-right">Ödenen Tutar</TableHead>
                      <TableHead className="text-center">Ödeme Türü</TableHead>
                      <TableHead>İşlem No / Notlar</TableHead>
                      <TableHead className="w-24 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPayments ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                          Ödeme kayıtları yükleniyor...
                        </TableCell>
                      </TableRow>
                    ) : filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                          Kayıtlı ödeme/tahsilat bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-semibold text-foreground font-mono">
                              {row.receiptNo || `MAK-${row.id}`}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {row.paymentDate
                                ? new Date(row.paymentDate).toLocaleDateString("tr-TR", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    weekday: "short",
                                  })
                                : "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-foreground">{row.studentName || `Öğrenci #${row.studentId}`}</div>
                            {row.parentName && (
                              <div className="text-[11px] text-muted-foreground">
                                Veli: {row.parentName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold text-emerald-600 text-sm">
                            ₺{row.amount?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            {getPaymentTypeBadge(row.paymentType)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.transactionId && (
                              <div className="font-mono text-[11px] text-foreground">
                                İşlem: {row.transactionId}
                              </div>
                            )}
                            <div>{row.notes || "-"}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingPayment(row);
                                  setPrefilledFeeDue(null);
                                  setIsPaymentDialogOpen(true);
                                }}
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
                                  setDeletingPayment(row);
                                  setIsDeletePaymentOpen(true);
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── MODALS ─── */}
      <FeeDueDialog
        open={isFeeDueDialogOpen}
        onOpenChange={setIsFeeDueDialogOpen}
        feeDue={editingFeeDue}
        onSuccess={() => {
          refetchFeeDues();
        }}
      />

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        payment={editingPayment}
        initialFeeDue={prefilledFeeDue}
        onSuccess={() => {
          refetchPayments();
          refetchFeeDues();
        }}
      />

      {/* ─── AIDAT SILME ONAY MODALI ─── */}
      <Dialog open={isDeleteFeeDueOpen} onOpenChange={setIsDeleteFeeDueOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Aidat / Tahakkuk Kaydını Sil
            </DialogTitle>
            <DialogDescription>
              Bu aidat kaydını silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>

          {deletingFeeDue && (
            <div className="p-3 bg-muted rounded-md text-xs space-y-1">
              <div>
                <strong>Başlık:</strong> {deletingFeeDue.title}
              </div>
              <div>
                <strong>Öğrenci:</strong> {deletingFeeDue.studentName}
              </div>
              <div>
                <strong>Tutar:</strong> ₺{deletingFeeDue.amount?.toLocaleString("tr-TR")}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteFeeDueOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFeeDue}
              disabled={deleteFeeDueMutation.isPending}
            >
              {deleteFeeDueMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ODEME SILME ONAY MODALI ─── */}
      <Dialog open={isDeletePaymentOpen} onOpenChange={setIsDeletePaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Ödeme / Tahsilat Kaydını Sil
            </DialogTitle>
            <DialogDescription>
              Bu ödeme kaydını silmek istediğinizden emin misiniz? İlişkili aidatın kalan bakiyesi tekrar güncellenecektir.
            </DialogDescription>
          </DialogHeader>

          {deletingPayment && (
            <div className="p-3 bg-muted rounded-md text-xs space-y-1">
              <div>
                <strong>Makbuz No:</strong> {deletingPayment.receiptNo}
              </div>
              <div>
                <strong>Öğrenci:</strong> {deletingPayment.studentName}
              </div>
              <div>
                <strong>Tutar:</strong> ₺{deletingPayment.amount?.toLocaleString("tr-TR")}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletePaymentOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePayment}
              disabled={deletePaymentMutation.isPending}
            >
              {deletePaymentMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}

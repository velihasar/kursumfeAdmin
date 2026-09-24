"use client";

import { useState, useMemo, Suspense } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ShoppingBag,
  Plus,
  Minus,
  Search,
  Building2,
  Filter,
  Trash2,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Coffee,
  CheckCircle2,
  Calendar,
  Eye,
  RefreshCw,
  Edit2,
  Tag,
  Package,
} from "lucide-react";
import {
  useStudentWallets,
  useStudentWalletTransactions,
  useDeleteStudentWalletTransaction,
} from "@/hooks/useStudentWallets";
import {
  useCanteenProducts,
  useDeleteCanteenProduct,
} from "@/hooks/useCanteenProducts";
import { useStudents } from "@/hooks/useStudents";
import { useTenants } from "@/hooks/useTenants";
import { checkIsSuperAdmin } from "@/lib/utils";
import { DepositWalletDialog } from "@/components/admin/deposit-wallet-dialog";
import { QuickSpendDialog } from "@/components/admin/quick-spend-dialog";
import { WalletDetailDialog } from "@/components/admin/wallet-detail-dialog";
import { CanteenProductDialog } from "@/components/admin/canteen-product-dialog";
import { CanteenProductGetAllDto } from "@/types/canteenProduct.types";
import { toast } from "sonner";

function WalletManagementContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // States
  const [activeTab, setActiveTab] = useState<"wallets" | "transactions" | "products">("wallets");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "positive" | "zero">("all");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Dialog States
  const [depositOpen, setDepositOpen] = useState(false);
  const [spendOpen, setSpendOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CanteenProductGetAllDto | null>(null);

  // Selected Student for Dialogs
  const [targetStudentId, setTargetStudentId] = useState<number | undefined>(undefined);
  const [targetStudentName, setTargetStudentName] = useState<string | undefined>(undefined);
  const [targetBalance, setTargetBalance] = useState<number | undefined>(undefined);

  // Data queries
  const tenantIdParam =
    isSuperAdmin && selectedTenantId !== "all" ? Number(selectedTenantId) : undefined;

  const {
    data: wallets = [],
    isLoading: isLoadingWallets,
    refetch: refetchWallets,
  } = useStudentWallets({ tenantId: tenantIdParam });

  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useStudentWalletTransactions({ tenantId: tenantIdParam });

  const {
    data: products = [],
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = useCanteenProducts({ tenantId: tenantIdParam });

  const { data: students = [] } = useStudents(
    tenantIdParam ? { tenantId: tenantIdParam } : undefined
  );
  const { data: tenants = [] } = useTenants();

  const deleteTransactionMutation = useDeleteStudentWalletTransaction();
  const deleteProductMutation = useDeleteCanteenProduct();

  // Combine students with existing wallets so every student can be seen
  const studentWalletList = useMemo(() => {
    const walletMap = new Map(wallets.map((w) => [w.studentId, w]));
    const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

    return students.map((s) => {
      const w = walletMap.get(s.id);
      return {
        studentId: s.id,
        walletId: w?.id ?? 0,
        studentName: `${s.firstName} ${s.lastName}`.trim(),
        studentNumber: s.studentNumber || "-",
        tenantId: s.tenantId ?? 0,
        tenantName: w?.tenantName || (s.tenantId ? tenantMap.get(s.tenantId) : undefined),
        balance: w?.balance ?? 0,
        totalDeposited: w?.totalDeposited ?? 0,
        totalSpent: w?.totalSpent ?? 0,
        lastTransactionDate: w?.lastTransactionDate,
      };
    });
  }, [students, wallets, tenants]);

  // Filtered Wallets
  const filteredWallets = useMemo(() => {
    return studentWalletList.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesNumber = item.studentNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesNumber) return false;
      }

      // Balance filter
      if (balanceFilter === "positive" && item.balance <= 0) return false;
      if (balanceFilter === "zero" && item.balance > 0) return false;

      return true;
    });
  }, [studentWalletList, searchQuery, balanceFilter]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tx.studentName?.toLowerCase().includes(q);
        const matchesNumber = tx.studentNumber?.toLowerCase().includes(q);
        const matchesDesc = tx.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesNumber && !matchesDesc) return false;
      }

      if (txTypeFilter !== "all" && String(tx.transactionType) !== txTypeFilter) {
        return false;
      }

      if (categoryFilter !== "all" && tx.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, txTypeFilter, categoryFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode?.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesCat) return false;
      }

      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, categoryFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
    const totalDeposited = wallets.reduce((acc, w) => acc + (w.totalDeposited || 0), 0);
    const totalSpent = wallets.reduce((acc, w) => acc + (w.totalSpent || 0), 0);
    const activeWalletsCount = wallets.filter((w) => (w.balance || 0) > 0).length;

    return {
      totalBalance,
      totalDeposited,
      totalSpent,
      activeWalletsCount,
      totalStudentsCount: students.length,
      totalProductsCount: products.length,
    };
  }, [wallets, students, products]);

  // Handlers
  const handleOpenDeposit = (studentId?: number, studentName?: string) => {
    setTargetStudentId(studentId);
    setTargetStudentName(studentName);
    setDepositOpen(true);
  };

  const handleOpenSpend = (studentId?: number, studentName?: string, balance?: number) => {
    setTargetStudentId(studentId);
    setTargetStudentName(studentName);
    setTargetBalance(balance);
    setSpendOpen(true);
  };

  const handleOpenDetail = (studentId: number) => {
    setTargetStudentId(studentId);
    setDetailOpen(true);
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };

  const handleOpenEditProduct = (prod: CanteenProductGetAllDto) => {
    setEditingProduct(prod);
    setProductDialogOpen(true);
  };

  const handleDeleteProduct = async (prodId: number) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

    try {
      await deleteProductMutation.mutateAsync({ id: prodId });
      toast.success("Ürün silindi.");
    } catch (err: any) {
      toast.error(err?.response?.data?.Message || err?.message || "Ürün silinemedi.");
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    if (!confirm("Bu işlemi iptal etmek istediğinize emin misiniz? Öğrenci bakiyesi geri yüklenecektir.")) {
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
        "İşlem iptal edilemedi.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Kantin, Dolap & Bakiye Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Öğrenci dolap / kantin avans bakiyelerini yönetin, ürün fiyatlarını tanımlayın ve tek tıkla satış yapın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleOpenCreateProduct}
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-xs gap-1.5"
          >
            <Tag className="h-4 w-4" />
            + Yeni Ürün Tanımla
          </Button>

          <Button
            onClick={() => handleOpenSpend()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Hızlı Dolap Satışı
          </Button>

          <Button
            onClick={() => handleOpenDeposit()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-2"
          >
            <Plus className="h-4 w-4" />
            Bakiye Yükle
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Toplam Öğrenci Bakiyesi
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₺{metrics.totalBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {metrics.activeWalletsCount} öğrencide aktif bakiye var
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Toplam Yüklenen Avans
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              ₺{metrics.totalDeposited.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Velilerden alınan toplam avans
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Toplam Harcanan (Kantin/Dolap)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              ₺{metrics.totalSpent.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Su, içecek ve kantin çıkışları
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Tanımlı Kantin Ürünleri
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {metrics.totalProductsCount} Ürün
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Fiyat listesinde kayıtlı ürünler
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Tab Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("wallets")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "wallets"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wallet className="h-4 w-4" />
                Öğrenci Bakiyeleri ({filteredWallets.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "transactions"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                Harcama & Yükleme Hareketleri ({filteredTransactions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "products"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tag className="h-4 w-4" />
                Kantin Ürünleri & Fiyat Listesi ({filteredProducts.length})
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* SuperAdmin Tenant Filter */}
              {isSuperAdmin && (
                <div className="w-[180px]">
                  <Select value={selectedTenantId} onValueChange={(val) => setSelectedTenantId(val ?? "all")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tüm Kurumlar">
                        {selectedTenantId === "all"
                          ? "Tüm Kurumlar"
                          : tenants.find((t) => String(t.id) === selectedTenantId)?.name || "Tüm Kurumlar"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kurumlar</SelectItem>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Search */}
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    activeTab === "products"
                      ? "Ürün veya barkod ara..."
                      : "Öğrenci ara..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>

              {/* Tab specific filter */}
              {activeTab === "wallets" ? (
                <Select
                  value={balanceFilter}
                  onValueChange={(val) => setBalanceFilter((val as "all" | "positive" | "zero") ?? "all")}
                >
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Tüm Bakiyeler">
                      {balanceFilter === "positive"
                        ? "Bakiyesi Olanlar"
                        : balanceFilter === "zero"
                        ? "Bakiyesi Sıfır (₺0)"
                        : "Tüm Bakiyeler"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Bakiyeler</SelectItem>
                    <SelectItem value="positive">Bakiyesi Olanlar</SelectItem>
                    <SelectItem value="zero">Bakiyesi Sıfır (₺0)</SelectItem>
                  </SelectContent>
                </Select>
              ) : activeTab === "transactions" ? (
                <>
                  <Select value={txTypeFilter} onValueChange={(val) => setTxTypeFilter(val ?? "all")}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Tüm İşlemler">
                        {txTypeFilter === "1"
                          ? "Bakiye Yüklemeleri (+)"
                          : txTypeFilter === "2"
                          ? "Harcamalar (-)"
                          : "Tüm İşlemler"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm İşlemler</SelectItem>
                      <SelectItem value="1">Bakiye Yüklemeleri (+)</SelectItem>
                      <SelectItem value="2">Harcamalar (-)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "all")}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Tüm Kategoriler">
                        {categoryFilter === "all" ? "Tüm Kategoriler" : categoryFilter}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      <SelectItem value="Su & İçecek">💧 Su & İçecek</SelectItem>
                      <SelectItem value="Meşrubat">🧃 Meşrubat</SelectItem>
                      <SelectItem value="Kantin & Atıştırmalık">🍫 Kantin & Atıştırmalık</SelectItem>
                      <SelectItem value="Ekipman & Malzeme">🥋 Ekipman & Malzeme</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                /* Products Tab Filter */
                <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "all")}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Tüm Kategoriler">
                      {categoryFilter === "all" ? "Tüm Kategoriler" : categoryFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    <SelectItem value="Su & İçecek">💧 Su & İçecek</SelectItem>
                    <SelectItem value="Meşrubat">🧃 Meşrubat</SelectItem>
                    <SelectItem value="Kantin & Atıştırmalık">🍫 Kantin & Atıştırmalık</SelectItem>
                    <SelectItem value="Ekipman & Malzeme">🥋 Ekipman & Malzeme</SelectItem>
                    <SelectItem value="Giyim & Aksesuar">🧦 Giyim & Aksesuar</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  refetchWallets();
                  refetchTransactions();
                  refetchProducts();
                }}
                title="Yenile"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === "wallets" ? (
            /* Öğrenci Bakiyeleri Tablosu */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Öğrenci</TableHead>
                    <TableHead>Öğrenci No</TableHead>
                    {isSuperAdmin && <TableHead>Kurum</TableHead>}
                    <TableHead className="text-right">Mevcut Bakiye</TableHead>
                    <TableHead className="text-right">Toplam Yüklenen</TableHead>
                    <TableHead className="text-right">Toplam Harcanan</TableHead>
                    <TableHead>Son İşlem Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingWallets ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        Bakiyeler yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : filteredWallets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        Kayıtlı öğrenci bakiyesi bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWallets.map((item) => (
                      <TableRow key={item.studentId} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                          {item.studentName}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {item.studentNumber}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-xs text-muted-foreground">
                            {item.tenantName || "-"}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.balance > 0
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            ₺{item.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">
                          ₺{item.totalDeposited.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs text-muted-foreground">
                          ₺{item.totalSpent.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.lastTransactionDate
                            ? new Date(item.lastTransactionDate).toLocaleString("tr-TR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 gap-1 text-xs"
                              onClick={() => handleOpenDeposit(item.studentId, item.studentName)}
                            >
                              <Plus className="h-3.5 w-3.5" /> Bakiye
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-indigo-200 gap-1 text-xs"
                              onClick={() => handleOpenSpend(item.studentId, item.studentName, item.balance)}
                            >
                              <Minus className="h-3.5 w-3.5" /> Harca
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Detay & İşlem Geçmişi"
                              onClick={() => handleOpenDetail(item.studentId)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : activeTab === "transactions" ? (
            /* Tüm Hareketler Tablosu */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Öğrenci</TableHead>
                    <TableHead>İşlem Türü</TableHead>
                    <TableHead>Kategori / Ürün</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Kalan Bakiye</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTransactions ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Hareketler yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Kayıtlı harcama veya yükleme hareketi bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isDeposit = tx.transactionType === 1;
                      return (
                        <TableRow key={tx.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">
                            {tx.transactionDate
                              ? new Date(tx.transactionDate).toLocaleString("tr-TR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {tx.studentName || `Öğrenci #${tx.studentId}`}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`gap-1 font-semibold text-xs ${
                                isDeposit
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400"
                              }`}
                            >
                              {isDeposit ? <ArrowDownLeft className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                              {isDeposit ? "Bakiye Yükleme" : "Harcama"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {tx.category || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {tx.description || "-"}
                            {tx.receiptNo && ` (Fiş: ${tx.receiptNo})`}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-bold text-sm ${
                                isDeposit ? "text-emerald-600" : "text-foreground"
                              }`}
                            >
                              {isDeposit ? "+" : "-"}₺
                              {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-medium">
                            ₺{tx.balanceAfter.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              title="İşlemi İptal Et (Geri Al)"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              disabled={deleteTransactionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Kantin Ürünleri & Fiyat Listesi Tablosu */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Barkod / Kod</TableHead>
                    <TableHead className="text-right">Satış Fiyatı</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProducts ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Ürünler yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <div className="space-y-2">
                          <div>Kayıtlı ürün bulunamadı.</div>
                          <Button size="sm" onClick={handleOpenCreateProduct} className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-3.5 w-3.5" /> İlk Ürünü Ekle
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{p.icon || "🛒"}</span>
                            <span>{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-medium">
                            {p.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {p.barcode || "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-base text-foreground">
                          ₺{p.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center text-xs font-medium">
                          {p.stockQuantity !== undefined && p.stockQuantity !== null ? (
                            <span className={p.stockQuantity <= 5 ? "text-red-500 font-bold" : "text-muted-foreground"}>
                              {p.stockQuantity} adet
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {p.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Düzenle"
                              onClick={() => handleOpenEditProduct(p)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              title="Sil"
                              onClick={() => handleDeleteProduct(p.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DepositWalletDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        preSelectedStudentId={targetStudentId}
        preSelectedStudentName={targetStudentName}
      />

      <QuickSpendDialog
        open={spendOpen}
        onOpenChange={setSpendOpen}
        preSelectedStudentId={targetStudentId}
        preSelectedStudentName={targetStudentName}
        preSelectedBalance={targetBalance}
      />

      <WalletDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        studentId={targetStudentId}
        onDepositClick={(sId, sName) => {
          setDetailOpen(false);
          handleOpenDeposit(sId, sName);
        }}
        onSpendClick={(sId, sName, bal) => {
          setDetailOpen(false);
          handleOpenSpend(sId, sName, bal);
        }}
      />

      <CanteenProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
      />
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>}>
      <WalletManagementContent />
    </Suspense>
  );
}

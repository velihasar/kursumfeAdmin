"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/useEvents";
import { useBranches } from "@/hooks/useBranches";
import { useTenants } from "@/hooks/useTenants";
import { EventGetAllDto } from "@/types/event.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Eye,
  GitBranch,
  School,
  Tag as TagIcon,
  Ticket,
  Calendar,
} from "lucide-react";
import { getApiErrorMessage, checkIsSuperAdmin } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_PRESETS = [
  "Seminer",
  "Veli Toplantısı",
  "Gezi & Tur",
  "Sınav",
  "Spor",
  "Sanat & Kültür",
  "Kutlama & Tören",
  "Atölye",
  "Konferans",
];

const STATUS_CONFIG: Record<number, { label: string; badgeClass: string }> = {
  0: { label: "Planlandı", badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  1: { label: "Devam Ediyor", badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  2: { label: "Tamamlandı", badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  3: { label: "İptal Edildi", badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

const ROLE_OPTIONS = [
  { value: 0, label: "Tüm Kullanıcılar (Herkes)" },
  { value: 1, label: "Öğrenciler" },
  { value: 2, label: "Veliler" },
  { value: 3, label: "Öğretmenler" },
];

function EventsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // Filters
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<number | undefined>(undefined);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<number | undefined>(undefined);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const activeTenantId = !isSuperAdmin && userTenantId > 0 ? userTenantId : selectedTenantFilter;

  // Queries
  const { data: events, isLoading, isError, refetch } = useEvents({
    tenantId: activeTenantId,
    branchId: selectedBranchFilter,
  });

  const { data: branches } = useBranches(
    activeTenantId ? { tenantId: activeTenantId } : undefined
  );
  const { data: tenants } = useTenants();

  // Mutations
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventGetAllDto | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventGetAllDto | null>(null);

  // Form Fields
  const [formTenantId, setFormTenantId] = useState<number | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Seminer");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [targetRole, setTargetRole] = useState<number>(0);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [isRegistrationRequired, setIsRegistrationRequired] = useState(false);
  const [status, setStatus] = useState<number>(0);

  // Check URL query action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setSelectedEvent(null);
    setFormTenantId(isSuperAdmin ? (selectedTenantFilter || (tenants && tenants[0]?.id) || undefined) : undefined);
    setBranchId(undefined);
    setTitle("");
    setDescription("");
    setCategory("Seminer");
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setStartDate(now.toISOString().slice(0, 16));
    setEndDate("");
    setLocation("");
    setTargetAudience("Tüm Öğrenciler & Veliler");
    setTargetRole(0);
    setCapacity(undefined);
    setIsRegistrationRequired(false);
    setStatus(0);
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: EventGetAllDto) => {
    setSelectedEvent(item);
    setFormTenantId(item.tenantId);
    setBranchId(item.branchId || undefined);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setCategory(item.category || "Seminer");
    setStartDate(item.startDate ? item.startDate.slice(0, 16) : "");
    setEndDate(item.endDate ? item.endDate.slice(0, 16) : "");
    setLocation(item.location || "");
    setTargetAudience(item.targetAudience || "");
    setTargetRole(item.targetRole ?? 0);
    setCapacity(item.capacity || undefined);
    setIsRegistrationRequired(item.isRegistrationRequired ?? false);
    setStatus(item.status ?? 0);
    setIsFormOpen(true);
  };

  // Open Detail Dialog
  const handleOpenDetail = (item: EventGetAllDto) => {
    setSelectedEvent(item);
    setIsDetailOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Etkinlik başlığı zorunludur.");
      return;
    }

    if (!startDate) {
      toast.error("Başlangıç tarihi ve saati zorunludur.");
      return;
    }

    if (isSuperAdmin && !formTenantId) {
      toast.error("Lütfen kurum seçiniz.");
      return;
    }

    if (selectedEvent) {
      // Update
      updateMutation.mutate(
        {
          id: selectedEvent.id,
          tenantId: isSuperAdmin ? formTenantId : undefined,
          branchId: branchId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          location: location.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          targetRole,
          capacity: capacity && capacity > 0 ? capacity : undefined,
          isRegistrationRequired,
          status,
        },
        {
          onSuccess: (res) => {
            if (res.success !== false) {
              toast.success("Etkinlik bilgileri başarıyla güncellendi.");
              setIsFormOpen(false);
              refetch();
            } else {
              toast.error(getApiErrorMessage(res.message, "Güncelleme sırasında hata oluştu."));
            }
          },
          onError: (err) => {
            toast.error(getApiErrorMessage(err, "Güncelleme yapılamadı."));
          },
        }
      );
    } else {
      // Create
      createMutation.mutate(
        {
          tenantId: isSuperAdmin ? formTenantId : undefined,
          branchId: branchId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          location: location.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          targetRole,
          capacity: capacity && capacity > 0 ? capacity : undefined,
          isRegistrationRequired,
          status,
        },
        {
          onSuccess: (res) => {
            if (res.success !== false) {
              toast.success("Yeni etkinlik başarıyla oluşturuldu.");
              setIsFormOpen(false);
              refetch();
            } else {
              toast.error(getApiErrorMessage(res.message, "Etkinlik eklenirken hata oluştu."));
            }
          },
          onError: (err) => {
            toast.error(getApiErrorMessage(err, "Etkinlik eklenemedi."));
          },
        }
      );
    }
  };

  // Submit Delete
  const handleDeleteConfirm = () => {
    if (!eventToDelete) return;

    deleteMutation.mutate(
      { id: eventToDelete.id },
      {
        onSuccess: () => {
          toast.success("Etkinlik başarıyla silindi.");
          setEventToDelete(null);
          refetch();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Silme işlemi başarısız."));
        },
      }
    );
  };

  // Filtered List
  const filteredEvents = (events || []).filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q));

    const matchesCategory =
      !selectedCategoryFilter || item.category === selectedCategoryFilter;

    const matchesStatus =
      selectedStatusFilter === undefined || item.status === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCount = events?.length || 0;
  const upcomingCount = events?.filter((e) => (e.status === 0 || e.status === 1)).length || 0;
  const registrationCount = events?.filter((e) => e.isRegistrationRequired).length || 0;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            Etkinlik & Takvim Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Okul seminerleri, veli toplantıları, sınavlar, geziler ve sosyal faaliyetleri planlayın ve duyurun.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="h-10 gap-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Yenile
          </Button>
          <Button onClick={handleOpenCreate} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2">
            <Plus className="h-4 w-4" />
            Yeni Etkinlik Ekle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Etkinlik</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sistemdeki tüm kayıtlı etkinlikler</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yaklaşan & Aktif</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Planlanan veya süren etkinlikler</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kayıt Gerektirenler</CardTitle>
            <Ticket className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{registrationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Katılım kontenjanı / kaydı olan</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-sm border border-border overflow-hidden">
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3 w-full">
              {/* SuperAdmin Tenant Filter */}
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                    value={selectedTenantFilter || ""}
                    onChange={(e) =>
                      setSelectedTenantFilter(Number(e.target.value) || undefined)
                    }
                  >
                    <option value="">Tüm Kurumlar</option>
                    {tenants?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch Filter */}
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  value={selectedBranchFilter || ""}
                  onChange={(e) =>
                    setSelectedBranchFilter(Number(e.target.value) || undefined)
                  }
                >
                  <option value="">Tüm Şubeler</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="">Kategori (Tümü)</option>
                  {CATEGORY_PRESETS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  value={selectedStatusFilter !== undefined ? selectedStatusFilter : ""}
                  onChange={(e) =>
                    setSelectedStatusFilter(e.target.value !== "" ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">Durum (Tümü)</option>
                  {Object.entries(STATUS_CONFIG).map(([val, conf]) => (
                    <option key={val} value={val}>
                      {conf.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Etkinlik ara..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Etkinlikler yükleniyor...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <XCircle className="h-10 w-10" />
              <p className="text-sm font-medium">Etkinlikler alınırken bir hata oluştu.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tekrar Dene
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Etkinlik Bulunamadı</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || selectedCategoryFilter || selectedStatusFilter !== undefined
                    ? "Arama kriterlerinize uygun etkinlik bulunamadı."
                    : "Henüz takvime kayıtlı bir etkinlik bulunmuyor. Yeni bir etkinlik planlayabilirsiniz."}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={handleOpenCreate} size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-1" /> Yeni Etkinlik Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#ID</TableHead>
                    {isSuperAdmin && <TableHead>Kurum</TableHead>}
                    <TableHead>Etkinlik Adı & Kategori</TableHead>
                    <TableHead>Tarih & Saat</TableHead>
                    <TableHead>Konum / Yer</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead>Katılım / Kontenjan</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((item) => {
                    const statusConf = STATUS_CONFIG[item.status ?? 0] || STATUS_CONFIG[0];
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{item.id}
                        </TableCell>

                        {isSuperAdmin && (
                          <TableCell>
                            <Badge variant="outline" className="font-normal gap-1">
                              <School className="h-3 w-3 text-primary" />
                              {item.tenantName || `Kurum #${item.tenantId}`}
                            </Badge>
                          </TableCell>
                        )}

                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.category && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                                  {item.category}
                                </Badge>
                              )}
                              {item.targetAudience && (
                                <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                  • {item.targetAudience}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="font-medium text-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary" />
                              {item.startDate ? new Date(item.startDate).toLocaleDateString("tr-TR") : "-"}
                            </div>
                            <div className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.startDate ? new Date(item.startDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : ""}
                              {item.endDate && ` - ${new Date(item.endDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {item.location ? (
                            <div className="text-xs text-foreground/90 flex items-center gap-1 max-w-[150px] truncate">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {item.branchName ? (
                            <span className="text-xs font-medium text-foreground/80 flex items-center gap-1">
                              <GitBranch className="h-3 w-3 text-muted-foreground" />
                              {item.branchName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Tüm Şubeler</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            {item.isRegistrationRequired ? (
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                                Kayıtlı {item.capacity ? `(${item.capacity} Kişi)` : ""}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Serbest Katılım</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={statusConf.badgeClass}>
                            {statusConf.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDetail(item)}
                              title="Görüntüle"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(item)}
                              title="Düzenle"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEventToDelete(item)}
                              title="Sil"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="h-5 w-5 text-primary" />
                {selectedEvent ? "Etkinlik Bilgilerini Düzenle" : "Yeni Etkinlik Planla"}
              </DialogTitle>
              <DialogDescription>
                Tarih, saat, konum, kategori ve hedef kitle ayrıntılarını belirleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* SuperAdmin Tenant Selection */}
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="ev-tenant">
                    Bağlı Kurum <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="ev-tenant"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                    value={formTenantId || ""}
                    onChange={(e) => setFormTenantId(Number(e.target.value) || undefined)}
                    required
                  >
                    <option value="">-- Kurum Seçiniz --</option>
                    {tenants?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch Selection & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-branch">Şube Kapsamı</Label>
                  <select
                    id="ev-branch"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                    value={branchId || ""}
                    onChange={(e) => setBranchId(Number(e.target.value) || undefined)}
                  >
                    <option value="">Tüm Şubeler (Genel)</option>
                    {branches?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ev-cat">Etkinlik Kategorisi</Label>
                  <select
                    id="ev-cat"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORY_PRESETS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Başlık */}
              <div className="space-y-2">
                <Label htmlFor="ev-title">
                  Etkinlik Başlığı <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-title"
                  placeholder="Örn: 1. Dönem Veli Bilgilendirme Toplantısı"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Açıklama */}
              <div className="space-y-2">
                <Label htmlFor="ev-desc">Açıklama / Program Detayları</Label>
                <Textarea
                  id="ev-desc"
                  rows={4}
                  placeholder="Etkinlik hakkında detaylar, akış ve katılımcılara yönelik notlar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Tarihler: Başlangıç ve Bitiş */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-start">
                    Başlangıç Tarihi ve Saati <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ev-start"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ev-end">Bitiş Tarihi ve Saati (Opsiyonel)</Label>
                  <Input
                    id="ev-end"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Konum / Yer & Hedef Kitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-loc">Konum / Mekan</Label>
                  <Input
                    id="ev-loc"
                    placeholder="Örn: Konferans Salonu veya Zoom Linki"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ev-target-role">Hedef Kitle Rolü</Label>
                  <select
                    id="ev-target-role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                    value={targetRole}
                    onChange={(e) => setTargetRole(Number(e.target.value))}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hedef Kitle Açıklaması & Durum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-aud-text">Hedef Kitle Notu</Label>
                  <Input
                    id="ev-aud-text"
                    placeholder="Örn: 8. ve 12. Sınıf Öğrencileri"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ev-status">Etkinlik Durumu</Label>
                  <select
                    id="ev-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value))}
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, conf]) => (
                      <option key={val} value={val}>
                        {conf.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kayıt ve Kontenjan Ayarları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 text-purple-500" />
                      Kayıt Zorunlu Mu?
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Katılımcıların önceden kayıt olması gerekir.
                    </p>
                  </div>
                  <Switch
                    checked={isRegistrationRequired}
                    onCheckedChange={setIsRegistrationRequired}
                  />
                </div>

                {isRegistrationRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="ev-cap">Kontenjan Limiti (Kişi)</Label>
                    <Input
                      id="ev-cap"
                      type="number"
                      placeholder="Örn: 50"
                      min={1}
                      value={capacity || ""}
                      onChange={(e) => setCapacity(Number(e.target.value) || undefined)}
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Kaydediliyor...
                  </>
                ) : selectedEvent ? (
                  "Güncelle"
                ) : (
                  "Planla & Kaydet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedEvent && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {selectedEvent.category && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedEvent.category}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={STATUS_CONFIG[selectedEvent.status ?? 0]?.badgeClass}
                  >
                    {STATUS_CONFIG[selectedEvent.status ?? 0]?.label}
                  </Badge>
                </div>
                <DialogTitle className="text-xl mt-2">
                  {selectedEvent.title}
                </DialogTitle>
                {selectedEvent.targetAudience && (
                  <DialogDescription className="text-sm font-medium text-foreground/80">
                    Hedef: {selectedEvent.targetAudience}
                  </DialogDescription>
                )}
              </DialogHeader>

              {selectedEvent.description && (
                <div className="p-4 rounded-lg bg-muted/40 border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedEvent.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t pt-3">
                <div>
                  <span className="font-semibold text-foreground">Başlangıç: </span>
                  {selectedEvent.startDate
                    ? new Date(selectedEvent.startDate).toLocaleString("tr-TR")
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Bitiş: </span>
                  {selectedEvent.endDate
                    ? new Date(selectedEvent.endDate).toLocaleString("tr-TR")
                    : "Belirtilmedi"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Konum: </span>
                  {selectedEvent.location || "Belirtilmedi"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Şube: </span>
                  {selectedEvent.branchName || "Tüm Şubeler"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Kayıt: </span>
                  {selectedEvent.isRegistrationRequired ? `Kayıt Zorunlu (${selectedEvent.capacity || "Limitsiz"} Kişi)` : "Serbest Katılım"}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDetailOpen(false)}>Kapat</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Etkinliği Silmek İstiyor Musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">{eventToDelete?.title}</strong> isimli etkinlik kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}

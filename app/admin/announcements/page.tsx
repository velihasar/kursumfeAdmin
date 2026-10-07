"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "@/hooks/useAnnouncements";
import { useBranches } from "@/hooks/useBranches";
import { useTenants } from "@/hooks/useTenants";
import { AnnouncementGetAllDto } from "@/types/announcement.types";
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
  Megaphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Eye,
  GitBranch,
  School,
  Tag as TagIcon,
  User,
  Users,
} from "lucide-react";
import { getApiErrorMessage, checkIsSuperAdmin } from "@/lib/utils";
import { toast } from "sonner";

const AUDIENCE_OPTIONS = [
  { value: 0, label: "Tüm Kullanıcılar (Herkes)", badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: 1, label: "Öğrenciler", badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: 2, label: "Veliler", badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: 3, label: "Öğretmenler & Personel", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
];

const TAG_PRESETS = ["Genel", "Sınav", "Tatil", "Önemli", "Etkinlik", "Kayıt", "Ders Programı", "Ödeme"];

function AnnouncementsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userTenantId = (session?.user as any)?.tenantId || 0;
  const isSuperAdmin = checkIsSuperAdmin(session?.user);

  // Filters
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<number | undefined>(undefined);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<number | undefined>(undefined);

  const activeTenantId = !isSuperAdmin && userTenantId > 0 ? userTenantId : selectedTenantFilter;

  // Queries
  const { data: announcements, isLoading, isError, refetch } = useAnnouncements({
    tenantId: activeTenantId,
    branchId: selectedBranchFilter,
  });

  const { data: branches } = useBranches(
    activeTenantId ? { tenantId: activeTenantId } : undefined
  );
  const { data: tenants } = useTenants();

  // Mutations
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementGetAllDto | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementGetAllDto | null>(null);

  // Form Fields
  const [formTenantId, setFormTenantId] = useState<number | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [tag, setTag] = useState("Genel");
  const [isImportant, setIsImportant] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [publishDate, setPublishDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [targetAudience, setTargetAudience] = useState<number>(0);

  // Check URL query action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setSelectedAnnouncement(null);
    setFormTenantId(isSuperAdmin ? (selectedTenantFilter || (tenants && tenants[0]?.id) || undefined) : undefined);
    setBranchId(undefined);
    setTitle("");
    setSummary("");
    setContent("");
    setAuthor((session?.user as any)?.name || "Yönetim");
    setTag("Genel");
    setIsImportant(false);
    setIsPublished(true);
    setPublishDate(new Date().toISOString().split("T")[0]);
    setExpireDate("");
    setTargetAudience(0);
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: AnnouncementGetAllDto) => {
    setSelectedAnnouncement(item);
    setFormTenantId(item.tenantId);
    setBranchId(item.branchId || undefined);
    setTitle(item.title || "");
    setSummary(item.summary || "");
    setContent(item.content || "");
    setAuthor(item.author || "");
    setTag(item.tag || "Genel");
    setIsImportant(item.isImportant ?? false);
    setIsPublished(item.isPublished ?? true);
    setPublishDate(item.publishDate ? item.publishDate.split("T")[0] : "");
    setExpireDate(item.expireDate ? item.expireDate.split("T")[0] : "");
    setTargetAudience(item.targetAudience ?? 0);
    setIsFormOpen(true);
  };

  // Open Detail Dialog
  const handleOpenDetail = (item: AnnouncementGetAllDto) => {
    setSelectedAnnouncement(item);
    setIsDetailOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Duyuru başlığı zorunludur.");
      return;
    }

    if (!content.trim()) {
      toast.error("Duyuru içeriği zorunludur.");
      return;
    }

    if (isSuperAdmin && !formTenantId) {
      toast.error("Lütfen kurum seçiniz.");
      return;
    }

    if (selectedAnnouncement) {
      // Update
      updateMutation.mutate(
        {
          id: selectedAnnouncement.id,
          tenantId: isSuperAdmin ? formTenantId : undefined,
          branchId: branchId || undefined,
          title: title.trim(),
          summary: summary.trim() || undefined,
          content: content.trim(),
          author: author.trim() || undefined,
          tag: tag.trim() || undefined,
          isImportant,
          isPublished,
          publishDate: publishDate ? new Date(publishDate).toISOString() : undefined,
          expireDate: expireDate ? new Date(expireDate).toISOString() : undefined,
          targetAudience,
        },
        {
          onSuccess: (res) => {
            if (res.success !== false) {
              toast.success("Duyuru başarıyla güncellendi.");
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
          summary: summary.trim() || undefined,
          content: content.trim(),
          author: author.trim() || undefined,
          tag: tag.trim() || undefined,
          isImportant,
          isPublished,
          publishDate: publishDate ? new Date(publishDate).toISOString() : undefined,
          expireDate: expireDate ? new Date(expireDate).toISOString() : undefined,
          targetAudience,
        },
        {
          onSuccess: (res) => {
            if (res.success !== false) {
              toast.success("Yeni duyuru başarıyla yayınlandı.");
              setIsFormOpen(false);
              refetch();
            } else {
              toast.error(getApiErrorMessage(res.message, "Duyuru eklenirken hata oluştu."));
            }
          },
          onError: (err) => {
            toast.error(getApiErrorMessage(err, "Duyuru eklenemedi."));
          },
        }
      );
    }
  };

  // Submit Delete
  const handleDeleteConfirm = () => {
    if (!announcementToDelete) return;

    deleteMutation.mutate(
      { id: announcementToDelete.id },
      {
        onSuccess: () => {
          toast.success("Duyuru başarıyla silindi.");
          setAnnouncementToDelete(null);
          refetch();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Silme işlemi başarısız."));
        },
      }
    );
  };

  // Filtered List
  const filteredAnnouncements = (announcements || []).filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.summary && item.summary.toLowerCase().includes(q)) ||
      (item.content && item.content.toLowerCase().includes(q)) ||
      (item.author && item.author.toLowerCase().includes(q)) ||
      (item.tag && item.tag.toLowerCase().includes(q));

    const matchesAudience =
      audienceFilter === undefined || item.targetAudience === audienceFilter;

    return matchesSearch && matchesAudience;
  });

  const totalCount = announcements?.length || 0;
  const importantCount = announcements?.filter((a) => a.isImportant).length || 0;
  const publishedCount = announcements?.filter((a) => a.isPublished !== false).length || 0;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Duyuru Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Öğrencilere, velilere veya personele yönelik kurumsal duyuruları hazırlayın, yayınlayın ve yönetin.
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
            Yeni Duyuru Ekle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Duyuru</CardTitle>
            <Megaphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sistemdeki tüm kayıtlı duyurular</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Önemli Duyurular</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{importantCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Öncelikli olarak işaretlenmiş</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yayında Olanlar</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{publishedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Kullanıcıların erişimine açık</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border border-border shadow-sm overflow-hidden">
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

              {/* Audience Filter */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  value={audienceFilter !== undefined ? audienceFilter : ""}
                  onChange={(e) =>
                    setAudienceFilter(e.target.value !== "" ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">Hedef Kitle (Tümü)</option>
                  {AUDIENCE_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Duyuru ara..."
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
              <p className="text-sm text-muted-foreground">Duyurular yükleniyor...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <XCircle className="h-10 w-10" />
              <p className="text-sm font-medium">Duyurular alınırken bir hata oluştu.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tekrar Dene
              </Button>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/50" />
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Duyuru Bulunamadı</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || audienceFilter !== undefined
                    ? "Arama kriterlerinize uygun duyuru bulunamadı."
                    : "Henüz kayıtlı bir duyuru bulunmuyor. Yeni bir duyuru oluşturabilirsiniz."}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={handleOpenCreate} size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-1" /> Yeni Duyuru Ekle
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
                    <TableHead>Başlık & Özet</TableHead>
                    <TableHead>Hedef Kitle</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead>Etiket / Yazar</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((item) => {
                    const aud = AUDIENCE_OPTIONS.find((a) => a.value === item.targetAudience) || AUDIENCE_OPTIONS[0];
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

                        <TableCell className="max-w-md">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              {item.isImportant && (
                                <Badge variant="destructive" className="text-[10px] py-0 px-1 font-bold animate-pulse">
                                  ÖNEMLİ
                                </Badge>
                              )}
                              <span className="truncate">{item.title}</span>
                            </div>
                            {item.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.summary}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={aud.badgeClass}>
                            {aud.label}
                          </Badge>
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
                          <div className="space-y-1">
                            {item.tag && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                                <TagIcon className="h-2.5 w-2.5 mr-1" />
                                {item.tag}
                              </Badge>
                            )}
                            {item.author && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <User className="h-2.5 w-2.5" />
                                {item.author}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.publishDate ? new Date(item.publishDate).toLocaleDateString("tr-TR") : "-"}
                          </div>
                        </TableCell>

                        <TableCell>
                          {item.isPublished !== false ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25">
                              Yayında
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-border">
                              Taslak
                            </Badge>
                          )}
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
                              onClick={() => setAnnouncementToDelete(item)}
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
                <Megaphone className="h-5 w-5 text-primary" />
                {selectedAnnouncement ? "Duyuruyu Düzenle" : "Yeni Duyuru Ekle"}
              </DialogTitle>
              <DialogDescription>
                Duyuru başlığını, içeriğini, hedef kitlesini ve geçerlilik tarihlerini belirleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* SuperAdmin Tenant Selection */}
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="ann-tenant">
                    Bağlı Kurum <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="ann-tenant"
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

              {/* Branch Selection & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ann-branch">Şube Kapsamı</Label>
                  <select
                    id="ann-branch"
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
                  <Label htmlFor="ann-audience">Hedef Kitle</Label>
                  <select
                    id="ann-audience"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(Number(e.target.value))}
                  >
                    {AUDIENCE_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Başlık */}
              <div className="space-y-2">
                <Label htmlFor="ann-title">
                  Duyuru Başlığı <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ann-title"
                  placeholder="Örn: 2026 Bahar Dönemi Sınav Takvimi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Kısa Özet */}
              <div className="space-y-2">
                <Label htmlFor="ann-summary">Kısa Özet / Alt Başlık</Label>
                <Input
                  id="ann-summary"
                  placeholder="Özet bilgi veya tek cümlelik açıklama"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              {/* İçerik */}
              <div className="space-y-2">
                <Label htmlFor="ann-content">
                  Duyuru İçeriği <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="ann-content"
                  rows={5}
                  placeholder="Duyurunun detaylı içeriğini buraya yazınız..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              {/* Etiket & Yazar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ann-tag">Etiket / Kategori</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ann-tag"
                      placeholder="Örn: Sınav, Genel"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {TAG_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setTag(p)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          tag === p
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ann-author">Yayınlayan / Yazar</Label>
                  <Input
                    id="ann-author"
                    placeholder="Örn: Okul Yönetimi"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ann-pub-date">Yayın Tarihi</Label>
                  <Input
                    id="ann-pub-date"
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ann-exp-date">Bitiş Tarihi (Opsiyonel)</Label>
                  <Input
                    id="ann-exp-date"
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Switches: IsImportant & IsPublished */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Önemli Duyuru
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Kullanıcı panelinde en üstte vurgulanır.
                    </p>
                  </div>
                  <Switch
                    checked={isImportant}
                    onCheckedChange={setIsImportant}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Yayında
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Kullanıcılar tarafından görüntülenebilir.
                    </p>
                  </div>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
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
                ) : selectedAnnouncement ? (
                  "Güncelle"
                ) : (
                  "Yayınla"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedAnnouncement && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {selectedAnnouncement.isImportant && (
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      ÖNEMLİ
                    </Badge>
                  )}
                  {selectedAnnouncement.tag && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedAnnouncement.tag}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs ml-auto">
                    {AUDIENCE_OPTIONS.find((a) => a.value === selectedAnnouncement.targetAudience)?.label}
                  </Badge>
                </div>
                <DialogTitle className="text-xl mt-2">
                  {selectedAnnouncement.title}
                </DialogTitle>
                {selectedAnnouncement.summary && (
                  <DialogDescription className="text-sm font-medium text-foreground/80">
                    {selectedAnnouncement.summary}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="p-4 rounded-lg bg-muted/40 border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedAnnouncement.content}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-3">
                <div>
                  <span className="font-semibold text-foreground">Yazar: </span>
                  {selectedAnnouncement.author || "Yönetim"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Şube: </span>
                  {selectedAnnouncement.branchName || "Tüm Şubeler"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Yayın Tarihi: </span>
                  {selectedAnnouncement.publishDate ? new Date(selectedAnnouncement.publishDate).toLocaleDateString("tr-TR") : "-"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Bitiş Tarihi: </span>
                  {selectedAnnouncement.expireDate ? new Date(selectedAnnouncement.expireDate).toLocaleDateString("tr-TR") : "Süresiz"}
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
        open={!!announcementToDelete}
        onOpenChange={(open) => !open && setAnnouncementToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyuruyu Silmek İstiyor Musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">{announcementToDelete?.title}</strong> başlıklı duyuru kalıcı olarak silinecektir. Bu işlem geri alınamaz.
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

export default function AnnouncementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <AnnouncementsContent />
    </Suspense>
  );
}

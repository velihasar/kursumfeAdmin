"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useParents, useCreateParent, useDeleteParent } from "@/hooks/useParents";
import { usePeople, useCreatePerson, useUpdatePerson } from "@/hooks/usePeople";
import { useStudents } from "@/hooks/useStudents";
import { useStudentParents } from "@/hooks/useStudentParents";
import { useTenants } from "@/hooks/useTenants";
import { ParentGetAllDto } from "@/types/parent.types";
import { getApiErrorMessage } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Icons
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Phone,
  Edit,
  Trash2,
  GraduationCap,
  School,
  Copy,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

// Helper for Turkish character case normalization
const normalizeTr = (str?: string) => (str || "").toLocaleLowerCase("tr-TR").trim();

function ParentsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Role & Tenant Checks
  const userTenantId = (session?.user as any)?.tenantId || 0;
  const userRoles: string[] = (session?.user as any)?.roles || [];
  const isSuperAdmin = userRoles.includes("SuperAdmin") || userRoles.includes("SUPER_ADMIN") || userTenantId === 0;

  // Queries
  const { data: parents, isLoading: isLoadingParents, refetch: refetchParents } = useParents();
  const { data: people, isLoading: isLoadingPeople, refetch: refetchPeople } = usePeople();
  const { data: students } = useStudents();
  const { data: studentParents } = useStudentParents();
  const { data: tenants } = useTenants();

  // Mutations
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const createParentMutation = useCreateParent();
  const deleteParentMutation = useDeleteParent();

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(undefined);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentGetAllDto | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formTenantId, setFormTenantId] = useState<number | undefined>(undefined);

  // Confirm Delete Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<ParentGetAllDto | null>(null);

  // Auto-open new modal if action=new in URL query
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      handleOpenCreateModal();
    }
  }, [searchParams]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedParent(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setFormTenantId(!isSuperAdmin && userTenantId > 0 ? userTenantId : undefined);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (parent: ParentGetAllDto) => {
    const person = people?.find((p) => p.id === parent.personId);
    setSelectedParent(parent);
    setFirstName(parent.firstName || person?.firstName || "");
    setLastName(parent.lastName || person?.lastName || "");
    setEmail(parent.email || person?.email || "");
    setPhone(parent.phone || person?.phone || "");
    setFormTenantId(parent.tenantId || (!isSuperAdmin && userTenantId > 0 ? userTenantId : undefined));
    setIsFormOpen(true);
  };

  // Handle Submit Form (Create or Edit Parent)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Lütfen ad ve soyad alanlarını doldurunuz.");
      return;
    }

    try {
      const cleanPhoneVal = phone.replace(/\s+/g, "").trim() || undefined;
      const targetTenant = formTenantId || (userTenantId > 0 ? userTenantId : undefined);

      if (selectedParent) {
        // EDIT Mode
        const personId = selectedParent.personId;
        if (personId) {
          await updatePersonMutation.mutateAsync({
            id: personId,
            tenantId: targetTenant,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || undefined,
            phone: cleanPhoneVal,
          });
        }
        toast.success("Veli bilgileri başarıyla güncellendi.");
      } else {
        // CREATE Mode
        const personRes: any = await createPersonMutation.mutateAsync({
          tenantId: targetTenant,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: cleanPhoneVal,
        });

        const newPersonId = personRes?.data?.id || personRes?.id;
        if (!newPersonId) {
          throw new Error("Kişi oluşturulamadı.");
        }

        await createParentMutation.mutateAsync({
          personId: newPersonId,
          tenantId: targetTenant,
        });

        toast.success("Yeni veli kaydı başarıyla oluşturuldu.");
      }

      setIsFormOpen(false);
      refetchParents();
      refetchPeople();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "İşlem sırasında bir hata oluştu."));
    }
  };

  // Handle Delete Parent
  const handleDeleteParent = async () => {
    if (!parentToDelete) return;
    try {
      await deleteParentMutation.mutateAsync({ id: parentToDelete.id });
      toast.success("Veli kaydı başarıyla silindi.");
      setDeleteConfirmOpen(false);
      setParentToDelete(null);
      refetchParents();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Veli silinirken bir hata oluştu."));
    }
  };

  // Copy phone number to clipboard
  const handleCopyPhone = (phoneNum: string) => {
    const clean = phoneNum.replace(/\s+/g, "");
    navigator.clipboard.writeText(clean);
    setCopiedPhone(clean);
    toast.success(`Telefon numarası kopyalandı: ${clean}`);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Combine Parent data with Person & Linked Students
  const combinedParents = useMemo(() => {
    if (!parents) return [];

    return parents.map((parent) => {
      const person = people?.find((p) => p.id === parent.personId);
      const fName = parent.firstName || person?.firstName || "";
      const lName = parent.lastName || person?.lastName || "";
      const fullName = `${fName} ${lName}`.trim() || `Veli #${parent.id}`;
      const phoneNum = parent.phone || person?.phone || "";
      const emailAddr = parent.email || person?.email || "";

      // Linked Students (Children)
      const linkedSps = (studentParents || []).filter((sp) => sp.parentId === parent.id);
      const linkedChildren = linkedSps.map((sp) => {
        const studentObj = (students || []).find((s) => s.id === sp.studentId);
        const studentPersonObj = studentObj
          ? (studentObj as any).person || (people || []).find((p) => p.id === studentObj.personId)
          : null;

        const childName = studentPersonObj
          ? `${studentPersonObj.firstName} ${studentPersonObj.lastName}`
          : studentObj?.firstName && studentObj?.lastName
          ? `${studentObj.firstName} ${studentObj.lastName}`
          : `Öğrenci #${sp.studentId}`;

        return {
          studentId: sp.studentId,
          childName,
          relationship: sp.relationship,
          isPrimary: sp.isPrimary,
          studentNumber: studentObj?.studentNumber,
        };
      });

      return {
        ...parent,
        person,
        fullName,
        fName,
        lName,
        phoneNum,
        emailAddr,
        linkedChildren,
      };
    });
  }, [parents, people, students, studentParents]);

  // Filtered Parents
  const filteredParents = useMemo(() => {
    return combinedParents.filter((item) => {
      // SuperAdmin Tenant Filter
      if (isSuperAdmin && selectedTenantId && selectedTenantId > 0) {
        if (item.tenantId !== selectedTenantId) return false;
      }

      const q = normalizeTr(searchTerm);
      if (!q) return true;

      const inName = normalizeTr(item.fullName).includes(q);
      const inPhone = normalizeTr(item.phoneNum).includes(q);
      const inEmail = normalizeTr(item.emailAddr).includes(q);
      const inChild = item.linkedChildren.some((child) => normalizeTr(child.childName).includes(q));

      return inName || inPhone || inEmail || inChild;
    });
  }, [combinedParents, isSuperAdmin, selectedTenantId, searchTerm]);

  // Stats
  const totalParentsCount = combinedParents.length;
  const parentsWithPhoneCount = combinedParents.filter((p) => !!p.phoneNum).length;
  const parentsWithChildrenCount = combinedParents.filter((p) => p.linkedChildren.length > 0).length;

  const isLoading = isLoadingParents || isLoadingPeople;

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Veli Rehberi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Okulda kayıtlı olan tüm velilerin iletişim bilgilerini ve bağlı öğrencilerini görüntüleyin.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchParents();
              refetchPeople();
            }}
            disabled={isLoadingParents || isLoadingPeople}
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingParents || isLoadingPeople) ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button onClick={handleOpenCreateModal} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Veli Kaydet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Veli Sayısı
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalParentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı aktif veli profili</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Telefonu Tanımlı Veliler
            </CardTitle>
            <Phone className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{parentsWithPhoneCount}</div>
            <p className="text-xs text-muted-foreground mt-1">SMS ve iletişim kurulabilir veli</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Öğrencisi Bağlı Veliler
            </CardTitle>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{parentsWithChildrenCount}</div>
            <p className="text-xs text-muted-foreground mt-1">En az bir öğrencisi olan veli</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {isSuperAdmin && (
                <div className="w-full sm:w-56">
                  <select
                    value={selectedTenantId || ""}
                    onChange={(e) => setSelectedTenantId(Number(e.target.value) || undefined)}
                    className={`w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                      !selectedTenantId ? "text-muted-foreground" : "text-foreground font-medium"
                    }`}
                  >
                    <option value="" className="text-muted-foreground">Tüm Kurumlar (Hepsi)</option>
                    {tenants?.map((t) => (
                      <option key={t.id} value={t.id} className="text-foreground">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Veli adı, telefon, e-posta veya öğrenci adıyla ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veli Adı Soyadı</TableHead>
                <TableHead>Telefon Numarası</TableHead>
                <TableHead>E-Posta</TableHead>
                <TableHead>Bağlı Öğrenciler (Çocukları)</TableHead>
                {isSuperAdmin && <TableHead>Kurum</TableHead>}
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 6 : 5} className="py-8 text-center text-muted-foreground">
                    Veliler yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredParents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 6 : 5} className="py-8 text-center text-muted-foreground">
                    Arama kriterlerine uygun veli kaydı bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filteredParents.map((parent) => {
                  const tenantName = tenants?.find((t) => t.id === parent.tenantId)?.name || `Kurum #${parent.tenantId}`;

                  return (
                    <TableRow key={parent.id}>
                      {/* Veli Adı Soyadı */}
                      <TableCell className="font-semibold text-foreground flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {parent.fName?.[0] || "V"}
                          {parent.lName?.[0] || ""}
                        </div>
                        <div>
                          <div>{parent.fullName}</div>
                          <span className="text-[10px] text-muted-foreground font-normal">ID: #{parent.id}</span>
                        </div>
                      </TableCell>

                      {/* Telefon */}
                      <TableCell>
                        {parent.phoneNum ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                            <span>{parent.phoneNum}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyPhone(parent.phoneNum)}
                              title="Kopyala"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            >
                              {copiedPhone === parent.phoneNum.replace(/\s+/g, "") ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Telefon girilmemiş</span>
                        )}
                      </TableCell>

                      {/* E-Posta */}
                      <TableCell className="text-muted-foreground">
                        {parent.emailAddr ? (
                          <span className="text-foreground text-xs">{parent.emailAddr}</span>
                        ) : (
                          <span className="italic text-[11px]">-</span>
                        )}
                      </TableCell>

                      {/* Bağlı Öğrenciler */}
                      <TableCell>
                        {parent.linkedChildren.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {parent.linkedChildren.map((child) => (
                              <Badge
                                key={child.studentId}
                                variant={child.isPrimary ? "default" : "outline"}
                                className="text-[10px] py-0.5 px-2 gap-1 font-normal"
                              >
                                <GraduationCap className="w-3 h-3 opacity-70" />
                                <span>{child.childName}</span>
                                {child.relationship && (
                                   <span className="opacity-75">({child.relationship})</span>
                                )}
                                {child.isPrimary && (
                                  <span className="bg-primary-foreground text-primary rounded-full px-1 text-[9px] font-bold">
                                    Birincil
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Bağlı öğrenci yok</span>
                        )}
                      </TableCell>

                      {/* Kurum (SuperAdmin) */}
                      {isSuperAdmin && (
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            <School className="w-3 h-3 mr-1 text-primary" />
                            {tenantName}
                          </Badge>
                        </TableCell>
                      )}

                      {/* İşlemler */}
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(parent)}
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                          title="Düzenle"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setParentToDelete(parent);
                            setDeleteConfirmOpen(true);
                          }}
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>

      {/* CREATE / EDIT PARENT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {selectedParent ? "Veli Bilgilerini Güncelle" : "Yeni Veli Kaydet"}
            </DialogTitle>
            <DialogDescription>
              Veliye ait ad, soyad ve iletişim bilgilerini giriniz.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 my-2">
            {/* SuperAdmin Tenant Selection */}
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <Label htmlFor="parent-tenant" className="flex items-center gap-1 text-xs font-medium">
                  <School className="w-3.5 h-3.5 text-primary" />
                  Bağlı Olduğu Kurum
                </Label>
                <select
                  id="parent-tenant"
                  value={formTenantId || ""}
                  onChange={(e) => setFormTenantId(Number(e.target.value) || undefined)}
                  className="w-full bg-background border border-input rounded-md px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Kurum Seçin --</option>
                  {tenants?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="parent-fname" className="text-xs font-medium">
                  Ad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parent-fname"
                  required
                  placeholder="Velinin adını giriniz..."
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parent-lname" className="text-xs font-medium">
                  Soyad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parent-lname"
                  required
                  placeholder="Velinin soyadını giriniz..."
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parent-phone" className="flex items-center justify-between text-xs font-medium">
                <span>Telefon Numarası</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Opsiyonel)</span>
              </Label>
              <Input
                id="parent-phone"
                placeholder="05xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parent-email" className="flex items-center justify-between text-xs font-medium">
                <span>E-Posta Adresi</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Opsiyonel)</span>
              </Label>
              <Input
                id="parent-email"
                type="email"
                placeholder="ornek@okul.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-9 text-xs">
                İptal
              </Button>
              <Button
                type="submit"
                disabled={
                  createPersonMutation.isPending ||
                  updatePersonMutation.isPending ||
                  createParentMutation.isPending
                }
                className="h-9 text-xs gap-1.5"
              >
                {selectedParent ? "Güncelle" : "Veli Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              Veli Kaydını Sil
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              <strong>{(parentToDelete as any)?.fullName}</strong> isimli veli kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="h-8 text-xs"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteParentMutation.isPending}
              onClick={handleDeleteParent}
              className="h-8 text-xs"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ParentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-muted-foreground">Yükleniyor...</div>}>
      <ParentsContent />
    </Suspense>
  );
}

"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useCreateStudent } from "@/hooks/useStudents";
import { useCreatePerson } from "@/hooks/usePeople";
import { useCreateParent } from "@/hooks/useParents";
import { useCreateStudentParent } from "@/hooks/useStudentParents";
import { useCreateStudentBranch } from "@/hooks/useStudentBranches";
import { BranchGetAllDto } from "@/types/branch.types";
import { TenantGetAllDto } from "@/types/tenant.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  Building2,
  X,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface StudentExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branches?: BranchGetAllDto[];
  tenants?: TenantGetAllDto[];
  tenantId?: number;
  isSuperAdmin?: boolean;
  onSuccess?: () => void;
}

export type ImportMode = "student_only" | "student_and_parent";

interface ParsedStudentRow {
  rowNumber: number;
  // Student
  studentFirstName: string;
  studentLastName: string;
  studentPhone?: string;
  studentEmail?: string;
  studentDob?: string;
  enrollmentDate?: string;
  branchName?: string;
  matchedBranchId?: number;
  // Parent (if mode is student_and_parent)
  parentFirstName?: string;
  parentLastName?: string;
  parentPhone?: string;
  parentEmail?: string;
  relationship?: string;
  isPrimary?: boolean;
  // Status
  isValid: boolean;
  validationError?: string;
}

// Turkish string normalizer for header matching
const normalizeHeader = (str: string) => {
  return (str || "")
    .toString()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
};

// Date formatter for Excel serial date numbers or text
const parseExcelDate = (val: any): string | undefined => {
  if (!val) return undefined;
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  if (typeof val === "number") {
    // Excel date serial number to JS Date
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  const str = String(val).trim();
  // Match DD.MM.YYYY or DD/MM/YYYY
  const parts = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (parts) {
    const day = parts[1].padStart(2, "0");
    const month = parts[2].padStart(2, "0");
    const year = parts[3];
    return `${year}-${month}-${day}`;
  }
  // Match YYYY-MM-DD
  const isoParts = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoParts) {
    const year = isoParts[1];
    const month = isoParts[2].padStart(2, "0");
    const day = isoParts[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return undefined;
};

export function StudentExcelImportDialog({
  isOpen,
  onClose,
  branches = [],
  tenants = [],
  tenantId,
  isSuperAdmin = false,
  onSuccess,
}: StudentExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const createPersonMutation = useCreatePerson();
  const createStudentMutation = useCreateStudent();
  const createParentMutation = useCreateParent();
  const createStudentParentMutation = useCreateStudentParent();
  const createStudentBranchMutation = useCreateStudentBranch();

  // Dialog State
  const [importMode, setImportMode] = useState<ImportMode>("student_and_parent");
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(tenantId);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failCount: number;
    errors: string[];
  } | null>(null);

  const resetState = () => {
    setParsedRows([]);
    setFileName("");
    setIsProcessing(false);
    setProgress({ current: 0, total: 0, currentName: "" });
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    resetState();
    onClose();
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    let headers: string[];
    let sampleData: any[];

    if (importMode === "student_only") {
      headers = [
        "Öğrenci Adı*",
        "Öğrenci Soyadı*",
        "Öğrenci Telefon",
        "Öğrenci E-posta",
        "Doğum Tarihi (GG.AA.YYYY)",
        "Kayıt Tarihi (GG.AA.YYYY)",
        "Şube Adı",
      ];
      sampleData = [
        {
          "Öğrenci Adı*": "Ahmet",
          "Öğrenci Soyadı*": "Yılmaz",
          "Öğrenci Telefon": "05551112233",
          "Öğrenci E-posta": "ahmet.yilmaz@ornek.com",
          "Doğum Tarihi (GG.AA.YYYY)": "15.05.2008",
          "Kayıt Tarihi (GG.AA.YYYY)": "01.09.2026",
          "Şube Adı": branches[0]?.name || "10-A",
        },
        {
          "Öğrenci Adı*": "Zeynep",
          "Öğrenci Soyadı*": "Kaya",
          "Öğrenci Telefon": "05552223344",
          "Öğrenci E-posta": "zeynep.kaya@ornek.com",
          "Doğum Tarihi (GG.AA.YYYY)": "22.11.2009",
          "Kayıt Tarihi (GG.AA.YYYY)": "01.09.2026",
          "Şube Adı": branches[1]?.name || "9-B",
        },
      ];
    } else {
      headers = [
        "Öğrenci Adı*",
        "Öğrenci Soyadı*",
        "Öğrenci Telefon",
        "Öğrenci E-posta",
        "Doğum Tarihi (GG.AA.YYYY)",
        "Kayıt Tarihi (GG.AA.YYYY)",
        "Şube Adı",
        "Veli Adı*",
        "Veli Soyadı*",
        "Veli Telefon*",
        "Veli E-posta",
        "Yakınlık (Anne/Baba/Vasi)",
        "Birincil Veli (Evet/Hayır)",
      ];
      sampleData = [
        {
          "Öğrenci Adı*": "Ahmet",
          "Öğrenci Soyadı*": "Yılmaz",
          "Öğrenci Telefon": "05551112233",
          "Öğrenci E-posta": "ahmet.yilmaz@ornek.com",
          "Doğum Tarihi (GG.AA.YYYY)": "15.05.2008",
          "Kayıt Tarihi (GG.AA.YYYY)": "01.09.2026",
          "Şube Adı": branches[0]?.name || "10-A",
          "Veli Adı*": "Mehmet",
          "Veli Soyadı*": "Yılmaz",
          "Veli Telefon*": "05321112233",
          "Veli E-posta": "mehmet.yilmaz@ornek.com",
          "Yakınlık (Anne/Baba/Vasi)": "Baba",
          "Birincil Veli (Evet/Hayır)": "Evet",
        },
        {
          "Öğrenci Adı*": "Zeynep",
          "Öğrenci Soyadı*": "Kaya",
          "Öğrenci Telefon": "05552223344",
          "Öğrenci E-posta": "zeynep.kaya@ornek.com",
          "Doğum Tarihi (GG.AA.YYYY)": "22.11.2009",
          "Kayıt Tarihi (GG.AA.YYYY)": "01.09.2026",
          "Şube Adı": branches[1]?.name || "9-B",
          "Veli Adı*": "Fatma",
          "Veli Soyadı*": "Kaya",
          "Veli Telefon*": "05332223344",
          "Veli E-posta": "fatma.kaya@ornek.com",
          "Yakınlık (Anne/Baba/Vasi)": "Anne",
          "Birincil Veli (Evet/Hayır)": "Evet",
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    // Set auto column width
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OgrenciKayit");

    const exportFileName =
      importMode === "student_only"
        ? "ogrenci_aktarim_sablonu.xlsx"
        : "ogrenci_ve_veli_aktarim_sablonu.xlsx";

    XLSX.writeFile(wb, exportFileName);
    toast.success("Örnek Excel şablonu indirildi.");
  };

  // Parse Uploaded File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          toast.error("Excel dosyasında veri bulunamadı.");
          setParsedRows([]);
          return;
        }

        // Map and validate rows
        const parsed: ParsedStudentRow[] = rawJson.map((row, index) => {
          const rowKeys = Object.keys(row);

          // Find field values based on normalized key matching
          const getValue = (patterns: string[]): string => {
            const key = rowKeys.find((k) => {
              const norm = normalizeHeader(k);
              return patterns.some((p) => norm.includes(p));
            });
            return key ? String(row[key] || "").trim() : "";
          };

          const rawStudentFirstName = getValue(["ogrenciadi", "ogrenciad", "adi", "ad", "firstname"]);
          const rawStudentLastName = getValue(["ogrencisoyadi", "ogrencisoyad", "soyadi", "soyad", "lastname"]);
          const rawStudentPhone = getValue(["ogrencitelefon", "ogrencitel", "ogrenciphone", "telefon", "tel", "phone"]);
          const rawStudentEmail = getValue(["ogrencieposta", "ogrenciemail", "eposta", "email"]);
          const rawDob = getValue(["dogumtarihi", "dogum", "birthdate", "dob"]);
          const rawEnrollment = getValue(["kayittarihi", "kayit", "enrollmentdate"]);
          const rawBranchName = getValue(["subeadi", "sube", "branch", "sinif"]);

          // Parent fields
          const rawParentFirstName = getValue(["veliadi", "veliad", "parentfirstname"]);
          const rawParentLastName = getValue(["velisoyadi", "velisoyad", "parentlastname"]);
          const rawParentPhone = getValue(["velitelefon", "velitel", "parentphone"]);
          const rawParentEmail = getValue(["velieposta", "veliemail", "parentemail"]);
          const rawRelationship = getValue(["yakinlik", "iliski", "relationship"]) || "Anne";
          const rawIsPrimary = getValue(["birincil", "isprimary", "asil"]);

          const studentDob = parseExcelDate(rawDob);
          const enrollmentDate = parseExcelDate(rawEnrollment) || new Date().toISOString().split("T")[0];

          // Match Branch by Name
          let matchedBranchId: number | undefined;
          if (rawBranchName) {
            const branchMatch = branches.find(
              (b) => normalizeHeader(b.name) === normalizeHeader(rawBranchName)
            );
            if (branchMatch) {
              matchedBranchId = branchMatch.id;
            }
          }

          let isPrimary = true;
          if (rawIsPrimary) {
            const normP = normalizeHeader(rawIsPrimary);
            if (normP === "hayir" || normP === "false" || normP === "0" || normP === "h") {
              isPrimary = false;
            }
          }

          // Validation
          let isValid = true;
          let validationError: string | undefined;

          if (!rawStudentFirstName || !rawStudentLastName) {
            isValid = false;
            validationError = "Öğrenci adı ve soyadı zorunludur.";
          } else if (importMode === "student_and_parent") {
            if (!rawParentFirstName || !rawParentLastName) {
              isValid = false;
              validationError = "Veli adı ve soyadı zorunludur.";
            }
          }

          return {
            rowNumber: index + 2, // Excel 1-based + 1 for header
            studentFirstName: rawStudentFirstName,
            studentLastName: rawStudentLastName,
            studentPhone: rawStudentPhone || undefined,
            studentEmail: rawStudentEmail || undefined,
            studentDob,
            enrollmentDate,
            branchName: rawBranchName || undefined,
            matchedBranchId,
            parentFirstName: rawParentFirstName || undefined,
            parentLastName: rawParentLastName || undefined,
            parentPhone: rawParentPhone || undefined,
            parentEmail: rawParentEmail || undefined,
            relationship: rawRelationship || "Anne",
            isPrimary,
            isValid,
            validationError,
          };
        });

        setParsedRows(parsed);
        const validCount = parsed.filter((r) => r.isValid).length;
        toast.success(`${parsed.length} satır okundu (${validCount} geçerli kayıt).`);
      } catch (err: any) {
        toast.error("Excel dosyası okunurken hata oluştu. Lütfen dosya formatını kontrol edin.");
        console.error("Excel okuma hatası:", err);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Perform Batch Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Aktarılacak geçerli kayıt bulunamadı.");
      return;
    }

    if (isSuperAdmin && !selectedTenantId) {
      toast.error("Lütfen öğrencilerin kaydedileceği kurumu/okulu seçiniz.");
      return;
    }

    setIsProcessing(true);
    const targetTenant = isSuperAdmin ? selectedTenantId : tenantId;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setProgress({
        current: i + 1,
        total: validRows.length,
        currentName: `${row.studentFirstName} ${row.studentLastName}`,
      });

      try {
        // Step 1: Create Student Person
        const personRes: any = await createPersonMutation.mutateAsync({
          tenantId: targetTenant,
          firstName: row.studentFirstName,
          lastName: row.studentLastName,
          phone: row.studentPhone ? row.studentPhone.replace(/\s+/g, "") : undefined,
          email: row.studentEmail || undefined,
          dateOfBirth: row.studentDob ? new Date(row.studentDob).toISOString() : undefined,
        });

        const studentPersonId = personRes?.data?.id || personRes?.Data?.Id || personRes?.id;
        if (!studentPersonId) {
          throw new Error("Öğrenci kişi kaydı oluşturulamadı.");
        }

        // Step 2: Create Student Record
        const studentRes: any = await createStudentMutation.mutateAsync({
          tenantId: targetTenant,
          personId: studentPersonId,
          enrollmentDate: row.enrollmentDate ? new Date(row.enrollmentDate).toISOString() : new Date().toISOString(),
        });

        const studentId = studentRes?.data?.id || studentRes?.Data?.Id || studentRes?.id;
        if (!studentId) {
          throw new Error("Öğrenci kaydı oluşturulamadı.");
        }

        // Step 3: Assign Branch if matched
        if (row.matchedBranchId) {
          try {
            await createStudentBranchMutation.mutateAsync({
              tenantId: targetTenant,
              studentId,
              branchId: row.matchedBranchId,
            });
          } catch (bErr) {
            console.warn(`Şube ataması yapılamadı (Öğrenci: ${row.studentFirstName}):`, bErr);
          }
        }

        // Step 4: Create Parent & StudentParent if mode is student_and_parent
        if (importMode === "student_and_parent" && row.parentFirstName && row.parentLastName) {
          try {
            const parentPersonRes: any = await createPersonMutation.mutateAsync({
              tenantId: targetTenant,
              firstName: row.parentFirstName,
              lastName: row.parentLastName,
              phone: row.parentPhone ? row.parentPhone.replace(/\s+/g, "") : undefined,
              email: row.parentEmail || undefined,
            });

            const parentPersonId = parentPersonRes?.data?.id || parentPersonRes?.Data?.Id || parentPersonRes?.id;

            if (parentPersonId) {
              const parentRes: any = await createParentMutation.mutateAsync({
                tenantId: targetTenant,
                personId: parentPersonId,
              });

              const parentId = parentRes?.data?.id || parentRes?.Data?.Id || parentRes?.id;

              if (parentId) {
                await createStudentParentMutation.mutateAsync({
                  tenantId: targetTenant,
                  studentId,
                  parentId,
                  relationship: row.relationship || "Anne",
                  isPrimary: row.isPrimary !== undefined ? row.isPrimary : true,
                });
              }
            }
          } catch (pErr) {
            console.warn(`Veli kaydı oluşturulamadı (Öğrenci: ${row.studentFirstName}):`, pErr);
          }
        }

        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push(`Satır ${row.rowNumber} (${row.studentFirstName} ${row.studentLastName}): ${err?.message || "Bilinmeyen hata"}`);
      }
    }

    setIsProcessing(false);
    setImportResult({ successCount, failCount, errors });

    if (successCount > 0) {
      toast.success(`${successCount} öğrenci kaydı başarıyla oluşturuldu!`);
      onSuccess?.();
    }
    if (failCount > 0) {
      toast.warning(`${failCount} kayıt aktarılırken hata oluştu.`);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-xl">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Excel ile Toplu Öğrenci Aktarımı
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Excel dosyanızı yükleyerek tek seferde onlarca öğrenci ve veli kaydını sisteme aktarabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Institution Selector for SuperAdmin */}
          {isSuperAdmin && (
            <div className="space-y-2 p-3.5 rounded-lg border border-primary/20 bg-primary/5">
              <Label htmlFor="importTenantSelect" className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Öğrencilerin Aktarılacağı Kurum / Okul *
              </Label>
              <select
                id="importTenantSelect"
                value={selectedTenantId || ""}
                onChange={(e) => setSelectedTenantId(Number(e.target.value))}
                required
                className="w-full h-9 px-3 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                <option value="" disabled>-- Kurum Seçiniz --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} - {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Selection Tabs */}
          {!isProcessing && !importResult && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Aktarım Türü
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setImportMode("student_and_parent");
                    resetState();
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    importMode === "student_and_parent"
                      ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                      : "border-border bg-card/50 hover:bg-muted/30"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${importMode === "student_and_parent" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Öğrenci ve Veli Birlikte
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                        Önerilen
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Her satırda öğrenci bilgileriyle birlikte velisi de oluşturulur ve otomatik bağlanır.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportMode("student_only");
                    resetState();
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    importMode === "student_only"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border bg-card/50 hover:bg-muted/30"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${importMode === "student_only" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Sadece Öğrenci Kaydı
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sadece öğrenci ve şube kayıtları aktarılır. Veliler daha sonra tanımlanabilir.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Excel Format Guide & Template Download Box */}
          {!isProcessing && !importResult && (
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Beklenen Excel Kolon Formatı
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Aktarım yapmadan önce örnek Excel şablonunu indirip kendi verilerinizle doldurabilirsiniz.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-medium"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Örnek Şablon İndir (.xlsx)
                </Button>
              </div>

              {/* Columns Table Description */}
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Kolon Başlığı</th>
                      <th className="px-3 py-2">Durum</th>
                      <th className="px-3 py-2">Örnek Değer</th>
                      <th className="px-3 py-2">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-3 py-1.5 font-medium text-foreground">Öğrenci Adı</td>
                      <td className="px-3 py-1.5"><Badge variant="destructive" className="text-[10px] px-1 py-0 font-normal">Zorunlu</Badge></td>
                      <td className="px-3 py-1.5 text-muted-foreground">Ahmet</td>
                      <td className="px-3 py-1.5 text-muted-foreground">Öğrencinin adı</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-medium text-foreground">Öğrenci Soyadı</td>
                      <td className="px-3 py-1.5"><Badge variant="destructive" className="text-[10px] px-1 py-0 font-normal">Zorunlu</Badge></td>
                      <td className="px-3 py-1.5 text-muted-foreground">Yılmaz</td>
                      <td className="px-3 py-1.5 text-muted-foreground">Öğrencinin soyadı</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-medium text-foreground">Öğrenci Telefon</td>
                      <td className="px-3 py-1.5"><span className="text-[11px] text-muted-foreground">Opsiyonel</span></td>
                      <td className="px-3 py-1.5 text-muted-foreground">05551112233</td>
                      <td className="px-3 py-1.5 text-muted-foreground">İletişim numarası</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-medium text-foreground">Doğum Tarihi</td>
                      <td className="px-3 py-1.5"><span className="text-[11px] text-muted-foreground">Opsiyonel</span></td>
                      <td className="px-3 py-1.5 text-muted-foreground">15.05.2008</td>
                      <td className="px-3 py-1.5 text-muted-foreground">GG.AA.YYYY veya YYYY-AA-GG</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-medium text-foreground">Şube Adı</td>
                      <td className="px-3 py-1.5"><span className="text-[11px] text-muted-foreground">Opsiyonel</span></td>
                      <td className="px-3 py-1.5 text-muted-foreground">10-A</td>
                      <td className="px-3 py-1.5 text-muted-foreground">Sistemdeki şube adıyla otomatik eşleşir</td>
                    </tr>
                    {importMode === "student_and_parent" && (
                      <>
                        <tr className="bg-indigo-500/5">
                          <td className="px-3 py-1.5 font-medium text-indigo-700 dark:text-indigo-300">Veli Adı</td>
                          <td className="px-3 py-1.5"><Badge variant="destructive" className="text-[10px] px-1 py-0 font-normal">Zorunlu</Badge></td>
                          <td className="px-3 py-1.5 text-muted-foreground">Mehmet</td>
                          <td className="px-3 py-1.5 text-muted-foreground">Velinin adı</td>
                        </tr>
                        <tr className="bg-indigo-500/5">
                          <td className="px-3 py-1.5 font-medium text-indigo-700 dark:text-indigo-300">Veli Soyadı</td>
                          <td className="px-3 py-1.5"><Badge variant="destructive" className="text-[10px] px-1 py-0 font-normal">Zorunlu</Badge></td>
                          <td className="px-3 py-1.5 text-muted-foreground">Yılmaz</td>
                          <td className="px-3 py-1.5 text-muted-foreground">Velinin soyadı</td>
                        </tr>
                        <tr className="bg-indigo-500/5">
                          <td className="px-3 py-1.5 font-medium text-indigo-700 dark:text-indigo-300">Veli Telefon</td>
                          <td className="px-3 py-1.5"><span className="text-[11px] text-muted-foreground">Opsiyonel</span></td>
                          <td className="px-3 py-1.5 text-muted-foreground">05321112233</td>
                          <td className="px-3 py-1.5 text-muted-foreground">Veli mobil giriş ve bildirimler için</td>
                        </tr>
                        <tr className="bg-indigo-500/5">
                          <td className="px-3 py-1.5 font-medium text-indigo-700 dark:text-indigo-300">Yakınlık</td>
                          <td className="px-3 py-1.5"><span className="text-[11px] text-muted-foreground">Opsiyonel</span></td>
                          <td className="px-3 py-1.5 text-muted-foreground">Baba / Anne / Vasi</td>
                          <td className="px-3 py-1.5 text-muted-foreground">Varsayılan: Anne</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* File Upload Drop Area */}
          {!isProcessing && !importResult && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer bg-card hover:bg-muted/20 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-primary hover:underline">
                      Excel Dosyası Seçin (.xlsx, .xls, .csv)
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      veya dosyayı buraya sürükleyip bırakın
                    </p>
                  </div>
                  {fileName && (
                    <Badge variant="outline" className="mt-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 py-1 px-2.5">
                      <FileCheck className="h-3.5 w-3.5" />
                      Seçilen Dosya: {fileName} ({parsedRows.length} satır)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview Table of Parsed Rows */}
          {!isProcessing && !importResult && parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Veri Önizleme
                  </span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                    {validCount} Geçerli
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {invalidCount} Hatalı Satır
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Temizle
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-12 text-xs">#</TableHead>
                      <TableHead className="text-xs">Öğrenci Adı Soyadı</TableHead>
                      <TableHead className="text-xs">Telefon</TableHead>
                      <TableHead className="text-xs">Şube</TableHead>
                      {importMode === "student_and_parent" && (
                        <>
                          <TableHead className="text-xs">Veli Adı Soyadı</TableHead>
                          <TableHead className="text-xs">Veli Telefon</TableHead>
                          <TableHead className="text-xs">Yakınlık</TableHead>
                        </>
                      )}
                      <TableHead className="text-right text-xs">Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <TableRow key={row.rowNumber} className={!row.isValid ? "bg-destructive/5" : ""}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row.rowNumber}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-foreground">
                          {row.studentFirstName} {row.studentLastName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.studentPhone || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.branchName ? (
                            row.matchedBranchId ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                {row.branchName}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" title="Sistemde eşleşen şube bulunamadı">
                                {row.branchName} (?)
                              </Badge>
                            )
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        {importMode === "student_and_parent" && (
                          <>
                            <TableCell className="text-xs font-medium text-foreground">
                              {row.parentFirstName && row.parentLastName
                                ? `${row.parentFirstName} ${row.parentLastName}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {row.parentPhone || "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {row.relationship || "Anne"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right text-xs">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Hazır
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium" title={row.validationError}>
                              <AlertCircle className="h-3.5 w-3.5" />
                              {row.validationError || "Eksik Alan"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Processing Progress View */}
          {isProcessing && (
            <div className="py-8 space-y-4 text-center">
              <div className="flex justify-center">
                <Spinner className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Öğrenci Kayıtları Aktarılıyor...
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  İşleniyor: <span className="font-semibold text-foreground">{progress.currentName}</span> ({progress.current} / {progress.total})
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden max-w-md mx-auto">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Result Summary View */}
          {importResult && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-center space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-foreground">
                  Aktarım İşlemi Tamamlandı!
                </h3>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-emerald-600 dark:text-emerald-400">{importResult.successCount}</strong> öğrenci kaydı başarıyla oluşturuldu.
                  {importResult.failCount > 0 && (
                    <> <strong className="text-destructive">{importResult.failCount}</strong> kayıt aktarılamadı.</>
                  )}
                </p>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs">
                  <span className="font-bold text-destructive">Hata Detayları:</span>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground max-h-36 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            size="sm"
          >
            {importResult ? "Kapat" : "İptal"}
          </Button>

          {!importResult && (
            <Button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing || validCount === 0}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Aktarılıyor ({progress.current}/{progress.total})...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {validCount > 0 ? `${validCount} Öğrenciyi İçe Aktar` : "İçe Aktar"}
                </>
              )}
            </Button>
          )}

          {importResult && (
            <Button
              type="button"
              onClick={resetState}
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              Yeni Dosya Yükle
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

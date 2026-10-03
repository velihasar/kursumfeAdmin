"use client";

import { useState, useRef, useMemo } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Building2,
  Sparkles,
  Maximize2,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { TenantGetAllDto } from "@/types/tenant.types";

interface TenantAttendanceQrDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenants?: TenantGetAllDto[];
  selectedTenantId: number;
  onTenantChange?: (tenantId: number) => void;
  isSuperAdmin?: boolean;
}

export function TenantAttendanceQrDialog({
  isOpen,
  onClose,
  tenants,
  selectedTenantId,
  onTenantChange,
  isSuperAdmin = false,
}: TenantAttendanceQrDialogProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentTenant = useMemo(() => {
    return tenants?.find((t) => t.id === selectedTenantId) || tenants?.[0];
  }, [tenants, selectedTenantId]);

  // Payload encoded in the QR code
  const qrPayload = useMemo(() => {
    if (!currentTenant) return "";
    return JSON.stringify({
      protocol: "KURSUM_ATTENDANCE",
      version: "1.0",
      tenantId: currentTenant.id,
      tenantCode: currentTenant.code || "",
      tenantName: currentTenant.name,
    });
  }, [currentTenant]);

  // Copy raw payload
  const handleCopyPayload = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setIsCopied(true);
    toast.success("QR kod verisi panoya kopyalandı.");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download high-resolution PNG
  const handleDownloadPng = () => {
    if (!currentTenant) return;
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("Görsel oluşturulamadı.");
      return;
    }

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentTenant.name.replace(/\s+/g, "_")}_Yoklama_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR kod görseli indirildi.");
  };

  // Print poster
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ─── Standard Dialog ─── */}
      <Dialog open={isOpen && !isKioskMode} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <span>Kurum Giriş & Yoklama QR Kodu</span>
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs mt-1">
                Veliler ve öğrenciler mobil uygulamadan bu kodu okutarak o anki derslerine anında yoklama girişi yapabilirler.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            {/* SuperAdmin Tenant Switcher */}
            {isSuperAdmin && tenants && tenants.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Kurum Seçiniz
                </Label>
                <Select
                  value={String(currentTenant?.id || selectedTenantId)}
                  onValueChange={(val) => onTenantChange?.(Number(val))}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Kurum seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                        {t.name} {t.code ? `(${t.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Printable Poster Card */}
            <div
              id="printable-qr-card"
              className="p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 via-background to-background text-center flex flex-col items-center justify-center gap-4 shadow-sm"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Sparkles className="h-3 w-3" />
                  Mobil Hızlı Giriş
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {currentTenant?.name || "Kurum Girişi"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Kursum Mobil uygulamasını açıp bu karekodu okutunuz.
                </p>
              </div>

              {/* QR Code Graphic */}
              <div className="p-4 bg-white rounded-xl shadow-md border border-border/80">
                <QRCodeSVG
                  value={qrPayload || "KURSUM"}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Hidden Canvas for PNG Export */}
              <div ref={canvasRef} className="hidden">
                <QRCodeCanvas
                  value={qrPayload || "KURSUM"}
                  size={1000}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[11px] bg-muted/60">
                  Kurum Kodu: {currentTenant?.code || `#${currentTenant?.id || 1}`}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Yazdır (A4)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadPng}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                PNG İndir
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPayload}
                className="gap-1.5 text-xs"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? "Kopyalandı" : "Veri Kopyala"}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsKioskMode(true)}
                className="gap-1.5 text-xs"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Tam Ekran
              </Button>
            </div>

            {/* Info Hint */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11px] text-muted-foreground">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>
                Bu QR kod kurumun ana giriş kapısına, danışma masasına veya sınıflara asılabilir. Öğrenci veya veli tek bir okutma ile o anki dersine otomatik yoklama kaydı oluşturur.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Kiosk / TV Fullscreen Mode ─── */}
      {isKioskMode && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8 animate-in fade-in-0 duration-200">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsKioskMode(false)}
            className="absolute top-6 right-6 h-10 w-10 rounded-full"
            title="Tam Ekrandan Çık"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="max-w-md w-full text-center space-y-6 flex flex-col items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                Mobil Yoklama & Giriş Noktası
              </div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                {currentTenant?.name || "Kurum Girişi"}
              </h1>
              <p className="text-muted-foreground text-sm">
                Kursum Mobil uygulamasını açarak bu karekodu okutunuz.
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl shadow-2xl border-4 border-primary/20">
              <QRCodeSVG
                value={qrPayload || "KURSUM"}
                size={300}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
                {currentTenant?.code || `#${currentTenant?.id || 1}`}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                Otomatik Ders Eşleşmeli Giriş
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

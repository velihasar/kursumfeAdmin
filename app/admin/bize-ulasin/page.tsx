"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertCircle,
  Lightbulb,
  Bug,
  Info,
  MessageSquare,
  User as UserIcon,
  Mail,
  Send,
  ShieldCheck,
  CheckCircle2,
  MessagesSquare,
} from "lucide-react";
import { useUserDetail } from "@/hooks/useUsers";
import { sendContactMessage } from "@/hooks/useContact";
import { cn } from "@/lib/utils";

interface SubjectOption {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  bgClass: string;
  activeBorderClass: string;
}

const SUBJECT_OPTIONS: SubjectOption[] = [
  {
    id: "Şikayet",
    label: "Şikayet",
    description: "Yaşadığınız aksaklıkları bildirin",
    icon: AlertCircle,
    color: "#EF4444",
    bgClass: "bg-red-500/10 text-red-600 dark:text-red-400",
    activeBorderClass: "border-red-500 ring-2 ring-red-500/15 bg-red-500/5",
  },
  {
    id: "Öneri",
    label: "Öneri",
    description: "Geliştirme fikirlerinizi paylaşın",
    icon: Lightbulb,
    color: "#F59E0B",
    bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    activeBorderClass: "border-amber-500 ring-2 ring-amber-500/15 bg-amber-500/5",
  },
  {
    id: "Hata Bildirimi",
    label: "Hata Bildirimi",
    description: "Teknik sorunları bize iletin",
    icon: Bug,
    color: "#EC4899",
    bgClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    activeBorderClass: "border-pink-500 ring-2 ring-pink-500/15 bg-pink-500/5",
  },
  {
    id: "Genel Bilgi",
    label: "Genel Bilgi",
    description: "Soru ve bilgi talepleriniz",
    icon: Info,
    color: "#3B82F6",
    bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    activeBorderClass: "border-blue-500 ring-2 ring-blue-500/15 bg-blue-500/5",
  },
  {
    id: "Diğer",
    label: "Diğer",
    description: "Diğer tüm konular",
    icon: MessageSquare,
    color: "#8B5CF6",
    bgClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    activeBorderClass: "border-violet-500 ring-2 ring-violet-500/15 bg-violet-500/5",
  },
];

export default function BizeUlasinPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const userId = sessionUser?.id ? Number(sessionUser.id) : undefined;
  const { data: userDetail } = useUserDetail(userId);

  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  useEffect(() => {
    if (userDetail && Object.keys(userDetail).length > 0) {
      setFullName((prev) => prev || userDetail.fullName || userDetail.FullName || sessionUser?.name || "");
      setUserEmail((prev) => prev || userDetail.email || userDetail.Email || sessionUser?.email || "");
    } else if (sessionUser) {
      setFullName((prev) => prev || sessionUser.name || sessionUser.fullName || "");
      setUserEmail((prev) => prev || sessionUser.email || "");
    }
  }, [userDetail, sessionUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSentSuccess(false);

    const trimmedName = fullName.trim();
    const trimmedEmail = userEmail.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      setErrorMessage("Lütfen mesajınız için bir konu seçin.");
      toast.error("Lütfen mesajınız için bir konu seçin.");
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage("Lütfen iletmek istediğiniz mesajı yazın.");
      toast.error("Lütfen iletmek istediğiniz mesajı yazın.");
      return;
    }

    if (trimmedMessage.length < 5) {
      setErrorMessage("Mesajınız en az 5 karakter olmalıdır.");
      toast.error("Mesajınız en az 5 karakter olmalıdır.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Ad soyad alanı gereklidir.");
      toast.error("Ad soyad alanı gereklidir.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("E-posta adresi gereklidir.");
      toast.error("E-posta adresi gereklidir.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Geçerli bir e-posta adresi girin.");
      toast.error("Geçerli bir e-posta adresi girin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendContactMessage({
        fullName: trimmedName,
        userEmail: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

      if (res.success) {
        toast.success(res.message || "Destek ekibimiz en kısa sürede dönüş yapacaktır.");
        setSubject("");
        setMessage("");
        setIsSentSuccess(true);
      } else {
        setErrorMessage(res.message || "Mesaj iletilemedi. Lütfen tekrar deneyin.");
        toast.error(res.message || "Mesaj iletilemedi. Lütfen tekrar deneyin.");
      }
    } catch {
      setErrorMessage("Beklenmedik bir bağlantı hatası oluştu.");
      toast.error("Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Bize Ulaşın</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Bilgilendirme Banner Kartı */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 p-5 shadow-2xs">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-bold text-foreground">
              Size Nasıl Yardımcı Olabiliriz?
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Uygulama deneyiminiz, kurs süreçleriniz, şikayet ve önerileriniz doğrudan destek ekibimize iletilir.
            </p>
          </div>
        </div>
      </div>

      {/* Başarılı Gönderim Bildirimi */}
      {isSentSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm font-medium">
            Mesajınız başarıyla iletildi! Destek ekibimiz inceleyip en kısa sürede e-posta adresinize dönüş yapacaktır.
          </div>
        </div>
      )}

      {/* Ana İletişim / Şikayet Formu Kartı */}
      <div className="bg-card border rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ad Soyad ve E-Posta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="contact-fullname" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                AD SOYAD <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız ve soyadınız"
                  className="pl-9 h-10"
                  disabled={isSubmitting}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                E-POSTA ADRESİ <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="ornek@kursum.com"
                  className="pl-9 h-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Konu Seçimi */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              KONU SEÇİN <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {SUBJECT_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = subject === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSubject(item.id);
                      setErrorMessage(null);
                      setIsSentSuccess(false);
                    }}
                    className={cn(
                      "flex sm:flex-col items-center sm:items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? item.activeBorderClass
                        : "border-border bg-muted/20 hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        item.bgClass
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mesaj Alanı */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="contact-message" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                MESAJINIZ <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs font-semibold text-muted-foreground">
                {message.length} / 8000
              </span>
            </div>
            <Textarea
              id="contact-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Şikayet, öneri veya detaylı mesajınızı buraya yazın..."
              rows={6}
              maxLength={8000}
              disabled={isSubmitting}
              className="resize-y min-h-[140px]"
            />
          </div>

          {/* Hata Mesajı Kutusu */}
          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Gönder Butonu */}
          <div className="pt-1 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[180px] h-11 gap-2 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Mesajı Gönder</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Destek Bilgilendirme Alt Notu */}
      <div className="flex items-center gap-2.5 px-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <span>
          MasavTech Destek Ekibi mesajınızı inceleyip sistemde kayıtlı e-posta adresinize dönüş sağlayacaktır.
        </span>
      </div>
    </div>
  );
}


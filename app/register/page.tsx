"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Send,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { AuthBrandSidebar } from "@/components/auth/auth-brand-sidebar";

const STUDENT_COUNT_OPTIONS = [
  "1 - 50 Öğrenci",
  "50 - 150 Öğrenci",
  "150 - 300 Öğrenci",
  "300+ Öğrenci",
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [studentCount, setStudentCount] = useState(STUDENT_COUNT_OPTIONS[1]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !institutionName.trim() || !phone.trim() || !email.trim()) {
      toast.error("Lütfen zorunlu alanları (Ad Soyad, Kurum, Telefon, E-posta) doldurunuz.");
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${apiBase}/api/Contact/institution-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          institutionName: institutionName.trim(),
          city: city.trim(),
          studentCount,
          message: message.trim(),
          source: "Web Yönetim Paneli",
        }),
      });

      const text = await res.text();
      let dataMsg = text;
      try {
        const j = JSON.parse(text);
        dataMsg = j.message || j.Message || text;
      } catch {}

      if (!res.ok) {
        toast.error(dataMsg || "Başvuru iletilirken bir hata oluştu.");
      } else {
        setIsSuccess(true);
        toast.success("Başvurunuz başarıyla alındı!");
      }
    } catch {
      toast.error("Sunucuya bağlanırken bir hata oluştu. Lütfen bağlantınızı kontrol ediniz.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sol Marka ve Tanıtım Alanı (Sayfalar arası geçişte sabit) */}
      <AuthBrandSidebar />

      {/* Sağ Form Alanı */}
      <div className="flex w-full lg:w-7/12 items-center justify-center bg-background p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6 animate-fade-in py-6">
          <div className="flex justify-center lg:hidden mb-2">
            <Logo size="default" priority />
          </div>

          {isSuccess ? (
            /* Başarılı Onay Kartı */
            <div className="bg-card border rounded-3xl p-8 md:p-10 text-center shadow-lg space-y-5 animate-scale-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  Başvurunuz Başarıyla Alındı!
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  <strong>{institutionName}</strong> kurum kaydı talebiniz yetkililerimize iletilmiştir. Kurumunuzun kurulumu ve demo aktivasyonu için ekibimiz sizinle en kısa sürede iletişime geçecektir.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Giriş Sayfasına Dön
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
                <Button
                  variant="outline"
                  className="h-11 px-6"
                  onClick={() => {
                    setIsSuccess(false);
                    setFullName("");
                    setInstitutionName("");
                    setPhone("");
                    setEmail("");
                    setCity("");
                    setMessage("");
                  }}
                >
                  Yeni Başvuru Yap
                </Button>
              </div>
            </div>
          ) : (
            /* Başvuru Formu */
            <>
              <div className="text-center lg:text-left">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  Kurum Kayıt & Demo Başvurusu
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Kurumunuzu Kursum sistemine dahil etmek için formu doldurun; uzman ekibimiz kurulum için sizinle iletişime geçsin.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Yetkili Ad Soyad */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground tracking-wide" htmlFor="fullName">
                      Yetkili Adı Soyadı <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Yetkili kişinin adını ve soyadını giriniz"
                        className="pl-10 h-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Kurum Adı */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground tracking-wide" htmlFor="institutionName">
                      Kurum / Kurs Adı <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="institutionName"
                        type="text"
                        placeholder="Kurumunuzun resmi veya tabela adını giriniz"
                        className="pl-10 h-10"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Telefon */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground tracking-wide" htmlFor="phone">
                      Telefon Numarası <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="05XX XXX XX XX"
                        className="pl-10 h-10"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* E-posta */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground tracking-wide" htmlFor="email">
                      E-Posta Adresi <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Kurumsal e-posta adresinizi giriniz"
                        className="pl-10 h-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Şehir / Lokasyon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground tracking-wide" htmlFor="city">
                    Şehir / İlçe
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="city"
                      type="text"
                      placeholder="Kurumun bulunduğu şehir ve ilçeyi giriniz"
                      className="pl-10 h-10"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Tahmini Öğrenci Sayısı */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground tracking-wide">
                    Tahmini Öğrenci Sayısı
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STUDENT_COUNT_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setStudentCount(opt)}
                        className={`text-xs py-2 px-2.5 rounded-lg border font-medium transition-all ${
                          studentCount === opt
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-card text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ek Not / Mesaj */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground tracking-wide" htmlFor="message">
                    Ek Açıklama ve Talepleriniz (İsteğe Bağlı)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    placeholder="Şube sayısı, öğrenci yapısı veya sormak istediğiniz tüm detayları buraya yazabilirsiniz..."
                    className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 mt-2"
                >
                  {isLoading ? (
                    "Başvuru İletiliyor..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Başvuru Talebini Gönder
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center flex flex-col items-center gap-3 lg:items-start">
                <p className="text-sm text-muted-foreground">
                  Zaten bir kurum hesabınız var mı?{" "}
                  <Link href="/login" className="text-primary hover:underline font-semibold">
                    Yönetici Girişi Yapın
                  </Link>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bilgileriniz KVKK kapsamında korunmakta ve yalnızca yetkili ekibimizce incelenmektedir.</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

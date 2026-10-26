"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, Mail } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { AuthBrandSidebar } from "@/components/auth/auth-brand-sidebar";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const urlError = searchParams.get("error");

  useState(() => {
    if (urlError === "VeliAccessDenied") {
      setTimeout(() => {
        toast.error("Veli hesaplarının yönetim paneline giriş yetkisi bulunmamaktadır. Lütfen veli mobil uygulamasını kullanınız.");
      }, 100);
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", { 
      email, 
      password, 
      redirect: false
    });

    setIsLoading(false);

    if (result?.error) {
      if (result.error.includes("Veli") || result.error.includes("veli")) {
        toast.error(result.error);
      } else {
        toast.error(result.error !== "CredentialsSignin" ? result.error : "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } else {
      toast.success("Başarıyla giriş yapıldı!");
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sol Marka Kısmı (Sayfalar arası geçişte sabit) */}
      <AuthBrandSidebar />

      <div className="flex w-full lg:w-7/12 items-center justify-center bg-background p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex justify-center lg:hidden">
            <Logo size="default" priority />
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Yönetici Girişi
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Kursum Bilgi ve Yönetim Sistemi&apos;ne erişmek için bilgilerinizi girin.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="yonetici@kursum.com" 
                    className="pl-10 h-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:-translate-y-1"
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              {isLoading ? "Giriş yapılıyor..." : "Yönetici Olarak Giriş Yap"}
            </Button>
          </form>
          
          <div className="mt-8 flex flex-col gap-4 text-center lg:text-left">
            <p className="text-sm text-muted-foreground">
              Kurumunuzu Kursum'a dahil etmek mi istiyorsunuz?{" "}
              <Link href="/register" className="text-primary hover:underline font-semibold">
                Kurum Kayıt & Demo Başvurusu
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Giriş yaparak, Kursum Bilgi ve Yönetim Sistemi Hizmet Şartlarını kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
"use client";

import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function AuthBrandSidebar() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-5/12 bg-primary p-12 text-primary-foreground relative overflow-hidden shrink-0">
      {/* Arka plan dekoratif daireler */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-white opacity-5 mix-blend-overlay pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-white opacity-5 mix-blend-overlay pointer-events-none" />

      {/* Logo Alanı (Sayfalar arası geçişte yerinden oynamaz) */}
      <div className="relative z-10 flex flex-col items-start">
        <div className="bg-white/95 backdrop-blur-xs rounded-3xl p-6 shadow-2xl">
          <Logo size="3xl" priority />
        </div>
      </div>

      {/* Kurumsal Tanıtım ve Özellik Maddeleri */}
      <div className="relative z-10 space-y-6 max-w-lg">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
          Kurumunuzu Kursum ile Dijitalleştirin
        </h2>

        <p className="text-primary-foreground/80 text-sm leading-relaxed">
          Eğitim süreçlerinizi, yoklamayı, ders programını ve kantin cüzdanını tek bir akıllı platformdan yönetin. Veli ve öğrencilerinizle kusursuz bir iletişim ağı kurun.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="text-xs text-primary-foreground/90">
              Öğrenci, veli, öğretmen ve ders programı entegrasyonu
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="text-xs text-primary-foreground/90">
              Akıllı kantin cüzdanı ve şeffaf online bakiye takibi
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="text-xs text-primary-foreground/90">
              24 saat içinde sıfır veri kaybıyla kurumunuza özel kurulum
            </span>
          </div>
        </div>
      </div>

      {/* Footer Telif Yazısı */}
      <div className="relative z-10 text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Kursum. Tüm hakları saklıdır.
      </div>
    </div>
  );
}

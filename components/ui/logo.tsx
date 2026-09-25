import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  showSubtitle?: boolean;
  textClassName?: string;
  iconClassName?: string;
  size?: "sm" | "default" | "lg" | "xl";
}

export function Logo({
  className,
  showText = true,
  showSubtitle = false,
  textClassName,
  iconClassName,
  size = "default",
}: LogoProps) {
  const sizeMap = {
    sm: {
      box: "h-7 w-7 rounded-lg",
      icon: "h-4 w-4",
      text: "text-sm font-bold",
    },
    default: {
      box: "h-9 w-9 rounded-xl",
      icon: "h-5 w-5",
      text: "text-base font-bold",
    },
    lg: {
      box: "h-11 w-11 rounded-xl",
      icon: "h-6 w-6",
      text: "text-2xl font-bold tracking-tight",
    },
    xl: {
      box: "h-14 w-14 rounded-2xl",
      icon: "h-8 w-8",
      text: "text-3xl font-extrabold tracking-tight",
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-primary text-primary-foreground shadow-sm shrink-0",
          currentSize.box,
          iconClassName
        )}
      >
        <GraduationCap className={currentSize.icon} />
      </div>
      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={cn(
              "leading-none tracking-tight",
              currentSize.text,
              textClassName || "text-foreground"
            )}
          >
            KURSUM
          </span>
          {showSubtitle && (
            <span className="text-[9px] font-semibold text-muted-foreground tracking-wider uppercase mt-0.5">
              Bilgi & Yönetim Sistemi
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  src?: string;
  className?: string;
  imageClassName?: string;
  size?: "sm" | "default" | "lg" | "xl" | "2xl" | "3xl";
  priority?: boolean;
  // Kept for backward compatibility with previous callers
  showText?: boolean;
  showSubtitle?: boolean;
  textClassName?: string;
  iconClassName?: string;
}

export function Logo({
  src = "/logo.png",
  className,
  imageClassName,
  size = "default",
  priority = false,
}: LogoProps) {
  const sizeMap = {
    sm: "h-7",
    default: "h-9",
    lg: "h-11",
    xl: "h-14",
    "2xl": "h-20",
    "3xl": "h-32",
  };

  return (
    <div className={cn("inline-flex items-center select-none shrink-0", className)}>
      <Image
        src={src}
        alt="Kursum"
        width={320}
        height={100}
        priority={priority}
        className={cn(
          "w-auto max-h-full max-w-full object-contain",
          sizeMap[size],
          imageClassName
        )}
      />
    </div>
  );
}

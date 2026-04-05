import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "border border-turquoise bg-turquoise text-marine shadow-[0_10px_24px_rgba(5,195,221,0.2)] hover:brightness-95",
  secondary:
    "border border-marine bg-marine text-white shadow-[0_12px_24px_rgba(0,45,98,0.14)] hover:brightness-110",
  ghost: "border border-black/8 bg-white/80 text-textPrimary hover:bg-white",
  danger:
    "border border-veoliaRed bg-veoliaRed text-white shadow-[0_10px_24px_rgba(255,0,0,0.14)] hover:bg-[#e00000]",
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ringSoft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

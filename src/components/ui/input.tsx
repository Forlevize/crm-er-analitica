import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-full border border-black/10 bg-white/72 px-4 text-sm text-textPrimary shadow-insetSoft backdrop-blur-sm",
        "outline-none transition-all focus:border-marine/20 focus:bg-white focus:ring-2 focus:ring-ringSoft",
        className,
      )}
      {...props}
    />
  );
});

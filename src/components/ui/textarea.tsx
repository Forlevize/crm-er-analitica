import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-2xl border border-borderSoft bg-white px-3.5 py-2.5 text-sm text-textPrimary shadow-insetSoft",
        "outline-none transition-all focus:border-turquoise focus:ring-2 focus:ring-ringSoft",
        className,
      )}
      {...props}
    />
  );
});

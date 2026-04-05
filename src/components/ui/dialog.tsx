import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
  bodyClassName?: string;
}

export function Dialog({ open, title, description, onClose, children, widthClassName, bodyClassName }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 p-4 backdrop-blur-md">
      <div
        className={cn(
          "w-full max-w-3xl overflow-hidden rounded-[34px] border border-black/8 bg-[#fbf8f3]/95 shadow-float",
          widthClassName,
        )}
      >
        <div className="flex max-h-[88vh] flex-col">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/8 bg-[#fbf8f3]/95 px-7 pb-4 pt-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-textPrimary">{title}</h2>
              {description ? <p className="mt-1 text-sm text-textSecondary">{description}</p> : null}
            </div>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
          <div className={cn("overflow-y-auto px-7 pb-7 pt-5", bodyClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}

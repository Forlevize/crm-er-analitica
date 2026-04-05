import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getStatusMeta } from "@/lib/statusUtils";
import type { EquipamentoStatus } from "@/types";

export function BadgeStatus({ status, className }: { status: EquipamentoStatus; className?: string }) {
  const meta = getStatusMeta(status);
  return <Badge className={cn(meta.className, className)}>{meta.label}</Badge>;
}

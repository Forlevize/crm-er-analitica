import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AppUser } from "@/types";

const schema = z.object({
  full_name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail valido"),
  phone: z.string().optional(),
  district: z.string().optional(),
  role: z.enum(["admin", "gestor", "lider", "usuario"]),
  lider_id: z.string().optional(),
  active: z.enum(["true", "false"]),
});

export type UsuarioFormValues = z.infer<typeof schema>;

interface ModalUsuarioProps {
  open: boolean;
  item?: AppUser | null;
  lideres: AppUser[];
  onClose: () => void;
  onSave: (values: UsuarioFormValues) => Promise<void> | void;
}

export function ModalUsuario({ open, item, lideres, onClose, onSave }: ModalUsuarioProps) {
  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      district: "",
      role: "usuario",
      lider_id: "",
      active: "true",
    },
  });

  const watchedRole = form.watch("role");
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    form.reset({
      full_name: item?.full_name ?? "",
      email: item?.email ?? "",
      phone: item?.phone ?? "",
      district: item?.district ?? "",
      role: item?.role ?? "usuario",
      lider_id: item?.lider_id ?? "",
      active: item?.active ? "true" : "false",
    });
  }, [form, item]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={item ? "Editar usuario" : "Cadastrar usuario"}
      description="Onboarding por convite seguro no Supabase."
    >
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          await onSave(values);
          onClose();
        })}
      >
        <div className="rounded-2xl border border-marine/10 bg-white/80 p-3">
          <label className="mb-2 block text-sm font-medium text-textSecondary">Nome completo</label>
          <Input {...form.register("full_name")} />
        </div>
        <div className="rounded-2xl border border-marine/10 bg-white/80 p-3">
          <label className="mb-2 block text-sm font-medium text-textSecondary">E-mail</label>
          <Input type="email" {...form.register("email")} />
        </div>
        <div className="rounded-2xl border border-marine/10 bg-white/80 p-3">
          <label className="mb-2 block text-sm font-medium text-textSecondary">Telefone</label>
          <Input {...form.register("phone")} />
        </div>
        <div className="rounded-2xl border border-marine/10 bg-white/80 p-3">
          <label className="mb-2 block text-sm font-medium text-textSecondary">Distrito</label>
          <Input {...form.register("district")} />
        </div>
        <div className="rounded-2xl border border-marine/10 bg-white/80 p-3">
          <label className="mb-2 block text-sm font-medium text-textSecondary">Role</label>
          <Select {...form.register("role")}>
            <option value="admin">admin</option>
            <option value="gestor">gestor</option>
            <option value="lider">lider</option>
            <option value="usuario">usuario</option>
          </Select>
        </div>
        {watchedRole === "usuario" ? (
          <div className="rounded-2xl border border-marine/10 bg-white/80 p-3">
            <label className="mb-2 block text-sm font-medium text-textSecondary">Lider responsavel</label>
            <Select {...form.register("lider_id")}>
              <option value="">Selecione</option>
              {lideres.map((lider) => (
                <option key={lider.id} value={lider.id}>
                  {lider.full_name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="rounded-2xl border border-marine/10 bg-white/80 p-3">
          <label className="mb-2 block text-sm font-medium text-textSecondary">Status</label>
          <Select {...form.register("active")}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        </div>
        <div className="md:col-span-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

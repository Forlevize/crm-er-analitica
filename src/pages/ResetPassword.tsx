import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const schema = z
  .object({
    password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a nova senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const { session, isLoading, signOut, updatePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function handleSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      await updatePassword(values.password);
      await signOut();
      toast.success("Senha salva com sucesso. Faca login com a nova senha.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoading && !session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-appBg px-5 py-5 lg:px-10 lg:py-8">
      <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat opacity-100" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,248,243,0.2),rgba(251,248,243,0.3))]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-40px)] max-w-[980px] items-center justify-center">
        <section className="w-full max-w-[560px] rounded-[28px] border border-black/8 bg-white/95 px-7 py-8 shadow-panel backdrop-blur-[8px] lg:px-9">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-marine text-white">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-marine">
                Configuracao de acesso
              </p>
              <h1 className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.06em] text-textPrimary">
                Criar ou redefinir senha
              </h1>
            </div>
          </div>

          <p className="mt-4 text-[15px] leading-7 text-textSecondary">
            Defina sua senha para concluir o acesso a plataforma com seguranca.
          </p>

          <form className="mt-8 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-textSecondary">Nova senha</label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-xs text-veoliaRed">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-textSecondary">Confirmar nova senha</label>
              <Input type="password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword ? (
                <p className="text-xs text-veoliaRed">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full justify-between" disabled={isSubmitting || isLoading}>
                <span>{isSubmitting ? "Salvando..." : "Salvar senha"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
              Voltar ao login
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, ShieldCheck, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Informe um e-mail valido"),
  password: z.string().min(1, "Informe a senha"),
});

type FormValues = z.infer<typeof schema>;

export function Login() {
  const navigate = useNavigate();
  const { role, signIn, requestPasswordReset, defaultRoute } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (role) {
      navigate(defaultRoute, { replace: true });
    }
  }, [defaultRoute, navigate, role]);

  if (role) {
    return <Navigate to={defaultRoute} replace />;
  }

  async function handleSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      await signIn(values.email, values.password);
      toast.success("Login realizado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao autenticar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-appBg px-5 py-5 lg:px-10 lg:py-8">
      <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat opacity-100" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,248,243,0.2),rgba(251,248,243,0.3))]" />

      <div className="mx-auto flex max-w-[1380px] items-start justify-between border-b border-black/8 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-marine">Veolia</p>
          <h1 className="mt-2.5 text-[32px] font-semibold leading-none tracking-[-0.06em] text-textPrimary">ER Analitica</h1>
          <p className="mt-1.5 text-sm text-textSecondary">Gestao de equipamentos, calibracoes e relacionamento operacional.</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-7 grid max-w-[1380px] gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-2xl bg-marine px-7 py-7 text-white shadow-float lg:px-9 lg:py-8">
          <div className="absolute right-[-90px] top-8 h-60 w-60 rounded-full bg-veoliaRed/92" />
          <div className="absolute bottom-[-130px] right-[10%] h-72 w-72 rounded-full bg-turquoise/86" />
          <div className="absolute left-[44%] top-0 h-full w-px bg-white/10" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="inline-flex rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-veoliaRed">
                Plataforma operacional
              </p>
              <h2 className="mt-6 max-w-[620px] text-[38px] font-semibold leading-[0.94] tracking-[-0.08em] sm:text-[52px] lg:text-[70px]">
                Controle visual claro para uma operacao critica.
              </h2>
              <p className="mt-4 max-w-[520px] text-base leading-7 text-white/76">
                Um ambiente unificado para owners, lideres, gestores e administradores acompanharem calibracoes,
                CRM, revisoes e auditoria.
              </p>
            </div>

            <div className="space-y-3 lg:pt-7">
              <div className="rounded-xl border border-white/18 bg-white/10 p-4 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 text-white" />
                <p className="mt-3 text-[22px] font-semibold leading-none tracking-[-0.04em]">Governanca e rastreio</p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Permissoes por perfil, historico de mudancas e acompanhamento operacional continuo.
                </p>
              </div>
              <div className="rounded-xl border border-white/18 bg-white/10 p-4 backdrop-blur-sm">
                <Workflow className="h-5 w-5 text-turquoise" />
                <p className="mt-3 text-[22px] font-semibold leading-none tracking-[-0.04em]">Fluxo centralizado</p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Equipamentos, CRM, revisoes e acompanhamento operacional organizados no mesmo ambiente.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/8 bg-white/96 px-7 py-7 shadow-panel backdrop-blur-[8px] lg:px-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-marine">Acesso ao sistema</p>
          <h2 className="mt-4 text-[38px] font-semibold leading-none tracking-[-0.07em] text-textPrimary">Entrar</h2>
          <p className="mt-2 text-[15px] leading-7 text-textSecondary">
            Use suas credenciais para acessar a plataforma conforme seu perfil.
          </p>

          <form className="mt-8 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-textSecondary">E-mail</label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-textSecondary">Senha</label>
              <Input type="password" {...form.register("password")} />
            </div>

            <div className="pt-1">
              <Button type="submit" className="w-full justify-between" disabled={isSubmitting}>
                <span>{isSubmitting ? "Entrando..." : "Entrar"}</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={async () => {
                const email = form.getValues("email");
                if (!email) {
                  toast.error("Informe o e-mail para recuperar a senha.");
                  return;
                }
                await requestPasswordReset(email);
                toast.success("Se o e-mail existir, o link de recuperacao foi enviado.");
              }}
            >
              Esqueci minha senha
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

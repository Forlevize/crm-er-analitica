import { Card, CardTitle } from "@/components/ui/card";
import { TabelaRelatorio } from "@/components/relatorios/TabelaRelatorio";
import { useEmails } from "@/hooks/useEmails";
import { formatDateTime } from "@/lib/utils";

function getTipoLabel(tipo: "aviso_60" | "aviso_45" | "escalonamento_gestor" | "semanal_lider") {
  switch (tipo) {
    case "aviso_60":
      return "Aviso 60 dias";
    case "aviso_45":
      return "Aviso 45 dias";
    case "escalonamento_gestor":
      return "Escalonamento gestor";
    case "semanal_lider":
      return "Resumo semanal lider";
    default:
      return tipo;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "agendado":
      return "Agendado";
    case "ja_enviado_no_ciclo":
      return "Ja enviado no ciclo";
    case "sem_destinatario":
      return "Sem destinatario";
    case "respondido":
      return "Respondido";
    case "resolvido":
      return "Resolvido";
    case "fora_da_etapa":
      return "Bloqueado pela etapa";
    case "enviado":
      return "Enviado";
    case "falha":
      return "Falha";
    case "ignorado_sem_destinatario":
      return "Ignorado sem destinatario";
    default:
      return status;
  }
}

export function Emails() {
  const { upcomingEmails, emailLogs, equipamentos, metrics, isLoading } = useEmails();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borderSoft pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-textPrimary">E-mails</h1>
          <p className="mt-0.5 text-sm text-textSecondary">
            Visao operacional dos proximos disparos, bloqueios e historico de envios.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textSecondary">Agendados</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-textPrimary">{metrics.agendados}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textSecondary">Bloqueados</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-textPrimary">{metrics.bloqueados}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textSecondary">Ja enviados</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-textPrimary">{metrics.enviadosNoCiclo}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textSecondary">Resolvidos</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-textPrimary">{metrics.respondidosOuResolvidos}</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borderSoft bg-appBg px-4 py-3">
        <p className="text-sm text-textSecondary">
          Fila calculada com base nas regras atuais do sistema e nos dados reais do CRM.
        </p>
        <span className="text-xs font-medium text-textSecondary">{upcomingEmails.length} regras avaliadas</span>
      </div>

      {isLoading ? <p className="text-sm text-textSecondary">Carregando dados de e-mail...</p> : null}

      <TabelaRelatorio
        title="Proximos e-mails e regras avaliadas"
        headers={["Tipo", "Data prevista", "Owner/Lider", "Destinatarios", "Motivo", "Status"]}
        rows={upcomingEmails.map((item) => [
          getTipoLabel(item.tipo),
          formatDateTime(item.data_prevista),
          item.tipo === "semanal_lider"
            ? item.lider_nome ?? "-"
            : `${item.owner_nome}${item.serial_number ? ` / ${item.serial_number}` : ""}`,
          item.destinatarios.length > 0 ? item.destinatarios.join(", ") : "-",
          item.motivo,
          getStatusLabel(item.status),
        ])}
      />

      <TabelaRelatorio
        title="Historico de e-mails enviados"
        headers={["Tipo", "Data de envio", "Destinatarios", "Status", "Equipamento"]}
        rows={emailLogs.map((item) => [
          getTipoLabel(item.tipo),
          formatDateTime(item.enviado_em),
          item.enviado_para.join(", ") || "-",
          getStatusLabel(item.status),
          item.equipamento_id
            ? (() => {
                const equipamento = equipamentos.find((entry) => entry.id === item.equipamento_id);
                return equipamento ? `${equipamento.serial_number} / ${equipamento.equipamento}` : item.equipamento_id;
              })()
            : "-",
        ])}
      />

      <Card>
        <CardTitle className="mb-4">Como ler esta aba</CardTitle>
        <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Agendado", desc: "A regra esta apta e o proximo job deve disparar o e-mail." },
            { title: "Bloqueado", desc: "Falta destinatario ou o card nao esta na etapa esperada para o envio." },
            { title: "Ja enviado", desc: "O e-mail ja saiu no ciclo atual e nao deve repetir indevidamente." },
            { title: "Resolvido", desc: "O CRM indica resposta ou encerramento, entao a automacao para." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-borderSoft bg-appBg px-4 py-3">
              <strong className="mb-1 block text-textPrimary">{item.title}</strong>
              <p className="text-textSecondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

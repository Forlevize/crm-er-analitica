interface EquipamentoTemplateInput {
  ownerName: string;
  serialNumber: string;
  equipamento: string;
  dueDate: string | null;
  statusLabel: string;
  appUrl: string;
}

interface LeaderSummaryInput {
  leaderName: string;
  total: number;
  calibrado: number;
  critico: number;
  vencido: number;
  appUrl: string;
}

function shell(content: string) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden;">
        <div style="background: #002D62; padding: 24px;">
          <div style="display: inline-block; background: #ffffff; color: #FF0000; padding: 10px 16px; border-radius: 999px; font-weight: 700;">
            Veolia
          </div>
          <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px;">ER Analitica</h1>
        </div>
        <div style="padding: 24px;">${content}</div>
        <div style="padding: 20px 24px; background: #F5F5F5; color: #55555A; font-size: 12px;">
          Plataforma de gestao de equipamentos e calibracoes.
        </div>
      </div>
    </div>
  `;
}

export function renderEquipamentoTemplate({
  ownerName,
  serialNumber,
  equipamento,
  dueDate,
  statusLabel,
  appUrl,
}: EquipamentoTemplateInput) {
  return shell(`
    <p style="margin: 0 0 12px; color: #000000;">Ola, ${ownerName}.</p>
    <p style="margin: 0 0 20px; color: #000000;">
      O equipamento abaixo exige atencao no fluxo de calibracao.
    </p>
    <div style="border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px; background: #F9FAFB;">
      <p style="margin: 0 0 8px;"><strong>Serial:</strong> ${serialNumber}</p>
      <p style="margin: 0 0 8px;"><strong>Equipamento:</strong> ${equipamento}</p>
      <p style="margin: 0 0 8px;"><strong>Vencimento:</strong> ${dueDate ?? "-"}</p>
      <p style="margin: 0;"><strong>Status:</strong> ${statusLabel}</p>
    </div>
    <p style="margin: 20px 0 0;">
      <a href="${appUrl}" style="display: inline-block; background: #05C3DD; color: #002D62; padding: 12px 16px; border-radius: 999px; text-decoration: none; font-weight: 700;">
        Acessar sistema
      </a>
    </p>
  `);
}

export function renderLeaderWeeklyTemplate({
  leaderName,
  total,
  calibrado,
  critico,
  vencido,
  appUrl,
}: LeaderSummaryInput) {
  return shell(`
    <p style="margin: 0 0 12px; color: #000000;">Ola, ${leaderName}.</p>
    <p style="margin: 0 0 20px; color: #000000;">Segue o resumo semanal dos equipamentos sob sua lideranca.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 10px; background: #002D62; color: #ffffff;">Indicador</th>
          <th style="text-align: left; padding: 10px; background: #002D62; color: #ffffff;">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Total</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${total}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Calibrados</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${calibrado}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Criticos</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${critico}</td></tr>
        <tr><td style="padding: 10px;">Vencidos</td><td style="padding: 10px;">${vencido}</td></tr>
      </tbody>
    </table>
    <p style="margin: 20px 0 0;">
      <a href="${appUrl}" style="display: inline-block; background: #05C3DD; color: #002D62; padding: 12px 16px; border-radius: 999px; text-decoration: none; font-weight: 700;">
        Abrir dashboard
      </a>
    </p>
  `);
}

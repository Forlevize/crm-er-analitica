interface SendEmailInput {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, cc = [], subject, html }: SendEmailInput) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "ER Analitica <no-reply@eranalitica.com>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY nao configurada.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      cc,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar e-mail: ${body}`);
  }

  return response.json();
}


import { logger } from "@/lib/logger";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

type EmailResult = { ok: boolean; id?: string; error?: string };

async function sendWithResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || "E-Coffee Node <noreply@e-coffee-node.com>",
        to: [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { ok: false, error: err };
    }

    const data = await response.json();
    return { ok: true, id: (data as { id: string }).id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("Email send failed", { error: msg });
    return { ok: false, error: msg };
  }
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(options);
  }
  logger.warn("No email provider configured, email not sent", { to: options.to, subject: options.subject });
  return { ok: false, error: "No email provider configured" };
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0f172a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: 700; color: #c9a96e; }
    .content { line-height: 1.6; }
    .button { display: inline-block; background: #c9a96e; color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">E-Coffee Node</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>E-Coffee Node · Medjez el Bab, Tunisie</p>
      <p>Pour ne plus recevoir nos emails, <a href="#" style="color: #64748b;">cliquez ici</a>.</p>
    </div>
  </div>
</body>
</html>`;
}

export function bookingConfirmation(data: {
  name: string;
  date: string;
  time: string;
  partySize: number;
  restaurant: string;
}): string {
  return baseTemplate(`
    <h2 style="color: #c9a96e;">Réservation confirmée</h2>
    <p>Bonjour ${data.name},</p>
    <p>Votre réservation au <strong>${data.restaurant}</strong> est confirmée :</p>
    <ul>
      <li>Date : ${data.date}</li>
      <li>Heure : ${data.time}</li>
      <li>Personnes : ${data.partySize}</li>
    </ul>
    <p>À bientôt !</p>
  `);
}

export function reviewRequest(data: {
  name: string;
  restaurant: string;
  reviewUrl: string;
}): string {
  return baseTemplate(`
    <h2 style="color: #c9a96e;">Comment s'est passée votre visite ?</h2>
    <p>Bonjour ${data.name},</p>
    <p>Nous espérons que votre expérience au <strong>${data.restaurant}</strong> vous a plu.</p>
    <p>Nous serions ravis de connaître votre avis :</p>
    <a href="${data.reviewUrl}" class="button">Laisser un avis</a>
  `);
}

export function birthdayOffer(data: {
  name: string;
  restaurant: string;
  discount: number;
  code: string;
}): string {
  return baseTemplate(`
    <h2 style="color: #c9a96e;">Joyeux anniversaire ${data.name} !</h2>
    <p>Pour célébrer votre anniversaire, nous vous offrons <strong>${data.discount}%</strong> de réduction.</p>
    <p>Utilisez le code <strong>${data.code}</strong> lors de votre prochaine réservation.</p>
    <p>Offre valable tout le mois.</p>
  `);
}

export function winBackCampaign(data: {
  name: string;
  restaurant: string;
  discount: number;
  code: string;
}): string {
  return baseTemplate(`
    <h2 style="color: #c9a96e;">On vous manque !</h2>
    <p>Bonjour ${data.name},</p>
    <p>Cela fait un moment que vous n'êtes pas passé au <strong>${data.restaurant}</strong>.</p>
    <p>Profitez de <strong>${data.discount}%</strong> de réduction pour votre prochaine visite.</p>
    <p>Code : <strong>${data.code}</strong></p>
  `);
}

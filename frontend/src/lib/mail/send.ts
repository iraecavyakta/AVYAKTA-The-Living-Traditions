import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { after } from "next/server";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter: Transporter | null | undefined;

// Plain SMTP so any provider works (Google Workspace, Microsoft 365, ...).
// Unset credentials = mail is skipped, so local dev works without a mailbox.
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn("SMTP_HOST/SMTP_USER/SMTP_PASS not set - emails are disabled");
    return (transporter = null);
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  return (transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 upgrades via STARTTLS
    auth: { user, pass },
  }));
}

const MAX_ATTEMPTS = 3;

// Retrying can't fix bad credentials (EAUTH) or a rejected address (5xx reply),
// so those fail fast; network blips and 4xx "try later" replies are retried.
const isPermanent = (error: unknown) => {
  const { code, responseCode } = error as {
    code?: string;
    responseCode?: number;
  };
  return code === "EAUTH" || (responseCode ?? 0) >= 500;
};

/** Never throws: a failed email must not undo a saved application/decision. */
export async function sendMail(message: MailMessage): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) return;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mailer.sendMail({
        from: `"Avyakta" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS || isPermanent(error)) {
        console.error(
          `Failed to send "${message.subject}" to ${message.to} (attempt ${attempt}):`,
          error,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Send once the HTTP response has gone out, so the user isn't kept waiting on
 * SMTP. `after` keeps the serverless function alive until it finishes.
 * ponytail: 3 in-process attempts, then only logged. Add a persistent outbox
 * if a missed email must never be lost.
 */
export function sendMailAfterResponse(message: MailMessage): void {
  after(() => sendMail(message));
}

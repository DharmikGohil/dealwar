import "server-only";
import { Resend } from "resend";
import { emailConfigured, env } from "@/lib/env";

const resend = emailConfigured ? new Resend(env.RESEND_API_KEY) : null;

type EmailInput = {
  to: string;
  subject: string;
  preview: string;
  heading: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  replyTo?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailHtml(input: EmailInput) {
  const action =
    input.actionLabel && input.actionUrl
      ? `<p style="margin:32px 0"><a href="${escapeHtml(input.actionUrl)}" style="background:#ff4f1f;color:#11100e;text-decoration:none;font-weight:800;padding:14px 20px;border:2px solid #11100e;box-shadow:4px 4px 0 #11100e">${escapeHtml(input.actionLabel)}</a></p>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f0e6;color:#11100e;font-family:Arial,sans-serif"><span style="display:none">${escapeHtml(input.preview)}</span><table width="100%" role="presentation"><tr><td align="center" style="padding:40px 16px"><table width="100%" role="presentation" style="max-width:560px;background:#fffdf7;border:2px solid #11100e"><tr><td style="padding:24px;border-bottom:2px solid #11100e;font-weight:900;letter-spacing:-1px;font-size:24px">DEAL/WAR<span style="color:#ff4f1f">.</span></td></tr><tr><td style="padding:32px"><h1 style="font-size:32px;line-height:1.05;margin:0 0 18px">${escapeHtml(input.heading)}</h1><p style="font-size:16px;line-height:1.6;margin:0;white-space:pre-line">${escapeHtml(input.body)}</p>${action}<p style="font-size:12px;color:#6b675f;margin:32px 0 0">DealWar sends transactional email only for actions on your account.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendEmail(input: EmailInput) {
  if (!resend) {
    if (env.NODE_ENV === "production") {
      throw new Error("Transactional email is not configured.");
    }
    return { id: "development-email-disabled" };
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: emailHtml(input),
    replyTo: input.replyTo,
  });
  if (error) throw new Error(`Email delivery failed: ${error.message}`);
  return data;
}

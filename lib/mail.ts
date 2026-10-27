import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

/** SMTP when configured; otherwise a JSON transport that logs emails (dev). */
function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }) {
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM ?? "ScholarSphere <no-reply@scholarsphere.app>",
    ...opts,
  });
  if (!process.env.SMTP_HOST) console.info(`[mail:dev] → ${opts.to} · ${opts.subject}`);
  return info;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function deadlineReminderEmail(p: {
  name: string | null;
  title: string;
  provider: string;
  daysLeft: number;
  deadline: string;
  url: string;
  applyUrl: string;
}) {
  const when = p.daysLeft <= 1 ? "tomorrow" : `in ${p.daysLeft} days`;
  const subject = `⏰ ${p.title} closes ${when}`;
  const text = `Hi ${p.name ?? "there"},\n\n"${p.title}" (${p.provider}) closes ${when} on ${p.deadline}.\n\nView details: ${p.url}\nApply: ${p.applyUrl}\n\n— ScholarSphere`;
  const html = `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;color:#121733">
    <p style="font-size:13px;color:#5b6178;margin:0 0 24px">ScholarSphere · Deadline reminder</p>
    <h1 style="font-size:20px;margin:0 0 8px">${escape(p.title)}</h1>
    <p style="margin:0 0 16px;color:#5b6178">${escape(p.provider)}</p>
    <p style="font-size:15px">Hi ${escape(p.name ?? "there")}, this scholarship closes <strong>${when}</strong> (${escape(p.deadline)}).</p>
    <p style="margin:28px 0">
      <a href="${p.applyUrl}" style="background:#283593;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Apply now</a>
      <a href="${p.url}" style="margin-left:12px;color:#283593">View details</a>
    </p>
    <p style="font-size:12px;color:#8a8fa3">You're receiving this because you saved this scholarship. Turn off reminders in your profile settings.</p>
  </div>`;
  return { subject, text, html };
}

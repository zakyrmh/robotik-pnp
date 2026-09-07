import { Resend } from "resend";
import nodemailer from "nodemailer";

export interface SendETicketEmailParams {
  toEmail: string;
  teamName: string;
  registrationCode: string;
  categoryName: string;
  accessToken: string;
  appBaseUrl: string;
  paymentStatus?: "pending" | "paid" | "expired" | "failed";
}

export async function sendETicketEmail(params: SendETicketEmailParams) {
  const ticketUrl = `${params.appBaseUrl}/mrc/tiket/${params.accessToken}`;
  const isPaid = params.paymentStatus === "paid";

  const headline = isPaid
    ? "Pendaftaran Berhasil & Pembayaran Dikonfirmasi"
    : "Pendaftaran Berhasil Diterima";
  const subtext = isPaid
    ? `Pembayaran pendaftaran Anda untuk kategori <strong>${params.categoryName}</strong> telah berhasil diverifikasi.`
    : `Pendaftaran tim Anda untuk kategori <strong>${params.categoryName}</strong> telah berhasil disimpan. Silakan selesaikan pembayaran untuk mengonfirmasi keikutsertaan Anda.`;
  const buttonLabel = isPaid
    ? "Lihat E-Tiket & QR Kokarde"
    : "Akses E-Tiket & Lanjut Pembayaran";
  const statusBadge = isPaid
    ? `<span style="display: inline-block; padding: 4px 12px; background-color: #dcfce7; color: #15803d; font-weight: bold; border-radius: 9999px; font-size: 12px;">Status: LUNAS / TERVERIFIKASI</span>`
    : `<span style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #b45309; font-weight: bold; border-radius: 9999px; font-size: 12px;">Status: MENUNGGU PEMBAYARAN</span>`;

  const subject = isPaid
    ? `E-Tiket & Konfirmasi Pembayaran: ${params.teamName} - ${params.categoryName}`
    : `Konfirmasi Pendaftaran & Link Pembayaran: ${params.teamName} - ${params.categoryName}`;

  // Template email satu kolom yang disengaja minimalis: klien email
  // (Gmail, Outlook) menghapus <style>/CSS eksternal, jadi seluruh styling
  // HARUS inline. Palet mengikuti DESIGN.md: navy #3b5b84 (primary),
  // orange #f0975a/#9a5b30 (accent), kanvas #ffffff, surface #f8fafc,
  // border #e5e7eb, badge success/warning-soft. Tombol memakai Deep Accent
  // #9a5b30 agar teks putih lolos kontras 4.5:1.
  const htmlContent = `
    <div style="font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <h2 style="font-family: 'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif; color: #3b5b84; margin-bottom: 8px; letter-spacing: -0.02em;">${headline}</h2>
      <div style="margin-bottom: 16px;">${statusBadge}</div>
      <p>Halo Tim <strong>${params.teamName}</strong>,</p>
      <p>${subtext}</p>

      <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Kode Pendaftaran:</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; color: #3b5b84;">${params.registrationCode}</p>
      </div>

      <p>Silakan klik tombol di bawah ini untuk mengakses E-Tiket dan melanjutkan pembayaran/melihat QR Code kokarde tim Anda:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${ticketUrl}" style="background-color: #9a5b30; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ${buttonLabel}
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280;">Jika tombol di atas tidak bekerja, salin link berikut ke browser Anda:<br/><a href="${ticketUrl}">${ticketUrl}</a></p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Panitia Minangkabau Robot Contest — SIM UKM Robotik Politeknik Negeri Padang</p>
    </div>
  `;

  const fromEmail =
    process.env.SMTP_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "Minangkabau Robot Contest <noreply@ukmrobotikpnp.org>";

  // 1. Try Resend if API key is present
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: fromEmail,
        to: [params.toEmail],
        subject,
        html: htmlContent,
      });
      return { success: true, provider: "resend" };
    } catch (err: unknown) {
      console.error("Failed to send e-ticket email via Resend:", err);
    }
  }

  // 2. Try Mailpit REST API (Supabase Local Docker UI port 54324)
  const mailpitWebUrl = process.env.MAILPIT_WEB_URL || "http://127.0.0.1:54324";
  try {
    const mailpitRes = await fetch(`${mailpitWebUrl}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: {
          Email: "noreply@ukmrobotikpnp.org",
          Name: "Minangkabau Robot Contest",
        },
        To: [{ Email: params.toEmail, Name: params.teamName }],
        Subject: subject,
        HTML: htmlContent,
      }),
    });

    if (mailpitRes.ok) {
      console.log(
        `[Mailpit REST API] E-Ticket email sent to ${params.toEmail}`,
      );
      return { success: true, provider: "mailpit-rest" };
    }
  } catch (_err: unknown) {
    // Mailpit REST API not reachable, proceed to SMTP fallback
  }

  // 3. Fallback to Mailpit / Local SMTP if configured or default local port 1025
  const smtpHost = process.env.SMTP_HOST || "127.0.0.1";
  const smtpPort = Number(process.env.SMTP_PORT || 1025);

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || "",
          }
        : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: params.toEmail,
      subject,
      html: htmlContent,
    });

    console.log(
      `[Mailpit SMTP] E-Ticket email sent to ${params.toEmail} via ${smtpHost}:${smtpPort}`,
    );
    return { success: true, provider: "smtp" };
  } catch (err: unknown) {
    console.error("Failed to send e-ticket email via Mailpit/SMTP:", err);
    console.log(`[Mock Email Log Fallback] Ticket URL: ${ticketUrl}`);
    return { success: true, mocked: true };
  }
}

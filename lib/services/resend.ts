import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { BankAccount } from "@/types/event-registration";

export interface SendETicketEmailParams {
  toEmail: string;
  teamName: string;
  registrationCode: string;
  categoryName: string;
  accessToken: string;
  appBaseUrl: string;
  paymentStatus?: "unpaid" | "pending" | "pending_verification" | "paid" | "rejected" | "expired" | "failed";
  paymentMode?: "midtrans" | "manual_bank";
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  bankAccounts?: BankAccount[] | null;
  whatsappGroupUrl?: string | null;
  rejectionReason?: string | null;
}

export async function sendETicketEmail(params: SendETicketEmailParams) {
  const ticketUrl = `${params.appBaseUrl}/mrc/tiket/${params.accessToken}`;
  const payUrl = `${params.appBaseUrl}/mrc/bayar/${params.accessToken}`;
  const status = params.paymentStatus || "pending";

  let headline = "Pendaftaran Berhasil Diterima";
  let subject = `Konfirmasi Pendaftaran: ${params.teamName} - ${params.categoryName}`;
  let statusBadge = `<span style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #b45309; font-weight: bold; border-radius: 9999px; font-size: 12px;">Status: MENUNGGU PEMBAYARAN</span>`;
  let subtext = `Pendaftaran tim Anda untuk kategori <strong>${params.categoryName}</strong> telah berhasil disimpan. Silakan selesaikan pembayaran untuk mengonfirmasi keikutsertaan Anda.`;
  let buttonLabel = "Akses E-Tiket & Lanjut Pembayaran";
  let buttonUrl = payUrl;

  if (status === "paid") {
    headline = "Pendaftaran Berhasil & Pembayaran Dikonfirmasi";
    subject = `E-Tiket & Konfirmasi Pembayaran: ${params.teamName} - ${params.categoryName}`;
    statusBadge = `<span style="display: inline-block; padding: 4px 12px; background-color: #dcfce7; color: #15803d; font-weight: bold; border-radius: 9999px; font-size: 12px;">Status: LUNAS / TERVERIFIKASI</span>`;
    subtext = `Pembayaran pendaftaran Anda untuk kategori <strong>${params.categoryName}</strong> telah berhasil diverifikasi. Selamat berlomba!`;
    buttonLabel = "Lihat E-Tiket & QR Kokarde";
    buttonUrl = ticketUrl;
  } else if (status === "pending_verification") {
    headline = "Bukti Pembayaran Diterima - Menunggu Verifikasi Panitia";
    subject = `Bukti Pembayaran Diterima: ${params.teamName} - ${params.categoryName}`;
    statusBadge = `<span style="display: inline-block; padding: 4px 12px; background-color: #dbeafe; color: #1e40af; font-weight: bold; border-radius: 9999px; font-size: 12px;">Status: MENUNGGU VERIFIKASI</span>`;
    subtext = `Bukti pembayaran yang Anda unggah sedang ditinjau oleh panitia pendaftaran. Anda akan menerima pemberitahuan via email setelah verifikasi selesai.`;
    buttonLabel = "Cek Status Pendaftaran";
    buttonUrl = payUrl;
  } else if (status === "rejected") {
    headline = "Bukti Pembayaran Memerlukan Perbaikan";
    subject = `Bukti Pembayaran Ditolak: ${params.teamName} - ${params.categoryName}`;
    statusBadge = `<span style="display: inline-block; padding: 4px 12px; background-color: #fee2e2; color: #991b1b; font-weight: bold; border-radius: 9999px; font-size: 12px;">Status: BUKTI PEMBAYARAN DITOLAK</span>`;
    subtext = `Mohon maaf, bukti pembayaran yang Anda unggah belum dapat disetujui oleh panitia. Silakan lakukan upload ulang bukti pembayaran yang valid.`;
    buttonLabel = "Unggah Ulang Bukti Pembayaran";
    buttonUrl = payUrl;
  }

  // Rekening Bank Info
  let bankInfoHtml = "";
  if (params.paymentMode === "manual_bank" && status !== "paid") {
    const list = params.bankAccounts && params.bankAccounts.length > 0
      ? params.bankAccounts
      : params.bankDetails
      ? [{ bank_name: params.bankDetails.bankName, account_number: params.bankDetails.accountNumber, account_holder: params.bankDetails.accountHolder }]
      : [];

    if (list.length > 0) {
      const bankItems = list
        .map(
          (b) => `
          <div style="background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 12px; margin-top: 8px;">
            <p style="margin: 0; font-size: 13px; color: #1e3a8a;"><strong>Bank:</strong> ${b.bank_name}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #1e3a8a;"><strong>No. Rekening:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold;">${b.account_number}</span></p>
            <p style="margin: 0; font-size: 12px; color: #1e3a8a;"><strong>Atas Nama:</strong> ${b.account_holder}</p>
          </div>
        `,
        )
        .join("");

      bankInfoHtml = `
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 4px 0; color: #1e40af; font-size: 14px;">Daftar Rekening Bank Tujuan Transfer:</h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #3b82f6;">Anda dapat memilih salah satu rekening bank di bawah ini untuk transfer biaya pendaftaran:</p>
          ${bankItems}
        </div>
      `;
    }
  }

  // WhatsApp Group Info
  let waGroupHtml = "";
  if (status === "paid" && params.whatsappGroupUrl) {
    waGroupHtml = `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">Grup WhatsApp Official Peserta</h4>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #15803d;">Silakan bergabung ke grup WhatsApp official kategori <strong>${params.categoryName}</strong> melalui tombol berikut:</p>
        <a href="${params.whatsappGroupUrl}" target="_blank" style="background-color: #16a34a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
          Bergabung ke Grup WhatsApp
        </a>
      </div>
    `;
  }

  // Rejection Reason Info
  let rejectionHtml = "";
  if (status === "rejected" && params.rejectionReason) {
    rejectionHtml = `
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h4 style="margin: 0 0 6px 0; color: #991b1b; font-size: 14px;">Alasan Penolakan dari Admin:</h4>
        <p style="margin: 0; font-size: 13px; color: #7f1d1d;">${params.rejectionReason}</p>
      </div>
    `;
  }

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

      ${bankInfoHtml}
      ${rejectionHtml}
      ${waGroupHtml}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${buttonUrl}" style="background-color: #9a5b30; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ${buttonLabel}
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280;">Jika tombol di atas tidak bekerja, salin link berikut ke browser Anda:<br/><a href="${buttonUrl}">${buttonUrl}</a></p>

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

  // 2. Try Mailpit REST API
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
    // Mailpit REST API not reachable
  }

  // 3. Fallback to Mailpit / Local SMTP
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

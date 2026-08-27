import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured.");
    return null;
  }
  return new Resend(apiKey);
}

export interface SendETicketEmailParams {
  toEmail: string;
  teamName: string;
  registrationCode: string;
  categoryName: string;
  accessToken: string;
  appBaseUrl: string;
}

export async function sendETicketEmail(params: SendETicketEmailParams) {
  const resend = getResendClient();
  const ticketUrl = `${params.appBaseUrl}/event/tiket/${params.accessToken}`;

  if (!resend) {
    console.log(`[Mock Email] E-Ticket email for team "${params.teamName}" would be sent to ${params.toEmail}. Ticket URL: ${ticketUrl}`);
    return { success: true, mocked: true };
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Minangkabau Robot Contest <noreply@ukmrobotikpnp.org>";
    await resend.emails.send({
      from: fromEmail,
      to: [params.toEmail],
      subject: `E-Tiket & Konfirmasi Pendaftaran: ${params.teamName} - ${params.categoryName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #3b5b84;">Pendaftaran Berhasil & Pembayaran Dikonfirmasi</h2>
          <p>Halo Tim <strong>${params.teamName}</strong>,</p>
          <p>Pembayaran pendaftaran Anda untuk kategori <strong>${params.categoryName}</strong> telah berhasil diverifikasi.</p>

          <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Kode Pendaftaran:</p>
            <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: #3b5b84;">${params.registrationCode}</p>
          </div>

          <p>Silakan klik tombol di bawah ini untuk melihat E-Tiket dan QR Code kokarde tim Anda:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${ticketUrl}" style="background-color: #f0975a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Lihat E-Tiket & QR Kokarde
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b;">Jika tombol di atas tidak bekerja, salin link berikut ke browser Anda:<br/><a href="${ticketUrl}">${ticketUrl}</a></p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Panitia Minangkabau Robot Contest — SIM UKM Robotik Politeknik Negeri Padang</p>
        </div>
      `,
    });
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to send e-ticket email via Resend:", err);
    return { success: false, error: (err as Error).message };
  }
}

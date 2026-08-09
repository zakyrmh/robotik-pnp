import "server-only";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

/**
 * Verifikasi token Cloudflare Turnstile di server via siteverify.
 * Token hanya valid sekali — jangan verifikasi ulang di Supabase Auth
 * setelah pemanggilan ini.
 */
export async function verifyTurnstileToken(
  token: string,
  clientIp?: string,
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET;

  if (!secretKey) {
    console.error(
      "[Turnstile] TURNSTILE_SECRET belum dikonfigurasi di environment variables.",
    );
    return false;
  }

  if (!token.trim()) {
    return false;
  }

  const body = new URLSearchParams();
  body.append("secret", secretKey);
  body.append("response", token);
  if (clientIp) {
    body.append("remoteip", clientIp);
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (!res.ok) {
      console.error("[Turnstile] siteverify HTTP error:", res.status);
      return false;
    }

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      console.warn(
        "[Turnstile] Verifikasi gagal:",
        data["error-codes"]?.join(", ") ?? "unknown",
      );
    }
    return data.success;
  } catch (error) {
    console.error("[Turnstile] siteverify request failed:", error);
    return false;
  }
}

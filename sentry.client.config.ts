import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Integrasi Replay untuk merekam sesi ketika terjadi error pada client
  integrations: [Sentry.replayIntegration()],

  // Tracing sample rate (0.1 = 10% sampel tercatat untuk Vercel Free Plan)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay sample rates
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Nonaktifkan debug log di konsol agar bersih
  debug: false,
});

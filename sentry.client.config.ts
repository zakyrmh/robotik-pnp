import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Integrasi Replay untuk merekam sesi ketika terjadi error pada client
  integrations: [Sentry.replayIntegration()],

  // Tracing sample rate (1.0 = 100% sampel tercatat)
  tracesSampleRate: 1.0,

  // Replay sample rates
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Nonaktifkan debug log di konsol agar bersih
  debug: false,
});

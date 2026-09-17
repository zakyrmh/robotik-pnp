import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tracing sample rate untuk Edge runtime (0.1 = 10% sampel untuk Vercel Free Plan)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Nonaktifkan debug log di konsol Edge
  debug: false,
});

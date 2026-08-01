import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tracing sample rate untuk Edge runtime (1.0 = 100% sampel)
  tracesSampleRate: 1.0,

  // Nonaktifkan debug log di konsol Edge
  debug: false,
});

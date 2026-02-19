import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });

  console.log('✅ Sentry initialized successfully');
} else {
  console.log('⚠️ Sentry DSN not provided, skipping initialization');
}

export default Sentry;

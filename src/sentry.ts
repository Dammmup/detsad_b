import * as Sentry from '@sentry/node';


const SENTRY_DSN = process.env.SENTRY_DSN || 'https://6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f@o45051200000.ingest.sentry.io/45051200000';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });

  console.log('✅ Sentry initialized successfully');
} else {
  console.log('⚠️ Sentry DSN not provided, skipping initialization');
}

export default Sentry;
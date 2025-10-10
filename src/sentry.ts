import * as Sentry from '@sentry/node';

// Инициализируем Sentry только если есть DSN
const SENTRY_DSN = process.env.SENTRY_DSN || 'https://fbc249178aeea96ba69f4c2809a0d821@o4510119640498177.ingest.us.sentry.io/4510166460530688';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0, // 100% транзакций для трассировки
  });

  console.log('✅ Sentry initialized successfully');
} else {
  console.log('⚠️ Sentry DSN not provided, skipping initialization');
}

export default Sentry;
const Sentry = require('@sentry/node');

const isSentryReady = process.env.NODE_ENV !== 'test' && !!process.env.SENTRY_DSN;


if (isSentryReady) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    integrations: [
      (() => {
        try {
          const { nodeProfilingIntegration } = require('@sentry/profiling-node');
          return nodeProfilingIntegration();
        } catch (e) {
          return null;
        }
      })()
    ].filter(Boolean),
    tracesSampleRate: 0.2, // Sampling rate at 20%
    profilesSampleRate: 0.2,
    
    // Scrub sensitive headers & tokens before sending to Sentry
    beforeSend(event) {
      if (event.request) {
        // Scrub request headers
        if (event.request.headers) {
          const sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token', 'x-api-key'];
          sensitiveHeaders.forEach((header) => {
            if (event.request.headers[header]) {
              event.request.headers[header] = '[SCRUBBED]';
            }
          });
        }
        
        // Scrub body parameters (passwords, OTPs, secret tokens)
        if (event.request.data && typeof event.request.data === 'object') {
          const sensitiveKeys = ['password', 'otp', 'refreshToken', 'token', 'secret'];
          const dataStr = JSON.stringify(event.request.data);
          let dataParsed = JSON.parse(dataStr);
          
          const maskObj = (obj) => {
            for (const key in obj) {
              if (sensitiveKeys.includes(key)) {
                obj[key] = '[SCRUBBED]';
              } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                maskObj(obj[key]);
              }
            }
          };
          maskObj(dataParsed);
          event.request.data = dataParsed;
        }
      }
      return event;
    },
  });
  console.log('✅ Sentry Real-Time Error Tracking and Profiling initialized successfully.');
} else {
  console.log('ℹ️ Sentry is disabled (either in test environment or missing SENTRY_DSN).');
}

module.exports = {
  Sentry,
  isSentryReady,
};

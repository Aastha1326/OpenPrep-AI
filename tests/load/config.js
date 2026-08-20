export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const ALLOW_PROD = __ENV.ALLOW_PROD === 'true';
const isProd = BASE_URL.includes('production') || BASE_URL.includes('openprep.ai');

if (isProd && !ALLOW_PROD) {
  throw new Error('Guard Triggered: Attempting to run load tests against production without ALLOW_PROD=true. Aborting.');
}

const vus = __ENV.VUS ? parseInt(__ENV.VUS) : 200;
const duration = __ENV.DURATION || '5m';

export const options = {
  stages: [
    { duration: duration, target: vus }, // Ramp up to max VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must complete below 200ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

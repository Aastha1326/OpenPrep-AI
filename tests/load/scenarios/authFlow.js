import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config.js';

export default function () {
  const payload = JSON.stringify({
    email: 'testuser@example.com',
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    // Dummy credentials intentionally return 401 — tell k6 these are expected,
    // so http_req_failed only reflects real errors (5xx/timeouts).
    responseCallback: http.expectedStatuses(200, 401),
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);
  check(res, {
    'auth login is status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
}

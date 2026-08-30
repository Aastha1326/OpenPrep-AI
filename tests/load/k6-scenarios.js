import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    peak_quiz_submissions: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30s',
      exec: 'quizSubmissions',
    },
    dashboard_aggregation: {
      executor: 'constant-vus',
      vus: 500,
      duration: '30s',
      exec: 'dashboardAggregation',
    },
    websocket_sync: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
      exec: 'websocketSync',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must complete below 200ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';

// Scenario A: Peak Quiz Submissions
export function quizSubmissions() {
  const payload = JSON.stringify({
    answers: { 'q-1': 1, 'q-2': 2 },
    timeSpentSeconds: 120,
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-token-here',
    },
  };
  const res = http.post(`${BASE_URL}/quizzes/attempts`, payload, params);
  check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
  sleep(1);
}

// Scenario B: Dashboard Aggregation
export function dashboardAggregation() {
  const params = {
    headers: {
      'Authorization': 'Bearer mock-token-here',
    },
  };
  const res = http.get(`${BASE_URL}/progress/dashboard`, params);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

// Scenario C: WebSocket Sync (simulated via HTTP API squad retrieval endpoint)
export function websocketSync() {
  const params = {
    headers: {
      'Authorization': 'Bearer mock-token-here',
    },
  };
  const res = http.get(`${BASE_URL}/squads`, params);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

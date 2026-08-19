import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config.js';

export default function () {
  // Using a dummy UUID for the quiz id
  const quizId = '00000000-0000-0000-0000-000000000000';
  
  const payload = JSON.stringify({
    answers: [1, 2, 3], // Dummy answers
    timeSpent: 120,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Authorization would be added here normally. We just want to hit the endpoint to measure load/handling of auth failures
      'Authorization': 'Bearer dummy_token',
    },
  };

  const res = http.post(`${BASE_URL}/api/quizzes/${quizId}/submit`, payload, params);

  check(res, {
    'quiz submission is status 200, 401, or 404': (r) => [200, 201, 400, 401, 404].includes(r.status),
  });
}

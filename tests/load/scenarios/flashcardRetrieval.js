import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config.js';

export default function () {
  const params = {
    headers: {
      'Authorization': 'Bearer dummy_token',
    },
  };

  const res = http.get(`${BASE_URL}/api/flashcards`, params);

  check(res, {
    'flashcard retrieval is status 200 or 401': (r) => [200, 401].includes(r.status),
  });
}

import { options } from './config.js';
import authFlow from './scenarios/authFlow.js';
import quizSubmission from './scenarios/quizSubmission.js';
import dashboardStats from './scenarios/dashboardStats.js';
import flashcardRetrieval from './scenarios/flashcardRetrieval.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export { options };

export default function () {
  authFlow();
  quizSubmission();
  dashboardStats();
  flashcardRetrieval();
}

export function handleSummary(data) {
  return {
    'tests/load/reports/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

# Platform Load Testing and Performance Benchmarking

This document details the configuration, scripts, and workflows to seed synthetic data and run performance load tests to benchmark OpenPrep AI.

---

## 🚀 Synthetic Data Generation

OpenPrep AI comes with an optimized relational synthetic data generator to populate the database with realistic scale metrics for local development and benchmarking.

### Seeding Execution

To clean your tables and seed 500+ users, 20+ curricula (JEE, NEET, etc.), 5,000+ MCQs, and 10,000+ quiz attempts, run:

```bash
cd backend
npm run seed:synthetic
```

The seeder uses optimized Sequelize bulk creates (`bulkCreate`) and hashes password keys once, ensuring the entire seeding routine completes in **under 30 seconds**.

---

## 📊 k6 Load Testing

We use [k6](https://k6.io/) to run simulated load testing scenarios to ensure the APIs handle concurrent traffic spikes during peak exam seasons.

### Installation

Install k6 on your system (e.g. using Chocolatey on Windows, Homebrew on macOS, or apt on Linux):

```bash
# Windows
choco install k6

# macOS
brew install k6
```

### Load Test Scenarios

The load testing suite located at `tests/load/k6-scenarios.js` runs three concurrent simulation groups:

1. **Scenario A (Peak Quiz Submissions)**: Simulates 200 concurrent Virtual Users (VUs) submitting answers simultaneously to `POST /api/quizzes/attempts`.
2. **Scenario B (Dashboard Aggregation)**: Simulates 500 concurrent Virtual Users requesting dashboard analytics from `GET /api/progress/dashboard`.
3. **Scenario C (WebSocket/Squad Sync)**: Simulates 50 concurrent Virtual Users polling squad list details to mock squad sync loads.

### Running Load Tests

To run the load testing scenarios against a running local instance (ensure the server is started with `npm run dev` in `backend`):

```bash
k6 run tests/load/k6-scenarios.js
```

To run against a specific environment base URL:

```bash
k6 run -e BASE_URL=https://staging.openprep.ai/api tests/load/k6-scenarios.js
```

### SLA and Thresholds

The k6 test suite automatically asserts the following performance criteria:
- **`http_req_duration`**: 95% of all HTTP requests must complete under **200ms** (`p(95)<200`).
- Fails the benchmark run if error rates exceed 1%.

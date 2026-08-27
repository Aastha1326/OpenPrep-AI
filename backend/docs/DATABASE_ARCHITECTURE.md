# OpenPrep AI Database Architecture & Connection Pooling

## Overview
OpenPrep AI utilizes a hybrid relational database strategy leveraging PostgreSQL for high integrity, ACID compliance, and structured queries.

```
       +--------------------+
       |  Express Router    |
       +---------+----------+
                 |
        +--------+--------+
        |                 |
        v                 v
+---------------+ +---------------+
| Sequelize ORM | |   Raw pg.Pool |
|  (Active DB)  | |  (Migrations) |
+-------+-------+ +-------+-------+
        |                 |
        +--------+--------+
                 |
                 v
      +--------------------+
      | PostgreSQL Cluster |
      +--------------------+
```

## Connection Pool Tuning Parameters

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `max` | `20` | Maximum simultaneous open connections in pool |
| `min` | `5` | Minimum idle connections preserved to reduce TCP handshake overhead |
| `acquire` | `30000ms` | Maximum time to wait for acquiring an available connection |
| `idle` | `30000ms` | Eviction timeout for idle connections |
| `statement_timeout` | `15000ms` | Automatically aborts long-running or stalled queries |
| `idle_in_transaction_session_timeout` | `15000ms` | Prevents connection leakage from uncommitted transactions |

## Health Probe & Circuit Breaker
- **Endpoint**: `GET /api/health/db`
- **Circuit Breaker States**:
  - `CLOSED`: Normal operation, queries executing cleanly.
  - `OPEN`: Failures exceeded threshold (`5`), incoming traffic shielded.
  - `HALF_OPEN`: Cooldown elapsed, probing database status with lightweight ping.

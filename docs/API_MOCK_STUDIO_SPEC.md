# OpenPrep AI API Contract Studio & Mock Server Specification

## Architecture

```
+-------------------------------------------------------------+
|                API Contract Designer & Studio               |
+-------------------------------------------------------------+
   |                                                        |
   v                                                        v
+-----------------------------+              +-----------------------------+
| Dynamic Schema Mock Payload |              | Network Fault & Latency     |
| Generator (Faker / Blueprint|              | Injector (100ms - 5000ms)   |
+--------------+--------------+              +--------------+--------------+
               |                                            |
               +----------------------+---------------------+
                                      |
                                      v
+-------------------------------------------------------------+
| Live Request Timeline & Waterfall Duration Inspector        |
+-------------------------------------------------------------+
```

## Features
- **Dynamic Route Matcher**: Emulates `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
- **Fault Injection**: Custom HTTP status codes (`400`, `401`, `429`, `500`, `503`) and configurable artificial network jitter.
- **Traffic Telemetry**: Real-time duration waterfall inspection.

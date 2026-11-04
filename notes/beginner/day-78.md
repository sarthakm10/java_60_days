# Day 78 — Observability: Logs, Metrics and Traces

> With one app, you read its log. With twenty services, a single user request passes through five of them, and you need to see the whole journey. Read each 🌱 **In simple words** box first.

**Today's goal:** follow one request across services, collect logs centrally, and review the microservices patterns from Days 75–77.

<!-- topic: b78_t1 -->
## 🏗️ Microservices — Observability

<!-- intro: d29_t1_s4 -->
Give every incoming request a unique **correlation id**, pass it along in a header to every service it calls, and put it in every log line (using MDC, Day 63). When a user reports an error, search all logs for that one id and you see the request's whole story across services.

<!-- intro: d29_t1_s5 -->
**Distributed tracing** goes further: each request gets a **trace id**, and each step inside it (an HTTP call, a database query) is a **span** with a start time and duration. Tools like **Zipkin** or **Jaeger** draw it as a timeline, so you can see that a slow checkout spent 1.8 of its 2 seconds waiting on the payments service. Spring Boot does this with Micrometer Tracing.

<!-- intro: d29_t1_s6 -->
Logs scattered over fifty containers are useless if you have to log in to each one. **Centralised logging** ships every service's logs to one searchable place, like the **ELK** stack (Elasticsearch, Logstash, Kibana) or CloudWatch Logs (Day 89). Logging in JSON (Day 63) makes fields like `traceId` and `userId` searchable.

<!-- intro: d34_t1_s6 -->
Review: draw a microservices architecture from memory: clients → API Gateway → services found through service discovery → each with its own database, circuit breakers on their calls, and Kafka between them for events. Explain each box in one sentence.

<!-- intro: d40_t1_s3 -->
Explain a saga out loud (Day 77): the order flow, what happens when payment fails, and the difference between orchestration and choreography.

<!-- intro: d40_t1_s4 -->
Explain the circuit breaker's three states and exactly what moves it between them (Day 76): failures over a threshold open it, a timer moves it to half-open, and test calls close it or open it again.

<!-- intro: d40_t1_s6 -->
Rapid-fire: one sentence each for API Gateway, service discovery, outbox, CQRS and event sourcing (Days 75–77). Then check yourself with the flashcards.

👉 There's no code exercise for these days: the patterns live in infrastructure and libraries. The Day 76 resilience exercise is the hands-on part of this block.

<!-- topic: b78_t2 -->
## 🌿 Spring Boot — Metrics & Health

<!-- intro: d25_t1_s3 -->
**Micrometer** records numbers about your app (counters like "orders placed", timers like "how long checkout takes", gauges like "items in the queue"), and tools like **Prometheus** and **Grafana** collect them into dashboards and alerts. It's how teams notice problems before users report them.

<!-- intro: d25_t1_s2 -->
A custom **`HealthIndicator`** adds your own checks to `/actuator/health`: "can we reach the payment service?". If a dependency is down, health reports DOWN, and the platform can stop sending users to this instance.

## 📝 Day 78 Recap

1. What is a correlation id? → **a unique id passed with a request through every service and logged everywhere**
2. Trace vs span? → **a trace is one request's whole journey; a span is one timed step inside it**
3. Tools to view traces? → **Zipkin or Jaeger**
4. What does Spring Boot use for tracing? → **Micrometer Tracing**
5. What is centralised logging? → **shipping every service's logs to one searchable system**
6. What is the ELK stack? → **Elasticsearch, Logstash and Kibana**
7. Why log in JSON? → **fields like traceId become searchable**
8. Three pillars of observability? → **logs, metrics and traces**
9. What opens a circuit breaker? → **failures above a threshold**
10. What closes it again? → **successful test calls in the half-open state**
11. What does Micrometer do? → **records metrics (counters, timers, gauges) for tools like Prometheus**
12. Add your own check to /actuator/health? → **a HealthIndicator bean**

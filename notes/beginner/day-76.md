# Day 76 — Microservices: Resilience

> In a system of many services, something is always failing somewhere. Resilience is about making sure one slow or broken service doesn't take everything down with it. Read each 🌱 **In simple words** box first.

**Today's goal:** understand circuit breakers, bulkheads, retries with backoff, fallbacks and rate limits, and how Resilience4j provides them.

<!-- topic: b76_t1 -->
## 🏗️ Microservices — Resilience

<!-- intro: d27_t1_s4 -->
If the payments service is down, every order request would wait for a timeout, threads would pile up (Day 40), and the orders service would go down too: a **cascade failure**. A **circuit breaker** works like the one in your home's fuse box: after too many failures it **opens** and fails calls instantly for a while instead of waiting; then it lets a few test calls through (**half-open**); if they succeed it **closes** again and normal traffic resumes.

<!-- intro: d27_t1_s5 -->
A **bulkhead** isolates failures, like the watertight compartments in a ship's hull: give calls to each downstream service their **own** limited thread pool or concurrency limit, so a slow recommendations service can only use up its own threads, and checkout keeps working.

<!-- intro: d29_t1_s1 -->
**Resilience4j** is the Java library that provides these patterns as annotations on Spring methods: `@CircuitBreaker`, `@Retry`, `@RateLimiter`, `@TimeLimiter` and `@Bulkhead`, each configured in `application.yml`. It works through proxies (Day 64), just like `@Transactional`.

<!-- intro: d29_t1_s2 -->
Many failures are temporary (a network blip), so **retrying** helps, but only carefully. Wait longer after each attempt (**exponential backoff**: 100 ms, 200 ms, 400 ms…), add a little randomness (**jitter**) so thousands of clients don't all retry at the same instant, cap the number of attempts, and only retry operations that are safe to repeat (idempotent, Day 45).

<!-- intro: d29_t1_s3 -->
When a call fails, what do you show the user? A **fallback**: a sensible default (generic recommendations instead of personal ones), the last cached value, or a reduced feature ("delivery estimate unavailable") instead of an error page. Decide per feature what "good enough" looks like when a dependency is down.

<!-- intro: d29_t1_s7 -->
**Rate limiting** caps how many requests a client may make (say, 100 per minute), protecting your service from overload and abuse. The **token bucket** is the classic algorithm: a bucket refills with tokens at a steady rate, each request takes one, and when it's empty, requests are rejected (HTTP 429 Too Many Requests). Across many servers, the counts live in a shared store like Redis.

👉 **Code Practice** builds a retry-with-backoff and a circuit breaker in plain Java, so you can see the states change.

## 📝 Day 76 Recap

1. What is a cascade failure? → **one failing service causing its callers to fail too, spreading through the system**
2. Circuit breaker states? → **CLOSED, OPEN, HALF_OPEN**
3. What happens when a breaker is OPEN? → **calls fail immediately without trying the remote service**
4. What is a bulkhead? → **separate limited resources per dependency so one slow service can't exhaust everything**
5. Java library for these patterns? → **Resilience4j**
6. What is exponential backoff? → **waiting longer after each failed retry (e.g. doubling)**
7. Why add jitter? → **so many clients don't retry at exactly the same moment**
8. Which operations are safe to retry? → **idempotent ones**
9. What is a fallback? → **a sensible alternative response when a call fails**
10. Status code for too many requests? → **429 Too Many Requests**

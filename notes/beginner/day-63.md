# Day 63 — Configuration, Profiles, Logging and Actuator

> The features that make an app ready to run on a real server. Read each 🌱 **In simple words** box first.

**Today's goal:** run the same app with different settings per environment, read configuration safely, log properly, and expose health and metrics.

<!-- topic: b63_t1 -->
## 🌿 Spring Boot — Production Features

<!-- intro: d25_t1_s4 -->
Your laptop, the test server and production each need different settings: a different database, a fake versus a real email sender. **Profiles** handle this: `application-dev.properties` and `application-prod.properties` hold the differences, and `spring.profiles.active=dev` picks one (the common `application.properties` always loads too). Day 53's `@Profile` beans switch on the same way.

<!-- intro: d25_t1_s5 -->
Reading many settings with `@Value` (Day 54) gets messy. **`@ConfigurationProperties(prefix = "app.mail")`** binds a whole group of settings into one typed class (a record works well), and adding `@Validated` with validation annotations (Day 56) makes the app refuse to start with a missing or invalid setting, which is far better than failing at 3 am.

<!-- intro: d25_t1_s6 -->
A setting can come from many places, and the higher ones win: command-line arguments, then **environment variables** (`SERVER_PORT=9090`), then profile files, then `application.properties`, then defaults. That's how servers and Docker (Day 73) inject real passwords without them ever being in your Git repository.

<!-- intro: d25_t1_s7 -->
Stop using `System.out.println` in real apps. A **logger** (SLF4J, built in) adds the time, level and class to every line, and you choose how much to see per package: `log.info("Order {} placed", id)`. Levels from noisiest to quietest: TRACE, DEBUG, INFO, WARN, ERROR. On servers, logs are often written as JSON so tools can search them, with a correlation id (MDC) to follow one request through every line.

<!-- intro: d25_t1_s1 -->
**Actuator** adds ready-made monitoring endpoints: `/actuator/health` (is the app and its database OK? Load balancers and Kubernetes ask this constantly), `/actuator/metrics`, `/actuator/info`. Add the starter, and choose which endpoints to expose; never expose them all publicly.

<!-- intro: d25_t1_s2 -->
A custom **`HealthIndicator`** adds your own checks to `/actuator/health`: "can we reach the payment service?". If a dependency is down, health reports DOWN, and the platform can stop sending users to this instance.

<!-- intro: d25_t1_s3 -->
**Micrometer** records numbers about your app (counters like "orders placed", timers like "how long checkout takes", gauges like "items in the queue"), and tools like **Prometheus** and **Grafana** collect them into dashboards and alerts. It's how teams notice problems before users report them.

<!-- intro: d25_t1_s8 -->
Spring Boot 3 changed some package names from `javax.*` to **`jakarta.*`** (old tutorials still say `javax.persistence`), and can compile apps to native executables with GraalVM for very fast startup. The first matters every time you copy code from an older article.

## 📝 Day 63 Recap

1. File for dev-only settings? → **application-dev.properties**
2. Activate a profile? → **spring.profiles.active=dev (or an environment variable)**
3. Bind a group of settings to a typed class? → **@ConfigurationProperties(prefix = "...")**
4. Make the app refuse to start with bad config? → **@Validated plus validation annotations on the properties class**
5. Which wins: an environment variable or application.properties? → **the environment variable**
6. Why use a logger instead of System.out? → **timestamps, levels, per-package control and structured output**
7. Log levels from noisiest to quietest? → **TRACE, DEBUG, INFO, WARN, ERROR**
8. Endpoint load balancers check? → **/actuator/health**
9. What does Micrometer do? → **records metrics (counters, timers, gauges) for tools like Prometheus**
10. Old javax.persistence in Spring Boot 3 becomes? → **jakarta.persistence**

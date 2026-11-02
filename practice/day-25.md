Today is about running Spring Boot in production: a custom **health check**, **type-safe configuration** that fails fast when it's wrong, **profiles**, Micrometer **metrics**, and a **correlation id** in every log line.

**Dependencies to add:** Spring Boot Actuator (`spring-boot-starter-actuator`), plus Spring Web and Validation from Day 20. On Boot 4, `HealthIndicator` and `Health` moved to `org.springframework.boot.health.contributor` (Boot 3: `org.springframework.boot.actuate.health`).

<!-- exercise: d25_e1 | Medium | A custom `HealthIndicator` for a downstream dependency -->
**Concepts:** `HealthIndicator` · `Health.up()` / `down()` with details · component name derived from the bean name · `/actuator/health` returns **503** when DOWN · `management.endpoint.health.show-details` · `@SpringBootTest` + `@AutoConfigureMockMvc` + `@MockitoBean`

**Task.** Your service depends on a payment gateway. Write `PaymentGatewayHealthIndicator` that asks a `GatewayProbe` for the latency:

- Latency ≤ 500 ms → **UP** with detail `latencyMs`.
- Latency > 500 ms → **DOWN** with detail `reason: "latency 900 ms over 500 ms"`.
- The probe throws → **DOWN** with the exception as an error detail.

**Starter code**

```java
// src/main/java/com/example/practice/d25/health/GatewayProbe.java
package com.example.practice.d25.health;

public interface GatewayProbe {
    long latencyMs();   // pings the gateway, may throw
}
```

```java
// src/main/java/com/example/practice/d25/health/SimulatedGatewayProbe.java
package com.example.practice.d25.health;

import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Component;

@Component   // stand-in so the app starts; a real one would call the gateway's /ping with a short timeout
public class SimulatedGatewayProbe implements GatewayProbe {
    public long latencyMs() { return ThreadLocalRandom.current().nextLong(50, 200); }
}
```

```java
// src/main/java/com/example/practice/d25/health/PaymentGatewayHealthIndicator.java
package com.example.practice.d25.health;

import org.springframework.stereotype.Component;

@Component
public class PaymentGatewayHealthIndicator /* TODO: implements HealthIndicator */ {
    private final GatewayProbe probe;

    public PaymentGatewayHealthIndicator(GatewayProbe probe) { this.probe = probe; }

    // TODO: health() — UP with latencyMs, DOWN with reason, DOWN with the exception
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d25/health/GatewayHealthTest.java
package com.example.practice.d25.health;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = GatewayHealthTest.App.class,
        properties = "management.endpoint.health.show-details=always")
@AutoConfigureMockMvc
class GatewayHealthTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    static class App {
        @Bean   // same bean name component scanning would give it in a real app
        PaymentGatewayHealthIndicator paymentGatewayHealthIndicator(GatewayProbe probe) {
            return new PaymentGatewayHealthIndicator(probe);
        }
    }

    @Autowired MockMvc mvc;
    @MockitoBean GatewayProbe probe;

    @Test
    void fastGatewayIsUpWithLatencyDetail() throws Exception {
        when(probe.latencyMs()).thenReturn(120L);
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.paymentGateway.status").value("UP"))
                .andExpect(jsonPath("$.components.paymentGateway.details.latencyMs").value(120));
    }

    @Test
    void slowGatewayMakesTheServiceDown() throws Exception {
        when(probe.latencyMs()).thenReturn(900L);
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.components.paymentGateway.details.reason").value("latency 900 ms over 500 ms"));
    }

    @Test
    void probeFailureIsReportedAsDown() throws Exception {
        when(probe.latencyMs()).thenThrow(new IllegalStateException("connection refused"));
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.components.paymentGateway.status").value("DOWN"))
                .andExpect(jsonPath("$.components.paymentGateway.details.error").exists());
    }
}
```

**Expected result**

```text
GatewayHealthTest: 3 tests passed
```

<!-- hints -->
- The component's name in the JSON is the bean name minus the `HealthIndicator` suffix: `paymentGatewayHealthIndicator` → `paymentGateway`.
- `Health.up().withDetail("latencyMs", latency).build()`; `Health.down().withDetail("reason", "...").build()`; `Health.down(exception).build()` adds an `error` detail.
- Catch exceptions inside `health()` — a health check should **report** failure, not throw.
- Keep health checks cheap and time-bounded (they're polled every few seconds by load balancers and Kubernetes).
- 🚀 In Kubernetes, split `/actuator/health/liveness` (is the JVM stuck? restart it) from `/actuator/health/readiness` (can it take traffic?). A slow payment gateway should affect **readiness**, never liveness — otherwise every pod restarts at once.

<!-- solution -->
```java
// src/main/java/com/example/practice/d25/health/PaymentGatewayHealthIndicator.java
package com.example.practice.d25.health;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {
    private static final long MAX_LATENCY_MS = 500;
    private final GatewayProbe probe;

    public PaymentGatewayHealthIndicator(GatewayProbe probe) { this.probe = probe; }

    @Override
    public Health health() {
        try {
            long latency = probe.latencyMs();
            if (latency > MAX_LATENCY_MS) {
                return Health.down()
                        .withDetail("reason", "latency " + latency + " ms over " + MAX_LATENCY_MS + " ms")
                        .build();
            }
            return Health.up().withDetail("latencyMs", latency).build();
        } catch (RuntimeException e) {
            return Health.down(e).build();                      // adds an "error" detail
        }
    }
}
```

**Exposing Actuator safely.** By default only `health` is exposed over HTTP. Expose more with `management.endpoints.web.exposure.include=health,info,metrics,prometheus`, put the management port behind the internal network (`management.server.port=9090`), and never expose `env`, `heapdump` or `shutdown` publicly.

<!-- exercise: d25_e2 | Medium | Type-safe configuration with validation, and profiles -->
**Concepts:** `@ConfigurationProperties` on a record · nested properties · `Duration` binding (`750ms`, `2s`) · `@DefaultValue` · `@Validated` → startup fails on bad config · `@Profile` beans · testing configuration with `ApplicationContextRunner`

**Task.**

1. Bind `payments.*` into `PaymentProperties`: `provider` (required), `retries` (default 3, between 1 and 10), `currency` (default `INR`) and nested `timeouts.connect` / `timeouts.read` (`Duration`, defaults 2s and 5s). Invalid config must **stop the application from starting**.
2. In `NotifierConfig`, provide a `ConsoleNotifier` under the `dev` profile and an `SmsNotifier` otherwise.

**Starter code**

```java
// src/main/java/com/example/practice/d25/config/PaymentProperties.java
package com.example.practice.d25.config;

import java.time.Duration;

// TODO: @ConfigurationProperties("payments") + @Validated; defaults and constraints
public record PaymentProperties(String provider, int retries, String currency, Timeouts timeouts) {
    public record Timeouts(Duration connect, Duration read) { }
}
```

```java
// src/main/java/com/example/practice/d25/config/PaymentConfig.java
package com.example.practice.d25.config;

// TODO: enable PaymentProperties (this class is registered explicitly — no @Configuration needed)
public class PaymentConfig {
}
```

```java
// src/main/java/com/example/practice/d25/config/NotifierConfig.java
package com.example.practice.d25.config;

public class NotifierConfig {
    public interface Notifier { String channel(); }
    public static class ConsoleNotifier implements Notifier { public String channel() { return "console"; } }
    public static class SmsNotifier implements Notifier { public String channel() { return "sms"; } }

    // TODO: @Bean ConsoleNotifier for profile "dev", @Bean SmsNotifier for every other profile
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d25/config/ConfigurationTest.java
package com.example.practice.d25.config;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class ConfigurationTest {

    final ApplicationContextRunner payments = new ApplicationContextRunner().withUserConfiguration(PaymentConfig.class);
    final ApplicationContextRunner notifiers = new ApplicationContextRunner().withUserConfiguration(NotifierConfig.class);

    @Test
    void bindsWithDefaults() {
        payments.withPropertyValues("payments.provider=razorpay").run(ctx -> {
            PaymentProperties p = ctx.getBean(PaymentProperties.class);
            assertThat(p.provider()).isEqualTo("razorpay");
            assertThat(p.retries()).isEqualTo(3);
            assertThat(p.currency()).isEqualTo("INR");
            assertThat(p.timeouts().connect()).isEqualTo(Duration.ofSeconds(2));
            assertThat(p.timeouts().read()).isEqualTo(Duration.ofSeconds(5));
        });
    }

    @Test
    void bindsOverridesAndDurations() {
        payments.withPropertyValues("payments.provider=stripe", "payments.retries=5", "payments.timeouts.read=750ms")
                .run(ctx -> {
                    PaymentProperties p = ctx.getBean(PaymentProperties.class);
                    assertThat(p.retries()).isEqualTo(5);
                    assertThat(p.timeouts().read()).isEqualTo(Duration.ofMillis(750));
                });
    }

    @Test
    void missingProviderStopsStartup() {
        payments.run(ctx -> assertThat(ctx).hasFailed());
    }

    @Test
    void outOfRangeRetriesStopStartup() {
        payments.withPropertyValues("payments.provider=stripe", "payments.retries=50")
                .run(ctx -> assertThat(ctx).hasFailed());
    }

    @Test
    void devProfileUsesTheConsoleNotifier() {
        notifiers.withPropertyValues("spring.profiles.active=dev")
                .run(ctx -> assertThat(ctx.getBean(NotifierConfig.Notifier.class).channel()).isEqualTo("console"));
    }

    @Test
    void otherProfilesUseSms() {
        notifiers.withPropertyValues("spring.profiles.active=prod")
                .run(ctx -> assertThat(ctx.getBean(NotifierConfig.Notifier.class).channel()).isEqualTo("sms"));
    }
}
```

**Expected result**

```text
ConfigurationTest: 6 tests passed
```

<!-- hints -->
- Record binding uses the constructor: `@DefaultValue("3") @Min(1) @Max(10) int retries`, `@DefaultValue("INR") String currency`, `@NotBlank String provider`.
- For the nested record, `@DefaultValue Timeouts timeouts` (no value) makes Spring create it even when no `payments.timeouts.*` keys exist; give its components `@DefaultValue("2s")` and `@DefaultValue("5s")`.
- `@Validated` on the properties class makes binding run the Jakarta constraints — a bad value fails the context with a clear `BindValidationException` message at startup instead of a `NullPointerException` at 3 a.m.
- `@EnableConfigurationProperties(PaymentProperties.class)` on `PaymentConfig` registers the record as a bean. (In an app, `@ConfigurationPropertiesScan` on the main class finds them all.)
- `@Profile("dev")` and `@Profile("!dev")` on the two `@Bean` methods. Use profiles for **wiring** differences; use properties (`application-dev.yml`) for **values**.

<!-- solution -->
```java
// src/main/java/com/example/practice/d25/config/PaymentProperties.java
package com.example.practice.d25.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties("payments")
@Validated                                                       // bad config → startup fails
public record PaymentProperties(
        @NotBlank String provider,
        @DefaultValue("3") @Min(1) @Max(10) int retries,
        @DefaultValue("INR") String currency,
        @DefaultValue Timeouts timeouts) {

    public record Timeouts(@DefaultValue("2s") Duration connect, @DefaultValue("5s") Duration read) { }
}
```

```java
// src/main/java/com/example/practice/d25/config/PaymentConfig.java
package com.example.practice.d25.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableConfigurationProperties(PaymentProperties.class)
public class PaymentConfig {
}
```

```java
// src/main/java/com/example/practice/d25/config/NotifierConfig.java
package com.example.practice.d25.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;

public class NotifierConfig {
    public interface Notifier { String channel(); }
    public static class ConsoleNotifier implements Notifier { public String channel() { return "console"; } }
    public static class SmsNotifier implements Notifier { public String channel() { return "sms"; } }

    @Bean
    @Profile("dev")
    Notifier consoleNotifier() { return new ConsoleNotifier(); }

    @Bean
    @Profile("!dev")
    Notifier smsNotifier() { return new SmsNotifier(); }
}
```

**Where values come from (highest wins):** command-line args → `SPRING_APPLICATION_JSON` → OS environment variables (`PAYMENTS_RETRIES=5` binds to `payments.retries` thanks to relaxed binding) → `application-{profile}.yml` → `application.yml` → `@DefaultValue`. Secrets come from the environment or a secrets manager — never from a committed YAML file.

<!-- exercise: d25_e3 | Medium | Micrometer metrics and a correlation-id filter -->
**Concepts:** `MeterRegistry` · `Counter` with tags · `Timer.record` · `Gauge` backed by an `AtomicInteger` · testing with `SimpleMeterRegistry` · `OncePerRequestFilter` · SLF4J **MDC** (put in, always clear in `finally`) · echoing `X-Correlation-Id`

**Task.**

1. `OrderMetrics`: count placed orders per `channel` tag (`orders.placed`), time order processing (`orders.processing`), and expose the number of pending orders as a gauge (`orders.pending`).
2. `CorrelationIdFilter`: use the incoming `X-Correlation-Id` header or generate a UUID, put it in the MDC under `correlationId`, return it in the response header, and **clear** the MDC afterwards.

**Starter code**

```java
// src/main/java/com/example/practice/d25/observability/OrderMetrics.java
package com.example.practice.d25.observability;

import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.atomic.AtomicInteger;

public class OrderMetrics {
    private final MeterRegistry registry;
    private final AtomicInteger pending = new AtomicInteger();

    public OrderMetrics(MeterRegistry registry) {
        this.registry = registry;
        // TODO: register the "orders.pending" gauge
    }

    public void orderPlaced(String channel) { }            // TODO: counter "orders.placed" tagged channel
    public void process(Runnable work) { work.run(); }     // TODO: time it with "orders.processing"
    public void enqueue() { }                               // TODO: pending + 1
    public void dequeue() { }                               // TODO: pending - 1
}
```

```java
// src/main/java/com/example/practice/d25/observability/CorrelationIdFilter.java
package com.example.practice.d25.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        chain.doFilter(request, response);   // TODO: read or generate the id, MDC put, response header, clear MDC
    }
}
```

```java
// src/main/java/com/example/practice/d25/observability/PingController.java
package com.example.practice.d25.observability;

import org.slf4j.MDC;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {
    @GetMapping("/api/ping")
    public String ping() { return String.valueOf(MDC.get(CorrelationIdFilter.MDC_KEY)); }   // what logs would see
}
```

**Given tests** (don't change them)

```java
// src/test/java/com/example/practice/d25/observability/OrderMetricsTest.java
package com.example.practice.d25.observability;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrderMetricsTest {

    final SimpleMeterRegistry registry = new SimpleMeterRegistry();
    final OrderMetrics metrics = new OrderMetrics(registry);

    @Test
    void countsOrdersPerChannel() {
        metrics.orderPlaced("web");
        metrics.orderPlaced("web");
        metrics.orderPlaced("app");
        assertThat(registry.get("orders.placed").tag("channel", "web").counter().count()).isEqualTo(2.0);
        assertThat(registry.get("orders.placed").tag("channel", "app").counter().count()).isEqualTo(1.0);
    }

    @Test
    void timesProcessing() {
        metrics.process(() -> { });
        metrics.process(() -> { });
        assertThat(registry.get("orders.processing").timer().count()).isEqualTo(2);
    }

    @Test
    void gaugeTracksPendingOrders() {
        metrics.enqueue();
        metrics.enqueue();
        metrics.enqueue();
        metrics.dequeue();
        assertThat(registry.get("orders.pending").gauge().value()).isEqualTo(2.0);
    }
}
```

```java
// src/test/java/com/example/practice/d25/observability/CorrelationIdFilterTest.java
package com.example.practice.d25.observability;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@WebMvcTest(PingController.class)
class CorrelationIdFilterTest {

    @Autowired MockMvc mvc;

    @Test
    void reusesTheIncomingId() throws Exception {
        mvc.perform(get("/api/ping").header("X-Correlation-Id", "abc-123"))
                .andExpect(header().string("X-Correlation-Id", "abc-123"))
                .andExpect(content().string("abc-123"));
    }

    @Test
    void generatesAnIdWhenMissing() throws Exception {
        MvcResult result = mvc.perform(get("/api/ping")).andReturn();
        String id = result.getResponse().getHeader("X-Correlation-Id");
        assertThat(id).matches("[0-9a-f-]{36}");
        assertThat(result.getResponse().getContentAsString()).isEqualTo(id);
    }

    @Test
    void mdcIsClearedAfterTheRequest() throws Exception {
        mvc.perform(get("/api/ping").header("X-Correlation-Id", "abc-123"));
        assertThat(MDC.get("correlationId")).isNull();
    }
}
```

**Expected result**

```text
OrderMetricsTest: 3 tests passed
CorrelationIdFilterTest: 3 tests passed
```

<!-- hints -->
- `registry.counter("orders.placed", "channel", channel).increment()` — the registry returns the same counter for the same name + tags.
- `registry.timer("orders.processing").record(work)`; `registry.gauge("orders.pending", pending)` registers a gauge that reads the `AtomicInteger` whenever it's scraped (keep a strong reference to it — gauges hold it weakly).
- Tag values must have **low cardinality**: a channel (web/app) is fine; a user id or order id would create millions of time series.
- Filter: `String id = Optional.ofNullable(request.getHeader(HEADER)).filter(s -> !s.isBlank()).orElseGet(() -> UUID.randomUUID().toString());` then `MDC.put`, `response.setHeader`, and `try { chain.doFilter(...) } finally { MDC.remove(MDC_KEY); }`.
- `@WebMvcTest` picks up `Filter` beans automatically, so the test exercises your filter without extra configuration.

<!-- solution -->
```java
// src/main/java/com/example/practice/d25/observability/OrderMetrics.java
package com.example.practice.d25.observability;

import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.atomic.AtomicInteger;

public class OrderMetrics {
    private final MeterRegistry registry;
    private final AtomicInteger pending = new AtomicInteger();

    public OrderMetrics(MeterRegistry registry) {
        this.registry = registry;
        registry.gauge("orders.pending", pending);                 // sampled on every scrape
    }

    public void orderPlaced(String channel) {
        registry.counter("orders.placed", "channel", channel).increment();   // one time series per channel
    }

    public void process(Runnable work) {
        registry.timer("orders.processing").record(work);          // count, total time, max (+ percentiles if enabled)
    }

    public void enqueue() { pending.incrementAndGet(); }
    public void dequeue() { pending.decrementAndGet(); }
}
```

```java
// src/main/java/com/example/practice/d25/observability/CorrelationIdFilter.java
package com.example.practice.d25.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String id = Optional.ofNullable(request.getHeader(HEADER))
                .filter(s -> !s.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());
        MDC.put(MDC_KEY, id);                                       // every log line on this thread gets it
        response.setHeader(HEADER, id);                             // clients can quote it in bug reports
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);                                    // pooled threads must not leak it
        }
    }
}
```

**Make it visible in logs:** add `%X{correlationId}` to the Logback pattern, or use Spring Boot's structured logging (`logging.structured.format.console=ecs`) which includes MDC fields as JSON. With Micrometer Tracing on the classpath, Spring already puts `traceId`/`spanId` into the MDC and propagates them across services — the same idea, standardised.

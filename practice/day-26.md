Phase 3 review in code: trace a request through filters, interceptors, the controller and exception handling; build a small production-style API with validation, `ProblemDetail` and **idempotency keys**; and finish with Spring's caching annotations — another proxy-based feature with the same self-invocation trap.

**Dependencies:** Spring Web + Validation + the web test starter (Day 20). Caching needs nothing extra — `spring-context` includes `@EnableCaching` and a simple in-memory cache manager.

<!-- exercise: d26_e1 | Medium | Trace a request: filter → interceptor → controller → advice -->
**Concepts:** servlet `Filter` (`OncePerRequestFilter`) wraps everything · `HandlerInterceptor` `preHandle` / `postHandle` / `afterCompletion` · `WebMvcConfigurer.addInterceptors` with path patterns · `@RestControllerAdvice` · `postHandle` is skipped when the handler throws · `preHandle` returning `false` short-circuits

**Task.** Record every step into `RequestTrace` so the given test can assert the exact order for a normal request, a failing request, and a request the interceptor **blocks** (header `X-Block: true` → 403, controller never runs). Only `/api/trace/**` should be traced.

**Starter code**

```java
// src/main/java/com/example/practice/d26/trace/RequestTrace.java
package com.example.practice.d26.trace;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Shared event log. Declared as a @Bean in TraceWebConfig (so every web test that loads the tracing pieces gets it). */
public class RequestTrace {
    private final List<String> events = new CopyOnWriteArrayList<>();
    public void add(String event) { events.add(event); }
    public List<String> events() { return List.copyOf(events); }
    public void clear() { events.clear(); }
}
```

```java
// src/main/java/com/example/practice/d26/trace/TraceController.java
package com.example.practice.d26.trace;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TraceController {
    private final RequestTrace trace;
    public TraceController(RequestTrace trace) { this.trace = trace; }

    @GetMapping("/api/trace/ok")
    public String ok() { trace.add("controller"); return "ok"; }

    @GetMapping("/api/trace/boom")
    public String boom() { trace.add("controller"); throw new IllegalStateException("boom"); }
}
```

```java
// src/main/java/com/example/practice/d26/trace/TracingFilter.java
package com.example.practice.d26.trace;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TracingFilter extends OncePerRequestFilter {
    private final RequestTrace trace;
    public TracingFilter(RequestTrace trace) { this.trace = trace; }

    // TODO: only filter /api/trace/** (override shouldNotFilter)

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        chain.doFilter(req, res);   // TODO: "filter:before" … "filter:after" (after must run even on errors)
    }
}
```

```java
// src/main/java/com/example/practice/d26/trace/TracingInterceptor.java
package com.example.practice.d26.trace;

import org.springframework.web.servlet.HandlerInterceptor;

public class TracingInterceptor implements HandlerInterceptor {
    private final RequestTrace trace;
    public TracingInterceptor(RequestTrace trace) { this.trace = trace; }

    // TODO: preHandle → "interceptor:preHandle" (if header X-Block is "true": add "interceptor:blocked", send 403, return false)
    // TODO: postHandle → "interceptor:postHandle"; afterCompletion → "interceptor:afterCompletion"
}
```

```java
// src/main/java/com/example/practice/d26/trace/TraceWebConfig.java
package com.example.practice.d26.trace;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class TraceWebConfig implements WebMvcConfigurer {

    @Bean
    public RequestTrace requestTrace() { return new RequestTrace(); }

    // TODO: register a TracingInterceptor (using requestTrace()) for /api/trace/**
}
```

```java
// src/main/java/com/example/practice/d26/trace/TraceAdvice.java
package com.example.practice.d26.trace;

// TODO: @RestControllerAdvice for TraceController only; IllegalStateException → add "advice", return 500 with body "handled"
public class TraceAdvice {
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d26/trace/RequestLifecycleTest.java
package com.example.practice.d26.trace;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TraceController.class)
class RequestLifecycleTest {

    @Autowired MockMvc mvc;
    @Autowired RequestTrace trace;

    @BeforeEach
    void reset() { trace.clear(); }

    @Test
    void normalRequest() throws Exception {
        mvc.perform(get("/api/trace/ok")).andExpect(status().isOk());
        assertThat(trace.events()).containsExactly(
                "filter:before", "interceptor:preHandle", "controller",
                "interceptor:postHandle", "interceptor:afterCompletion", "filter:after");
    }

    @Test
    void failingRequestSkipsPostHandle() throws Exception {
        mvc.perform(get("/api/trace/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("handled"));
        assertThat(trace.events()).containsExactly(
                "filter:before", "interceptor:preHandle", "controller",
                "advice", "interceptor:afterCompletion", "filter:after");
    }

    @Test
    void interceptorCanBlockTheRequest() throws Exception {
        mvc.perform(get("/api/trace/ok").header("X-Block", "true")).andExpect(status().isForbidden());
        assertThat(trace.events()).containsExactly(
                "filter:before", "interceptor:preHandle", "interceptor:blocked", "filter:after");
    }
}
```

**Expected result**

```text
RequestLifecycleTest: 3 tests passed
```

<!-- hints -->
- Filter: `trace.add("filter:before"); try { chain.doFilter(req, res); } finally { trace.add("filter:after"); }`. `shouldNotFilter(request)` returns `!request.getRequestURI().startsWith("/api/trace/")`.
- Interceptor `preHandle(request, response, handler)` returns `true` to continue. To block: `response.sendError(403)` (or `setStatus(403)`) and return `false` — then neither the controller, `postHandle` nor `afterCompletion` runs.
- `registry.addInterceptor(new TracingInterceptor(trace)).addPathPatterns("/api/trace/**");`
- `@RestControllerAdvice(assignableTypes = TraceController.class)` keeps the advice from catching other controllers' exceptions; add `@Order(Ordered.HIGHEST_PRECEDENCE)` so it also wins over any project-wide advice (like Day 20's). `@ExceptionHandler(IllegalStateException.class) @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)`.
- Order to remember: **Filter** (servlet level, sees every request, even static files) → `DispatcherServlet` → **HandlerMapping** finds the controller → **interceptor** `preHandle` → **controller** → `postHandle` (only on success) → exception resolvers / **advice** → `afterCompletion` (always, once `preHandle` returned true).

<!-- solution -->
```java
// src/main/java/com/example/practice/d26/trace/TracingFilter.java
package com.example.practice.d26.trace;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TracingFilter extends OncePerRequestFilter {
    private final RequestTrace trace;
    public TracingFilter(RequestTrace trace) { this.trace = trace; }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/trace/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        trace.add("filter:before");
        try {
            chain.doFilter(req, res);                      // the whole Spring MVC pipeline runs in here
        } finally {
            trace.add("filter:after");
        }
    }
}
```

```java
// src/main/java/com/example/practice/d26/trace/TracingInterceptor.java
package com.example.practice.d26.trace;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

public class TracingInterceptor implements HandlerInterceptor {
    private final RequestTrace trace;
    public TracingInterceptor(RequestTrace trace) { this.trace = trace; }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        trace.add("interceptor:preHandle");
        if ("true".equals(request.getHeader("X-Block"))) {
            trace.add("interceptor:blocked");
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return false;                                  // stop: no controller, no postHandle/afterCompletion
        }
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView mav) {
        trace.add("interceptor:postHandle");               // only after a successful handler
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        trace.add("interceptor:afterCompletion");          // always, like a finally block
    }
}
```

```java
// src/main/java/com/example/practice/d26/trace/TraceWebConfig.java
package com.example.practice.d26.trace;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class TraceWebConfig implements WebMvcConfigurer {

    @Bean
    public RequestTrace requestTrace() { return new RequestTrace(); }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // calling requestTrace() on a @Configuration class returns the singleton bean, not a new object
        registry.addInterceptor(new TracingInterceptor(requestTrace())).addPathPatterns("/api/trace/**");
    }
}
```

```java
// src/main/java/com/example/practice/d26/trace/TraceAdvice.java
package com.example.practice.d26.trace;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = TraceController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)                     // scoped advice wins over any global handler
public class TraceAdvice {
    private final RequestTrace trace;
    public TraceAdvice(RequestTrace trace) { this.trace = trace; }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String handle(IllegalStateException e) {
        trace.add("advice");
        return "handled";
    }
}
```

**Filter or interceptor?** Filters: cross-cutting concerns for **every** request, before Spring MVC — security (Spring Security is a filter chain), CORS, correlation ids, compression, request logging. Interceptors: logic that needs the **chosen handler** — per-endpoint auth checks, locale, timing of controller methods. Both beat sprinkling the same code into every controller.

<!-- exercise: d26_e2 | Hard | Capstone: an orders API with validation and idempotency keys -->
**Concepts:** `@RequestHeader` · nested validation (`List<@Valid Line>`) · 201 vs 200 for a replayed request · idempotency key semantics (same key + same body = same result; same key + different body = 422) · per-controller `@RestControllerAdvice` returning `ProblemDetail`

**Task.** Clients retry `POST /api/orders` when the network drops, so every request carries an `Idempotency-Key` header:

- First request with a key → create the order, **201**.
- Same key **and** same body → return the **same** order with **200** and header `Idempotent-Replayed: true` (no second order).
- Same key with a **different** body → **422** `ProblemDetail` (`title`: `"Idempotency key reused with a different request"`).
- Missing key → **400**. Invalid body → **400** `ProblemDetail` titled `"Validation failed"`.
- `GET /api/orders/{id}` → 200, or **404** `ProblemDetail`.

**Starter code**

```java
// src/main/java/com/example/practice/d26/orders/CreateOrderRequest.java
package com.example.practice.d26.orders;

import java.util.List;

// TODO: customer not blank; lines not empty and each line valid (sku not blank, qty >= 1)
public record CreateOrderRequest(String customer, List<Line> lines) {
    public record Line(String sku, int qty) { }
}
```

```java
// src/main/java/com/example/practice/d26/orders/OrderResponse.java
package com.example.practice.d26.orders;

public record OrderResponse(long id, String customer, int totalItems, String status) { }
```

```java
// src/main/java/com/example/practice/d26/orders/OrderService.java
package com.example.practice.d26.orders;

import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    public record Result(OrderResponse order, boolean replayed) { }
    public static class IdempotencyConflictException extends RuntimeException {
        public IdempotencyConflictException(String key) { super("key " + key + " was used with a different request"); }
    }

    // TODO: remember key → (request, order) and id → order
    public synchronized Result create(String key, CreateOrderRequest request) {
        return null; // TODO: new order, replay, or conflict
    }

    public Optional<OrderResponse> find(long id) { return Optional.empty(); }   // TODO
}
```

```java
// src/main/java/com/example/practice/d26/orders/OrderController.java
package com.example.practice.d26.orders;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {
    // TODO: POST /api/orders (Idempotency-Key header, @Valid body) and GET /api/orders/{id}
}
```

```java
// src/main/java/com/example/practice/d26/orders/OrderErrors.java
package com.example.practice.d26.orders;

// TODO: @RestControllerAdvice(assignableTypes = OrderController.class) mapping validation → 400,
//       IdempotencyConflictException → 422, NotFound → 404 — all as ProblemDetail
public class OrderErrors {
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(long id) { super("No order with id " + id); }
    }
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d26/orders/OrderApiTest.java
package com.example.practice.d26.orders;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import(OrderService.class)
class OrderApiTest {

    static final String BODY = "{\"customer\":\"asha\",\"lines\":[{\"sku\":\"PEN\",\"qty\":2},{\"sku\":\"BOOK\",\"qty\":1}]}";

    @Autowired MockMvc mvc;

    ResultActions postOrder(String key, String body) throws Exception {
        var request = post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body);
        if (key != null) request.header("Idempotency-Key", key);
        return mvc.perform(request);
    }

    @Test
    void firstRequestCreatesTheOrder() throws Exception {
        postOrder("k-1", BODY)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalItems").value(3))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    void retryWithTheSameKeyReturnsTheSameOrder() throws Exception {
        String first = postOrder("k-2", BODY).andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(first, "$.id");
        postOrder("k-2", BODY)
                .andExpect(status().isOk())
                .andExpect(header().string("Idempotent-Replayed", "true"))
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void sameKeyWithADifferentBodyIs422() throws Exception {
        postOrder("k-3", BODY).andExpect(status().isCreated());
        postOrder("k-3", BODY.replace("\"qty\":2", "\"qty\":5"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.title").value("Idempotency key reused with a different request"));
    }

    @Test
    void missingKeyIs400() throws Exception {
        postOrder(null, BODY).andExpect(status().isBadRequest());
    }

    @Test
    void invalidBodyIs400ProblemDetail() throws Exception {
        postOrder("k-4", "{\"customer\":\"\",\"lines\":[{\"sku\":\"PEN\",\"qty\":0}]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation failed"));
    }

    @Test
    void unknownOrderIs404() throws Exception {
        mvc.perform(get("/api/orders/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No order with id 9999"));
    }
}
```

**Expected result**

```text
OrderApiTest: 6 tests passed
```

<!-- hints -->
- Validation: `@NotBlank String customer, @NotEmpty List<@Valid Line> lines` and inside `Line`: `@NotBlank String sku, @Min(1) int qty`.
- Records have value-based `equals`, so "same body" is simply `stored.request().equals(request)`.
- Controller: `@PostMapping public ResponseEntity<OrderResponse> create(@RequestHeader("Idempotency-Key") String key, @Valid @RequestBody CreateOrderRequest request)` — a missing required header already produces 400 (`MissingRequestHeaderException`).
- For the replay: `ResponseEntity.ok().header("Idempotent-Replayed", "true").body(result.order())`; for a new order `ResponseEntity.status(HttpStatus.CREATED).body(...)`.
- 422 is `HttpStatus.UNPROCESSABLE_CONTENT` in Spring 7 (`UNPROCESSABLE_ENTITY` in Spring 6).
- 🚀 In production the key → response mapping lives in Redis or a DB table with a unique constraint and a TTL (e.g. 24 h), stored in the same transaction as the order — exactly the pattern Stripe's API uses.

<!-- solution -->
```java
// src/main/java/com/example/practice/d26/orders/CreateOrderRequest.java
package com.example.practice.d26.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateOrderRequest(@NotBlank String customer, @NotEmpty List<@Valid Line> lines) {
    public record Line(@NotBlank String sku, @Min(1) int qty) { }
}
```

```java
// src/main/java/com/example/practice/d26/orders/OrderService.java
package com.example.practice.d26.orders;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    public record Result(OrderResponse order, boolean replayed) { }
    public static class IdempotencyConflictException extends RuntimeException {
        public IdempotencyConflictException(String key) { super("key " + key + " was used with a different request"); }
    }

    private record Stored(CreateOrderRequest request, OrderResponse order) { }

    private final Map<String, Stored> byKey = new HashMap<>();              // guarded by synchronized create()
    private final Map<Long, OrderResponse> byId = new ConcurrentHashMap<>();
    private final AtomicLong ids = new AtomicLong();

    public synchronized Result create(String key, CreateOrderRequest request) {
        Stored stored = byKey.get(key);
        if (stored != null) {
            if (!stored.request().equals(request)) throw new IdempotencyConflictException(key);
            return new Result(stored.order(), true);                       // replay: no new order
        }
        int items = request.lines().stream().mapToInt(CreateOrderRequest.Line::qty).sum();
        OrderResponse order = new OrderResponse(ids.incrementAndGet(), request.customer(), items, "CREATED");
        byKey.put(key, new Stored(request, order));
        byId.put(order.id(), order);
        return new Result(order, false);
    }

    public Optional<OrderResponse> find(long id) { return Optional.ofNullable(byId.get(id)); }
}
```

```java
// src/main/java/com/example/practice/d26/orders/OrderController.java
package com.example.practice.d26.orders;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orders;

    public OrderController(OrderService orders) { this.orders = orders; }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@RequestHeader("Idempotency-Key") String key,
                                                @Valid @RequestBody CreateOrderRequest request) {
        OrderService.Result result = orders.create(key, request);
        if (result.replayed()) {
            return ResponseEntity.ok().header("Idempotent-Replayed", "true").body(result.order());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(result.order());
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable long id) {
        return orders.find(id).orElseThrow(() -> new OrderErrors.OrderNotFoundException(id));
    }
}
```

```java
// src/main/java/com/example/practice/d26/orders/OrderErrors.java
package com.example.practice.d26.orders;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = OrderController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)                     // beats a project-wide @RestControllerAdvice
public class OrderErrors {
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(long id) { super("No order with id " + id); }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage()).sorted().toList());
        return pd;
    }

    @ExceptionHandler(OrderService.IdempotencyConflictException.class)
    public ProblemDetail conflict(OrderService.IdempotencyConflictException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage());
        pd.setTitle("Idempotency key reused with a different request");
        return pd;
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ProblemDetail notFound(OrderNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}
```

**Why idempotency matters.** Networks fail *after* the server did the work: the client never sees the 201 and retries. Without a key you charge the card twice. With it, retries are safe — the same idea as idempotent Kafka consumers (Day 38) and the payment-system design on Day 60.

<!-- exercise: d26_e3 | Medium | Caching with `@Cacheable`, `@CachePut` and `@CacheEvict` -->
**Concepts:** `@EnableCaching` + a `CacheManager` · `@Cacheable` with `unless` · `@CachePut` refreshes without skipping the method · `@CacheEvict(allEntries = true)` · cache keys from method arguments · self-invocation bypasses the cache proxy

**Task.** `PriceCatalog.price(sku)` is slow (it counts real "lookups"). Add caching so the test proves:

1. A second call for the same SKU is served from the cache.
2. `updatePrice` writes the new price **into** the cache.
3. `null` results (unknown SKUs) are **not** cached.
4. `clear()` empties the cache.
5. `priceViaThis` — which calls `price` on `this` — is **not** cached.

**Starter code**

```java
// src/main/java/com/example/practice/d26/cache/CacheConfig.java
package com.example.practice.d26.cache;

import org.springframework.context.annotation.Configuration;

@Configuration
public class CacheConfig {
    // TODO: enable caching and define a ConcurrentMapCacheManager with a "prices" cache
}
```

```java
// src/main/java/com/example/practice/d26/cache/PriceCatalog.java
package com.example.practice.d26.cache;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

@Service
public class PriceCatalog {
    private final Map<String, Integer> database = new ConcurrentHashMap<>();
    private final AtomicInteger lookups = new AtomicInteger();

    public PriceCatalog() { reset(); }

    // TODO: cache in "prices", but never cache null
    public Integer price(String sku) {
        lookups.incrementAndGet();                 // pretend this is a slow DB query
        return database.get(sku);
    }

    // TODO: always run, and put the returned price into the cache under the sku
    public Integer updatePrice(String sku, int price) {
        database.put(sku, price);
        return price;
    }

    // TODO: evict everything in "prices"
    public void clear() { }

    public Integer priceViaThis(String sku) { return price(sku); }   // self-invocation

    public int lookups() { return lookups.get(); }

    public void reset() {
        database.clear();
        database.put("SKU-1", 100);
        database.put("SKU-2", 250);
        lookups.set(0);
    }
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d26/cache/PriceCacheTest.java
package com.example.practice.d26.cache;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThat;

@SpringJUnitConfig({CacheConfig.class, PriceCatalog.class})
class PriceCacheTest {

    @Autowired PriceCatalog catalog;

    @BeforeEach
    void freshState() {
        catalog.clear();
        catalog.reset();
    }

    @Test
    void secondCallIsServedFromTheCache() {
        assertThat(catalog.price("SKU-1")).isEqualTo(100);
        assertThat(catalog.price("SKU-1")).isEqualTo(100);
        assertThat(catalog.lookups()).isEqualTo(1);
    }

    @Test
    void cachePutRefreshesTheEntry() {
        catalog.price("SKU-1");
        catalog.updatePrice("SKU-1", 120);
        assertThat(catalog.price("SKU-1")).isEqualTo(120);
        assertThat(catalog.lookups()).isEqualTo(1);
    }

    @Test
    void nullResultsAreNotCached() {
        assertThat(catalog.price("NOPE")).isNull();
        assertThat(catalog.price("NOPE")).isNull();
        assertThat(catalog.lookups()).isEqualTo(2);
    }

    @Test
    void evictForcesAReload() {
        catalog.price("SKU-2");
        catalog.clear();
        catalog.price("SKU-2");
        assertThat(catalog.lookups()).isEqualTo(2);
    }

    @Test
    void selfInvocationBypassesTheCache() {
        catalog.priceViaThis("SKU-1");
        catalog.priceViaThis("SKU-1");
        assertThat(catalog.lookups()).isEqualTo(2);
    }
}
```

**Expected result**

```text
PriceCacheTest: 5 tests passed
```

<!-- hints -->
- `@Configuration @EnableCaching` with `@Bean CacheManager cacheManager() { return new ConcurrentMapCacheManager("prices"); }`.
- `@Cacheable(value = "prices", unless = "#result == null")` — the key defaults to the method arguments (here: the sku).
- `@CachePut(value = "prices", key = "#sku")` always runs the method and stores its return value — use it for updates. (The `#sku` name needs `-parameters`, which the Spring Boot Maven plugin enables; `#p0` works everywhere.)
- `@CacheEvict(value = "prices", allEntries = true)` on `clear()`.
- `priceViaThis` → `this.price(...)` never goes through the caching proxy, exactly like `@Transactional` and your audit aspect.

<!-- solution -->
```java
// src/main/java/com/example/practice/d26/cache/CacheConfig.java
package com.example.practice.d26.cache;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching                                            // creates proxies for @Cacheable beans
public class CacheConfig {

    @Bean
    CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("prices");   // in-memory; swap for Redis/Caffeine in production
    }
}
```

```java
// src/main/java/com/example/practice/d26/cache/PriceCatalog.java
package com.example.practice.d26.cache;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class PriceCatalog {
    private final Map<String, Integer> database = new ConcurrentHashMap<>();
    private final AtomicInteger lookups = new AtomicInteger();

    public PriceCatalog() { reset(); }

    @Cacheable(value = "prices", unless = "#result == null")      // key = sku
    public Integer price(String sku) {
        lookups.incrementAndGet();
        return database.get(sku);
    }

    @CachePut(value = "prices", key = "#p0")                       // always runs, then caches the result
    public Integer updatePrice(String sku, int price) {
        database.put(sku, price);
        return price;
    }

    @CacheEvict(value = "prices", allEntries = true)
    public void clear() { }

    public Integer priceViaThis(String sku) { return price(sku); }   // bypasses the proxy

    public int lookups() { return lookups.get(); }

    public void reset() {
        database.clear();
        database.put("SKU-1", 100);
        database.put("SKU-2", 250);
        lookups.set(0);
    }
}
```

**From here to production.** Add `spring-boot-starter-cache` plus Caffeine (`spring.cache.caffeine.spec=maximumSize=10000,expireAfterWrite=10m`) for a local cache, or `spring-boot-starter-data-redis` for a shared one across instances. Cache **DTOs**, not JPA entities; always set a TTL; and remember cache-aside's stale-read race (Day 55). That closes Phase 3 — you've now written and tested every Spring concept from Days 19–25.

From today the exercises live in a **Spring Boot project** instead of single files. Each one gives you starter classes and a ready-made **JUnit test**; you're done when the test passes.

**One-time setup:** go to [start.spring.io](https://start.spring.io) → Maven, Java 21, Spring Boot 4.0.x, group `com.example`, artifact `practice` (package `com.example.practice`) → dependencies for today: none needed beyond the default, plus **AspectJ** for exercise 3 (`spring-boot-starter-aspectj`; on Boot 3.x it's called `spring-boot-starter-aop`). Open it in IntelliJ or VS Code, put each file at the path in its first comment line, and run the test class (or `./mvnw test`). You'll add more dependencies as later days need them.

<!-- exercise: d19_e1 | Easy | Constructor injection, `@Primary` and `@Qualifier` -->
**Concepts:** stereotype annotations (`@Component`, `@Service`) · constructor injection · resolving two beans of the same type with `@Primary` and `@Qualifier` · injecting every implementation as a `List` · singleton scope

**Task.** Three classes implement `MessageSender`: email, SMS and push. Make the given test pass:

- `EmailSender` is the default sender — mark it `@Primary`.
- `SmsSender` is registered under the bean name `"sms"`.
- `NotificationService` receives, **through its constructor**: the default sender, the SMS sender (via `@Qualifier("sms")`), and a `List<MessageSender>` of all senders.

**Starter code**

```java
// src/main/java/com/example/practice/d19/di/MessageSender.java
package com.example.practice.d19.di;

public interface MessageSender {
    String channel();

    default String send(String to, String message) {
        return channel() + " to " + to + ": " + message;
    }
}
```

```java
// src/main/java/com/example/practice/d19/di/Senders.java
package com.example.practice.d19.di;

// TODO: make these Spring beans; EmailSender is the default, SmsSender is named "sms"
class EmailSender implements MessageSender {
    public String channel() { return "EMAIL"; }
}

class SmsSender implements MessageSender {
    public String channel() { return "SMS"; }
}

class PushSender implements MessageSender {
    public String channel() { return "PUSH"; }
}
```

```java
// src/main/java/com/example/practice/d19/di/NotificationService.java
package com.example.practice.d19.di;

import java.util.List;

// TODO: make this a @Service with constructor injection
public class NotificationService {

    public String notifyDefault(String to, String message) { return null; }   // TODO: default sender
    public String notifySms(String to, String message) { return null; }       // TODO: the "sms" sender
    public List<String> channels() { return List.of(); }                      // TODO: every sender's channel, sorted
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d19/di/NotificationServiceTest.java
package com.example.practice.d19.di;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThat;

@SpringJUnitConfig({EmailSender.class, SmsSender.class, PushSender.class, NotificationService.class})
class NotificationServiceTest {

    @Autowired NotificationService service;
    @Autowired ApplicationContext context;

    @Test
    void primarySenderIsUsedByDefault() {
        assertThat(service.notifyDefault("asha", "hi")).isEqualTo("EMAIL to asha: hi");
    }

    @Test
    void qualifierSelectsTheSmsSender() {
        assertThat(service.notifySms("asha", "otp 1234")).isEqualTo("SMS to asha: otp 1234");
    }

    @Test
    void listInjectionReceivesEverySender() {
        assertThat(service.channels()).containsExactly("EMAIL", "PUSH", "SMS");
    }

    @Test
    void beansAreSingletonsByDefault() {
        assertThat(context.getBean(NotificationService.class)).isSameAs(service);
    }
}
```

**Expected result**

```text
NotificationServiceTest: 4 tests passed
```

<!-- hints -->
- Without `@Primary`, injecting a plain `MessageSender` fails with `NoUniqueBeanDefinitionException: expected single matching bean but found 3`.
- `@Component("sms")` names the bean; `@Qualifier("sms")` on the constructor parameter picks it by that name.
- A class with a **single constructor** needs no `@Autowired` — Spring uses it automatically.
- `List<MessageSender>` (or `Map<String, MessageSender>` keyed by bean name) injects **every** bean of that type — the basis of the strategy pattern in Spring.
- `@SpringJUnitConfig({...})` builds a small context from just these classes — fast, and no component scanning.

<!-- solution -->
```java
// src/main/java/com/example/practice/d19/di/Senders.java
package com.example.practice.d19.di;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary                                       // wins when a single MessageSender is requested
class EmailSender implements MessageSender {
    public String channel() { return "EMAIL"; }
}

@Component("sms")                              // bean name used by @Qualifier("sms")
class SmsSender implements MessageSender {
    public String channel() { return "SMS"; }
}

@Component
class PushSender implements MessageSender {
    public String channel() { return "PUSH"; }
}
```

```java
// src/main/java/com/example/practice/d19/di/NotificationService.java
package com.example.practice.d19.di;

import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final MessageSender defaultSender;
    private final MessageSender smsSender;
    private final List<MessageSender> allSenders;

    // single constructor → Spring injects it; fields can be final
    public NotificationService(MessageSender defaultSender,
                               @Qualifier("sms") MessageSender smsSender,
                               List<MessageSender> allSenders) {
        this.defaultSender = defaultSender;
        this.smsSender = smsSender;
        this.allSenders = allSenders;
    }

    public String notifyDefault(String to, String message) { return defaultSender.send(to, message); }

    public String notifySms(String to, String message) { return smsSender.send(to, message); }

    public List<String> channels() {
        return allSenders.stream().map(MessageSender::channel).sorted().toList();
    }
}
```

**Why constructor injection.** Dependencies are explicit and `final`, the object can't exist half-wired, unit tests can call `new NotificationService(...)` with fakes, and circular dependencies fail fast at startup instead of hiding. Field injection (`@Autowired` on a private field) hides all of that.

<!-- exercise: d19_e2 | Medium | Bean lifecycle and prototype scope -->
**Concepts:** lifecycle order — constructor → `@PostConstruct` → `afterPropertiesSet()` → … → `@PreDestroy` → `destroy()` · singleton vs `prototype` scope · prototype injected into a singleton is created **once** · `ObjectProvider` for a fresh instance · the container never destroys prototypes

**Task.** Complete the four classes so the test passes:

- `ConnectionPool` (singleton) records every lifecycle step in the shared `LifecycleLog`, using **both** the annotations and the `InitializingBean`/`DisposableBean` interfaces.
- `ShoppingCart` is a **prototype** with an id from a static counter; its `@PreDestroy` writes to the log (and should never run).
- `CheckoutService` (singleton) gets one `ShoppingCart` injected directly **and** an `ObjectProvider<ShoppingCart>`.

**Starter code**

```java
// src/main/java/com/example/practice/d19/lifecycle/LifecycleLog.java
package com.example.practice.d19.lifecycle;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class LifecycleLog {
    private final List<String> events = Collections.synchronizedList(new ArrayList<>());
    public void add(String event) { events.add(event); }
    public List<String> events() { return List.copyOf(events); }
}
```

```java
// src/main/java/com/example/practice/d19/lifecycle/ConnectionPool.java
package com.example.practice.d19.lifecycle;

import org.springframework.stereotype.Component;

@Component
public class ConnectionPool /* TODO: implements InitializingBean, DisposableBean */ {
    private final LifecycleLog log;

    public ConnectionPool(LifecycleLog log) {
        this.log = log;
        // TODO: log "ConnectionPool: constructor"
    }

    // TODO: @PostConstruct  → "ConnectionPool: @PostConstruct"
    // TODO: afterPropertiesSet → "ConnectionPool: afterPropertiesSet"
    // TODO: @PreDestroy     → "ConnectionPool: @PreDestroy"
    // TODO: destroy         → "ConnectionPool: destroy"
}
```

```java
// src/main/java/com/example/practice/d19/lifecycle/ShoppingCart.java
package com.example.practice.d19.lifecycle;

import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component   // TODO: prototype scope
public class ShoppingCart {
    private static final AtomicInteger NEXT_ID = new AtomicInteger();
    private final int id = NEXT_ID.incrementAndGet();
    private final LifecycleLog log;

    public ShoppingCart(LifecycleLog log) { this.log = log; }

    public int id() { return id; }

    // TODO: @PreDestroy → log "ShoppingCart: @PreDestroy"
}
```

```java
// src/main/java/com/example/practice/d19/lifecycle/CheckoutService.java
package com.example.practice.d19.lifecycle;

import org.springframework.stereotype.Service;

@Service
public class CheckoutService {
    // TODO: constructor-inject ShoppingCart and ObjectProvider<ShoppingCart>

    public ShoppingCart injectedCart() { return null; }   // TODO: the directly injected cart
    public ShoppingCart freshCart() { return null; }      // TODO: a new cart from the provider
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d19/lifecycle/LifecycleTest.java
package com.example.practice.d19.lifecycle;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

class LifecycleTest {
    AnnotationConfigApplicationContext ctx;

    @BeforeEach
    void start() {
        ctx = new AnnotationConfigApplicationContext(LifecycleLog.class, ConnectionPool.class, ShoppingCart.class, CheckoutService.class);
    }

    @AfterEach
    void stop() {
        if (ctx.isActive()) ctx.close();
    }

    @Test
    void singletonCallbacksRunInOrder() {
        LifecycleLog log = ctx.getBean(LifecycleLog.class);
        ctx.close();
        assertThat(log.events()).filteredOn(e -> e.startsWith("ConnectionPool")).containsExactly(
                "ConnectionPool: constructor",
                "ConnectionPool: @PostConstruct",
                "ConnectionPool: afterPropertiesSet",
                "ConnectionPool: @PreDestroy",
                "ConnectionPool: destroy");
    }

    @Test
    void prototypeGivesANewInstanceEveryTime() {
        assertThat(ctx.getBean(ShoppingCart.class)).isNotSameAs(ctx.getBean(ShoppingCart.class));
        assertThat(ctx.getBean(ConnectionPool.class)).isSameAs(ctx.getBean(ConnectionPool.class));
    }

    @Test
    void prototypeInjectedIntoSingletonIsCreatedOnce() {
        CheckoutService checkout = ctx.getBean(CheckoutService.class);
        assertThat(checkout.injectedCart()).isSameAs(checkout.injectedCart());
    }

    @Test
    void objectProviderReturnsAFreshPrototype() {
        CheckoutService checkout = ctx.getBean(CheckoutService.class);
        ShoppingCart first = checkout.freshCart(), second = checkout.freshCart();
        assertThat(first.id()).isNotEqualTo(second.id());
        assertThat(first).isNotSameAs(checkout.injectedCart());
    }

    @Test
    void containerNeverDestroysPrototypes() {
        LifecycleLog log = ctx.getBean(LifecycleLog.class);
        ctx.getBean(ShoppingCart.class);
        ctx.close();
        assertThat(log.events()).doesNotContain("ShoppingCart: @PreDestroy");
    }
}
```

**Expected result**

```text
LifecycleTest: 5 tests passed
```

<!-- hints -->
- `@PostConstruct` and `@PreDestroy` come from `jakarta.annotation` (Spring Boot 3+; it was `javax.annotation` before).
- Order on startup: constructor → dependency injection → `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → custom `initMethod`. Shutdown: `@PreDestroy` → `DisposableBean.destroy()` → custom `destroyMethod`.
- `@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)` (or `@Scope("prototype")`) on `ShoppingCart`.
- A singleton is built once, so a prototype injected into its constructor is resolved **once**. To get a new one per call, inject `ObjectProvider<ShoppingCart>` and call `getObject()` (or use `@Lookup`).
- For prototypes, Spring creates the bean and hands it over — it doesn't track it, so destruction callbacks never run. Clean up yourself.

<!-- solution -->
```java
// src/main/java/com/example/practice/d19/lifecycle/ConnectionPool.java
package com.example.practice.d19.lifecycle;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

@Component
public class ConnectionPool implements InitializingBean, DisposableBean {
    private final LifecycleLog log;

    public ConnectionPool(LifecycleLog log) {
        this.log = log;
        log.add("ConnectionPool: constructor");
    }

    @PostConstruct
    void open() { log.add("ConnectionPool: @PostConstruct"); }            // dependencies are ready here

    @Override
    public void afterPropertiesSet() { log.add("ConnectionPool: afterPropertiesSet"); }

    @PreDestroy
    void close() { log.add("ConnectionPool: @PreDestroy"); }              // on context shutdown

    @Override
    public void destroy() { log.add("ConnectionPool: destroy"); }
}
```

```java
// src/main/java/com/example/practice/d19/lifecycle/ShoppingCart.java
package com.example.practice.d19.lifecycle;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)                         // new instance per lookup
public class ShoppingCart {
    private static final AtomicInteger NEXT_ID = new AtomicInteger();
    private final int id = NEXT_ID.incrementAndGet();
    private final LifecycleLog log;

    public ShoppingCart(LifecycleLog log) { this.log = log; }

    public int id() { return id; }

    @PreDestroy
    void cleanup() { log.add("ShoppingCart: @PreDestroy"); }             // never called for prototypes
}
```

```java
// src/main/java/com/example/practice/d19/lifecycle/CheckoutService.java
package com.example.practice.d19.lifecycle;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class CheckoutService {
    private final ShoppingCart injectedCart;                  // resolved once, when this singleton is built
    private final ObjectProvider<ShoppingCart> carts;         // asks the container on every call

    public CheckoutService(ShoppingCart injectedCart, ObjectProvider<ShoppingCart> carts) {
        this.injectedCart = injectedCart;
        this.carts = carts;
    }

    public ShoppingCart injectedCart() { return injectedCart; }

    public ShoppingCart freshCart() { return carts.getObject(); }
}
```

**Scopes in web apps.** `request` and `session` scopes work the same way: injecting them into a singleton needs a **scoped proxy** (`@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)`) or an `ObjectProvider`, otherwise the singleton would keep the first request's object forever.

<!-- exercise: d19_e3 | Medium | An auditing aspect with `@Around` -->
**Concepts:** `@Aspect` + `@Around` advice · pointcut on a custom annotation (`@annotation(...)`) · `ProceedingJoinPoint.proceed()` · CGLIB proxies for classes without interfaces · self-invocation isn't advised

**Task.** Write an `AuditAspect` that wraps every method annotated with `@Audited`:

- Before the call: log `BEFORE <method>`.
- After success: `AFTER <method>: ok`. After an exception: `AFTER <method>: failed <ExceptionSimpleName>`, then **rethrow** it.
- `BankService.transferTwice` calls `this.transfer(...)` internally — confirm those inner calls are **not** audited.

You built the same thing by hand with a JDK proxy on Day 10; now Spring creates the proxy for you.

**Starter code**

```java
// src/main/java/com/example/practice/d19/aop/Audited.java
package com.example.practice.d19.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Audited { }
```

```java
// src/main/java/com/example/practice/d19/aop/AuditLog.java
package com.example.practice.d19.aop;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class AuditLog {
    private final List<String> entries = new ArrayList<>();
    public synchronized void add(String entry) { entries.add(entry); }
    public synchronized List<String> entries() { return List.copyOf(entries); }
    public synchronized void clear() { entries.clear(); }
}
```

```java
// src/main/java/com/example/practice/d19/aop/BankService.java
package com.example.practice.d19.aop;

import org.springframework.stereotype.Service;

@Service
public class BankService {

    @Audited
    public String transfer(String from, String to, int amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        return "moved " + amount + " from " + from + " to " + to;
    }

    public String transferTwice(String from, String to, int amount) {
        return transfer(from, to, amount) + " | " + transfer(from, to, amount);   // this.transfer(...)
    }
}
```

```java
// src/main/java/com/example/practice/d19/aop/AuditAspect.java
package com.example.practice.d19.aop;

import org.springframework.stereotype.Component;

@Component
public class AuditAspect {
    private final AuditLog log;

    public AuditAspect(AuditLog log) { this.log = log; }

    // TODO: make this an @Aspect with @Around advice for methods annotated with @Audited
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d19/aop/AuditAspectTest.java
package com.example.practice.d19.aop;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringJUnitConfig(AuditAspectTest.Config.class)
class AuditAspectTest {

    @Configuration
    @EnableAspectJAutoProxy
    @Import({AuditLog.class, AuditAspect.class, BankService.class})
    static class Config { }

    @Autowired BankService bank;
    @Autowired AuditLog log;

    @BeforeEach
    void reset() { log.clear(); }

    @Test
    void successfulCallIsWrapped() {
        assertThat(bank.transfer("A", "B", 100)).isEqualTo("moved 100 from A to B");
        assertThat(log.entries()).containsExactly("BEFORE transfer", "AFTER transfer: ok");
    }

    @Test
    void failureIsRecordedAndRethrown() {
        assertThatThrownBy(() -> bank.transfer("A", "B", 0)).isInstanceOf(IllegalArgumentException.class);
        assertThat(log.entries()).containsExactly("BEFORE transfer", "AFTER transfer: failed IllegalArgumentException");
    }

    @Test
    void springInjectsACglibProxy() {
        assertThat(AopUtils.isAopProxy(bank)).isTrue();
        assertThat(AopUtils.isCglibProxy(bank)).isTrue();
    }

    @Test
    void selfInvocationIsNotAdvised() {
        bank.transferTwice("A", "B", 5);
        assertThat(log.entries()).isEmpty();
    }
}
```

**Expected result**

```text
AuditAspectTest: 4 tests passed
```

<!-- hints -->
- Annotate the class with `@Aspect` (from `org.aspectj.lang.annotation`) in addition to `@Component`.
- `@Around("@annotation(com.example.practice.d19.aop.Audited)")` matches any method carrying the annotation.
- Inside the advice: `String name = pjp.getSignature().getName();` then `Object result = pjp.proceed();` — forgetting `proceed()` means the real method never runs.
- Catch `Throwable`, log the failure, and rethrow it unchanged so callers (and `@Transactional`) still see the exception.
- `BankService` has no interface, so Spring proxies it with a **CGLIB subclass**. `transferTwice` isn't annotated, and its internal `this.transfer()` calls stay inside the real object.

<!-- solution -->
```java
// src/main/java/com/example/practice/d19/aop/AuditAspect.java
package com.example.practice.d19.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditAspect {
    private final AuditLog log;

    public AuditAspect(AuditLog log) { this.log = log; }

    @Around("@annotation(com.example.practice.d19.aop.Audited)")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        String method = pjp.getSignature().getName();
        log.add("BEFORE " + method);
        try {
            Object result = pjp.proceed();                         // run the real method
            log.add("AFTER " + method + ": ok");
            return result;
        } catch (Throwable ex) {
            log.add("AFTER " + method + ": failed " + ex.getClass().getSimpleName());
            throw ex;                                              // never swallow
        }
    }
}
```

**Advice types.** `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After` (finally) and `@Around` (full control, can skip or retry the call). Spring's `@Transactional`, `@Cacheable`, `@Async`, `@Retryable` and Micrometer's `@Timed` are all aspects like this one — which is why they share the same self-invocation limitation.

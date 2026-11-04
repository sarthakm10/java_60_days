# Day 64 — AOP and How Spring Works Inside

> Today you look under the hood: how Spring adds behaviour to your methods without touching them, and what happens to a request from arrival to response. Read each 🌱 **In simple words** box first.

**Today's goal:** understand aspects and proxies, trace a request through Spring MVC, and explain auto-configuration and the bean lifecycle in an interview.

<!-- topic: b64_t1 -->
## 🌿 Spring — Under the Hood

<!-- intro: d19_t1_s8 -->
Some jobs belong in **many** methods: logging every call, timing, checking permissions, starting transactions. Copying that code everywhere would be awful. **AOP** (aspect-oriented programming) lets you write it **once**, in an **aspect**, and say where it applies: `@Around("execution(* com.example.service.*.*(..))")` runs your code around every service method. Underneath, it's Day 44's proxy: Spring wraps your bean and runs the aspect before and after each call. `@Transactional` (Day 60) is exactly this.

<!-- intro: d26_t1_s6 -->
What happens to `GET /api/products/1`: the embedded Tomcat receives it → security and other **filters** run (Day 61) → Spring's **`DispatcherServlet`** (the front desk for every request) asks the **handler mapping** which controller method matches → arguments are prepared (`@PathVariable`, `@RequestBody`) → your method runs → the returned object is converted to JSON → filters run on the way out → the response goes back. Being able to draw this is a favourite interview question.

<!-- intro: d26_t1_s5 -->
Recap Day 54 in interview words: auto-configuration classes are guarded by conditions like `@ConditionalOnClass` ("only if this library is present") and `@ConditionalOnMissingBean` ("only if you haven't defined your own"). That second one is why defining your own bean of a type replaces Spring Boot's default.

<!-- intro: d26_t1_s1 -->
Explain out loud, without notes: IoC and dependency injection (Day 52), the bean lifecycle with `@PostConstruct`/`@PreDestroy` (Day 53), and the two `@Transactional` traps: self-invocation and checked exceptions (Day 60).

👉 **Code Practice** today: an auditing aspect, tracing a request through filter, interceptor, controller and advice, and writing your own auto-configuration.

<!-- topic: b64_t2 -->
## 🛠️ Project — Task Manager API (Step 11)

<!-- subtopic: b64_t2_s1 -->
### Step 11: an aspect that times every service call

**Goal:** log any service method that's slow, without adding a line to any service: a cross-cutting concern written once, as an **aspect**. Then see the proxies that make it (and `@Transactional`) work.

**1. Add AspectJ support** (on Spring Boot 3.x the starter is called `spring-boot-starter-aop`):

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aspectj</artifactId>
</dependency>
```

**2. The aspect:**

```java
// src/main/java/com/example/taskmanager/common/TimingAspect.java
package com.example.taskmanager.common;

import java.time.Duration;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// Times every public method of every @Service in this app, without touching the services: Spring wraps each
// service bean in a proxy, and the proxy runs this code around the real method (the same trick as @Transactional).
@Aspect
@Component
public class TimingAspect {

    private static final Logger log = LoggerFactory.getLogger(TimingAspect.class);

    private final long slowMillis;

    public TimingAspect(@Value("${app.timing.slow-threshold:500ms}") Duration slowThreshold) {
        this.slowMillis = slowThreshold.toMillis();
    }

    // Pointcut: which methods. Here: any method of a class annotated @Service, inside our package.
    @Around("within(com.example.taskmanager..*) && @within(org.springframework.stereotype.Service)")
    public Object time(ProceedingJoinPoint call) throws Throwable {
        long start = System.nanoTime();
        try {
            return call.proceed();                       // run the real method
        } finally {                                      // also when it throws
            long millis = (System.nanoTime() - start) / 1_000_000;
            if (millis >= slowMillis) {
                log.warn("Slow call: {} took {} ms", call.getSignature().toShortString(), millis);
            } else {
                log.debug("{} took {} ms", call.getSignature().toShortString(), millis);
            }
        }
    }
}
```

And its setting, at the end of `application.properties`:

```properties
# in application.properties
# Service calls slower than this are logged as warnings (TimingAspect)
app.timing.slow-threshold=500ms
```

**3. A test** that builds the same kind of proxy Spring builds, around a tiny service, and reads the log:

```java
// src/test/java/com/example/taskmanager/common/TimingAspectTest.java
package com.example.taskmanager.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.stereotype.Service;

// Builds the same kind of proxy Spring builds, around a tiny test service, and reads what was logged
@ExtendWith(OutputCaptureExtension.class)
class TimingAspectTest {

    @Service
    static class SlowService {
        public String work(long millis) throws InterruptedException {
            Thread.sleep(millis);
            return "done";
        }
    }

    SlowService proxied(Duration threshold) {
        AspectJProxyFactory factory = new AspectJProxyFactory(new SlowService());
        factory.addAspect(new TimingAspect(threshold));
        return factory.getProxy();
    }

    @Test
    void slowCallsAreLoggedAsWarnings(CapturedOutput output) throws Exception {
        String result = proxied(Duration.ofMillis(50)).work(80);

        assertThat(result).isEqualTo("done");                         // the real method still ran
        assertThat(output).contains("Slow call: SlowService.work(..) took");
    }

    @Test
    void fastCallsAreNotWarnings(CapturedOutput output) throws Exception {
        proxied(Duration.ofMillis(500)).work(1);

        assertThat(output).doesNotContain("Slow call");
    }
}
```

**4. See it.** With the dev profile, every service call logs at DEBUG, for example `TaskService.list(..) took 12 ms`. Set `app.timing.slow-threshold=1ms` to see the warnings, then put it back.

**See the proxy.** Add this to `TaskManagerApplication` for a minute (imports: `CommandLineRunner`, `Bean`, `TaskService`):

```java
@Bean
CommandLineRunner showProxy(TaskService taskService) {
    return args -> System.out.println(taskService.getClass().getName());
}
```

It prints `com.example.taskmanager.task.TaskService$$SpringCGLIB$$0`: a subclass Spring generated. Controllers get this proxy, and the proxy runs the timing aspect and the transaction before and after calling the real `TaskService`. That's also why a service calling **its own** method skips both: `this.update(…)` doesn't go through the proxy. Remove the bean.

**✅ Checkpoint**

- [ ] Service calls are timed in the log, and slow ones are warnings.
- [ ] `./mvnw test` passes. Commit: `step 11: timing aspect`.

One big piece is left: ownership, so each user sees only their own projects. It's the first step on Day 65; then Days 65–67 finish the API with documentation, end-to-end tests, a security review, a runnable jar and a README.

**If it doesn't work:** no timing lines at all usually means the AspectJ starter is missing (the `@Aspect` annotation compiles but nothing runs it), or the class lacks `@Component`.

<!-- topic: b64_t3 -->
## 🧮 DSA — Full Mock Coding Round

A full mock interview: two mediums and one hard in 90 minutes, thinking aloud and asking clarifying questions as you would with an interviewer. Afterwards, write down which patterns were weak and add them to your revision list. If you can, do it with a friend playing interviewer.

## 📝 Day 64 Recap

1. What problem does AOP solve? → **code needed in many places (logging, timing, security, transactions) written once**
2. What is an aspect? → **a class holding cross-cutting code and the rules for where it applies**
3. How does Spring apply aspects? → **by wrapping beans in proxies**
4. Which Spring feature is AOP underneath? → **@Transactional**
5. Spring MVC's front controller? → **DispatcherServlet**
6. Who picks the controller method for a request? → **the handler mapping**
7. What runs before the DispatcherServlet? → **servlet filters, including security**
8. What does @ConditionalOnMissingBean mean? → **create this bean only if you haven't defined one yourself**
9. How do you replace a Spring Boot default bean? → **define your own bean of that type**
10. Two @Transactional traps? → **self-invocation skips the proxy; checked exceptions don't roll back by default**

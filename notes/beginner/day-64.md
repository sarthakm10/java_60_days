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

# Day 53 — Beans: Scopes, Lifecycle and Configuration

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** create beans for classes you didn't write, control how many copies Spring makes, and run code when a bean starts and stops.

<!-- topic: b53_t1 -->
## 🌿 Spring — Beans

<!-- subtopic: b53_t1_s1 -->
### @Configuration and @Bean

`@Component` works for **your** classes: you put the annotation on them. But what about classes from a library, like a `RestClient` or a `PasswordEncoder`? You can't edit their source to add `@Component`.

The answer is a **configuration class** with **`@Bean` methods**: you write a method that builds the object, and Spring calls it once and manages whatever it returns:

```java
@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();          // a library class: Spring now manages it as a bean
    }

    @Bean
    public RestClient weatherClient() {
        return RestClient.builder()
                .baseUrl("https://api.weather.example")
                .build();
    }
}
```

Now any bean can ask for a `PasswordEncoder` in its constructor and get this one. `@Bean` methods can take other beans as parameters, and Spring passes them in.

| Use | When |
|---|---|
| `@Component` / `@Service` / … on the class | it's your own class |
| `@Bean` method in a `@Configuration` class | it's a library class, or it needs custom setup code |

<details>
<summary>When do you use a @Bean method instead of @Component?</summary>

For classes you can't annotate (library classes) or objects that need custom construction code.
</details>

<!-- intro: d19_t1_s5 -->
By default Spring creates **one** instance of each bean and shares it everywhere: the **singleton** scope. That's what you want for services and repositories (they hold no per-user data). **Prototype** makes a new instance every time one is requested, and web apps add **request** and **session** scopes (one per HTTP request / per user session). Because singletons are shared by every request thread at once (Day 38), never keep per-user data in a singleton's fields.

<!-- intro: d19_t1_s6 -->
Spring creates a bean, injects its dependencies, then calls any method marked **`@PostConstruct`** (for setup that needs the dependencies, like loading a cache). When the app shuts down, it calls **`@PreDestroy`** methods (for clean-up like closing connections). Between those, the bean does its normal work.

<!-- intro: d19_t1_s7 -->
Sometimes a bean should exist only in certain situations. **`@Profile("dev")`** creates it only when the `dev` profile is active (a fake email sender while developing, the real one in production); `@Conditional...` annotations create beans only if some condition holds (a class is on the classpath, a property is set). Spring Boot's auto-configuration (Day 54) is built entirely from these conditions.

<!-- topic: b53_t2 -->
## 🏗️ DSA — Pattern Cheat Sheet Creation

Write your own one-page cheat sheet of DSA patterns: for each one (two pointers, sliding window, binary search, BFS/DFS, topological sort, Union-Find, the DP shapes, backtracking, greedy, heaps), write **when to use it** in one line and a minimal template. Writing it yourself is the revision. Keep it next to you for the rest of the track and before interviews.

## 📝 Day 53 Recap

1. What does @Configuration mark? → **a class that defines beans with @Bean methods**
2. What does a @Bean method do? → **builds an object that Spring then manages as a bean**
3. Default bean scope? → **singleton: one shared instance**
4. Prototype scope? → **a new instance every time the bean is requested**
5. Why not store per-user data in a singleton's fields? → **the singleton is shared by all requests and threads**
6. When does @PostConstruct run? → **after the bean is created and its dependencies are injected**
7. When does @PreDestroy run? → **when the application shuts down**
8. What does @Profile("dev") do? → **creates the bean only when the dev profile is active**
9. What is auto-configuration built on? → **conditional bean creation (@Conditional...)**
10. Purpose of a DSA cheat sheet? → **one line on when to use each pattern plus a template, for quick revision**

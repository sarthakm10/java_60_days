# Day 54 — Your First Spring Boot App

> Today you build and run a real web server. By the end you'll call your own Java code from a browser.

**Today's goal:** create a Spring Boot project, understand what `@SpringBootApplication` and auto-configuration do for you, configure the app, and return text and JSON from your first endpoints.

<!-- topic: b54_t1 -->
## 🌿 Spring Boot — Getting Started

<!-- subtopic: b54_t1_s1 -->
### Create and run a project

**Spring** is the framework (DI, web, data…). **Spring Boot** is Spring with sensible defaults and a built-in web server, so a project runs with zero setup.

1. Open [start.spring.io](https://start.spring.io) (the **Spring Initializr**).
2. Choose: **Maven**, **Java**, the latest stable Spring Boot, Group `com.example`, Artifact `demo`, Java **21**.
3. Add dependencies: **Spring Web** and **Spring Boot DevTools**.
4. Click **Generate**, unzip, and open the folder in IntelliJ (*File → Open*, pick the folder with `pom.xml`).

You get the Maven layout from Day 46, plus:

```text
src/main/java/com/example/demo/DemoApplication.java    ← the starting point
src/main/resources/application.properties              ← configuration
pom.xml                                                ← spring-boot-starter-web, etc.
mvnw / mvnw.cmd                                        ← the Maven wrapper
```

Run `DemoApplication` (▶ next to `main`) or `./mvnw spring-boot:run`. The log ends with something like:

```text
Tomcat started on port 8080 (http)
Started DemoApplication in 1.8 seconds
```

**Tomcat** is a web server, embedded inside your app. Open `http://localhost:8080`: you'll see an error page ("Whitelabel Error Page", 404). That's good: the server is running, it just has no endpoints yet.

**DevTools** restarts the app automatically when you rebuild, so you don't need to stop and start it after every change (in IntelliJ: *Build → Build Project*, or enable automatic building).

<details>
<summary>What is the embedded server in a Spring Boot web app, and which port does it use by default?</summary>

Tomcat, on port 8080.
</details>

<!-- intro: d20_t1_s1 -->
Look at `DemoApplication`: one annotation, `@SpringBootApplication`, does three jobs. It marks the class as a configuration class (Day 53), turns on **auto-configuration** (next section), and turns on **component scanning**: Spring looks for `@Component`, `@Service`, `@RestController`… in this class's package **and every package below it**. That's why your classes must live under `com.example.demo`: a controller in a different package would never be found.

<!-- intro: d20_t1_s2 -->
How does adding "Spring Web" give you a running web server with zero code? **Auto-configuration**: Spring Boot contains hundreds of ready-made `@Configuration` classes, each guarded by conditions like "if Tomcat is on the classpath and you haven't defined your own web server, create one". Your dependencies decide what gets configured, and anything you define yourself takes priority. Run the app with `--debug` to see the report of what was configured and why.

<!-- subtopic: b54_t1_s4 -->
### application.properties

Spring Boot reads settings from `src/main/resources/application.properties` (or the same thing in YAML format, `application.yml`):

```properties
server.port=8081
spring.application.name=demo
logging.level.com.example.demo=DEBUG

# your own settings
app.greeting=Hello
app.max-items=50
```

```yaml
# the same settings in application.yml
server:
  port: 8081
app:
  greeting: Hello
  max-items: 50
```

Read your own settings in a bean with `@Value`:

```java
@Service
public class GreetingService {
    private final String greeting;

    public GreetingService(@Value("${app.greeting}") String greeting) {
        this.greeting = greeting;
    }
}
```

Keeping settings out of code means the same JAR can run with different values on your laptop and on a server. Day 63 covers profiles, typed configuration classes and environment variables. Never put real passwords in this file once it's committed to Git (Day 12).

<details>
<summary>Where do Spring Boot settings like server.port go?</summary>

In `src/main/resources/application.properties` (or `application.yml`).
</details>

<!-- subtopic: b54_t1_s5 -->
### Your first endpoints

A **controller** handles HTTP requests. Create it in the same package as `DemoApplication` (or below it):

```java
package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot!";
    }

    @GetMapping("/greeting")
    public Greeting greeting() {
        return new Greeting("Hello", "Asha", 2026);
    }

    record Greeting(String message, String name, int year) { }
}
```

Restart, then open:

- `http://localhost:8080/hello` → `Hello from Spring Boot!`
- `http://localhost:8080/greeting` → `{"message":"Hello","name":"Asha","year":2026}`

What just happened:

1. `@RestController` made this class a bean that handles web requests and returns data (not HTML pages).
2. `@GetMapping("/hello")` connected `GET /hello` to the `hello()` method.
3. Returning a `String` sends it as the response body; returning an **object** sends it as **JSON**, converted automatically by Jackson (Day 45). You never wrote any JSON code.

Try it with curl or Postman too: `curl -i http://localhost:8080/greeting` shows the `200` status and the `Content-Type: application/json` header.

👉 **Code Practice** today builds this controller with a test that checks it.

<details>
<summary>What happens when a @RestController method returns a Java object?</summary>

Spring converts it to JSON (with Jackson) and sends it as the response body.
</details>

<!-- topic: b54_t2 -->
## 🧮 DSA — Timed Practice

Interviews have time limits, so practise with one: solve one easy and two medium problems in 60 minutes, without looking anything up. Then two design-flavoured problems (Design Twitter, Flatten Nested List Iterator) that combine maps, lists and heaps, and Task Scheduler (heap + greedy). Note which problems ran over time; those patterns go on your revision list.

## 📝 Day 54 Recap

1. Spring vs Spring Boot? → **Spring is the framework; Spring Boot adds defaults, auto-configuration and an embedded server**
2. Where do you generate a project? → **start.spring.io (Spring Initializr)**
3. Embedded web server and default port? → **Tomcat on 8080**
4. Three things @SpringBootApplication turns on? → **configuration, auto-configuration and component scanning**
5. Why must controllers be under the main class's package? → **component scanning only searches that package and below**
6. What is auto-configuration? → **beans Spring Boot creates automatically based on your dependencies and settings, unless you define your own**
7. Change the port? → **server.port=8081 in application.properties**
8. Read a custom property into a bean? → **@Value("${app.greeting}")**
9. Map GET /hello to a method? → **@GetMapping("/hello") in a @RestController**
10. Returning an object from a controller sends? → **JSON**

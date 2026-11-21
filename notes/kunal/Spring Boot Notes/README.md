# Spring Boot Notes

In-depth notes for learning **Spring Boot** after the Java + DSA playlist, in the same style as the playlist notes: numbered sections, coloured diagrams, runnable code with real output, a complete example and a cheat sheet in every file.

These notes come after [Java gap #12](../Java%20Topics%20Not%20Covered%20Notes/java_gap_12_junit_maven_gradle_jdbc.md) (JUnit, Maven, JDBC) in the [study roadmap](../java_dsa_study_roadmap.md). You should be comfortable with OOP, interfaces, collections, generics, lambdas/streams and exceptions first.

## Versions used

| Tool | Version |
|---|---|
| JDK | 21 |
| Maven | 3.9.14, through the Maven wrapper (`./mvnw`) in each example |
| Spring Boot | 4.0.5 (Spring Framework 7.0.6) |
| PostgreSQL | 18 (local install), from file 07 on |

Where Spring Boot **3.x** does something differently (Jackson 2 vs 3, `javax` vs `jakarta`, test annotations), the notes say so.

## Files

| # | File | Status |
|---|---|---|
| 01 | [Maven in Depth](spring_01_maven_in_depth.md) | ✅ |
| 02 | [HTTP & REST Basics](spring_02_http_rest_basics.md) | ✅ |
| 03 | [Spring Core: IoC, DI and Beans](spring_03_spring_core_ioc_di.md) | ✅ |
| 04 | [Spring Boot Fundamentals](spring_04_spring_boot_fundamentals.md): starters, auto-configuration, `application.yml`, profiles | ✅ |
| 05 | [REST Controllers](spring_05_rest_controllers.md) (Spring MVC): mappings, `ResponseEntity` and status codes, DTOs, Jackson, Lombok/records, file upload, API versioning, **filters vs interceptors, custom interceptors + annotations, HATEOAS** | ✅ |
| 06 | [Validation & Error Handling](spring_06_validation_error_handling.md): `@Valid`, `@ExceptionHandler`, `@ResponseStatus`, `@RestControllerAdvice`, `ProblemDetail` | ✅ |
| 07 | [SQL Essentials (joins, GROUP BY, indexes, window functions) on PostgreSQL](spring_07_sql_essentials.md) | ✅ |
| 08 | [Data Access I](spring_08_data_access_jdbc_jpa.md): **JdbcTemplate**, JPA architecture, entity lifecycle, mapping (`@Table`, `@Column`, `@Embeddable`), relationships (one-to-one / one-to-many / many-to-many, uni- and bidirectional), **first- and second-level caching**, Flyway, HikariCP | ✅ |
| 09 | [Data Access II](spring_09_queries_transactions.md): derived queries, JPQL, native queries, **Criteria API, Specifications**, joins, N+1, pagination and sorting, DTO mapping; `@Transactional` in depth (**declarative vs programmatic, propagation, isolation levels**, locking) | ✅ |
| 10 | [Testing Spring Apps (MockMvc, `@DataJpaTest`, `@SpringBootTest`, Testcontainers)](spring_10_testing.md) | ✅ |
| 11 | [Spring Security](spring_11_security.md): **attacks (CSRF, XSS, CORS, SQL injection)**, architecture and filter chain, users in memory and in the DB, form login (stateful), basic auth (stateless), JWT vs session, JWT implementation, OAuth2, **method security (`@PreAuthorize`, `@PostAuthorize`)** | ✅ |
| 12 | [Production Features](spring_12_production_features.md): logging, **Actuator in depth**, OpenAPI, virtual threads | ✅ |
| 13 | [Advanced Spring](spring_13_advanced_spring.md): **AOP in depth**, **`@Async` and `ThreadPoolExecutor`**, caching with Redis, scheduling, events, `RestClient`, rate limiting | ✅ |
| 14 | [Deployment](spring_14_deployment.md): fat jar, Docker, config and secrets, CI | ✅ |
| 15 | [Capstone](spring_15_capstone.md): the whole Task Tracker end to end + interview questions | ✅ |
| 16 | [Messaging with Kafka / RabbitMQ](spring_16_messaging.md) | ✅ |
| 17 | [Microservices with Spring Cloud](spring_17_microservices.md) | ✅ |
| 18 | [NoSQL with Spring Data MongoDB](spring_18_mongodb.md) | ✅ |

Topics in **bold** were added so that every video of the reference playlist (next section) is covered. Files 08, 09 and 11 are the largest.

## Reference playlist: where each video is covered

The reference playlist is [*Spring Boot from Basics to Advanced*](https://www.youtube.com/playlist?list=PL6W8uoQQ2c60g6_fcjDCLHSx1LBeVYqyZ) by Concept && Coding (Shrayansh), 44 videos. These notes follow their **own** order, built so each file only needs the earlier ones. This table shows where each video's topic is covered.

> [!NOTE]
> Most of the playlist's videos are **members-only**, so these notes were written from the video **titles**, not from watching them. They cover each topic in depth, but they don't reproduce the videos' own examples or wording.

| # | Video | Covered in |
|---|---|---|
| 1 | Spring Boot roadmap | This README + the [study roadmap](../java_dsa_study_roadmap.md#track-spring-boot-backend-development) |
| 2 | Introduction to Spring Boot, advantages over Spring MVC and servlets | [04 §0–3](spring_04_spring_boot_fundamentals.md), [02 §10](spring_02_http_rest_basics.md#10-http-versions-https-and-where-tomcat-fits) |
| 3 | Project setup and layered architecture | [04 §0](spring_04_spring_boot_fundamentals.md#0-creating-a-project-with-spring-initializr), [05 §12](spring_05_rest_controllers.md#12-request-scope-and-the-layered-architecture) |
| 4 | Maven and its lifecycle | [01](spring_01_maven_in_depth.md) |
| 5 | Controller-layer annotations (`@Controller`, `@RestController`, `@RequestMapping`) | [05 §1–2](spring_05_rest_controllers.md#1-restcontroller-and-the-mapping-annotations) |
| 6 | Bean and its lifecycle, IoC | [03 §1–2, §8](spring_03_spring_core_ioc_di.md#8-the-bean-lifecycle) |
| 7 | Dependency injection, advantages and disadvantages | [03 §5–6](spring_03_spring_core_ioc_di.md#5-constructor-setter-and-field-injection) |
| 8 | Bean scopes: singleton, prototype, request, session | [03 §7](spring_03_spring_core_ioc_di.md#7-bean-scopes), request scope demo in [05 §12](spring_05_rest_controllers.md#12-request-scope-and-the-layered-architecture) |
| 9 | Dynamically initialized beans, `@Value` | [03 §9](spring_03_spring_core_ioc_di.md#9-configuration-values-and-profiles), [04 §7](spring_04_spring_boot_fundamentals.md#7-type-safe-configuration-with-configurationproperties) |
| 10 | `@ConditionalOnProperty` | [04 §3](spring_04_spring_boot_fundamentals.md#3-auto-configuration-how-the-magic-works) |
| 11 | `@Profile` and how profiles work | [03 §9.2](spring_03_spring_core_ioc_di.md#92-profiles), [04 §8](spring_04_spring_boot_fundamentals.md#8-profiles-in-spring-boot) |
| 12 | AOP | [13](spring_13_advanced_spring.md#1-aop-concepts) §0–2 |
| 13–15 | `@Transactional` parts 1–3: declarative vs programmatic, propagation, isolation | [09 §8–12](spring_09_queries_transactions.md#8-how-transactional-works) (proxies first explained in [03 §11](spring_03_spring_core_ioc_di.md#11-proxies-how-spring-adds-behaviour)) |
| 16–17 | `@Async` parts 1–2, `ThreadPoolExecutor`, interview questions | [13](spring_13_advanced_spring.md#3-async-and-thread-pools) (thread pools in [Java gap #1](../Java%20Topics%20Not%20Covered%20Notes/java_gap_01_multithreading_concurrency.md)) |
| 18 | Custom interceptors and custom annotations | [05 §10](spring_05_rest_controllers.md#10-custom-annotations-read-by-an-interceptor) |
| 19 | Filters vs interceptors | [05 §9](spring_05_rest_controllers.md#9-filters-vs-interceptors) |
| 20 | HATEOAS | [05 §11](spring_05_rest_controllers.md#11-hateoas-responses-with-links) |
| 21 | `ResponseEntity` and response codes 1xx–5xx | [02 §3](spring_02_http_rest_basics.md#3-status-codes), [05 §3](spring_05_rest_controllers.md#3-writing-the-response-responseentity-and-status-codes) |
| 22 | Exception handling: `@ControllerAdvice`, `@ResponseStatus`, `@ExceptionHandler` | [06 §7–10](spring_06_validation_error_handling.md#7-how-spring-mvc-handles-exceptions) |
| 23 | JPA part 1: JdbcTemplate | [08 §3](spring_08_data_access_jdbc_jpa.md#3-spring-jdbc-jdbctemplate-and-jdbcclient) |
| 24 | JPA part 2: setup, architecture, entity lifecycle | [08 §1](spring_08_data_access_jdbc_jpa.md#1-setup-starters-datasource-and-hikaricp), [§4](spring_08_data_access_jdbc_jpa.md#4-jpa-architecture), [§6](spring_08_data_access_jdbc_jpa.md#6-the-entity-lifecycle) |
| 25–26 | JPA parts 3–4: first-level and second-level caching | [08 §7](spring_08_data_access_jdbc_jpa.md#7-persistence-context-first-level-cache-dirty-checking-flush), [§10](spring_08_data_access_jdbc_jpa.md#10-second-level-cache) |
| 27 | JPA part 5: `@Table`, `@Column`, `@Id`, `@Embeddable` | [08 §5](spring_08_data_access_jdbc_jpa.md#5-mapping-entities) |
| 28–29 | JPA parts 6–7: one-to-one, one-to-many, many-to-one, many-to-many | [08 §8](spring_08_data_access_jdbc_jpa.md#8-relationships) |
| 30 | JPA part 8: JPQL, derived queries, N+1, joins, pagination, sorting | [09 §1–5](spring_09_queries_transactions.md#1-derived-queries) |
| 31–32 | JPA parts 9–10: native queries, Criteria API, Specifications | [09 §2](spring_09_queries_transactions.md#2-jpql-and-native-queries), [§6](spring_09_queries_transactions.md#6-specifications-and-the-criteria-api) |
| 33 | Attacks: CSRF, XSS, CORS, SQL injection | [11](spring_11_security.md#1-common-attacks-csrf-xss-sql-injection-and-cors) (SQL injection also in [Java gap #12](../Java%20Topics%20Not%20Covered%20Notes/java_gap_12_junit_maven_gradle_jdbc.md)) |
| 34–37 | Security parts 1–4: architecture, users in memory/DB, form login, basic auth | [11](spring_11_security.md#2-architecture-the-filter-chain) §2–7 |
| 38–39 | JWT explained, JWT implementation | [11](spring_11_security.md#8-jwt-issuing-and-validating-tokens) ([02 §6](spring_02_http_rest_basics.md#6-statelessness-cookies-sessions-and-tokens) introduces tokens) |
| 40–41 | OAuth 2.0 explained, OAuth2 implementation | [11](spring_11_security.md#9-oauth2-and-openid-connect) |
| 42 | Method security, `@PreAuthorize` / `@PostAuthorize` | [11](spring_11_security.md#10-authorization-url-rules-and-method-security) |
| 43 | Actuator in depth | [12](spring_12_production_features.md#5-actuator-endpoints-exposure-and-security) §5–10 |
| 44 | `@ConfigurationProperties` in depth | [04 §7](spring_04_spring_boot_fundamentals.md#7-type-safe-configuration-with-configurationproperties) |

What these notes add beyond the playlist: HTTP basics (02), SQL (07), testing (10), Docker and CI (14), messaging (16), microservices (17) and MongoDB (18).

## Example projects

Each file's runnable code lives in [`examples/`](examples/):

| Folder | Used by | Run it with |
|---|---|---|
| [`01-maven-multimodule/`](examples/01-maven-multimodule/) | File 01 | `./mvnw clean package`, then `java -jar stats-app/target/stats-app-1.0.0.jar` |
| (none: plain JDK) | File 02 | Copy the Complete Example into `TaskApiDemo.java`, then `java TaskApiDemo.java` |
| [`03-spring-core/`](examples/03-spring-core/) | File 03 | `./mvnw -q compile exec:java` |
| [`04-boot-fundamentals/`](examples/04-boot-fundamentals/) | File 04 | `./mvnw package`, then `java -jar target/task-tracker-0.4.0.jar` |
| [`05-rest-controllers/`](examples/05-rest-controllers/) | File 05 | `./mvnw package`, then `java -jar target/task-tracker-0.5.0.jar` (port 8080) |
| [`06-validation-errors/`](examples/06-validation-errors/) | File 06 | `./mvnw package`, then `java -jar target/task-tracker-0.6.0.jar` |
| [`07-sql/`](examples/07-sql/) | File 07 | `psql ... -f schema.sql`, then `-f queries.sql` (see the file) |
| [`08-data-access/`](examples/08-data-access/) | File 08 | `./mvnw package`, then `java -jar target/task-tracker-0.8.0.jar` |
| [`09-queries-transactions/`](examples/09-queries-transactions/) | File 09 | `./mvnw package`, then `java -jar target/task-tracker-0.9.0.jar` |
| [`10-testing/`](examples/10-testing/) | File 10 | `./mvnw package`, then `java -jar target/task-tracker-0.10.0.jar` |
| [`11-security/`](examples/11-security/) | File 11 | `./mvnw package`, then `java -jar target/task-tracker-0.11.0.jar` |
| [`12-production/`](examples/12-production/) | File 12 | `./mvnw package`, then `java -jar target/task-tracker-0.12.0.jar` |
| [`13-advanced/`](examples/13-advanced/) | File 13 | `./mvnw package`, then `java -jar target/task-tracker-0.13.0.jar` |
| [`14-deployment/`](examples/14-deployment/) | File 14 | `./mvnw package`, then `java -jar target/task-tracker-0.14.0.jar` |
| [`15-capstone/`](examples/15-capstone/) | File 15 | `./mvnw package`, then `java -jar target/task-tracker-0.15.0.jar` |
| [`16-messaging/`](examples/16-messaging/) | File 16 | `./mvnw package`; with an embedded Kafka broker: `./mvnw spring-boot:test-run -Dspring-boot.run.main-class=com.notes.tasks.messaging.MessagingDemo` |
| [`17-microservices/`](examples/17-microservices/) | File 17 | `./mvnw package`, then start the 5 jars in order (config-server, discovery-server, user-service ×2 with `PORT`, task-service, gateway) |
| [`18-mongodb/`](examples/18-mongodb/) | File 18 | `./mvnw package` (mapping tests, no server needed); with a MongoDB server: `MONGODB_URI=mongodb://localhost:27017/tasks_test ./mvnw test`, then `java -jar target/task-docs-0.18.0.jar` |

From file 04 on, one **Task Tracker** Spring Boot project grows file by file. Each file keeps its own snapshot folder (`04-…`, `05-…`), so every file's example still runs exactly as described.

> [!TIP]
> On Windows, run `./mvnw` from **Git Bash**, or `.\mvnw.cmd` from PowerShell. `JAVA_HOME` must point to JDK 21.

## Database setup (from file 07 on)

The examples use a separate local PostgreSQL user and database, so they never touch your own databases. Create them once (it asks for your `postgres` admin password):

```bash
"/c/Program Files/PostgreSQL/18/bin/psql" -U postgres -c "CREATE ROLE springnotes LOGIN PASSWORD 'springnotes';" -c "CREATE DATABASE springnotes OWNER springnotes;"
```

`springnotes` / `springnotes` is a throwaway password for local practice only. Never use a real password like this.

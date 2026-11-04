# Day 66 — Project Day 2: End-to-End Tests, Errors and a Security Review

> Yesterday the API became complete. Today you prove it works end to end, make every error look the same, and review its security.

**Today's goal:** a test against a real database, demo data, the same error format for every failure (including security errors and bugs), a security review of the whole project, and how real apps keep users logged in.

<!-- topic: b66_t1 -->
## 🛠️ Project — Finish the Task Manager API (Part 2)

<!-- subtopic: b65_t1_s3 -->
### Step 15: an end-to-end test against a real database

**Goal:** one test class that starts the **whole** app (security, Flyway, JPA, PostgreSQL) and drives it through HTTP, the way the React app will. Unit and `@WebMvcTest` tests are fast and precise; this one proves the pieces work together, including the SQL that the other tests mock away.

**1. A separate database for tests,** so tests never touch your dev data. In psql:

```sql
CREATE DATABASE taskmanager_test;
```

```properties
# src/main/resources/application-test.properties
# Used by @ActiveProfiles("test"): a separate database, so tests never touch your dev data.
# Create it once: CREATE DATABASE taskmanager_test;  Flyway creates the tables on the first run.
spring.datasource.url=jdbc:postgresql://localhost:5432/taskmanager_test
spring.datasource.username=${DB_USER:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}

app.jwt.secret=test-only-secret-0123456789-abcdefghij
app.cors.allowed-origins=http://localhost:5173
```

**2. The test.** `@SpringBootTest` starts everything; `@AutoConfigureMockMvc` gives a `MockMvc` that goes through the real security filters; `JsonPath` (already in the test starter) reads values out of JSON answers:

```java
// src/test/java/com/example/taskmanager/TaskApiIntegrationTest.java
package com.example.taskmanager;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

// The whole app (every bean, security, Flyway, a real PostgreSQL database) driven through HTTP, the way the
// React app will use it. Slower than the unit tests, so there are only a few, each one a complete story.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskApiIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Test
    void signUpLogInAndManageTasks() throws Exception {
        String token = newUserToken();

        String project = mvc.perform(json(post("/api/projects"), token, """
                        {"name": "Website"}
                        """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int projectId = JsonPath.read(project, "$.id");

        String task = mvc.perform(json(post("/api/projects/" + projectId + "/tasks"), token, """
                        {"title": "Write tests", "priority": 4}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("TODO"))
                .andReturn().getResponse().getContentAsString();
        int taskId = JsonPath.read(task, "$.id");

        mvc.perform(json(patch("/api/tasks/" + taskId), token, """
                        {"status": "DONE"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.priority").value(4));

        mvc.perform(get("/api/projects/" + projectId + "/tasks?status=DONE").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Write tests"));

        mvc.perform(get("/api/projects").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].taskCount").value(1))
                .andExpect(jsonPath("$[0].doneCount").value(1));

        mvc.perform(delete("/api/tasks/" + taskId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/tasks/" + taskId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void usersCantSeeEachOthersData() throws Exception {
        String ana = newUserToken();
        String ben = newUserToken();
        String project = mvc.perform(json(post("/api/projects"), ana, """
                        {"name": "Ana's secret project"}
                        """))
                .andReturn().getResponse().getContentAsString();
        int projectId = JsonPath.read(project, "$.id");

        mvc.perform(get("/api/projects/" + projectId).header("Authorization", "Bearer " + ben))
                .andExpect(status().isNotFound());
        mvc.perform(json(post("/api/projects/" + projectId + "/tasks"), ben, """
                        {"title": "Sneaky"}
                        """))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/projects").header("Authorization", "Bearer " + ben))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void noTokenNoAccess() throws Exception {
        mvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized());
    }

    // Signs up a brand-new user (a random email, so tests never clash) and logs in
    private String newUserToken() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        String body = """
                {"email": "%s", "password": "correct-horse"}
                """.formatted(email);
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        String login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(login, "$.token");
    }

    private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String token, String body) {
        return request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body);
    }
}
```

**3. The Initializr's `contextLoads` test** should use the test database too:

```java
// src/test/java/com/example/taskmanager/TaskManagerApplicationTests.java
package com.example.taskmanager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// Starts the whole app against the test database: fails if any bean, setting or query is broken
@SpringBootTest
@ActiveProfiles("test")
class TaskManagerApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

**4. Run everything:** `./mvnw test`. The integration tests take a few seconds (the app starts once and is reused by all three); Flyway creates the tables in `taskmanager_test` on the first run.

Make sure it can fail: in `ProjectService.find`, use `projectRepository.findById(id)` instead of `findByIdAndOwnerId(id, userId)` for a moment. `usersCantSeeEachOthersData` fails: Ben can now add a task to Ana's project. Put it back.

**✅ Checkpoint**

- [ ] `./mvnw test` passes, including `TaskApiIntegrationTest` (3 tests).
- [ ] Breaking the ownership check makes it fail. Commit: `step 15: end-to-end tests`.

**If it doesn't work:** "database taskmanager_test does not exist" means step 1 was skipped. If tests pass alone but fail together, two tests probably share an email: `newUserToken()` makes a fresh one each time for exactly this reason.

<!-- subtopic: b65_t1_s4 -->
### Step 16: demo data on startup

**Goal:** a fresh database with something in it, so you (and anyone trying your project, and the React app on Day 69) can log in straight away. Only in the dev profile: production never gets a demo account.

```java
// src/main/java/com/example/taskmanager/common/DemoData.java
package com.example.taskmanager.common;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.taskmanager.project.Project;
import com.example.taskmanager.project.ProjectRepository;
import com.example.taskmanager.task.Task;
import com.example.taskmanager.task.TaskRepository;
import com.example.taskmanager.task.TaskStatus;
import com.example.taskmanager.user.AppUser;
import com.example.taskmanager.user.UserRepository;

// On your laptop only (dev profile): a demo account with a project and a few tasks, so the API and the React app
// have something to show right away. Runs at startup and does nothing if the demo user already exists.
@Component
@Profile("dev")
public class DemoData implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoData.class);
    static final String EMAIL = "demo@example.com";

    private final UserRepository users;
    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final PasswordEncoder passwordEncoder;

    public DemoData(UserRepository users, ProjectRepository projects, TaskRepository tasks, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.projects = projects;
        this.tasks = tasks;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.existsByEmail(EMAIL)) return;
        AppUser demo = users.save(new AppUser(EMAIL, passwordEncoder.encode("demo-password")));
        Project website = projects.save(new Project("Website relaunch", demo));
        task(website, "Design the database", TaskStatus.DONE, 4, null);
        task(website, "Build the task API", TaskStatus.IN_PROGRESS, 5, LocalDate.now().plusDays(3));
        task(website, "Connect the React app", TaskStatus.TODO, 3, LocalDate.now().plusDays(10));
        task(website, "Write the README", TaskStatus.TODO, 2, null);
        log.info("Demo data added: log in as {} / demo-password", EMAIL);
    }

    private void task(Project project, String title, TaskStatus status, int priority, LocalDate dueDate) {
        Task task = new Task();
        task.setProject(project);
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(priority);
        task.setDueDate(dueDate);
        tasks.save(task);
    }
}
```

Restart the app: the log says `Demo data added: log in as demo@example.com / demo-password`. Log in as the demo user and list the projects: one project with four tasks, one of them done. Restart again: nothing is added twice.

**✅ Checkpoint**

- [ ] The demo login works in dev; with the `prod` profile there's no demo user.
- [ ] Commit: `step 16: demo data`.

<!-- subtopic: b66_t1_s1 -->
### Step 17: one error format everywhere

**Goal:** a client should never need two ways to read an error. Two kinds still break the `ProblemDetail` format: security errors (a 401 with an empty body, because they happen in filters before any controller, so `@RestControllerAdvice` never sees them) and unexpected bugs (a default error page that can leak details).

**1. Security errors as `ProblemDetail`:**

```java
// src/main/java/com/example/taskmanager/security/ProblemDetailAuthHandler.java
package com.example.taskmanager.security;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import tools.jackson.databind.json.JsonMapper;

// Security errors happen in filters, before any controller, so @RestControllerAdvice never sees them.
// Spring's own bearer-token handlers set the status and the WWW-Authenticate header; this adds the same
// ProblemDetail body the rest of the API uses, so the React app can always read "detail".
public class ProblemDetailAuthHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final AuthenticationEntryPoint bearerEntryPoint = new BearerTokenAuthenticationEntryPoint();
    private final AccessDeniedHandler bearerDeniedHandler = new BearerTokenAccessDeniedHandler();

    // 401: no token, an expired one, or a forged one
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException, ServletException {
        bearerEntryPoint.commence(request, response, ex);
        write(request, response, HttpStatus.UNAUTHORIZED, "Log in first: the token is missing, expired or invalid");
    }

    // 403: logged in, but not allowed (for when you add roles, such as admin-only endpoints)
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException, ServletException {
        bearerDeniedHandler.handle(request, response, ex);
        write(request, response, HttpStatus.FORBIDDEN, "You are not allowed to do this");
    }

    private static void write(HttpServletRequest request, HttpServletResponse response, HttpStatus status, String detail)
            throws IOException {
        Map<String, Object> problem = new LinkedHashMap<>();
        problem.put("title", status.getReasonPhrase());
        problem.put("status", status.value());
        problem.put("detail", detail);
        problem.put("instance", request.getRequestURI());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        JsonMapper.shared().writeValue(response.getWriter(), problem);   // real JSON escaping, not string pasting
    }
}
```

Use it for the resource server and for exception handling in `SecurityConfig`:

```java
// in SecurityConfig.java
private final ProblemDetailAuthHandler authErrors = new ProblemDetailAuthHandler();

@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
            // No login page and no session cookie: each request proves who it is with a token.
            // CSRF attacks ride on cookies the browser sends by itself, so without cookies CSRF protection isn't needed.
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(Customizer.withDefaults())                      // uses the corsConfigurationSource bean below
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**", "/api/ping", "/actuator/health").permitAll()
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .anyRequest().authenticated())
            // Authorization: Bearer <token>. Spring checks the signature and expiry with the JwtDecoder below;
            // a missing, expired or forged token gets a 401, with a ProblemDetail body like every other error
            .oauth2ResourceServer(oauth -> oauth
                    .jwt(Customizer.withDefaults())
                    .authenticationEntryPoint(authErrors)
                    .accessDeniedHandler(authErrors))
            .exceptionHandling(errors -> errors
                    .authenticationEntryPoint(authErrors)
                    .accessDeniedHandler(authErrors));
    return http.build();
```

**2. A last-resort handler for everything else,** in `GlobalExceptionHandler` (imports: `jakarta.servlet.http.HttpServletRequest`, `org.slf4j.Logger`, `org.slf4j.LoggerFactory`; and a `private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);`):

```java
// in GlobalExceptionHandler.java
// Anything nobody planned for (a bug, the database down): the full error goes to OUR log, and the client gets
// a short message with no stack trace, SQL or class names that would help an attacker
@ExceptionHandler(Exception.class)
public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
    log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), ex);
    return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on our side. Please try again.");
}
```

The more specific handlers still win: Spring picks the closest matching exception type, so this one only catches what nothing else does.

**3. Tests**, in `TaskControllerTest` (import `static …MockMvcResultMatchers.content`):

```java
// in TaskControllerTest.java
@Test
void withoutATokenIs401() throws Exception {
    mvc.perform(get("/api/tasks/5"))
            .andExpect(status().isUnauthorized())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.detail").value("Log in first: the token is missing, expired or invalid"));

    verifyNoInteractions(taskService);
}

@Test
void aBrokenTokenIs401Too() throws Exception {
    mvc.perform(get("/api/tasks/5").header("Authorization", "Bearer not.a.token"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().exists("WWW-Authenticate"))
            .andExpect(jsonPath("$.status").value(401));
}

@Test
void anUnexpectedErrorIs500WithoutDetails() throws Exception {
    when(taskService.get(1L, 5L)).thenThrow(new IllegalStateException("connection pool exhausted at db-7"));

    mvc.perform(get("/api/tasks/5").with(ANA))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.detail").value("Something went wrong on our side. Please try again."));
}
```

**4. Try it.** These are real answers now:

```text
GET /api/projects (no token)       → 401 {"title":"Unauthorized","status":401,"detail":"Log in first: the token is missing, expired or invalid","instance":"/api/projects"}
GET /api/projects (Bearer abc.def) → 401 the same body, plus WWW-Authenticate: Bearer error="invalid_token", …
PUT /api/ping                      → 405 {"detail":"Method 'PUT' is not supported.","instance":"/api/ping","status":405,"title":"Method Not Allowed"}
```

**✅ Checkpoint**

- [ ] Every error from the API, whatever caused it, is `application/problem+json` with a `detail`.
- [ ] A bug answers 500 with a generic message, and the full stack trace is in the server log. Commit: `step 17: one error format`.

<!-- subtopic: b66_t1_s2 -->
### Step 18: a security review

**Goal:** go through the project the way a reviewer would, with the OWASP Top 10 in mind (Day 61's notes). For each row, find the code that does it, and be ready to explain it in an interview.

| Risk | What protects the Task Manager | Where |
|---|---|---|
| Stolen passwords | BCrypt hashes with a random salt each; passwords never logged or returned | `AuthService`, `UserResponse` |
| Guessing which emails exist | the same 401 for an unknown email and a wrong password | `AuthService.login` |
| Seeing other users' data (broken access control) | every query filters by the owner from the token; others' data is a 404 | the repositories, `ProjectService`, `TaskService` |
| Forged or old tokens | HS256 signature and a 15-minute expiry, checked on every request | `SecurityConfig.jwtDecoder` |
| Leaked secrets | the JWT secret and database password come from environment variables in prod; prod won't start without them | `application-prod.properties`, `JwtProperties` |
| Bad input | validation on every request DTO, `CHECK` constraints in the database | the request records, `V1__…sql` |
| SQL injection | JPA binds every value as a parameter; no SQL is built from strings | the repositories |
| Other websites calling the API from a browser | CORS allows only the configured origins | `CorsProperties`, `SecurityConfig` |
| CSRF | no cookies or sessions, so there's nothing for a forged request to ride on | `SecurityConfig` (stateless) |
| Leaking internals in errors | `ProblemDetail` messages only; stack traces stay in the log | `GlobalExceptionHandler` |
| Huge requests | page size capped at 100, string lengths capped | `max-page-size`, `@Size` |

**What a real product would add next** (say these in an interview; you don't need to build them now):

- **Rate limiting** on `/api/auth/login`, so nobody can try thousands of passwords (Bucket4j, or the API gateway).
- **Refresh tokens** in an HttpOnly cookie, so users stay logged in longer than 15 minutes without a long-lived access token (today's Spring Security topic, and Module 25 for the browser side).
- **HTTPS everywhere**, done by the server or load balancer in front of the app (Days 73 onward).
- **Dependency scanning** (GitHub's Dependabot) to hear about vulnerable libraries.

**✅ Checkpoint**

- [ ] You can point at the code for every row, and explain each "add next" item in a sentence.

<!-- topic: b66_t2 -->
## 🌿 Spring Security — Beyond Access Tokens

<!-- intro: d23_t1_s4 -->
Your Task Manager's tokens last 15 minutes, then the user must log in again. JWTs can't easily be cancelled once issued, so they're kept **short-lived**. Real apps add a longer-lived **refresh token** (days), used only to get a new access token, and revocable on logout: users stay logged in, and a stolen access token is only useful briefly. This is the first item on step 18's "add next" list.

<!-- intro: d23_t1_s5 -->
"Log in with Google" uses **OAuth2** and **OpenID Connect**: instead of your app handling passwords, a trusted **authorization server** (Google, Okta, Keycloak) logs the user in and gives your app a token. Your API is already a **resource server** that checks tokens: with an authorization server it would check that server's tokens instead of making its own. For browser and mobile apps the flow uses **PKCE**, which stops stolen login codes from being used. Recognise the terms; you'll configure them when a project needs it.

## 📝 Day 66 Recap

1. @WebMvcTest vs @SpringBootTest? → **the web layer with mocked services vs the whole application**
2. What does the end-to-end test catch that unit tests can't? → **wrong queries and wiring, because unit tests mock the repositories**
3. Why a separate test database? → **tests must never change your dev data**
4. Where does demo data go? → **a CommandLineRunner in the dev profile only, skipped if it already exists**
5. Why doesn't @RestControllerAdvice handle a 401? → **security errors happen in filters, before any controller runs**
6. How do you give 401s a ProblemDetail body? → **a custom AuthenticationEntryPoint (and AccessDeniedHandler for 403)**
7. What does a last-resort @ExceptionHandler(Exception.class) do? → **logs the full error and returns a generic 500 without internals**
8. Why is CSRF protection off? → **the API uses tokens, not cookies, so a forged request has nothing to ride on**
9. What is a refresh token for? → **getting a new access token without logging in again**
10. What is OAuth2/OpenID Connect used for? → **letting a trusted provider log users in and issue tokens ("Log in with Google")**

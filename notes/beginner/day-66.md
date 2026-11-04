# Day 66 — Project Day 2: Errors, Security Review and a Runnable Jar

> Yesterday you proved the API works. Today you make it consistent and safe, and package it the way it will run on a server.

**Today's goal:** the same error format for every failure (including security errors and bugs), a security review of the whole project, a code review with the last missing tests, and a jar that starts with the prod profile.

<!-- topic: b66_t1 -->
## 🛠️ Project — Finish the Task Manager API (Part 2)

<!-- subtopic: b66_t1_s1 -->
### Step 16: one error format everywhere

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
- [ ] A bug answers 500 with a generic message, and the full stack trace is in the server log. Commit: `step 16: one error format`.

<!-- subtopic: b66_t1_s2 -->
### Step 17: a security review

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
- **Refresh tokens** in an HttpOnly cookie, so users stay logged in longer than 15 minutes without a long-lived access token (Module 25 explains the setup).
- **HTTPS everywhere**, done by the server or load balancer in front of the app (Days 73 onward).
- **Dependency scanning** (GitHub's Dependabot) to hear about vulnerable libraries.

**✅ Checkpoint**

- [ ] You can point at the code for every row, and explain each "add next" item in a sentence.

<!-- subtopic: b66_t1_s3 -->
### Step 18: a code review and the last tests

**Goal:** read your own project as a stranger would, and fill the one gap in the tests: `ProjectController` has none.

```java
// src/test/java/com/example/taskmanager/project/ProjectControllerTest.java
package com.example.taskmanager.project;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.example.taskmanager.security.SecurityConfig;

@WebMvcTest(ProjectController.class)
@Import(SecurityConfig.class)
class ProjectControllerTest {

    static final RequestPostProcessor ANA = jwt().jwt(token -> token.subject("ana@example.com").claim("uid", 1L));

    @Autowired
    MockMvc mvc;

    @MockitoBean
    ProjectService projectService;

    @Test
    void createReturns201WithLocation() throws Exception {
        when(projectService.create(eq(1L), any())).thenReturn(new ProjectResponse(3L, "Website", 0, 0));

        mvc.perform(post("/api/projects").with(ANA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Website"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/projects/3"))
                .andExpect(jsonPath("$.name").value("Website"));
    }

    @Test
    void listIsAPlainArrayWithCounts() throws Exception {
        when(projectService.list(1L)).thenReturn(List.of(new ProjectResponse(3L, "Website", 4, 1)));

        mvc.perform(get("/api/projects").with(ANA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].taskCount").value(4))
                .andExpect(jsonPath("$[0].doneCount").value(1));
    }

    @Test
    void nameIsRequired() throws Exception {
        mvc.perform(post("/api/projects").with(ANA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("name: must not be blank"));
    }

    @Test
    void deleteReturns204() throws Exception {
        mvc.perform(delete("/api/projects/3").with(ANA))
                .andExpect(status().isNoContent());

        verify(projectService).delete(1L, 3L);
    }
}
```

**A review checklist**, for this project and every one after it:

- [ ] **Names** say what things are (`findByIdAndProjectOwnerId` beats `getTask2`), and every class sits in its feature's package.
- [ ] **No dead code:** unused imports, commented-out code, the `showProxy` bean from Day 64. IntelliJ: *Code → Optimize Imports*, and look for grey (unused) code.
- [ ] **Controllers are thin:** they take the request, call one service method and return. Rules live in services.
- [ ] **No entity leaves a service:** controllers only see DTO records.
- [ ] **Every write is in a transaction**, and reads are `readOnly`.
- [ ] **Comments explain why**, not what the code already says.
- [ ] **Each test can fail:** you broke the code once and saw it fail.

Then run everything:

```bash
./mvnw test
```

```text
[INFO] Tests run: 40, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

That's 37 unit and slice tests (they run in about 10 seconds, with no database) and the 3 end-to-end tests.

**✅ Checkpoint**

- [ ] 40 tests pass, and the checklist is clean. Commit: `step 18: code review`.

<!-- subtopic: b66_t1_s4 -->
### Step 19: a runnable jar with the prod profile

**Goal:** the app as one file that runs anywhere with Java 21, configured only by environment variables: exactly how it will run in Docker and on a server (Days 73 onward).

**1. Build it.** `package` runs the tests first, then puts your code and every library into one "fat" jar:

```bash
./mvnw clean package
```

```text
[INFO] Building jar: …/target/taskmanager-0.0.1-SNAPSHOT.jar
[INFO] BUILD SUCCESS
```

**2. Run it as production.** In Git Bash or macOS/Linux:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/taskmanager DB_USER=postgres DB_PASSWORD=postgres
export JWT_SECRET=$(openssl rand -base64 48) CORS_ORIGINS=http://localhost:5173
java -jar target/taskmanager-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

In PowerShell:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/taskmanager"; $env:DB_USER = "postgres"; $env:DB_PASSWORD = "postgres"
$env:JWT_SECRET = [Convert]::ToBase64String([byte[]](1..48 | ForEach-Object { Get-Random -Maximum 256 }))
$env:CORS_ORIGINS = "http://localhost:5173"
java -jar target/taskmanager-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

The log says `The following 1 profile is active: "prod"`, there are no SQL lines and no debug lines, and there's no demo user. `curl localhost:8080/actuator/health` answers `{"status":"UP"}` (no details in prod).

A new random `JWT_SECRET` on every start means everyone has to log in again after a restart: in a real deployment the secret is stored once in the platform's secret manager and stays the same.

**✅ Checkpoint**

- [ ] The jar starts with `prod`, refuses to start without the variables, and `/actuator/health` is UP.
- [ ] Commit: `step 19: runnable jar` (the jar itself stays out of Git: `target/` is ignored).

**If it doesn't work:** "no main manifest attribute" means the `spring-boot-maven-plugin` is missing from the `pom.xml` (the Initializr adds it). "Unsupported class file major version" means `java -version` is older than 21.

## 📝 Day 66 Recap

1. Why doesn't @RestControllerAdvice handle a 401? → **security errors happen in filters, before any controller runs**
2. How do you give 401s a ProblemDetail body? → **a custom AuthenticationEntryPoint (and AccessDeniedHandler for 403)**
3. What does a last-resort @ExceptionHandler(Exception.class) do? → **logs the full error and returns a generic 500 without internals**
4. Do specific handlers still run with a catch-all present? → **yes, Spring picks the closest matching exception type**
5. Why the same 401 for unknown email and wrong password? → **so attackers can't find out which emails have accounts**
6. Why is CSRF protection off? → **the API uses tokens, not cookies, so a forged request has nothing to ride on**
7. What would you add before a real launch? → **rate limiting on login, refresh tokens, HTTPS, dependency scanning**
8. What should controllers do? → **take the request, call one service method, return a DTO**
9. Build a runnable jar? → **./mvnw clean package, then java -jar target/….jar**
10. Choose the profile when running a jar? → **--spring.profiles.active=prod (or SPRING_PROFILES_ACTIVE)**

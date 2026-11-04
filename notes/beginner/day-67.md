# Day 67 — Project Day 3: Jar, README, GitHub and Phase 7 Review

> The last project day: package the app, make it easy to understand in two minutes, put it online, and check it's ready for the React app. Then review Phase 7.

**Today's goal:** a code review and a runnable jar, the README, a push to GitHub with a release tag, a check that the API matches what the React app (Module 29) expects, and the big Spring ideas explained without notes.

<!-- topic: b67_t1 -->
## 🛠️ Project — Finish the Task Manager API (Part 3)

<!-- subtopic: b66_t1_s3 -->
### Step 19: a code review and the last tests

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

That's 37 unit and slice tests (they run in about 10 seconds, with no database) and the 3 end-to-end tests from step 15.

**✅ Checkpoint**

- [ ] 40 tests pass, and the checklist is clean. Commit: `step 19: code review`.

<!-- subtopic: b66_t1_s4 -->
### Step 20: a runnable jar with the prod profile

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
- [ ] Commit: `step 20: runnable jar` (the jar itself stays out of Git: `target/` is ignored).

**If it doesn't work:** "no main manifest attribute" means the `spring-boot-maven-plugin` is missing from the `pom.xml` (the Initializr adds it). "Unsupported class file major version" means `java -version` is older than 21.

<!-- subtopic: b67_t1_s1 -->
### Step 21: a README

**Goal:** someone who has never seen your project (a recruiter, an interviewer, you in six months) understands what it is and runs it in five minutes. Create `README.md` in the project folder:

````markdown
# Task Manager API

A REST API for projects and tasks with JWT login, where every user sees only their own data.
Built with Java 21, Spring Boot 4, Spring Security, Spring Data JPA, PostgreSQL and Flyway.

## Run it

1. Java 21 and PostgreSQL. Create two databases: `CREATE DATABASE taskmanager;` and `CREATE DATABASE taskmanager_test;`
2. `./mvnw spring-boot:run` (dev profile: demo user `demo@example.com` / `demo-password`)
3. Open http://localhost:8080/swagger-ui.html

Tests: `./mvnw test` (40 tests; the end-to-end ones use `taskmanager_test`).

## API

| Method | Path | Does |
|---|---|---|
| POST | /api/auth/signup | create an account |
| POST | /api/auth/login | get a JWT (valid 15 minutes) |
| GET, POST | /api/projects | my projects (with task counts), create one |
| GET, DELETE | /api/projects/{id} | one project; delete it with its tasks |
| GET, POST | /api/projects/{id}/tasks | a page of tasks (?status=&page=&size=&sort=), add one |
| GET, PATCH, DELETE | /api/tasks/{id} | one task |

Every error is a ProblemDetail (`application/problem+json`) with a `detail` message.

## Design decisions

- **Package by feature** (project, task, user, security, common).
- **DTO records** in and out; entities never leave the services.
- **Ownership in every query**: another user's data is a 404, not a 403, so its existence isn't revealed.
- **Project counts in one query** (JPQL constructor expression) instead of N+1 queries.
- **Flyway** owns the schema; Hibernate only validates it.
- **Stateless JWT** (HS256, 15 minutes), so CSRF protection isn't needed.
- **Profiles**: dev on a laptop; prod configured only by environment variables and refusing to start without them.

## Production

`./mvnw clean package`, then run the jar with `--spring.profiles.active=prod` and
`DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (32+ characters) and `CORS_ORIGINS` set.

## Next

Refresh tokens, rate limiting on login, Docker and Testcontainers, deployment.
````

Add the ER diagram from Day 54 under the API table (GitHub draws ```` ```mermaid ```` blocks), and a screenshot of Swagger UI or, after Day 69, of the React app.

**✅ Checkpoint**

- [ ] A friend (or you, in a new folder) can clone and run it using only the README. Commit: `step 21: README`.

<!-- subtopic: b67_t1_s2 -->
### Step 22: push to GitHub and tag v1.0

**Goal:** the project online, with a version you can point to.

**1. Check nothing secret is in Git.** The only secrets in the repository should be dev-only ones (the dev JWT secret and the `postgres` default password). Search the whole history, not just the current files:

```bash
git log -p | grep -i -E "secret|password" | sort -u
```

If a real password ever got committed, change that password: deleting the file doesn't remove it from history.

**2. Create an empty repository** on GitHub named `task-manager-api` (no README, since you have one), then:

```bash
git remote add origin https://github.com/YOUR-NAME/task-manager-api.git
git branch -M main
git push -u origin main
git tag -a v1.0 -m "Task Manager API: complete"
git push origin v1.0
```

**3. Make it look finished:** a one-line description and topics on the repository page (`spring-boot`, `java`, `rest-api`, `jwt`, `postgresql`), and pin it on your GitHub profile. Your commits, one per step, tell the story of how you built it: that's worth more than one giant "initial commit".

**✅ Checkpoint**

- [ ] The repository is public, the README renders with its tables and diagram, and the `v1.0` tag is there.

<!-- subtopic: b67_t1_s3 -->
### Step 23: ready for the React app

**Goal:** on Day 69 the React app from the Frontend section (Module 29, step 7) switches from its fake API to this one. Check now that everything it relies on is true, so that day is about React, not about debugging Spring.

| The React app expects | Your API | Step |
|---|---|---|
| the API on port 8080, called through Vite's proxy at `/api` | the default port, every path under `/api` | 1 |
| `GET /api/projects` returns a plain list of `{id, name}` | a list of `ProjectResponse` (`taskCount` and `doneCount` are extra and harmless) | 6 |
| `GET /api/projects/{id}/tasks?status=&page=&size=` returns `{content, totalPages}` | `PageResponse` | 6 |
| tasks look like `{id, title, status, priority, dueDate}` | `TaskResponse` | 2 |
| `PATCH` changes only the fields sent; `DELETE` answers 204 | `UpdateTaskRequest` with nulls skipped | 2 |
| a 400's `detail` looks like `title: must not be blank` | `handleMethodArgumentNotValid` | 3 |
| `POST /api/auth/signup` then `POST /api/auth/login` returns `{"token": …}` | `AuthController` | 8, 9 |
| the token's `sub` is the email and `exp` is when it ends | `TokenService` | 9 |
| two users never see each other's projects | the owner filter in every query | 12 |
| a 401 when the token is missing or expired (the app then logs out) | the resource server, with a ProblemDetail body | 9, 17 |
| calls from `http://localhost:5173` are allowed (when not using the proxy) | `app.cors.allowed-origins` in dev | 8, 10 |

**One last check, the browser's way.** With the app running, open any website's DevTools console and run:

```js
fetch("http://localhost:8080/api/ping").then(r => r.json()).then(console.log)
```

From most websites this fails with a CORS error: correct, only `http://localhost:5173` is allowed. On Day 69 the same call from the React app works.

**What's next for this API:** on Days 73–74 you put it in a Docker container and replace the hand-made test database with Testcontainers; later it gets deployed to AWS. You'll keep building on this project, so keep it tidy.

**✅ Checkpoint**

- [ ] Every row of the table is true for your API. 🎉 You've built a complete, tested, secured backend.

<!-- topic: b67_t2 -->
## 🌿 Spring — Review

<!-- intro: d26_t1_s2 -->
Explain the N+1 problem in a minute without notes (Day 59): what it is, how the project-count query in your project avoids it, and the other fixes (JOIN FETCH, `@EntityGraph`, `@BatchSize`).

<!-- intro: d26_t1_s3 -->
Walk through your own project's login end to end, out loud (Days 61, 62 and 65): sign-up with a BCrypt hash, login issuing a JWT, the client sending `Authorization: Bearer`, the resource server checking it and setting the security context, and the service filtering by the owner.

<!-- intro: d26_t1_s4 -->
Explain where you used `@WebMvcTest` (Day 57) and where `@SpringBootTest` (Day 66) in your project, and what each one starts.

<!-- intro: d22_t1_s6 -->
Hibernate remembers entities it has already loaded **within a transaction** (the first-level cache), so asking for the same id twice runs only one query: it's also how dirty checking (Day 60) knows what changed. A second-level cache shared across transactions exists too, but needs extra setup; caching in general is Day 92's topic.

<!-- intro: d25_t1_s8 -->
Spring Boot 3 changed package names from `javax.*` to **`jakarta.*`** (your entities import `jakarta.persistence`; old tutorials still say `javax.persistence`), and can compile apps to native executables with GraalVM for very fast startup. The first matters every time you copy code from an older article.

## 📝 Day 67 Recap

1. Build a runnable jar? → **./mvnw clean package, then java -jar target/….jar**
2. Choose the profile when running a jar? → **--spring.profiles.active=prod (or SPRING_PROFILES_ACTIVE)**
3. What must a README answer first? → **what the project is and how to run it**
4. A real password was committed: what now? → **change the password; deleting the file doesn't remove it from history**
5. Mark a release in Git? → **an annotated tag, e.g. git tag -a v1.0, then push it**
6. Three N+1 fixes? → **JOIN FETCH, @EntityGraph, @BatchSize (or one aggregate query)**
7. JWT login flow in one line? → **login → signed token → Bearer header → resource server verifies → security context → owner filter**
8. First-level cache? → **the entities one transaction has loaded; the same id twice is one query**
9. Old javax.persistence in Spring Boot 3 becomes? → **jakarta.persistence**
10. Top thing interviewers ask about a project? → **what you'd change and why: design decisions and trade-offs**

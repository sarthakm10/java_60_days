# Day 65 — Project Day 1: Walk Through, Document and Test the API

> Your Task Manager API works: you built it a step a day since Day 54. These three days turn it from "works on my laptop" into a project you can hand to someone else, and show in an interview.

**Today's goal:** use the whole API once from start to finish, give it interactive documentation, prove it end to end with a test against a real database, and give it demo data.

<!-- topic: b65_t1 -->
## 🛠️ Project — Finish the Task Manager API (Part 1)

<!-- subtopic: b65_t1_s1 -->
### Step 12: walk through the whole API

**Goal:** use every endpoint once, the way a client will, including the errors. Anything that surprises you here is a bug to fix before going further. Start the app (dev profile) and follow along with curl or Postman.

**1. An account and a token:**

```bash
curl -i -X POST localhost:8080/api/auth/signup -H "Content-Type: application/json" \
     -d '{"email":"ana@example.com","password":"correct-horse"}'          # 201
curl -X POST localhost:8080/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"ana@example.com","password":"correct-horse"}'          # {"token":"eyJ…"}
TOKEN=eyJ...                                                              # paste yours
AUTH="Authorization: Bearer $TOKEN"
```

**2. Projects and tasks:**

```bash
curl -X POST localhost:8080/api/projects -H "$AUTH" -H "Content-Type: application/json" -d '{"name":"Website"}'
curl -X POST localhost:8080/api/projects/1/tasks -H "$AUTH" -H "Content-Type: application/json" \
     -d '{"title":"Write tests","priority":4,"dueDate":"2026-12-31"}'
curl -X PATCH localhost:8080/api/tasks/1 -H "$AUTH" -H "Content-Type: application/json" -d '{"status":"DONE"}'
curl "localhost:8080/api/projects/1/tasks?status=DONE&sort=dueDate,asc" -H "$AUTH"
curl localhost:8080/api/projects -H "$AUTH"                 # taskCount 1, doneCount 1
curl -i -X DELETE localhost:8080/api/tasks/1 -H "$AUTH"     # 204
```

(Use your own ids: they come from the database and keep counting up.)

**3. Every error**, each with a `ProblemDetail` body:

| Try | Status | `detail` |
|---|---|---|
| no `Authorization` header | 401 | the token is missing, expired or invalid |
| login with a wrong password | 401 | Wrong email or password |
| sign up with a taken email | 409 | An account with … already exists |
| a task with `"title":""` | 400 | title: must not be blank |
| `"priority":9` | 400 | priority: must be less than or equal to 5 |
| a due date in the past | 400 | dueDate: must be a date in the present or in the future |
| `?sort=colour` | 400 | sort: no field named 'colour' |
| `GET /api/tasks/999` | 404 | Task 999 not found |
| someone else's task | 404 | Task 7 not found (the same as a missing one) |

(The 401 body comes in tomorrow's step 16; today a missing token gets an empty 401.) This table, with the endpoint table from Day 54, is your API's contract: put both in the README on Day 67.

**✅ Checkpoint**

- [ ] Every row of the table answers as shown. Anything else is a bug: fix it now, with a test that would have caught it.

<!-- subtopic: b65_t1_s2 -->
### Step 13: interactive API docs with Swagger UI

**Goal:** a web page that lists every endpoint with its request and response shapes, generated from your code, where anyone can try the API (with a token) without curl.

**1. Add springdoc**, which reads your controllers and DTOs and serves an OpenAPI description plus the Swagger UI page. Use the newest **3.x** version listed at [springdoc.org](https://springdoc.org) (3.x is for Spring Boot 4; 2.x is for Boot 3):

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>3.0.0</version>
</dependency>
```

**2. A title, and an Authorize button for the JWT:**

```java
// src/main/java/com/example/taskmanager/common/OpenApiConfig.java
package com.example.taskmanager.common;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

// The title on the Swagger UI page, and an "Authorize" button that takes a JWT and sends it with every request
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Task Manager API", version = "1.0", description = "Projects and tasks, with JWT login"),
        security = @SecurityRequirement(name = "bearer"))
@SecurityScheme(name = "bearer", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
```

**3. Let the docs through security** (they're public: they describe the API, they don't open it). In `SecurityConfig`:

```java
// in SecurityConfig.java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**", "/api/ping", "/actuator/health").permitAll()
        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
        .anyRequest().authenticated())
```

**4. Try it.** Open [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html). Expand `POST /api/auth/login`, *Try it out*, log in, copy the token, click **Authorize** and paste it. Now every *Try it out* sends the token. The raw description is at `/v3/api-docs`: tools (and Postman's import) can generate clients from it.

**✅ Checkpoint**

- [ ] Swagger UI lists all endpoints with their DTOs, and after Authorize you can create a project from the page.
- [ ] Commit: `step 13: Swagger UI`.

<!-- subtopic: b65_t1_s3 -->
### Step 14: an end-to-end test against a real database

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
- [ ] Breaking the ownership check makes it fail. Commit: `step 14: end-to-end tests`.

**If it doesn't work:** "database taskmanager_test does not exist" means step 1 was skipped. If tests pass alone but fail together, two tests probably share an email: `newUserToken()` makes a fresh one each time for exactly this reason.

<!-- subtopic: b65_t1_s4 -->
### Step 15: demo data on startup

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
- [ ] Commit: `step 15: demo data`.

## 📝 Day 65 Recap

1. What do you check in a walk-through? → **every endpoint once, including each error case and its status code**
2. Someone else's task: 403 or 404? → **404, so the API doesn't reveal that it exists**
3. What does springdoc generate? → **an OpenAPI description (/v3/api-docs) and the Swagger UI page**
4. How does Swagger UI send a JWT? → **a bearer security scheme and the Authorize button**
5. @WebMvcTest vs @SpringBootTest? → **the web layer with mocked services vs the whole application**
6. What does the end-to-end test catch that unit tests can't? → **wrong queries and wiring, because unit tests mock the repositories**
7. Why a separate test database? → **tests must never change your dev data**
8. Read a value from a JSON answer in a test? → **JsonPath.read(body, "$.id")**
9. Why does each test sign up a new user? → **random emails keep tests independent of each other**
10. Where does demo data go? → **a CommandLineRunner in the dev profile only, skipped if it already exists**

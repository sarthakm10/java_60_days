# Day 57 — Testing Spring Boot Apps

> Day 46 introduced JUnit. Today you test real Spring code: services with fake dependencies, and controllers without starting a server. Read each 🌱 **In simple words** box first.

**Today's goal:** decide what kind of test to write, mock dependencies with Mockito, and test controllers with MockMvc.

<!-- topic: b57_t1 -->
## 🌿 Testing — Mockito & Spring Tests

<!-- intro: d24_t1_s1 -->
Not all tests are equal. **Unit tests** check one class alone: thousands of them run in seconds. **Integration tests** check several parts together (controller + service, or service + real database): slower, fewer. **End-to-end tests** drive the whole running system like a user: slowest, fewest. Picture a pyramid: a wide base of unit tests, fewer integration tests in the middle, a small tip of end-to-end tests.

<!-- intro: d24_t1_s6 -->
To unit-test `OrderService` without a real database or email server, you give it **fakes** made by **Mockito**: `mock(OrderRepository.class)` creates a stand-in object. `when(repo.findById(1L)).thenReturn(Optional.of(order))` tells it what to answer, and `verify(email).send(...)` checks that your code called it. This is exactly why constructor injection (Day 52) matters: the test just passes mocks to the constructor.

<!-- intro: d24_t1_s2 -->
Spring offers test annotations of different sizes. `@SpringBootTest` starts the **whole** application: the most realistic, and the slowest. **Slice** tests start only one layer: `@WebMvcTest` loads just the web layer (your controllers) and `@DataJpaTest` just the database layer. Prefer the smallest test that proves what you need.

<!-- intro: d24_t1_s3 -->
**MockMvc** sends fake HTTP requests to your controllers without a real server: `mockMvc.perform(get("/api/products/1")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Mouse"))`. It checks status codes, headers and the JSON body, which turns Day 55's checklist into automated tests.

<!-- intro: d24_t1_s4 -->
In a `@WebMvcTest`, the controller still needs its service, but you don't want the real one. **`@MockitoBean`** (called `@MockBean` in older Spring Boot versions) puts a Mockito mock into Spring's container in place of the real bean, so you control what the "service" returns and test only the controller's HTTP behaviour.

👉 **Code Practice** has three exercises: a Mockito unit test, parameterised tests that catch a real bug, and a `@WebMvcTest`.

<!-- topic: b57_t2 -->
## 🛠️ Project — Task Manager API (Step 4)

<!-- subtopic: b57_t2_s1 -->
### Step 4: tests for the service and the controller

**Goal:** automated tests that prove the rules from steps 2 and 3, and that keep proving them after every later change. Two kinds, as today's notes explain: a **unit test** for `TaskService` (plain Java, Mockito for its dependency) and a **web slice test** for `TaskController` (`@WebMvcTest`: the web layer only, with the service mocked). The test starter (JUnit 5, Mockito, AssertJ, MockMvc) is already in your `pom.xml`.

Test classes go in `src/test/java`, in the same package as the class they test:

```java
// src/test/java/com/example/taskmanager/task/TaskServiceTest.java
package com.example.taskmanager.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.taskmanager.common.NotFoundException;
import com.example.taskmanager.project.Project;
import com.example.taskmanager.project.ProjectService;

// A plain unit test: no Spring, no web server. ProjectService is a Mockito mock, so only TaskService is tested.
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    ProjectService projectService;

    TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(projectService);
    }

    @Test
    void newTaskStartsAsTodoWithPriority3() {
        when(projectService.find(1L)).thenReturn(new Project(1L, "Website"));

        TaskResponse task = taskService.create(1L, new CreateTaskRequest("Write tests", null, null, null));

        assertThat(task.status()).isEqualTo(TaskStatus.TODO);
        assertThat(task.priority()).isEqualTo(3);
    }

    @Test
    void creatingInAMissingProjectFails() {
        when(projectService.find(9L)).thenThrow(new NotFoundException("Project 9 not found"));

        assertThatThrownBy(() -> taskService.create(9L, new CreateTaskRequest("Write tests", null, null, null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Project 9 not found");
    }

    @Test
    void updateChangesOnlyTheFieldsSent() {
        when(projectService.find(1L)).thenReturn(new Project(1L, "Website"));
        LocalDate due = LocalDate.now().plusDays(7);
        TaskResponse created = taskService.create(1L, new CreateTaskRequest("Write tests", "unit + web", 4, due));

        TaskResponse updated = taskService.update(created.id(), new UpdateTaskRequest(null, null, TaskStatus.DONE, null, null));

        assertThat(updated.status()).isEqualTo(TaskStatus.DONE);
        assertThat(updated.title()).isEqualTo("Write tests");   // unchanged
        assertThat(updated.priority()).isEqualTo(4);
        assertThat(updated.dueDate()).isEqualTo(due);
    }

    @Test
    void deletingAMissingTaskFails() {
        assertThatThrownBy(() -> taskService.delete(42L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Task 42 not found");
    }
}
```

```java
// src/test/java/com/example/taskmanager/task/TaskControllerTest.java
package com.example.taskmanager.task;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.taskmanager.common.NotFoundException;

// Starts only the web layer (TaskController, GlobalExceptionHandler, JSON, validation): no services, no server.
// TaskService is replaced by a mock, so each test decides what the service returns.
@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TaskService taskService;

    @Test
    void createReturns201WithLocation() throws Exception {
        when(taskService.create(eq(1L), any()))
                .thenReturn(new TaskResponse(5L, "Write tests", null, TaskStatus.TODO, 3, null));

        mvc.perform(post("/api/projects/1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Write tests"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/tasks/5"))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.status").value("TODO"));
    }

    @Test
    void blankTitleIs400AndNeverReachesTheService() throws Exception {
        mvc.perform(post("/api/projects/1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "  "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("title: must not be blank"))
                .andExpect(jsonPath("$.errors.title").value("must not be blank"));

        verifyNoInteractions(taskService);
    }

    @Test
    void priorityAbove5Is400() throws Exception {
        mvc.perform(patch("/api/tasks/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"priority": 9}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("priority: must be less than or equal to 5"));
    }

    @Test
    void missingTaskIs404ProblemDetail() throws Exception {
        when(taskService.get(99L)).thenThrow(new NotFoundException("Task 99 not found"));

        mvc.perform(get("/api/tasks/99"))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", "application/problem+json"))
                .andExpect(jsonPath("$.detail").value("Task 99 not found"));
    }

    @Test
    void deleteReturns204() throws Exception {
        mvc.perform(delete("/api/tasks/5"))
                .andExpect(status().isNoContent());

        verify(taskService).delete(5L);
    }
}
```

**Run them:** the green ▶ next to each class in IntelliJ, or all of them with:

```bash
./mvnw test
```

```text
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

(10 = your 9 tests + the `contextLoads` test the Initializr made, which checks the whole app starts.)

**Make sure the tests can fail.** A test that never fails proves nothing. Remove the `@Valid` from `create` in `TaskController` and run the tests again: `blankTitleIs400AndNeverReachesTheService` fails, because the blank title now reaches the service. Put `@Valid` back. Do this whenever you write a test: break the code on purpose, watch the test catch it.

**✅ Checkpoint**

- [ ] `./mvnw test` passes with 10 tests.
- [ ] Removing `@Valid` makes a test fail. Commit: `step 4: service and controller tests`.

**If it doesn't work:** "No qualifying bean of type TaskService" in `TaskControllerTest` means the `@MockitoBean` is missing (a `@WebMvcTest` doesn't create services). On Spring Boot 3.x the imports differ: `@WebMvcTest` is in `org.springframework.boot.test.autoconfigure.web.servlet`.

<!-- topic: b57_t3 -->
## 🧮 DSA — Full Timed Practice

A full mock coding round: two mediums and one hard in 90 minutes, then a written review of which patterns you spotted quickly and which you struggled with, plus a "top 15 patterns" cheat sheet update (building on Day 53's). Treat it like the real thing: timer on, no notes.

## 📝 Day 57 Recap

1. Shape of the test pyramid? → **many unit tests, fewer integration tests, very few end-to-end tests**
2. What is a unit test? → **a fast test of one class on its own**
3. Create a fake dependency with Mockito? → **mock(SomeClass.class)**
4. Tell a mock what to return? → **when(mock.method(...)).thenReturn(value)**
5. Check that a method was called? → **verify(mock).method(...)**
6. @SpringBootTest vs @WebMvcTest? → **whole application vs only the web layer**
7. Test a controller without starting a server? → **MockMvc in a @WebMvcTest**
8. Check a JSON field in MockMvc? → **jsonPath("$.field").value(...)**
9. Replace a bean with a mock in a Spring test? → **@MockitoBean (@MockBean in older versions)**
10. Why does constructor injection make testing easy? → **tests can pass mocks straight into the constructor**

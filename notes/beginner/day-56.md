# Day 56 — Validation and Error Handling

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** reject bad input automatically, turn exceptions into clean error responses in one place, and know the options for evolving an API.

<!-- topic: b56_t1 -->
## 🌿 Spring Boot — Validation & Errors

<!-- intro: d20_t1_s6 -->
Never trust what clients send. Instead of writing `if` checks in every controller (Day 14's setters, by hand), put **validation annotations** on your request DTO's fields (`@NotBlank`, `@Size(max = 100)`, `@Email`, `@Min(1)`, `@Positive`) and add `@Valid` before `@RequestBody`. Spring checks the object before your method runs, and invalid requests get a `400 Bad Request` automatically. (Add the **Validation** starter to your project.)

<!-- intro: d20_t1_s7 -->
When something goes wrong deep inside (a product isn't found, a rule is broken), your service throws an exception (Day 21). A class marked **`@RestControllerAdvice`** catches those exceptions for **every** controller in one place: an `@ExceptionHandler(ProductNotFoundException.class)` method turns it into a `404` with a clear JSON error body. Controllers stay clean, and every error looks the same to clients. Spring's standard error format is `ProblemDetail`.

<!-- intro: d20_t1_s8 -->
Once clients use your API, you can't change it freely: an app on someone's phone still expects the old format. **Versioning** (`/api/v1/...`, `/api/v2/...`) lets old and new versions live side by side. The section also covers HATEOAS and the Richardson maturity model, which you only need to recognise by name.

<!-- topic: b56_t2 -->
## 🛠️ Project — Task Manager API (Step 3)

<!-- subtopic: b56_t2_s1 -->
### Step 3: validation and error responses

**Goal:** bad input is refused with a 400 before it reaches your code, and every error, from any controller, has the same JSON shape: Spring's `ProblemDetail`. The React app (Module 29) shows these messages to users, so they matter.

**1. Rules on the request DTOs.** The Validation starter is already in your project (step 1):

```java
// src/main/java/com/example/taskmanager/project/CreateProjectRequest.java
package com.example.taskmanager.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// What a client sends to create a project: {"name": "Website"}
public record CreateProjectRequest(
        @NotBlank @Size(max = 100) String name) {
}
```

```java
// src/main/java/com/example/taskmanager/task/CreateTaskRequest.java
package com.example.taskmanager.task;

import java.time.LocalDate;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// {"title": "Write tests", "description": "...", "priority": 4, "dueDate": "2026-12-01"}; only title is required
public record CreateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Min(1) @Max(5) Integer priority,
        @FutureOrPresent LocalDate dueDate) {
}
```

```java
// src/main/java/com/example/taskmanager/task/UpdateTaskRequest.java
package com.example.taskmanager.task;

import java.time.LocalDate;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// PATCH body: send only the fields you want to change; a missing (null) field stays as it is.
// Every check skips null, so @NotBlank can't be used here: @Pattern rejects a title that is only spaces.
public record UpdateTaskRequest(
        @Pattern(regexp = ".*\\S.*", message = "must not be blank") @Size(max = 200) String title,
        @Size(max = 2000) String description,
        TaskStatus status,
        @Min(1) @Max(5) Integer priority,
        @FutureOrPresent LocalDate dueDate) {
}
```

**2. Ask Spring to check them** with `@Valid` before each `@RequestBody`, in both controllers (and `import jakarta.validation.Valid;`):

```java
// in ProjectController.java
@PostMapping
public ResponseEntity<ProjectResponse> create(@Valid @RequestBody CreateProjectRequest request) {
    ProjectResponse created = projectService.create(request);
    return ResponseEntity.created(URI.create("/api/projects/" + created.id())).body(created);
}
```

```java
// in TaskController.java
@PostMapping("/projects/{projectId}/tasks")
public ResponseEntity<TaskResponse> create(@PathVariable Long projectId, @Valid @RequestBody CreateTaskRequest request) {
    TaskResponse created = taskService.create(projectId, request);
    return ResponseEntity.created(URI.create("/api/tasks/" + created.id())).body(created);
}
```

```java
// in TaskController.java
@PatchMapping("/tasks/{id}")
public TaskResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTaskRequest request) {
    return taskService.update(id, request);
}
```

**3. One place for errors.** Remove `@ResponseStatus` from `NotFoundException` (the handler takes over):

```java
// src/main/java/com/example/taskmanager/common/NotFoundException.java
package com.example.taskmanager.common;

// Thrown when a project or task doesn't exist; GlobalExceptionHandler turns it into a 404
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
```

```java
// src/main/java/com/example/taskmanager/common/GlobalExceptionHandler.java
package com.example.taskmanager.common;

import java.util.Map;
import java.util.TreeMap;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

// One place that turns exceptions into error responses, for every controller. Every error body is a
// ProblemDetail: {"type", "title", "status", "detail", "instance"}. Extending ResponseEntityExceptionHandler
// gives Spring's own errors (unreadable JSON, a wrong type in the URL, an unsupported method) the same format.
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // @Valid failed: "detail" names one problem ("title: must not be blank"), "errors" lists every field
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new TreeMap<>();   // sorted by field name, so the order is always the same
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.putIfAbsent(e.getField(), e.getDefaultMessage()));
        String detail = errors.entrySet().stream()
                .findFirst()
                .map(e -> e.getKey() + ": " + e.getValue())
                .orElse("Invalid request");
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(problem);
    }
}
```

`ResponseEntityExceptionHandler` is Spring's own base class for this: by extending it, the errors Spring itself raises (broken JSON, `?status=NOPE`, a PUT where only GET exists) come back as `ProblemDetail` too, and you only override the one you want to word differently.

**4. Try the error cases again.** These are real answers:

```bash
curl -X POST localhost:8080/api/projects -H "Content-Type: application/json" -d '{"name":"  "}'
```

```text
{"detail":"name: must not be blank","instance":"/api/projects","status":400,"title":"Validation failed","errors":{"name":"must not be blank"}}
```

```bash
curl -X POST localhost:8080/api/projects/1/tasks -H "Content-Type: application/json" \
     -d '{"title":"","priority":9,"dueDate":"2020-01-01"}'
```

```text
{"detail":"dueDate: must be a date in the present or in the future","instance":"/api/projects/1/tasks","status":400,
 "title":"Validation failed","errors":{"dueDate":"must be a date in the present or in the future",
 "priority":"must be less than or equal to 5","title":"must not be blank"}}
```

```bash
curl localhost:8080/api/tasks/7                          # {"detail":"Task 7 not found",...,"status":404,"title":"Not Found"}
curl "localhost:8080/api/projects/1/tasks?status=NOPE"   # 400 "Failed to convert 'status' with value: 'NOPE'"
curl localhost:8080/api/projects/abc                     # 400 "Failed to convert 'id' with value: 'abc'"
```

Every error now has `Content-Type: application/problem+json` and a `detail`. The shape `"field: message"` in `detail` is on purpose: the React form in Module 29 splits it at the `:` to show the message under the right field.

**✅ Checkpoint**

- [ ] A blank name or title, a priority of 0 or 6, or a date in the past answers 400 with a clear `detail`, and nothing is saved.
- [ ] A missing task answers 404 with `"detail":"Task 7 not found"`. Commit: `step 3: validation and ProblemDetail errors`.

**If it doesn't work:** if invalid data still gets a 201, the `@Valid` is missing on that method. If the 400 body has no `errors`, check that the handler class has `@RestControllerAdvice` and is inside `com.example.taskmanager`.

<!-- topic: b56_t3 -->
## 🧮 DSA — Final Hard Practice

Four hard problems: N-Queens II and Sudoku Solver (backtracking, Day 44), Palindrome Partitioning II (DP), and a timed hard problem. Stretch goals; skip without guilt if Spring needs your energy today.

## 📝 Day 56 Recap

1. Where do validation rules go? → **as annotations on the request DTO's fields (@NotBlank, @Email...)**
2. What triggers validation of a request body? → **@Valid before @RequestBody**
3. Status for a request that fails validation? → **400 Bad Request**
4. Which starter adds validation? → **spring-boot-starter-validation**
5. Handle exceptions for all controllers in one place? → **a @RestControllerAdvice class**
6. Map an exception to a response? → **an @ExceptionHandler(SomeException.class) method**
7. Spring's standard error body format? → **ProblemDetail**
8. Why version an API? → **so old clients keep working while a new version changes things**
9. Common way to version? → **in the URL path, e.g. /api/v1/products**
10. Should controllers contain try/catch for every error? → **no, throw from the service and handle centrally**

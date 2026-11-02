Today you build the web layer: a REST controller with correct status codes, request validation with a global error handler, and — to demystify Spring Boot — your **own auto-configuration**.

**Dependencies to add:** Spring Web (`spring-boot-starter-webmvc` on Boot 4, `spring-boot-starter-web` on Boot 3) and Validation (`spring-boot-starter-validation`). For tests on Boot 4 also add `spring-boot-starter-webmvc-test` (test scope). On Boot 3, `@WebMvcTest` lives in `org.springframework.boot.test.autoconfigure.web.servlet` instead of `org.springframework.boot.webmvc.test.autoconfigure`.

<!-- exercise: d20_e1 | Medium | A REST controller with the right status codes -->
**Concepts:** `@RestController` · `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping` · `@PathVariable` · `@RequestBody` · `ResponseEntity` (`ok`, `created` + `Location`, `noContent`, `notFound`) · `@WebMvcTest` + `MockMvc`

**Task.** Implement `BookController` under `/api/books` on top of the given in-memory `BookStore`:

| Request | Success | Missing id |
|---|---|---|
| `GET /api/books` | 200 + list | — |
| `GET /api/books/{id}` | 200 + book | 404 |
| `POST /api/books` | **201** + body + `Location: /api/books/{id}` | — |
| `PUT /api/books/{id}` | 200 + updated book | 404 |
| `DELETE /api/books/{id}` | **204**, no body | 404 |

**Starter code**

```java
// src/main/java/com/example/practice/d20/books/Book.java
package com.example.practice.d20.books;

public record Book(Long id, String title, String author) { }
```

```java
// src/main/java/com/example/practice/d20/books/BookRequest.java
package com.example.practice.d20.books;

public record BookRequest(String title, String author) { }
```

```java
// src/main/java/com/example/practice/d20/books/BookStore.java
package com.example.practice.d20.books;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

@Component
public class BookStore {
    private final Map<Long, Book> books = new ConcurrentHashMap<>();
    private final AtomicLong ids = new AtomicLong();

    public List<Book> findAll() { return books.values().stream().sorted((a, b) -> a.id().compareTo(b.id())).toList(); }
    public Optional<Book> findById(long id) { return Optional.ofNullable(books.get(id)); }
    public Book save(BookRequest r) { Book b = new Book(ids.incrementAndGet(), r.title(), r.author()); books.put(b.id(), b); return b; }
    public Optional<Book> replace(long id, BookRequest r) { return findById(id).map(old -> { Book b = new Book(id, r.title(), r.author()); books.put(id, b); return b; }); }
    public boolean delete(long id) { return books.remove(id) != null; }
    public void clear() { books.clear(); }
}
```

```java
// src/main/java/com/example/practice/d20/books/BookController.java
package com.example.practice.d20.books;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {
    // TODO: inject BookStore and implement the five endpoints under /api/books
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d20/books/BookControllerTest.java
package com.example.practice.d20.books;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookController.class)
@Import(BookStore.class)
class BookControllerTest {

    @Autowired MockMvc mvc;
    @Autowired BookStore store;

    @BeforeEach
    void reset() { store.clear(); }

    @Test
    void postCreatesABookWith201AndLocation() throws Exception {
        mvc.perform(post("/api/books").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Clean Code\",\"author\":\"Robert Martin\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern(".*/api/books/\\d+")))
                .andExpect(jsonPath("$.title").value("Clean Code"));
    }

    @Test
    void getExistingBookReturns200() throws Exception {
        Book b = store.save(new BookRequest("Effective Java", "Joshua Bloch"));
        mvc.perform(get("/api/books/{id}", b.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.author").value("Joshua Bloch"));
    }

    @Test
    void getMissingBookReturns404() throws Exception {
        mvc.perform(get("/api/books/999")).andExpect(status().isNotFound());
    }

    @Test
    void listReturnsEveryBook() throws Exception {
        store.save(new BookRequest("A", "x"));
        store.save(new BookRequest("B", "y"));
        mvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].title").value("B"));
    }

    @Test
    void putReplacesTheBook() throws Exception {
        Book b = store.save(new BookRequest("Old", "x"));
        mvc.perform(put("/api/books/{id}", b.id()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"New\",\"author\":\"y\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New"));
        mvc.perform(put("/api/books/999").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"t\",\"author\":\"a\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteReturns204ThenTheBookIsGone() throws Exception {
        Book b = store.save(new BookRequest("Temp", "x"));
        mvc.perform(delete("/api/books/{id}", b.id())).andExpect(status().isNoContent());
        mvc.perform(get("/api/books/{id}", b.id())).andExpect(status().isNotFound());
        mvc.perform(delete("/api/books/{id}", b.id())).andExpect(status().isNotFound());
    }
}
```

**Expected result**

```text
BookControllerTest: 6 tests passed
```

<!-- hints -->
- Put `@RequestMapping("/api/books")` on the class and `@GetMapping("/{id}")` etc. on methods.
- `store.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build())` handles 200/404 in one line.
- Build the `Location` URI with `ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(saved.id()).toUri()` and return `ResponseEntity.created(uri).body(saved)`.
- `ResponseEntity.noContent().build()` for a successful DELETE — 204 must have no body.
- `@WebMvcTest(BookController.class)` starts only the web layer (no service/repository beans) — that's why the test `@Import`s `BookStore`.

<!-- solution -->
```java
// src/main/java/com/example/practice/d20/books/BookController.java
package com.example.practice.d20.books;

import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/books")
public class BookController {
    private final BookStore store;

    public BookController(BookStore store) { this.store = store; }

    @GetMapping
    public List<Book> list() { return store.findAll(); }                       // 200 by default

    @GetMapping("/{id}")
    public ResponseEntity<Book> get(@PathVariable long id) {
        return store.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Book> create(@RequestBody BookRequest request) {
        Book saved = store.save(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(saved.id()).toUri();
        return ResponseEntity.created(location).body(saved);                    // 201 + Location
    }

    @PutMapping("/{id}")
    public ResponseEntity<Book> replace(@PathVariable long id, @RequestBody BookRequest request) {
        return store.replace(id, request).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return store.delete(id) ? ResponseEntity.noContent().build()            // 204
                : ResponseEntity.notFound().build();
    }
}
```

**REST status cheat sheet.** 200 OK (read/update with body) · 201 Created + `Location` (create) · 204 No Content (delete, or update without body) · 400 Bad Request (validation) · 401 Unauthorized (not logged in) · 403 Forbidden (logged in, not allowed) · 404 Not Found · 409 Conflict (duplicate, version clash) · 422 Unprocessable (semantically invalid) · 500 (our bug) · 503 (dependency down).

<!-- exercise: d20_e2 | Medium | Validation and a global `ProblemDetail` error handler -->
**Concepts:** Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Min`, `@Size`) · `@Valid @RequestBody` · `MethodArgumentNotValidException` · `@RestControllerAdvice` + `@ExceptionHandler` · RFC 9457 `ProblemDetail` (`application/problem+json`) · custom exception → 404

**Task.**

1. Annotate `CreateUserRequest` so the given invalid request fails on `name`, `email`, `age` and `password`.
2. `POST /api/users` validates the body and returns 201 with `{id, name, email}` (never echo the password).
3. `GET /api/users/{id}` throws `UserNotFoundException` for unknown ids.
4. `ApiExceptionHandler` turns validation errors into **400** `ProblemDetail` with title `"Validation failed"` and an `errors` property (field → message), and `UserNotFoundException` into **404** with title `"User not found"`.

**Starter code**

```java
// src/main/java/com/example/practice/d20/users/CreateUserRequest.java
package com.example.practice.d20.users;

// TODO: name not blank, valid email, age >= 18, password at least 8 characters
public record CreateUserRequest(String name, String email, Integer age, String password) { }
```

```java
// src/main/java/com/example/practice/d20/users/UserResponse.java
package com.example.practice.d20.users;

public record UserResponse(long id, String name, String email) { }
```

```java
// src/main/java/com/example/practice/d20/users/UserNotFoundException.java
package com.example.practice.d20.users;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(long id) { super("No user with id " + id); }
}
```

```java
// src/main/java/com/example/practice/d20/users/UserController.java
package com.example.practice.d20.users;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {
    private final Map<Long, UserResponse> users = new ConcurrentHashMap<>();
    private final AtomicLong ids = new AtomicLong();

    // TODO: POST /api/users (validated, 201) and GET /api/users/{id} (throws UserNotFoundException)
}
```

```java
// src/main/java/com/example/practice/d20/users/ApiExceptionHandler.java
package com.example.practice.d20.users;

// TODO: @RestControllerAdvice with handlers for MethodArgumentNotValidException and UserNotFoundException
public class ApiExceptionHandler {
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d20/users/UserControllerTest.java
package com.example.practice.d20.users;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired MockMvc mvc;

    @Test
    void validRequestCreatesUserWithoutPassword() throws Exception {
        mvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Asha\",\"email\":\"asha@mail.com\",\"age\":25,\"password\":\"s3cret!!\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("asha@mail.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void invalidRequestReturnsProblemDetailWithFieldErrors() throws Exception {
        mvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\" \",\"email\":\"not-an-email\",\"age\":16,\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.age").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void unknownUserReturns404ProblemDetail() throws Exception {
        mvc.perform(get("/api/users/42"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("User not found"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("No user with id 42"));
    }

    @Test
    void malformedJsonIsABadRequest() throws Exception {
        mvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest());
    }
}
```

**Expected result**

```text
UserControllerTest: 4 tests passed
```

<!-- hints -->
- Constraints go on the record components: `@NotBlank String name, @Email @NotBlank String email, @NotNull @Min(18) Integer age, @NotBlank @Size(min = 8) String password` (`jakarta.validation.constraints`).
- Validation only runs when the parameter is marked `@Valid` (or `@Validated`): `create(@Valid @RequestBody CreateUserRequest request)`.
- In the handler: `ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST); pd.setTitle("Validation failed");` then build a `TreeMap<String, String>` from `ex.getBindingResult().getFieldErrors()` and `pd.setProperty("errors", map)`.
- Returning `ProblemDetail` (or `ResponseEntity<ProblemDetail>`) from an `@ExceptionHandler` makes Spring use `application/problem+json`.
- `@WebMvcTest` picks up `@RestControllerAdvice` classes automatically.

<!-- solution -->
```java
// src/main/java/com/example/practice/d20/users/CreateUserRequest.java
package com.example.practice.d20.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotNull @Min(18) Integer age,
        @NotBlank @Size(min = 8, message = "must be at least 8 characters") String password) { }
```

```java
// src/main/java/com/example/practice/d20/users/UserController.java
package com.example.practice.d20.users;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final Map<Long, UserResponse> users = new ConcurrentHashMap<>();
    private final AtomicLong ids = new AtomicLong();

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {   // @Valid triggers validation
        UserResponse user = new UserResponse(ids.incrementAndGet(), request.name(), request.email());
        users.put(user.id(), user);
        return user;                                                              // no password in the response
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable long id) {
        return Optional.ofNullable(users.get(id)).orElseThrow(() -> new UserNotFoundException(id));
    }
}
```

```java
// src/main/java/com/example/practice/d20/users/ApiExceptionHandler.java
package com.example.practice.d20.users;

import java.util.Map;
import java.util.TreeMap;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new TreeMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fe.getField(), fe.getDefaultMessage());           // first message per field
        }
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("errors", errors);
        return pd;
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail notFound(UserNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("User not found");
        return pd;
    }
}
```

**Good error responses.** One consistent format for every error (ProblemDetail is the standard), field-level messages for validation, no stack traces or SQL in responses, and a correlation/trace id so support can find the logs. For unexpected exceptions add a catch-all `@ExceptionHandler(Exception.class)` that logs the error and returns a generic 500.

<!-- exercise: d20_e3 | Hard | Write your own auto-configuration -->
**Concepts:** `@AutoConfiguration` · `@ConditionalOnMissingBean` (user beans win) · `@ConditionalOnProperty` with `matchIfMissing` · `@ConfigurationProperties` record with `@DefaultValue` · `META-INF/spring/…AutoConfiguration.imports` · testing with `ApplicationContextRunner`

**Task.** Build a tiny "starter" the way Spring Boot builds its own:

- `GreetingProperties` binds `greeting.prefix` (default `"Hello"`).
- `GreetingAutoConfiguration` creates a `GreetingService` bean **only if** the user hasn't defined one, and only if `greeting.enabled` isn't `false`.
- Register it in the `AutoConfiguration.imports` file.

**Starter code**

```java
// src/main/java/com/example/practice/d20/greeting/GreetingService.java
package com.example.practice.d20.greeting;

public class GreetingService {
    private final String prefix;
    public GreetingService(String prefix) { this.prefix = prefix; }
    public String greet(String name) { return prefix + ", " + name + "!"; }
}
```

```java
// src/main/java/com/example/practice/d20/greeting/GreetingProperties.java
package com.example.practice.d20.greeting;

// TODO: @ConfigurationProperties("greeting") with prefix defaulting to "Hello"
public record GreetingProperties(String prefix) { }
```

```java
// src/main/java/com/example/practice/d20/greeting/GreetingAutoConfiguration.java
package com.example.practice.d20.greeting;

// TODO: @AutoConfiguration + conditions + @EnableConfigurationProperties; a GreetingService @Bean
public class GreetingAutoConfiguration {
}
```

```text
# src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
# TODO: one fully-qualified auto-configuration class name per line
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d20/greeting/GreetingAutoConfigurationTest.java
package com.example.practice.d20.greeting;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.context.annotation.ImportCandidates;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

class GreetingAutoConfigurationTest {

    final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(GreetingAutoConfiguration.class));

    @Test
    void createsAGreeterWithTheDefaultPrefix() {
        runner.run(ctx -> {
            assertThat(ctx).hasSingleBean(GreetingService.class);
            assertThat(ctx.getBean(GreetingService.class).greet("Asha")).isEqualTo("Hello, Asha!");
        });
    }

    @Test
    void bindsThePrefixFromProperties() {
        runner.withPropertyValues("greeting.prefix=Namaste")
                .run(ctx -> assertThat(ctx.getBean(GreetingService.class).greet("Asha")).isEqualTo("Namaste, Asha!"));
    }

    @Test
    void backsOffWhenTheUserDefinesTheirOwnBean() {
        runner.withUserConfiguration(CustomGreeter.class)
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(GreetingService.class);
                    assertThat(ctx.getBean(GreetingService.class).greet("Asha")).isEqualTo("Yo, Asha!");
                });
    }

    @Test
    void canBeSwitchedOffWithAProperty() {
        runner.withPropertyValues("greeting.enabled=false")
                .run(ctx -> assertThat(ctx).doesNotHaveBean(GreetingService.class));
    }

    @Test
    void isListedInTheImportsFile() {
        assertThat(ImportCandidates.load(AutoConfiguration.class, getClass().getClassLoader()))
                .contains(GreetingAutoConfiguration.class.getName());
    }

    @Configuration
    static class CustomGreeter {
        @Bean
        GreetingService myGreeter() { return new GreetingService("Yo"); }
    }
}
```

**Expected result**

```text
GreetingAutoConfigurationTest: 5 tests passed
```

<!-- hints -->
- `@ConfigurationProperties("greeting") public record GreetingProperties(@DefaultValue("Hello") String prefix) { }` — records bind through their constructor.
- On the auto-configuration class: `@AutoConfiguration`, `@EnableConfigurationProperties(GreetingProperties.class)`, `@ConditionalOnProperty(prefix = "greeting", name = "enabled", havingValue = "true", matchIfMissing = true)`.
- Put `@ConditionalOnMissingBean` on the `@Bean` method. Auto-configurations are processed **after** user configuration, which is what lets user beans win.
- The imports file is plain text: one class name per line (`#` comments allowed). Spring Boot 2 used `META-INF/spring.factories` instead.
- `ApplicationContextRunner` starts a tiny context per test in milliseconds — it's how Spring Boot tests its own auto-configurations.

<!-- solution -->
```java
// src/main/java/com/example/practice/d20/greeting/GreetingProperties.java
package com.example.practice.d20.greeting;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("greeting")
public record GreetingProperties(@DefaultValue("Hello") String prefix) { }
```

```java
// src/main/java/com/example/practice/d20/greeting/GreetingAutoConfiguration.java
package com.example.practice.d20.greeting;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@EnableConfigurationProperties(GreetingProperties.class)
@ConditionalOnProperty(prefix = "greeting", name = "enabled", havingValue = "true", matchIfMissing = true)
public class GreetingAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean                         // a user-defined GreetingService wins
    GreetingService greetingService(GreetingProperties properties) {
        return new GreetingService(properties.prefix());
    }
}
```

```text
# src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.practice.d20.greeting.GreetingAutoConfiguration
```

**This is how every starter works.** `spring-boot-starter-data-jpa` brings Hibernate onto the classpath; `HibernateJpaAutoConfiguration` is listed in an imports file and guarded by `@ConditionalOnClass` / `@ConditionalOnMissingBean`. Run your app with `--debug` (or `/actuator/conditions`) to see the **conditions evaluation report**: which auto-configurations matched and why the others backed off.

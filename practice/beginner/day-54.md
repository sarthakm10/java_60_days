Your first endpoints, checked by a test. Use the Spring Boot practice project you set up on Day 52 (or generate a new one at start.spring.io).

**Dependencies to add:** Spring Web (`spring-boot-starter-webmvc` on Boot 4, `spring-boot-starter-web` on Boot 3). For tests on Boot 4 also add `spring-boot-starter-webmvc-test` (test scope). On Boot 3, `@WebMvcTest` is in `org.springframework.boot.test.autoconfigure.web.servlet` instead of `org.springframework.boot.webmvc.test.autoconfigure`.

<!-- exercise: b54_e1 | Easy | Hello endpoints: text, a query parameter and JSON -->
**Concepts:** `@RestController` · `@GetMapping` · `@RequestParam` with a default value · returning a record as JSON · `@WebMvcTest` + `MockMvc`

**Task.** Complete `HelloController` so that:

| Request | Response |
|---|---|
| `GET /hello` | `Hello, World!` (plain text) |
| `GET /hello?name=Asha` | `Hello, Asha!` |
| `GET /api/greeting?name=Ravi` | JSON `{"message":"Hello","name":"Ravi","nameLength":4}` |

Then run the given test. You're done when all three tests pass. (Also start the app and open the URLs in your browser: seeing your own JSON in the browser is the fun part.)

**Starter code**

```java
// src/main/java/com/example/practice/b54/hello/HelloController.java
package com.example.practice.b54.hello;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    public record Greeting(String message, String name, int nameLength) { }

    // TODO: GET /hello with an optional "name" request parameter (default "World")
    // TODO: GET /api/greeting with a "name" request parameter, returning a Greeting
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/b54/hello/HelloControllerTest.java
package com.example.practice.b54.hello;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HelloController.class)
class HelloControllerTest {

    @Autowired MockMvc mvc;

    @Test
    void helloWithoutANameGreetsTheWorld() throws Exception {
        mvc.perform(get("/hello"))
                .andExpect(status().isOk())
                .andExpect(content().string("Hello, World!"));
    }

    @Test
    void helloUsesTheNameParameter() throws Exception {
        mvc.perform(get("/hello").param("name", "Asha"))
                .andExpect(status().isOk())
                .andExpect(content().string("Hello, Asha!"));
    }

    @Test
    void greetingReturnsJson() throws Exception {
        mvc.perform(get("/api/greeting").param("name", "Ravi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Hello"))
                .andExpect(jsonPath("$.name").value("Ravi"))
                .andExpect(jsonPath("$.nameLength").value(4));
    }
}
```

**Expected result**

```text
HelloControllerTest: 3 tests passed
```

<!-- hints -->
- `@GetMapping("/hello")` on a method returning `String` sends that text as the response body.
- `@RequestParam(defaultValue = "World") String name` reads `?name=...` and uses "World" when it's missing.
- For the JSON endpoint, return `new Greeting("Hello", name, name.length())`. Spring turns the record into JSON for you.
- Run the test with the ▶ next to the class name, or `./mvnw test -Dtest=HelloControllerTest`.

<!-- solution -->
```java
// src/main/java/com/example/practice/b54/hello/HelloController.java
package com.example.practice.b54.hello;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    public record Greeting(String message, String name, int nameLength) { }

    @GetMapping("/hello")
    public String hello(@RequestParam(defaultValue = "World") String name) {
        return "Hello, " + name + "!";
    }

    @GetMapping("/api/greeting")
    public Greeting greeting(@RequestParam String name) {
        return new Greeting("Hello", name, name.length());
    }
}
```

Two methods, no JSON code, no server code: Spring maps the URLs, reads the query parameter, and converts the record to JSON. `@WebMvcTest` started only the web layer with your controller, and MockMvc sent requests to it without opening a real port. That's why the test runs in about a second.

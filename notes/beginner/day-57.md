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

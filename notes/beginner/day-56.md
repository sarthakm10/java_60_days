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

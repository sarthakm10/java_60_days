# Day 66 — Project Day 2: Security and Tests

> Today the Task Manager gets real users, login and ownership rules, and a set of tests that prove it works.

**Today's goal:** add sign-up and JWT login, make sure users can only touch their own data, write tests for the service and the controllers, and return the same error format everywhere.

<!-- topic: b66_t1 -->
## 🌿 Project — Task Manager API (Part 2)

<!-- subtopic: b66_t1_s1 -->
### Sign-up and login with BCrypt and JWT

Add the **Spring Security** and **OAuth2 Resource Server** starters, and a migration for users:

```sql
-- V2__create_users.sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);
ALTER TABLE projects ADD COLUMN owner_id BIGINT REFERENCES users(id);
```

Two public endpoints:

| Endpoint | Does | Returns |
|---|---|---|
| `POST /api/auth/signup` `{email, password}` | validate, check the email is free (409 if not), store a **BCrypt hash** (Day 61) | 201 |
| `POST /api/auth/login` `{email, password}` | check with `encoder.matches`, then issue a signed JWT (Day 62) with the user's id and a 15-minute expiry | 200 `{ "token": "..." }` |

Then the `SecurityFilterChain`: `/api/auth/**` is public, everything else needs a valid JWT, sessions are stateless. The resource-server support verifies the token on every request, and controllers read the current user from it.

Test it by hand: sign up, log in, copy the token, and call `GET /api/projects` with `Authorization: Bearer <token>`. Without the header you should get 401.

Keep the JWT signing key out of Git: read it from an environment variable (Day 63).

<!-- subtopic: b66_t1_s2 -->
### Users can only touch their own data

A logged-in user must never see or change someone else's projects. This is the most common real-world security bug (it even has a name: **IDOR**, insecure direct object reference): `GET /api/tasks/57` returns task 57 to anyone who asks, just by changing the number.

The fix lives in the **service**, using the user id from the token:

```java
@Transactional(readOnly = true)
public TaskResponse get(Long taskId, Long currentUserId) {
    Task task = tasks.findById(taskId)
            .filter(t -> t.getProject().getOwnerId().equals(currentUserId))
            .orElseThrow(() -> new NotFoundException("Task " + taskId));   // 404, not 403: don't reveal it exists
    return toResponse(task);
}
```

Queries can do the filtering too: `findByIdAndProjectOwnerId(id, userId)`. Every read and write path must check ownership. Then test it: create two users, and confirm that user B gets 404 for user A's task, for **every** endpoint.

<!-- subtopic: b66_t1_s3 -->
### Tests for the service and the controllers

Now Day 57 for real:

**Service unit tests** with Mockito: mock the repositories, and test the rules.

```java
@Test
void get_taskOfAnotherUser_throwsNotFound() {
    Task task = taskOwnedBy(1L);
    when(tasks.findById(57L)).thenReturn(Optional.of(task));

    assertThrows(NotFoundException.class, () -> service.get(57L, 2L));
}
```

**Controller tests** with `@WebMvcTest` and MockMvc: status codes, validation (a blank title gives 400), and JSON shape. Test the unhappy paths at least as much as the happy ones.

Aim for a handful of tests per feature, run `./mvnw test` before every commit, and add a CI pipeline that runs them on GitHub later (Day 84).

<!-- subtopic: b66_t1_s4 -->
### The same error format everywhere

Clients should get errors in one predictable shape, whatever went wrong. Extend your `@RestControllerAdvice` (Day 56) to cover every case with `ProblemDetail`:

| Situation | Status | Example `detail` |
|---|---|---|
| validation failed | 400 | `title: must not be blank` |
| bad or missing token | 401 | (handled by Spring Security) |
| not found, or not yours | 404 | `Task 57 not found` |
| email already registered | 409 | `Email already in use` |
| anything unexpected | 500 | `Something went wrong` (log the real error, never send stack traces to clients) |

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Task 57 not found",
  "instance": "/api/tasks/57"
}
```

**End of day 2:** a secured multi-user API with tests. Commit and push.

## 📝 Day 66 Recap

1. Which endpoints are public in the task manager? → **only sign-up and login, under /api/auth**
2. How is the password stored? → **as a BCrypt hash**
3. What does login return? → **a signed, short-lived JWT**
4. Status when calling a protected endpoint without a token? → **401**
5. What is IDOR? → **accessing someone else's data just by changing an id in the request**
6. Where is ownership checked? → **in the service, on every read and write, using the user id from the token**
7. Why return 404 instead of 403 for someone else's task? → **so attackers can't even learn that it exists**
8. Tool for service unit tests? → **Mockito**
9. Standard error body format? → **ProblemDetail**
10. Should a 500 response include the stack trace? → **no, log it on the server and send a generic message**

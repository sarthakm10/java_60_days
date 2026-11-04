# Day 67 — Project Day 3: README, GitHub and Phase 7 Review

> The last project day: make the project easy to understand in two minutes, put it online, and check it's ready for the React app. Then review Phase 7.

**Today's goal:** write the README, push to GitHub with a release tag, confirm the API matches what the React app (Module 29) expects, and explain the project's big ideas without notes.

<!-- topic: b67_t1 -->
## 🛠️ Project — Finish the Task Manager API (Part 3)

<!-- subtopic: b67_t1_s1 -->
### Step 20: a README

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

- [ ] A friend (or you, in a new folder) can clone and run it using only the README. Commit: `step 20: README`.

<!-- subtopic: b67_t1_s2 -->
### Step 21: push to GitHub and tag v1.0

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
### Step 22: ready for the React app

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
| a 401 when the token is missing or expired (the app then logs out) | the resource server, with a ProblemDetail body | 9, 16 |
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
Walk through your own project's login end to end, out loud (Days 61–62): sign-up with a BCrypt hash, login issuing a JWT, the client sending `Authorization: Bearer`, the resource server checking it and setting the security context, and the service filtering by the owner.

<!-- intro: d26_t1_s4 -->
Explain where you used `@WebMvcTest` (Day 57) and where `@SpringBootTest` (Day 65) in your project, and what each one starts.

## 📝 Day 67 Recap

1. What must a README answer first? → **what the project is and how to run it**
2. What makes a project README stand out? → **design decisions and their trade-offs**
3. Check Git history for secrets? → **git log -p, searching for secret and password**
4. A real password was committed: what now? → **change the password; deleting the file doesn't remove it from history**
5. Mark a release in Git? → **an annotated tag, e.g. git tag -a v1.0, then push it**
6. Why one commit per step? → **the history shows how you built it, and each step can be checked out**
7. Three N+1 fixes? → **JOIN FETCH, @EntityGraph, @BatchSize (or one aggregate query)**
8. JWT login flow in one line? → **login → signed token → Bearer header → resource server verifies → security context → owner filter**
9. Why does a CORS error appear from other websites? → **the API only allows the configured origins**
10. Top thing interviewers ask about a project? → **what you'd change and why: design decisions and trade-offs**

# Day 67 — Project Day 3: Polish and Phase 7 Review

> The final project day: the features that make an API feel professional, a README that sells it, and a review of the whole Spring phase.

**Today's goal:** add paging and filtering, configure profiles, logging and health checks, document the project, and explain the core Spring ideas out loud.

<!-- topic: b67_t1 -->
## 🌿 Project — Task Manager API (Part 3)

<!-- subtopic: b67_t1_s1 -->
### Pagination, sorting and filtering

A project can have hundreds of tasks; the list endpoint must page them (Day 59):

```text
GET /api/projects/7/tasks?status=TODO&page=0&size=20&sort=dueDate,asc
```

```java
@GetMapping("/projects/{projectId}/tasks")
public Page<TaskResponse> list(@PathVariable Long projectId,
                               @RequestParam(required = false) TaskStatus status,
                               @PageableDefault(size = 20, sort = "priority", direction = Sort.Direction.DESC) Pageable pageable,
                               @AuthenticationPrincipal Jwt jwt) {
    return service.list(projectId, status, currentUserId(jwt), pageable);
}
```

The repository gets methods like `Page<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status, Pageable pageable)`. Cap the page size (say, 100), so nobody can ask for a million rows at once. Check the SQL log to make sure listing tasks doesn't cause N+1 queries (Day 59).

<!-- subtopic: b67_t1_s2 -->
### Profiles, logging and health

Make the app ready to run somewhere other than your laptop (Day 63):

- `application-dev.properties`: SQL logging on, local database.
- `application-prod.properties`: SQL logging off, everything secret from environment variables (`DB_URL`, `DB_PASSWORD`, `JWT_SECRET`).
- Replace any `System.out.println` with a logger, and log important events at INFO (`Task {} created in project {}`) and unexpected errors at ERROR.
- Add **Actuator**, expose only `health` and `info`, and check `/actuator/health` reports the database as UP.

On Day 73 you'll package all of this into a Docker image, and these settings are exactly what Docker passes in.

<!-- subtopic: b67_t1_s3 -->
### README and push

Your README is the project's front page; recruiters and interviewers read it first. Include:

1. **What it is**, in two sentences.
2. **Tech stack**: Java 21, Spring Boot, Spring Data JPA, PostgreSQL, Flyway, Spring Security (JWT), JUnit and Mockito.
3. **How to run it**: create the database, set the environment variables, `./mvnw spring-boot:run`.
4. **The API**: the endpoint table from Day 65, with an example request and response.
5. **The ER diagram** (GitHub renders the Mermaid block).
6. **Design decisions**: why ownership checks return 404, why Flyway, how paging is capped. Interviewers love asking about these.
7. **What you'd add next**: tags, due-date reminders, a React front end.

Push it, check that the README renders nicely on GitHub, and pin the repository on your GitHub profile. 🎉 You've built a real backend.

<!-- topic: b67_t2 -->
## 🌿 Spring — Review

<!-- intro: d26_t1_s2 -->
Explain the N+1 problem in a minute without notes (Day 59): what it is, how you'd notice it in your own project's SQL log, and the three fixes.

<!-- intro: d26_t1_s3 -->
Walk through your own project's login end to end, out loud (Days 61–62, 66): sign-up with a BCrypt hash, login issuing a JWT, the client sending `Authorization: Bearer`, the filter verifying it and setting the security context, and the service checking ownership.

<!-- intro: d26_t1_s4 -->
Explain when you used `@WebMvcTest` versus `@SpringBootTest` in your project (Day 57), and what each one starts.

## 📝 Day 67 Recap

1. Paging query parameters? → **page, size and sort, e.g. ?page=0&size=20&sort=dueDate,asc**
2. Why cap the page size? → **so nobody can request huge pages and overload the server**
3. Where do production secrets come from? → **environment variables, never files in Git**
4. Which Actuator endpoints to expose publicly? → **only health (and info), not all**
5. What replaces System.out in a real app? → **a logger (SLF4J)**
6. Top thing interviewers ask about a project? → **design decisions and their trade-offs**
7. Three N+1 fixes? → **JOIN FETCH, @EntityGraph, @BatchSize**
8. JWT login flow in one line? → **login → signed token → Bearer header → filter verifies → security context → ownership check**
9. @WebMvcTest vs @SpringBootTest? → **web layer only with mocked services vs the whole application**
10. What should a project README include? → **what it is, stack, how to run, API, diagram, design decisions, next steps**

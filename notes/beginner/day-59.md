# Day 59 — JPA Relationships and the N+1 Problem

> One of the most asked Spring interview topics, and one of the most common performance bugs in real apps. Read each 🌱 **In simple words** box first.

**Today's goal:** map relationships between entities, understand lazy loading and the N+1 problem, and fix it; then page and shape your query results.

<!-- topic: b59_t1 -->
## 🌿 Spring Data JPA — Relationships & Performance

<!-- intro: d21_t1_s2 -->
Day 47's foreign keys, in Java: a `Customer` has many `Order`s, so `Order` has a `@ManyToOne Customer customer` field (this side holds the foreign key column) and `Customer` can have a `@OneToMany(mappedBy = "customer") List<Order> orders` field. `@ManyToMany` maps a join table like enrolments. `mappedBy` tells JPA which side owns the relationship, so it doesn't create the link twice.

<!-- intro: d21_t1_s3 -->
When you load a customer, should JPA also load all their orders? **Lazy** loading waits until you actually touch `customer.getOrders()`; **eager** loading fetches them immediately. Lazy is usually right, but it causes the famous **N+1 problem**: load 100 customers (1 query), then touch each one's orders in a loop (100 more queries). 101 queries where 1 or 2 would do. Turn on `show-sql` (Day 58) and you'll see the flood.

<!-- intro: d21_t1_s4 -->
The fixes all say "fetch the related data in the **same** query": `JOIN FETCH` in a `@Query` (`SELECT c FROM Customer c JOIN FETCH c.orders`), an `@EntityGraph` on the repository method, or `@BatchSize` to fetch them in groups instead of one by one. Interviewers love asking for all three.

<!-- intro: d21_t1_s6 -->
Never return 100,000 rows to a client. **Paging** splits results into pages: pass a `Pageable` (page number, size, sort) to a repository method and get back a `Page<T>` with the items plus the total count. In a controller, `GET /api/products?page=0&size=20&sort=price` maps straight onto it.

<!-- intro: d21_t1_s8 -->
**Projections** load only the columns you need: declare an interface with just the getters you want (`interface ProductSummary { String getName(); double getPrice(); }`) or a DTO record (Day 55), and return that from a repository method. Less data loaded, less sent, and the entity's other fields are never touched.

<!-- topic: b59_t2 -->
## 🛠️ Project — Task Manager API (Step 6)

<!-- subtopic: b59_t2_s1 -->
### Step 6: relationships, paging, and project counts without N+1

**Goal:** three things from today. A task points at its `Project` with `@ManyToOne` instead of holding a bare number. The task list comes back **one page at a time**, filtered and sorted by the client. And the project list shows how many tasks each project has (and how many are done) using **one** query, not one per project.

**1. The relationship.** Same `project_id` column as before; Hibernate now adds a foreign key, and `LAZY` means loading a task doesn't load its project unless the code asks for it:

```java
// src/main/java/com/example/taskmanager/task/Task.java
package com.example.taskmanager.task;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.example.taskmanager.project.Project;

// One row of the tasks table
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many tasks belong to one project. Same project_id column as before, now with a foreign key.
    // LAZY: the project is only loaded from the database if the code actually uses it.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)                      // stored as 'TODO', not as 0: safe if the enum's order changes
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.TODO;

    @Column(nullable = false)
    private int priority = 3;

    private LocalDate dueDate;                        // column due_date: Spring names columns in snake_case

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
}
```

**2. Paged queries.** A `Pageable` parameter (page number, size, sort) makes Spring Data add `LIMIT`/`OFFSET` and `ORDER BY`, and return a `Page` with the totals:

```java
// src/main/java/com/example/taskmanager/task/TaskRepository.java
package com.example.taskmanager.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // "ProjectId" walks the relationship: ... WHERE project_id = ?, plus LIMIT/OFFSET and ORDER BY from the Pageable,
    // and a second COUNT query for the total
    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    Page<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status, Pageable pageable);
}
```

Spring's own `Page` JSON isn't guaranteed to stay the same between versions (Spring logs a warning if you return it), so the API returns its own small record:

```java
// src/main/java/com/example/taskmanager/common/PageResponse.java
package com.example.taskmanager.common;

import java.util.List;

import org.springframework.data.domain.Page;

// One page of results, in a JSON shape we control:
// {"content": [...], "page": 0, "size": 20, "totalElements": 42, "totalPages": 3}
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
```

```java
// src/main/java/com/example/taskmanager/task/TaskService.java
package com.example.taskmanager.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.taskmanager.common.NotFoundException;
import com.example.taskmanager.common.PageResponse;
import com.example.taskmanager.project.ProjectService;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;

    public TaskService(TaskRepository taskRepository, ProjectService projectService) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
    }

    public TaskResponse create(Long projectId, CreateTaskRequest request) {
        Task task = new Task();
        task.setProject(projectService.find(projectId));   // 404 if the project doesn't exist
        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.priority() != null) task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        return TaskResponse.from(taskRepository.save(task));
    }

    // One page of a project's tasks; status is optional (null = all)
    public PageResponse<TaskResponse> list(Long projectId, TaskStatus status, Pageable pageable) {
        projectService.find(projectId);
        Page<Task> page = status == null
                ? taskRepository.findByProjectId(projectId, pageable)
                : taskRepository.findByProjectIdAndStatus(projectId, status, pageable);
        return PageResponse.from(page.map(TaskResponse::from));
    }

    public TaskResponse get(Long id) {
        return TaskResponse.from(find(id));
    }

    // Only the fields the client sent change
    public TaskResponse update(Long id, UpdateTaskRequest request) {
        Task task = find(id);
        if (request.title() != null) task.setTitle(request.title());
        if (request.description() != null) task.setDescription(request.description());
        if (request.status() != null) task.setStatus(request.status());
        if (request.priority() != null) task.setPriority(request.priority());
        if (request.dueDate() != null) task.setDueDate(request.dueDate());
        return TaskResponse.from(taskRepository.save(task));   // UPDATE
    }

    public void delete(Long id) {
        if (!taskRepository.existsById(id)) throw new NotFoundException("Task " + id + " not found");
        taskRepository.deleteById(id);
    }

    private Task find(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task " + id + " not found"));
    }
}
```

In `TaskController`, the list method now takes a `Pageable` and returns a `PageResponse` (imports: `org.springframework.data.domain.Pageable`, `org.springframework.data.web.PageableDefault`, `com.example.taskmanager.common.PageResponse`; `java.util.List` is no longer needed):

```java
// in TaskController.java
// GET /api/projects/1/tasks?status=TODO&page=0&size=20&sort=dueDate,asc (every parameter is optional)
// Spring builds the Pageable from page, size and sort; without them: the first 20 tasks, oldest first
@GetMapping("/projects/{projectId}/tasks")
public PageResponse<TaskResponse> list(@PathVariable Long projectId,
                                       @RequestParam(required = false) TaskStatus status,
                                       @PageableDefault(size = 20, sort = "id") Pageable pageable) {
    return taskService.list(projectId, status, pageable);
}
```

Cap the page size, so nobody can ask for a million rows:

```properties
# in application.properties
# ?size= can't ask for more than 100 rows at once
spring.data.web.pageable.max-page-size=100
```

And a wrong sort field (`?sort=colour`) should be a 400, not a 500. Add to `GlobalExceptionHandler` (import `org.springframework.data.core.PropertyReferenceException`; on Spring Boot 3.x it's in `org.springframework.data.mapping`):

```java
// in GlobalExceptionHandler.java
// ?sort=colour: tasks have no such field
@ExceptionHandler(PropertyReferenceException.class)
public ProblemDetail handleBadSort(PropertyReferenceException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "sort: no field named '" + ex.getPropertyName() + "'");
}
```

**3. Project counts without N+1.** The obvious way is a query per project:

```java
// DON'T: 1 query for the projects, then 2 more for EACH project: 1 + 2N queries
return projectRepository.findAll().stream()
        .map(p -> new ProjectResponse(p.getId(), p.getName(),
                taskRepository.countByProjectId(p.getId()),
                taskRepository.countByProjectIdAndStatus(p.getId(), TaskStatus.DONE)))
        .toList();
```

With 50 projects that's 101 queries for one page. Instead, let the database join and count in one go, and put the result straight into the response record (a JPQL **constructor expression**):

```java
// src/main/java/com/example/taskmanager/project/ProjectResponse.java
package com.example.taskmanager.project;

// What the API sends back for a project, with how many tasks it has and how many are done
public record ProjectResponse(Long id, String name, long taskCount, long doneCount) {

    // A project that was just created has no tasks yet
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(project.getId(), project.getName(), 0, 0);
    }
}
```

```java
// src/main/java/com/example/taskmanager/project/ProjectRepository.java
package com.example.taskmanager.project;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Every project with its task counts in ONE query (a JOIN and GROUP BY), straight into the response record.
    // Counting each project's tasks in a loop would run 1 + N queries: the N+1 problem.
    @Query("""
            select new com.example.taskmanager.project.ProjectResponse(p.id, p.name, count(t),
                   count(case when t.status = com.example.taskmanager.task.TaskStatus.DONE then 1 end))
            from Project p left join Task t on t.project = p
            group by p.id, p.name
            order by p.id""")
    List<ProjectResponse> findAllWithCounts();

    @Query("""
            select new com.example.taskmanager.project.ProjectResponse(p.id, p.name, count(t),
                   count(case when t.status = com.example.taskmanager.task.TaskStatus.DONE then 1 end))
            from Project p left join Task t on t.project = p
            where p.id = :id
            group by p.id, p.name""")
    Optional<ProjectResponse> findWithCountsById(@Param("id") Long id);
}
```

```java
// src/main/java/com/example/taskmanager/project/ProjectService.java
package com.example.taskmanager.project;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.taskmanager.common.NotFoundException;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ProjectResponse create(CreateProjectRequest request) {
        Project saved = projectRepository.save(new Project(request.name()));   // INSERT; saved has its id
        return ProjectResponse.from(saved);
    }

    public List<ProjectResponse> list() {
        return projectRepository.findAllWithCounts();
    }

    public ProjectResponse get(Long id) {
        return projectRepository.findWithCountsById(id)
                .orElseThrow(() -> new NotFoundException("Project " + id + " not found"));
    }

    // The project itself, for TaskService; 404 if there's no such project
    public Project find(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project " + id + " not found"));
    }
}
```

**4. A test for paging,** in `TaskControllerTest` (also `import java.util.List;`, `import com.example.taskmanager.common.PageResponse;` and `import static org.mockito.ArgumentMatchers.argThat;`). It checks that `page`, `size` and `sort` from the URL reach the service:

```java
// in TaskControllerTest.java
@Test
void listPassesStatusPageAndSortToTheService() throws Exception {
    TaskResponse task = new TaskResponse(5L, "Write tests", null, TaskStatus.TODO, 3, null);
    when(taskService.list(eq(1L), eq(TaskStatus.TODO), argThat(p ->
            p.getPageNumber() == 2 && p.getPageSize() == 10 && p.getSort().toString().equals("dueDate: ASC"))))
            .thenReturn(new PageResponse<>(List.of(task), 2, 10, 21, 3));

    mvc.perform(get("/api/projects/1/tasks?status=TODO&page=2&size=10&sort=dueDate,asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].title").value("Write tests"))
            .andExpect(jsonPath("$.totalPages").value(3));
}
```

**5. Try it.** Add 25 tasks in a loop (Git Bash or macOS/Linux), then ask for the second page of 10, most urgent first:

```bash
for i in $(seq 1 25); do
  curl -s -X POST localhost:8080/api/projects/1/tasks -H "Content-Type: application/json" \
       -d "{\"title\":\"Task $i\",\"priority\":$(( i % 5 + 1 ))}" > /dev/null
done
curl "localhost:8080/api/projects/1/tasks?page=1&size=10&sort=priority,desc"
curl localhost:8080/api/projects
```

The first answer looks like `{"content":[…10 tasks…],"page":1,"size":10,"totalElements":27,"totalPages":3}`, and the log shows two queries for it: one `select … order by … offset ? rows fetch first ? rows only` for the page and one `select count(…)` for the totals. The project list is a single `select … left join … group by` however many projects there are, and each project now has `taskCount` and `doneCount`.

**✅ Checkpoint**

- [ ] `?page=`, `?size=`, `?sort=dueDate,asc` and `?status=` all work, alone or together; `?size=500` gives at most 100.
- [ ] `GET /api/projects` runs one query (check the log) and shows the counts.
- [ ] `./mvnw test` passes. Commit: `step 6: relationships, paging, counts`.

**If it doesn't work:** "Could not resolve attribute 'projectId'" means a repository method still says `ProjectId` but the entity has no `project` field (check `Task`). A `LazyInitializationException` means code touched `task.getProject().getName()` after the service returned: with `open-in-view=false`, read lazy data inside the service.

<!-- topic: b59_t3 -->
## 🧮 DSA — Timed Interview Practice

A timed interview-style session: solve problems while thinking aloud, ask clarifying questions as if to an interviewer, check edge cases (empty input, one element, negatives, huge input) and state the complexity after each solution (Day 11). How you communicate matters as much as the code.

## 📝 Day 59 Recap

1. Which side of a one-to-many holds the foreign key? → **the "many" side, with @ManyToOne**
2. What does mappedBy mean? → **this side doesn't own the relationship; the other side's field does**
3. Lazy vs eager loading? → **lazy loads related data when first accessed; eager loads it immediately**
4. What is the N+1 problem? → **one query for a list, then one more query per item for its related data**
5. How do you spot N+1? → **turn on SQL logging and see many repeated queries**
6. Three fixes for N+1? → **JOIN FETCH, @EntityGraph, @BatchSize**
7. Repository paging parameter and result types? → **`Pageable` in, `Page<T>` out**
8. Paging query parameters? → **?page=0&size=20&sort=price**
9. What does a projection do? → **loads only the fields you need**
10. Why think aloud in coding interviews? → **interviewers assess your reasoning and communication, not just the code**

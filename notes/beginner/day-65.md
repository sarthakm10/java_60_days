# Day 65 — Project Day 1: Ownership, a Walk-Through and API Docs

> Your Task Manager API almost works: you built it a step a day since Day 54. Today it gets its last big piece, then these three days turn it from "works on my laptop" into a project you can hand to someone else, and show in an interview.

**Today's goal:** make every user see only their own projects and tasks, use the whole API once from start to finish, and give it interactive documentation.

<!-- topic: b65_t1 -->
## 🛠️ Project — Finish the Task Manager API (Part 1)

<!-- subtopic: b65_t1_s5 -->
### Step 12: every user sees only their own data

**Goal:** **ownership**. Each project belongs to the user who created it, and nobody can see, change or even detect someone else's projects or tasks. The user's id comes from the login token (step 9's `uid` claim), never from the request, so it can't be faked. This is broken access control, number one on the OWASP Top 10 (Day 61), done right.

**1. Projects get an owner:**

```sql
-- src/main/resources/db/migration/V3__add_project_owner.sql
-- V3: every project belongs to a user. Projects created before this have no owner (NULL), so nobody sees them.

ALTER TABLE projects ADD COLUMN owner_id BIGINT REFERENCES users (id);

CREATE INDEX idx_projects_owner ON projects (owner_id);
```

```java
// src/main/java/com/example/taskmanager/project/Project.java
package com.example.taskmanager.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.example.taskmanager.user.AppUser;

// One row of the projects table
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   // the database numbers the rows
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private AppUser owner;

    protected Project() {
        // JPA creates entities with this, then fills the fields
    }

    public Project(String name, AppUser owner) {
        this.name = name;
        this.owner = owner;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public AppUser getOwner() { return owner; }
}
```

**2. Every query filters by the owner.** The services take the user's id and only ever load rows that belong to that user. Someone else's project is a **404**, not a 403: a 403 would confirm that project 7 exists.

```java
// src/main/java/com/example/taskmanager/project/ProjectRepository.java
package com.example.taskmanager.project;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Every method takes the owner's id: a user can only ever reach their own projects
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // "OwnerId" walks the relationship: ... WHERE id = ? AND owner_id = ?
    Optional<Project> findByIdAndOwnerId(Long id, Long ownerId);

    // Every project with its task counts in ONE query (a JOIN and GROUP BY), straight into the response record.
    // Counting each project's tasks in a loop would run 1 + N queries: the N+1 problem.
    @Query("""
            select new com.example.taskmanager.project.ProjectResponse(p.id, p.name, count(t),
                   count(case when t.status = com.example.taskmanager.task.TaskStatus.DONE then 1 end))
            from Project p left join Task t on t.project = p
            where p.owner.id = :ownerId
            group by p.id, p.name
            order by p.id""")
    List<ProjectResponse> findAllWithCounts(@Param("ownerId") Long ownerId);

    @Query("""
            select new com.example.taskmanager.project.ProjectResponse(p.id, p.name, count(t),
                   count(case when t.status = com.example.taskmanager.task.TaskStatus.DONE then 1 end))
            from Project p left join Task t on t.project = p
            where p.id = :id and p.owner.id = :ownerId
            group by p.id, p.name""")
    Optional<ProjectResponse> findWithCountsById(@Param("id") Long id, @Param("ownerId") Long ownerId);
}
```

```java
// src/main/java/com/example/taskmanager/project/ProjectService.java
package com.example.taskmanager.project;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.taskmanager.common.NotFoundException;
import com.example.taskmanager.task.TaskRepository;
import com.example.taskmanager.user.UserRepository;

// Every method gets the logged-in user's id from the controller. Someone else's project is "not found" (404),
// not "forbidden" (403): a 403 would tell an attacker that project 7 exists.
@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, TaskRepository taskRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProjectResponse create(Long userId, CreateProjectRequest request) {
        // getReferenceById: a stand-in for the user that only knows its id, enough to fill owner_id (no SELECT)
        Project project = new Project(request.name(), userRepository.getReferenceById(userId));
        return ProjectResponse.from(projectRepository.save(project));
    }

    public List<ProjectResponse> list(Long userId) {
        return projectRepository.findAllWithCounts(userId);
    }

    public ProjectResponse get(Long userId, Long id) {
        return projectRepository.findWithCountsById(id, userId)
                .orElseThrow(() -> new NotFoundException("Project " + id + " not found"));
    }

    // Two deletes that must succeed or fail together: if deleting the project fails, its tasks come back (rollback)
    @Transactional
    public void delete(Long userId, Long id) {
        Project project = find(userId, id);
        taskRepository.deleteAllByProjectId(id);
        projectRepository.delete(project);
    }

    // The project itself, for TaskService; 404 if there's no such project or it isn't this user's
    public Project find(Long userId, Long id) {
        return projectRepository.findByIdAndOwnerId(id, userId)
                .orElseThrow(() -> new NotFoundException("Project " + id + " not found"));
    }
}
```

```java
// src/main/java/com/example/taskmanager/task/TaskRepository.java
package com.example.taskmanager.task;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // "ProjectId" walks the relationship: ... WHERE project_id = ?, plus LIMIT/OFFSET and ORDER BY from the Pageable,
    // and a second COUNT query for the total. Callers check the project is the user's first.
    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    Page<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status, Pageable pageable);

    // A task, only if its project belongs to this user: task → project → owner → id, one JOIN
    Optional<Task> findByIdAndProjectOwnerId(Long id, Long ownerId);

    // One DELETE statement for all of a project's tasks (a derived deleteBy... would load and delete them one by one).
    // @Modifying marks a query that changes data; it needs a transaction, which ProjectService.delete provides.
    @Modifying
    @Query("delete from Task t where t.project.id = :projectId")
    int deleteAllByProjectId(@Param("projectId") Long projectId);
}
```

```java
// src/main/java/com/example/taskmanager/task/TaskService.java
package com.example.taskmanager.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.taskmanager.common.NotFoundException;
import com.example.taskmanager.common.PageResponse;
import com.example.taskmanager.project.ProjectService;

// Like ProjectService, every method takes the logged-in user's id and only reaches that user's tasks
@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;

    public TaskService(TaskRepository taskRepository, ProjectService projectService) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
    }

    @Transactional
    public TaskResponse create(Long userId, Long projectId, CreateTaskRequest request) {
        Task task = new Task();
        task.setProject(projectService.find(userId, projectId));   // 404 if it isn't this user's project
        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.priority() != null) task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        return TaskResponse.from(taskRepository.save(task));
    }

    // One page of a project's tasks; status is optional (null = all)
    public PageResponse<TaskResponse> list(Long userId, Long projectId, TaskStatus status, Pageable pageable) {
        projectService.find(userId, projectId);
        Page<Task> page = status == null
                ? taskRepository.findByProjectId(projectId, pageable)
                : taskRepository.findByProjectIdAndStatus(projectId, status, pageable);
        return PageResponse.from(page.map(TaskResponse::from));
    }

    public TaskResponse get(Long userId, Long id) {
        return TaskResponse.from(find(userId, id));
    }

    // Only the fields the client sent change. No save() needed: the task was loaded in this transaction, so
    // Hibernate notices the changes and writes one UPDATE when the method returns (dirty checking).
    @Transactional
    public TaskResponse update(Long userId, Long id, UpdateTaskRequest request) {
        Task task = find(userId, id);
        if (request.title() != null) task.setTitle(request.title());
        if (request.description() != null) task.setDescription(request.description());
        if (request.status() != null) task.setStatus(request.status());
        if (request.priority() != null) task.setPriority(request.priority());
        if (request.dueDate() != null) task.setDueDate(request.dueDate());
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        taskRepository.delete(find(userId, id));
    }

    private Task find(Long userId, Long id) {
        return taskRepository.findByIdAndProjectOwnerId(id, userId)
                .orElseThrow(() -> new NotFoundException("Task " + id + " not found"));
    }
}
```

**3. The controllers pass the user's id along.** `@AuthenticationPrincipal Jwt jwt` is the checked token of the user making the request, and `CurrentUser.id(jwt)` (step 9) reads the id out of it. Every endpoint changes the same way, for example:

```java
// in TaskController.java
@GetMapping("/tasks/{id}")
public TaskResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
    return taskService.get(CurrentUser.id(jwt), id);
}
```

<details class="deeper"><summary>📄 The whole `ProjectController`</summary>

```java
// src/main/java/com/example/taskmanager/project/ProjectController.java
package com.example.taskmanager.project;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.taskmanager.security.CurrentUser;

// @AuthenticationPrincipal Jwt: the checked token of the user making this request
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // 201 Created, with a Location header pointing at the new project
    @PostMapping
    public ResponseEntity<ProjectResponse> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse created = projectService.create(CurrentUser.id(jwt), request);
        return ResponseEntity.created(URI.create("/api/projects/" + created.id())).body(created);
    }

    @GetMapping
    public List<ProjectResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return projectService.list(CurrentUser.id(jwt));
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return projectService.get(CurrentUser.id(jwt), id);
    }

    // Deletes the project and all its tasks
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        projectService.delete(CurrentUser.id(jwt), id);
    }
}
```

</details>

<details class="deeper"><summary>📄 The whole `TaskController`</summary>

```java
// src/main/java/com/example/taskmanager/task/TaskController.java
package com.example.taskmanager.task;

import java.net.URI;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.taskmanager.common.PageResponse;
import com.example.taskmanager.security.CurrentUser;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> create(@AuthenticationPrincipal Jwt jwt, @PathVariable Long projectId,
                                               @Valid @RequestBody CreateTaskRequest request) {
        TaskResponse created = taskService.create(CurrentUser.id(jwt), projectId, request);
        return ResponseEntity.created(URI.create("/api/tasks/" + created.id())).body(created);
    }

    // GET /api/projects/1/tasks?status=TODO&page=0&size=20&sort=dueDate,asc (every parameter is optional)
    // Spring builds the Pageable from page, size and sort; without them: the first 20 tasks, oldest first
    @GetMapping("/projects/{projectId}/tasks")
    public PageResponse<TaskResponse> list(@AuthenticationPrincipal Jwt jwt,
                                           @PathVariable Long projectId,
                                           @RequestParam(required = false) TaskStatus status,
                                           @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return taskService.list(CurrentUser.id(jwt), projectId, status, pageable);
    }

    @GetMapping("/tasks/{id}")
    public TaskResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return taskService.get(CurrentUser.id(jwt), id);
    }

    @PatchMapping("/tasks/{id}")
    public TaskResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                               @Valid @RequestBody UpdateTaskRequest request) {
        return taskService.update(CurrentUser.id(jwt), id, request);
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        taskService.delete(CurrentUser.id(jwt), id);
    }
}
```

</details>

**4. Tests.** `@WithMockUser` has no user id, so the controller tests switch to `jwt()` from Spring Security's test support: it pretends a request carries a valid token with the claims you choose, without making a real one. Note the test that proves the id comes from the token:

```java
// src/test/java/com/example/taskmanager/task/TaskControllerTest.java
package com.example.taskmanager.task;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.example.taskmanager.common.NotFoundException;
import com.example.taskmanager.common.PageResponse;
import com.example.taskmanager.security.SecurityConfig;

// Starts only the web layer (TaskController, GlobalExceptionHandler, JSON, validation, security): no services, no server.
// TaskService is replaced by a mock, so each test decides what the service returns.
@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
class TaskControllerTest {

    // A logged-in user with id 1, as if the request carried a valid token (no real token is made)
    static final RequestPostProcessor ANA = jwt().jwt(token -> token.subject("ana@example.com").claim("uid", 1L));

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TaskService taskService;

    @Test
    void createReturns201WithLocation() throws Exception {
        when(taskService.create(eq(1L), eq(1L), any()))
                .thenReturn(new TaskResponse(5L, "Write tests", null, TaskStatus.TODO, 3, null));

        mvc.perform(post("/api/projects/1/tasks").with(ANA)
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
        mvc.perform(post("/api/projects/1/tasks").with(ANA)
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
        mvc.perform(patch("/api/tasks/5").with(ANA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"priority": 9}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("priority: must be less than or equal to 5"));
    }

    @Test
    void missingTaskIs404ProblemDetail() throws Exception {
        when(taskService.get(1L, 99L)).thenThrow(new NotFoundException("Task 99 not found"));

        mvc.perform(get("/api/tasks/99").with(ANA))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", "application/problem+json"))
                .andExpect(jsonPath("$.detail").value("Task 99 not found"));
    }

    @Test
    void listPassesStatusPageAndSortToTheService() throws Exception {
        TaskResponse task = new TaskResponse(5L, "Write tests", null, TaskStatus.TODO, 3, null);
        when(taskService.list(eq(1L), eq(1L), eq(TaskStatus.TODO), argThat(p ->
                p.getPageNumber() == 2 && p.getPageSize() == 10 && p.getSort().toString().equals("dueDate: ASC"))))
                .thenReturn(new PageResponse<>(List.of(task), 2, 10, 21, 3));

        mvc.perform(get("/api/projects/1/tasks?status=TODO&page=2&size=10&sort=dueDate,asc").with(ANA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Write tests"))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    void withoutATokenIs401() throws Exception {
        mvc.perform(get("/api/tasks/5"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(taskService);
    }

    @Test
    void theUserIdComesFromTheTokenNotTheRequest() throws Exception {
        RequestPostProcessor ben = jwt().jwt(token -> token.subject("ben@example.com").claim("uid", 2L));

        mvc.perform(delete("/api/tasks/5").with(ben))
                .andExpect(status().isNoContent());

        verify(taskService).delete(2L, 5L);
    }

    @Test
    void deleteReturns204() throws Exception {
        mvc.perform(delete("/api/tasks/5").with(ANA))
                .andExpect(status().isNoContent());

        verify(taskService).delete(1L, 5L);
    }
}
```

The service tests change in the same way (every call takes a user id). Open each one and replace your file:

<details class="deeper"><summary>📄 The updated `TaskServiceTest`</summary>

```java
// src/test/java/com/example/taskmanager/task/TaskServiceTest.java
package com.example.taskmanager.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.taskmanager.common.NotFoundException;
import com.example.taskmanager.project.Project;
import com.example.taskmanager.project.ProjectService;

// Still a plain unit test: the repository is a mock, so no database is needed
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    static final Long ANA = 1L, BEN = 2L;

    @Mock
    TaskRepository taskRepository;

    @Mock
    ProjectService projectService;

    TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, projectService);
    }

    @Test
    void newTaskStartsAsTodoWithPriority3() {
        when(projectService.find(ANA, 1L)).thenReturn(new Project("Website", null));
        when(taskRepository.save(any(Task.class))).thenAnswer(call -> call.getArgument(0));   // save returns the task

        TaskResponse task = taskService.create(ANA, 1L, new CreateTaskRequest("Write tests", null, null, null));

        assertThat(task.status()).isEqualTo(TaskStatus.TODO);
        assertThat(task.priority()).isEqualTo(3);
    }

    @Test
    void creatingInSomeoneElsesProjectFails() {
        when(projectService.find(BEN, 1L)).thenThrow(new NotFoundException("Project 1 not found"));

        assertThatThrownBy(() -> taskService.create(BEN, 1L, new CreateTaskRequest("Write tests", null, null, null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Project 1 not found");
        verify(taskRepository, never()).save(any());
    }

    @Test
    void updateChangesOnlyTheFieldsSent() {
        LocalDate due = LocalDate.now().plusDays(7);
        Task task = new Task();
        task.setTitle("Write tests");
        task.setPriority(4);
        task.setDueDate(due);
        when(taskRepository.findByIdAndProjectOwnerId(5L, ANA)).thenReturn(Optional.of(task));

        TaskResponse updated = taskService.update(ANA, 5L, new UpdateTaskRequest(null, null, TaskStatus.DONE, null, null));

        assertThat(updated.status()).isEqualTo(TaskStatus.DONE);
        assertThat(updated.title()).isEqualTo("Write tests");   // unchanged
        assertThat(updated.priority()).isEqualTo(4);
        assertThat(updated.dueDate()).isEqualTo(due);
        verify(taskRepository, never()).save(any());             // dirty checking writes the change, not save()
    }

    @Test
    void someoneElsesTaskIsNotFound() {
        when(taskRepository.findByIdAndProjectOwnerId(5L, BEN)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(BEN, 5L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Task 5 not found");
        verify(taskRepository, never()).delete(any());
    }
}
```

</details>

<details class="deeper"><summary>📄 The updated `ProjectServiceTest`</summary>

```java
// src/test/java/com/example/taskmanager/project/ProjectServiceTest.java
package com.example.taskmanager.project;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.taskmanager.common.NotFoundException;
import com.example.taskmanager.task.TaskRepository;
import com.example.taskmanager.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    ProjectRepository projectRepository;

    @Mock
    TaskRepository taskRepository;

    @Mock
    UserRepository userRepository;

    ProjectService projectService;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(projectRepository, taskRepository, userRepository);
    }

    @Test
    void deleteRemovesTheTasksFirstThenTheProject() {
        Project project = new Project("Website", null);
        when(projectRepository.findByIdAndOwnerId(1L, 1L)).thenReturn(Optional.of(project));

        projectService.delete(1L, 1L);

        // tasks point at the project (foreign key), so they must go first
        InOrder order = inOrder(taskRepository, projectRepository);
        order.verify(taskRepository).deleteAllByProjectId(1L);
        order.verify(projectRepository).delete(project);
    }

    @Test
    void someoneElsesProjectCantBeDeleted() {
        when(projectRepository.findByIdAndOwnerId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.delete(2L, 1L)).isInstanceOf(NotFoundException.class);
        verify(taskRepository, never()).deleteAllByProjectId(any());
        verify(projectRepository, never()).delete(any());
    }
}
```

</details>

**5. Try it with two users.** Log in as Ana (step 9), create a project, then sign up and log in as `ben@example.com`:

```bash
curl localhost:8080/api/projects -H "Authorization: Bearer $BEN_TOKEN"                 # []
curl -i localhost:8080/api/projects/1 -H "Authorization: Bearer $BEN_TOKEN"            # 404, it's Ana's
curl -i -X POST localhost:8080/api/projects/1/tasks -H "Authorization: Bearer $BEN_TOKEN" \
     -H "Content-Type: application/json" -d '{"title":"Sneaky"}'                       # 404
```

Projects made before today have no owner (`owner_id` is NULL), so they no longer show up for anyone. That's expected: create new ones.

**✅ Checkpoint**

- [ ] Two users never see each other's projects or tasks: someone else's id is always a 404.
- [ ] `./mvnw test` passes. Commit: `step 12: ownership`.

**If it doesn't work:** a `ClassCastException` in `CurrentUser` usually means a test token has no `uid` claim (add `.claim("uid", 1L)`). If one user still sees another's data, find the repository method that has no `OwnerId` in its name.

<!-- subtopic: b65_t1_s1 -->
### Step 13: walk through the whole API

**Goal:** use every endpoint once, the way a client will, including the errors. Anything that surprises you here is a bug to fix before going further. Start the app (dev profile) and follow along with curl or Postman.

**1. An account and a token:**

```bash
curl -i -X POST localhost:8080/api/auth/signup -H "Content-Type: application/json" \
     -d '{"email":"ana@example.com","password":"correct-horse"}'          # 201
curl -X POST localhost:8080/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"ana@example.com","password":"correct-horse"}'          # {"token":"eyJ…"}
TOKEN=eyJ...                                                              # paste yours
AUTH="Authorization: Bearer $TOKEN"
```

**2. Projects and tasks:**

```bash
curl -X POST localhost:8080/api/projects -H "$AUTH" -H "Content-Type: application/json" -d '{"name":"Website"}'
curl -X POST localhost:8080/api/projects/1/tasks -H "$AUTH" -H "Content-Type: application/json" \
     -d '{"title":"Write tests","priority":4,"dueDate":"2026-12-31"}'
curl -X PATCH localhost:8080/api/tasks/1 -H "$AUTH" -H "Content-Type: application/json" -d '{"status":"DONE"}'
curl "localhost:8080/api/projects/1/tasks?status=DONE&sort=dueDate,asc" -H "$AUTH"
curl localhost:8080/api/projects -H "$AUTH"                 # taskCount 1, doneCount 1
curl -i -X DELETE localhost:8080/api/tasks/1 -H "$AUTH"     # 204
```

(Use your own ids: they come from the database and keep counting up.)

**3. Every error**, each with a `ProblemDetail` body:

| Try | Status | `detail` |
|---|---|---|
| no `Authorization` header | 401 | the token is missing, expired or invalid |
| login with a wrong password | 401 | Wrong email or password |
| sign up with a taken email | 409 | An account with … already exists |
| a task with `"title":""` | 400 | title: must not be blank |
| `"priority":9` | 400 | priority: must be less than or equal to 5 |
| a due date in the past | 400 | dueDate: must be a date in the present or in the future |
| `?sort=colour` | 400 | sort: no field named 'colour' |
| `GET /api/tasks/999` | 404 | Task 999 not found |
| someone else's task | 404 | Task 7 not found (the same as a missing one) |

(The 401 body comes in tomorrow's step 17; today a missing token gets an empty 401.) This table, with the endpoint table from Day 54, is your API's contract: put both in the README on Day 67.

**✅ Checkpoint**

- [ ] Every row of the table answers as shown. Anything else is a bug: fix it now, with a test that would have caught it.

<!-- subtopic: b65_t1_s2 -->
### Step 14: interactive API docs with Swagger UI

**Goal:** a web page that lists every endpoint with its request and response shapes, generated from your code, where anyone can try the API (with a token) without curl.

**1. Add springdoc**, which reads your controllers and DTOs and serves an OpenAPI description plus the Swagger UI page. Use the newest **3.x** version listed at [springdoc.org](https://springdoc.org) (3.x is for Spring Boot 4; 2.x is for Boot 3):

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>3.0.0</version>
</dependency>
```

**2. A title, and an Authorize button for the JWT:**

```java
// src/main/java/com/example/taskmanager/common/OpenApiConfig.java
package com.example.taskmanager.common;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

// The title on the Swagger UI page, and an "Authorize" button that takes a JWT and sends it with every request
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Task Manager API", version = "1.0", description = "Projects and tasks, with JWT login"),
        security = @SecurityRequirement(name = "bearer"))
@SecurityScheme(name = "bearer", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
```

**3. Let the docs through security** (they're public: they describe the API, they don't open it). In `SecurityConfig`:

```java
// in SecurityConfig.java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**", "/api/ping", "/actuator/health").permitAll()
        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
        .anyRequest().authenticated())
```

**4. Try it.** Open [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html). Expand `POST /api/auth/login`, *Try it out*, log in, copy the token, click **Authorize** and paste it. Now every *Try it out* sends the token. The raw description is at `/v3/api-docs`: tools (and Postman's import) can generate clients from it.

**✅ Checkpoint**

- [ ] Swagger UI lists all endpoints with their DTOs, and after Authorize you can create a project from the page.
- [ ] Commit: `step 14: Swagger UI`.

## 📝 Day 65 Recap

1. Where does the user's id come from? → **the login token's claims, never the request body or URL**
2. Someone else's task: 403 or 404? → **404, so the API doesn't reveal that it exists**
3. Filter a repository query by owner? → **put it in the method name, e.g. findByIdAndProjectOwnerId(id, userId)**
4. What does getReferenceById give you? → **a stand-in that only knows the id, enough to set a foreign key without a SELECT**
5. Pretend a request has a token in a MockMvc test? → **.with(jwt().jwt(t -> t.claim("uid", 1L)))**
6. What do you check in a walk-through? → **every endpoint once, including each error case and its status code**
7. What does springdoc generate? → **an OpenAPI description (/v3/api-docs) and the Swagger UI page**
8. How does Swagger UI send a JWT? → **a bearer security scheme and the Authorize button**
9. Why are the API docs public? → **they describe the API; every endpoint still needs a token**
10. Broken access control is which OWASP risk? → **number one**

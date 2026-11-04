# Day 58 — Spring Data JPA: Entities and Repositories

> Your API gets a real database today. Days 47–51's SQL meets Phase 2's objects. Read each 🌱 **In simple words** box first.

**Today's goal:** map Java classes to tables, save and load them with almost no code, and write queries just by naming methods.

<!-- topic: b58_t1 -->
## 🌿 Spring Data JPA — Basics

<!-- subtopic: b58_t1_s1 -->
### ORM, JPA, Hibernate and Spring Data

On Day 51 you wrote JDBC: SQL strings, `ResultSet`s and copying columns into fields by hand. An **ORM** (object-relational mapper) does that translation for you: a Java **class** ↔ a **table**, an **object** ↔ a **row**, a **field** ↔ a **column**.

Three names that come together, from bottom to top:

| Name | What it is |
|---|---|
| **JPA** (Jakarta Persistence API) | the **standard**: a set of annotations and interfaces (`@Entity`, `@Id`, `EntityManager`) |
| **Hibernate** | the most used **implementation** of JPA: the library that actually generates and runs the SQL |
| **Spring Data JPA** | a layer on top that writes your **repository classes** for you |

Add the **Spring Data JPA** starter and a database driver (PostgreSQL, or H2 for an in-memory database while learning), and tell Spring where the database is:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/practice
spring.datasource.username=postgres
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=update     # create/update tables from your entities (for learning only)
spring.jpa.show-sql=true                 # print the SQL Hibernate runs: very educational
```

`ddl-auto=update` is handy while learning. Real projects create tables with migration scripts instead (Flyway, Day 60).

<details>
<summary>JPA vs Hibernate vs Spring Data JPA?</summary>

JPA is the standard (annotations and interfaces), Hibernate is the library that implements it and runs the SQL, and Spring Data JPA generates repositories on top of it.
</details>

<!-- intro: d21_t1_s1 -->
An **entity** is a class that maps to a table: mark it `@Entity`, mark the primary key `@Id`, and let the database choose ids with `@GeneratedValue(strategy = GenerationType.IDENTITY)`. Each field becomes a column. `@Table(name = "...")` and `@Column(...)` let you change names and rules. Entities need a no-argument constructor (JPA creates objects through it).

<!-- intro: d21_t1_s7 -->
Declare an **interface** that extends `JpaRepository<Product, Long>` (the entity type and its id type), and Spring Data **writes the implementation for you** at startup: `save`, `findById`, `findAll`, `deleteById`, `count`, and paging. You never write the class. That interface is the repository layer from Day 55.

<!-- subtopic: b58_t1_s4 -->
### Queries from method names

Spring Data can also write queries **from the name of a method** you declare in the repository interface:

```java
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByCity(String city);                        // WHERE city = ?
    Optional<Student> findByEmail(String email);                  // one or none
    List<Student> findByAgeGreaterThan(int age);                  // WHERE age > ?
    List<Student> findByCityAndAgeLessThan(String city, int age); // WHERE city = ? AND age < ?
    List<Student> findByNameStartingWithIgnoreCase(String prefix);
    List<Student> findByCityOrderByNameAsc(String city);
    long countByCity(String city);
    boolean existsByEmail(String email);
}
```

The name is parsed into SQL: `findBy` + field names + keywords like `And`, `Or`, `GreaterThan`, `Between`, `Like`, `IgnoreCase`, `OrderBy`. A typo in a field name makes the app fail at **startup** with a clear message, which is good: you find out immediately.

When the name gets long and awkward, write the query yourself with `@Query` (next section).

<details>
<summary>What SQL does findByCityAndAgeGreaterThan(String city, int age) produce?</summary>

`... WHERE city = ? AND age > ?`, generated automatically from the method name.
</details>

<!-- intro: d21_t1_s5 -->
For queries a method name can't express, `@Query` lets you write them yourself. **JPQL** looks like SQL but uses **class and field names**, not table and column names (`SELECT s FROM Student s WHERE s.age > :age`), so it works on any database. Add `nativeQuery = true` to write real SQL for that specific database.

<!-- topic: b58_t2 -->
## 🛠️ Project — Task Manager API (Step 5)

<!-- subtopic: b58_t2_s1 -->
### Step 5: store projects and tasks in PostgreSQL

**Goal:** the data survives restarts. `Project` and `Task` become JPA entities, the `Map`s become Spring Data repositories, and the controllers don't change at all: that's what the layers were for.

**1. Add two dependencies** to `pom.xml` (or tick **Spring Data JPA** and **PostgreSQL Driver** at start.spring.io and copy them over), then reload Maven:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

**2. Create the database** in psql or pgAdmin (Day 47):

```sql
CREATE DATABASE taskmanager;
```

**3. Tell Spring where it is.** `${DB_USER:postgres}` reads the environment variable `DB_USER`, or uses `postgres` if it isn't set; change the defaults to your own PostgreSQL user and password:

```properties
# src/main/resources/application.properties
spring.application.name=taskmanager

# PostgreSQL (Day 47). Create the database once: CREATE DATABASE taskmanager;
spring.datasource.url=jdbc:postgresql://localhost:5432/taskmanager
spring.datasource.username=${DB_USER:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}

# Hibernate creates and updates the tables to match the entities (Day 60 hands this job to Flyway)
spring.jpa.hibernate.ddl-auto=update
# Print every SQL statement, so you can see what JPA does
spring.jpa.show-sql=true
# Close the database session when the service returns (lazy data must be loaded inside the service)
spring.jpa.open-in-view=false
```

**4. Entities and repositories.** `Project` gets an id from the database instead of the service:

```java
// src/main/java/com/example/taskmanager/project/Project.java
package com.example.taskmanager.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// One row of the projects table
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   // the database numbers the rows
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    protected Project() {
        // JPA creates entities with this, then fills the fields
    }

    public Project(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
}
```

```java
// src/main/java/com/example/taskmanager/project/ProjectRepository.java
package com.example.taskmanager.project;

import org.springframework.data.jpa.repository.JpaRepository;

// save, findById, findAll, existsById, deleteById... all generated by Spring Data
public interface ProjectRepository extends JpaRepository<Project, Long> {
}
```

```java
// src/main/java/com/example/taskmanager/project/ProjectService.java
package com.example.taskmanager.project;

import java.util.List;

import org.springframework.data.domain.Sort;
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
        return projectRepository.findAll(Sort.by("id")).stream()
                .map(ProjectResponse::from)
                .toList();
    }

    public ProjectResponse get(Long id) {
        return ProjectResponse.from(find(id));
    }

    // The project itself, for TaskService; 404 if there's no such project
    public Project find(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project " + id + " not found"));
    }
}
```

```java
// src/main/java/com/example/taskmanager/task/Task.java
package com.example.taskmanager.task;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// One row of the tasks table
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)   // just the number for now; Day 59 makes it a relationship
    private Long projectId;

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
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
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

```java
// src/main/java/com/example/taskmanager/task/TaskRepository.java
package com.example.taskmanager.task;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // Spring Data writes the SQL from the method name: ... WHERE project_id = ? ORDER BY id
    List<Task> findByProjectIdOrderByIdAsc(Long projectId);

    // ... WHERE project_id = ? AND status = ? ORDER BY id
    List<Task> findByProjectIdAndStatusOrderByIdAsc(Long projectId, TaskStatus status);
}
```

```java
// src/main/java/com/example/taskmanager/task/TaskService.java
package com.example.taskmanager.task;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.taskmanager.common.NotFoundException;
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
        projectService.find(projectId);                     // 404 if the project doesn't exist
        Task task = new Task();
        task.setProjectId(projectId);
        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.priority() != null) task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        return TaskResponse.from(taskRepository.save(task));
    }

    // A project's tasks, oldest first; status is optional (null = all)
    public List<TaskResponse> list(Long projectId, TaskStatus status) {
        projectService.find(projectId);
        List<Task> tasks = status == null
                ? taskRepository.findByProjectIdOrderByIdAsc(projectId)
                : taskRepository.findByProjectIdAndStatusOrderByIdAsc(projectId, status);
        return tasks.stream().map(TaskResponse::from).toList();
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

**5. Update the unit test**, which now mocks the repository instead of relying on the in-memory map:

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
        when(projectService.find(1L)).thenReturn(new Project("Website"));
        when(taskRepository.save(any(Task.class))).thenAnswer(call -> call.getArgument(0));   // save returns the task

        TaskResponse task = taskService.create(1L, new CreateTaskRequest("Write tests", null, null, null));

        assertThat(task.status()).isEqualTo(TaskStatus.TODO);
        assertThat(task.priority()).isEqualTo(3);
    }

    @Test
    void creatingInAMissingProjectFails() {
        when(projectService.find(9L)).thenThrow(new NotFoundException("Project 9 not found"));

        assertThatThrownBy(() -> taskService.create(9L, new CreateTaskRequest("Write tests", null, null, null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Project 9 not found");
        verify(taskRepository, never()).save(any());
    }

    @Test
    void updateChangesOnlyTheFieldsSent() {
        LocalDate due = LocalDate.now().plusDays(7);
        Task task = new Task();
        task.setTitle("Write tests");
        task.setPriority(4);
        task.setDueDate(due);
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);

        TaskResponse updated = taskService.update(5L, new UpdateTaskRequest(null, null, TaskStatus.DONE, null, null));

        assertThat(updated.status()).isEqualTo(TaskStatus.DONE);
        assertThat(updated.title()).isEqualTo("Write tests");   // unchanged
        assertThat(updated.priority()).isEqualTo(4);
        assertThat(updated.dueDate()).isEqualTo(due);
    }

    @Test
    void deletingAMissingTaskFails() {
        when(taskRepository.existsById(42L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.delete(42L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Task 42 not found");
        verify(taskRepository, never()).deleteById(any());
    }
}
```

**6. Run it.** The log shows Hibernate creating the tables (`spring.jpa.show-sql=true`):

```text
create table projects (id bigint generated by default as identity, name varchar(100) not null, primary key (id))
create table tasks (due_date date, priority integer not null, id bigint generated by default as identity,
    project_id bigint not null, status varchar(20) not null check ((status in ('TODO','IN_PROGRESS','DONE'))),
    title varchar(200) not null, description varchar(2000), primary key (id))
```

Create a project and a task with curl, **restart the app**, and list them again: they're still there. Look at the rows too: `SELECT * FROM tasks;` in psql. Each request prints its SQL in the log, so you can see what every repository method runs.

**✅ Checkpoint**

- [ ] Projects and tasks survive a restart, and you can see them with `SELECT`.
- [ ] `./mvnw test` passes (the `contextLoads` test now needs PostgreSQL running). Commit: `step 5: PostgreSQL with JPA`.

**If it doesn't work:** "Connection refused" means PostgreSQL isn't running or isn't on port 5432. "password authentication failed" means the username or password in `application.properties` is wrong. "Failed to load driver class org.postgresql.Driver" means the `postgresql` dependency is missing (reload Maven).

<!-- topic: b58_t3 -->
## 🧮 DSA — Weak Area Focus

Review your "What I Missed" notes and the problems you flagged **Solve again** on the Revise page, re-solve your five weakest, and practise explaining solutions aloud. One timed set (one easy, two medium in 60 minutes) to finish.

## 📝 Day 58 Recap

1. What does an ORM do? → **maps classes to tables and objects to rows so you work with objects instead of SQL**
2. Most common JPA implementation? → **Hibernate**
3. Mark a class as a table? → **@Entity**
4. Mark the primary key and let the database generate it? → **@Id with @GeneratedValue(strategy = GenerationType.IDENTITY)**
5. How do you get a repository with save/findById/findAll? → **an interface extending `JpaRepository<Entity, IdType>`**
6. Who writes the repository implementation? → **Spring Data, at startup**
7. Students in a city by method name? → **`List<Student> findByCity(String city)`**
8. When is a misspelled query method name detected? → **at application startup**
9. JPQL uses table names or class names? → **class and field names**
10. See the SQL Hibernate runs? → **spring.jpa.show-sql=true**

# Day 62 — Spring Security: JWT and OAuth2

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** understand how a REST API remembers who you are between requests using tokens, and how "Log in with Google" works.

<!-- topic: b62_t1 -->
## 🌿 Spring Security — Tokens

<!-- intro: d23_t1_s2 -->
REST APIs are stateless (Day 45): the server doesn't remember you between requests. So after you log in, the server gives you a **token**, and you send it with every request in the `Authorization: Bearer <token>` header, like a wristband at a festival that you show at every gate. A **JWT** (JSON Web Token) is a common kind: three Base64 parts separated by dots, a header, a payload (who you are, your roles, when it expires) and a **signature**. The signature lets the server check that nobody changed the token, without storing anything. Note that the payload is only encoded, not encrypted: anyone can read it, so never put secrets in it.

<!-- intro: d23_t1_s3 -->
On every request, a security **filter** reads the `Authorization` header, verifies the JWT's signature and expiry, and if it's valid, records "this request is user X with roles Y" in the `SecurityContextHolder`. Controllers and `@PreAuthorize` then use that. The section shows writing this filter by hand; Spring's built-in resource-server support (used in Code Practice) does it for you.

<!-- intro: d23_t1_s4 -->
JWTs can't easily be cancelled once issued, so keep them **short-lived** (around 15 minutes). A longer-lived **refresh token** (days) is used only to get a new access token, and it can be revoked on logout. Users stay logged in; a stolen access token is only useful briefly.

<!-- intro: d23_t1_s5 -->
"Log in with Google" uses **OAuth2** and **OpenID Connect**: instead of your app handling passwords, a trusted **authorization server** (Google, Okta, Keycloak) logs the user in and gives your app a token. Your API acts as a **resource server** that checks those tokens. For browser and mobile apps the flow uses **PKCE**, which stops stolen login codes from being used. Recognise the terms; you'll configure them when a project needs it.

<!-- topic: b62_t2 -->
## 🛠️ Project — Task Manager API (Step 9)

<!-- subtopic: b62_t2_s1 -->
### Step 9: JWT login, and every user sees only their own data

**Goal:** log in once and get a signed **JWT** that the client sends as `Authorization: Bearer …` (no password on every request), and **ownership**: each project belongs to a user, and nobody can see, change or even detect someone else's projects or tasks. This is the biggest step: take your time.

Today's notes build a `JwtAuthenticationFilter` by hand, to show what happens inside. In the project you use Spring Security's **OAuth2 resource server** instead: the same filter, built in and well tested, so you only supply the key (today's first practice exercise uses it too).

**1. Add the resource server starter** (it checks Bearer tokens):

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security-oauth2-resource-server</artifactId>
</dependency>
```

Delete `DatabaseUserDetailsService`: with tokens, the login endpoint checks the password itself.

**2. Projects get an owner:**

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

**3. The signing key and the token lifetime** go at the end of `application.properties`:

```properties
# in application.properties
# The key that signs login tokens (at least 32 characters) and how long a token works.
# The default after the colon is for your laptop only; Day 63 makes production supply its own.
app.jwt.secret=${JWT_SECRET:dev-only-secret-0123456789-abcdefghij}
app.jwt.expiry=15m
```

**4. Making and checking tokens.** `TokenService` makes them at login; the `JwtDecoder` bean checks them on every request:

```java
// src/main/java/com/example/taskmanager/security/TokenService.java
package com.example.taskmanager.security;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.example.taskmanager.user.AppUser;

// Makes the signed token a user gets at login. Anyone can READ a JWT (it's only base64),
// so it holds nothing secret: who the user is and when the token stops working.
@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final Duration expiry;

    public TokenService(JwtEncoder encoder, @Value("${app.jwt.expiry}") Duration expiry) {
        this.encoder = encoder;
        this.expiry = expiry;
    }

    public String issue(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("taskmanager")
                .subject(user.getEmail())          // "sub": the React app shows this
                .claim("uid", user.getId())        // the id the services use
                .issuedAt(now)
                .expiresAt(now.plus(expiry))       // "exp": checked on every request
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
```

```java
// src/main/java/com/example/taskmanager/security/CurrentUser.java
package com.example.taskmanager.security;

import org.springframework.security.oauth2.jwt.Jwt;

public final class CurrentUser {

    private CurrentUser() {
    }

    // The user's id, from the "uid" claim TokenService puts in every token
    public static Long id(Jwt jwt) {
        return ((Number) jwt.getClaim("uid")).longValue();
    }
}
```

```java
// src/main/java/com/example/taskmanager/security/SecurityConfig.java
package com.example.taskmanager.security;

import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
public class SecurityConfig {

    // One secret key both signs tokens (at login) and checks them (on every request): HMAC-SHA256
    private final SecretKey jwtKey;

    public SecurityConfig(@Value("${app.jwt.secret}") String secret) {
        this.jwtKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // No login page and no session cookie: each request proves who it is with a token.
                // CSRF attacks ride on cookies the browser sends by itself, so without cookies CSRF protection isn't needed.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(Customizer.withDefaults())                      // uses the corsConfigurationSource bean below
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/ping").permitAll()
                        .anyRequest().authenticated())
                // Authorization: Bearer <token>. Spring checks the signature and expiry with the JwtDecoder below;
                // a missing, expired or forged token gets a 401
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtKey));
    }

    @Bean
    JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();                           // slow on purpose, with a random salt per password
    }

    // The React app (Module 29) runs on another origin, http://localhost:5173: the browser only lets it call this API
    // if the API says so with CORS headers
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

**5. Login:**

```java
// src/main/java/com/example/taskmanager/user/LoginRequest.java
package com.example.taskmanager.user;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String email, @NotBlank String password) {
}
```

```java
// src/main/java/com/example/taskmanager/user/TokenResponse.java
package com.example.taskmanager.user;

// {"token": "eyJhbGciOiJIUzI1NiJ9..."}
public record TokenResponse(String token) {
}
```

```java
// src/main/java/com/example/taskmanager/user/AuthService.java
package com.example.taskmanager.user;

import java.util.Locale;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.taskmanager.security.TokenService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public UserResponse signup(SignupRequest request) {
        String email = normalize(request.email());
        if (userRepository.existsByEmail(email)) throw new EmailTakenException(email);
        AppUser user = userRepository.save(new AppUser(email, passwordEncoder.encode(request.password())));
        return UserResponse.from(user);
    }

    // The same answer for an unknown email and a wrong password, so nobody can test which emails have accounts
    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmail(normalize(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Wrong email or password"));
        return new TokenResponse(tokenService.issue(user));
    }

    // "Ana@Mail.com " and "ana@mail.com" are the same account
    static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
```

```java
// in AuthController.java
@PostMapping("/login")
public TokenResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
}
```

And a 401 for a wrong password, in `GlobalExceptionHandler` (import `org.springframework.security.authentication.BadCredentialsException`):

```java
// in GlobalExceptionHandler.java
// Login with a wrong email or password
@ExceptionHandler(BadCredentialsException.class)
public ProblemDetail handleBadLogin(BadCredentialsException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
}
```

**6. Ownership, all the way down.** The controllers read the user's id from the token and pass it to the services; the services only ever load rows that belong to that user. Someone else's project is a **404**, not a 403: a 403 would confirm that project 7 exists.

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

**7. Tests.** `jwt()` from Spring Security's test support pretends a request carries a valid token with the claims you choose, so controller tests don't need real tokens. `TokenServiceTest` checks the real ones:

```java
// src/test/java/com/example/taskmanager/security/TokenServiceTest.java
package com.example.taskmanager.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.taskmanager.user.AppUser;

// The real encoder and decoder from SecurityConfig, without starting Spring
class TokenServiceTest {

    SecurityConfig config = new SecurityConfig("test-secret-0123456789-abcdefghijkl");
    TokenService tokenService = new TokenService(config.jwtEncoder(), Duration.ofMinutes(15));

    AppUser ana() {
        AppUser user = new AppUser("ana@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", 7L);   // the database would set it
        return user;
    }

    @Test
    void tokenCarriesEmailIdAndA15MinuteExpiry() {
        Jwt jwt = config.jwtDecoder().decode(tokenService.issue(ana()));

        assertThat(jwt.getSubject()).isEqualTo("ana@example.com");
        assertThat(CurrentUser.id(jwt)).isEqualTo(7L);
        assertThat(jwt.getExpiresAt()).isCloseTo(Instant.now().plus(15, ChronoUnit.MINUTES), within(5, ChronoUnit.SECONDS));
    }

    @Test
    void aChangedTokenIsRejected() {
        String token = tokenService.issue(ana());
        String[] parts = token.split("\\.");
        String forged = parts[0] + "." + parts[1].substring(0, parts[1].length() - 2) + "xx." + parts[2];

        assertThatThrownBy(() -> config.jwtDecoder().decode(forged)).isInstanceOf(JwtException.class);
    }

    @Test
    void aTokenSignedWithAnotherKeyIsRejected() {
        SecurityConfig other = new SecurityConfig("another-secret-0123456789-abcdefghij");
        String token = new TokenService(other.jwtEncoder(), Duration.ofMinutes(15)).issue(ana());

        assertThatThrownBy(() -> config.jwtDecoder().decode(token)).isInstanceOf(JwtException.class);
    }
}
```

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

The other test classes change in the same way: the services take a user id, and the login gets tests. Open each one and replace your file:

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

<details class="deeper"><summary>📄 The updated `AuthServiceTest` (with login tests)</summary>

```java
// src/test/java/com/example/taskmanager/user/AuthServiceTest.java
package com.example.taskmanager.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.taskmanager.security.TokenService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    TokenService tokenService;

    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, tokenService);
    }

    @Test
    void signupStoresAHashNotThePassword() {
        when(userRepository.existsByEmail("ana@example.com")).thenReturn(false);
        when(userRepository.save(any(AppUser.class))).thenAnswer(call -> call.getArgument(0));

        authService.signup(new SignupRequest(" Ana@Example.com", "correct-horse"));

        ArgumentCaptor<AppUser> saved = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("ana@example.com");            // normalized
        assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("correct-horse")
                .startsWith("$2a$");                                                    // a BCrypt hash
        assertThat(passwordEncoder.matches("correct-horse", saved.getValue().getPasswordHash())).isTrue();
    }

    @Test
    void sameEmailTwiceIsRefused() {
        when(userRepository.existsByEmail("ana@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(new SignupRequest("ana@example.com", "correct-horse")))
                .isInstanceOf(EmailTakenException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginWithTheRightPasswordGetsAToken() {
        AppUser ana = new AppUser("ana@example.com", passwordEncoder.encode("correct-horse"));
        when(userRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(ana));
        when(tokenService.issue(ana)).thenReturn("a.signed.token");

        assertThat(authService.login(new LoginRequest("Ana@example.com", "correct-horse")).token()).isEqualTo("a.signed.token");
    }

    @Test
    void wrongPasswordAndUnknownEmailGetTheSameError() {
        AppUser ana = new AppUser("ana@example.com", passwordEncoder.encode("correct-horse"));
        when(userRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(ana));
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ana@example.com", "wrong-password")))
                .isInstanceOf(BadCredentialsException.class).hasMessage("Wrong email or password");
        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@example.com", "correct-horse")))
                .isInstanceOf(BadCredentialsException.class).hasMessage("Wrong email or password");
        verify(tokenService, never()).issue(any());
    }
}
```

</details>

<details class="deeper"><summary>📄 The updated `AuthControllerTest` (with login tests)</summary>

```java
// src/test/java/com/example/taskmanager/user/AuthControllerTest.java
package com.example.taskmanager.user;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.taskmanager.security.SecurityConfig;

// @Import(SecurityConfig.class): slice tests don't load @Configuration classes by themselves,
// and without ours Spring Security's defaults (everything locked, CSRF on) would apply
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    AuthService authService;

    @Test
    void signupNeedsNoLoginAndReturns201() throws Exception {
        when(authService.signup(any())).thenReturn(new UserResponse(1L, "ana@example.com"));

        mvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "ana@example.com", "password": "correct-horse"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/users/1"))
                .andExpect(jsonPath("$.email").value("ana@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void shortPasswordIs400() throws Exception {
        mvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "ana@example.com", "password": "short"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("password: size must be between 8 and 72"));
    }

    @Test
    void loginReturnsAToken() throws Exception {
        when(authService.login(new LoginRequest("ana@example.com", "correct-horse"))).thenReturn(new TokenResponse("a.signed.token"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "ana@example.com", "password": "correct-horse"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("a.signed.token"));
    }

    @Test
    void wrongPasswordIs401() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Wrong email or password"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "ana@example.com", "password": "nope-nope"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Wrong email or password"));
    }

    @Test
    void takenEmailIs409() throws Exception {
        when(authService.signup(any())).thenThrow(new EmailTakenException("ana@example.com"));

        mvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "ana@example.com", "password": "correct-horse"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("An account with ana@example.com already exists"));
    }
}
```

</details>

**8. Try it.** Sign up and log in as two users:

```bash
curl -X POST localhost:8080/api/auth/signup -H "Content-Type: application/json" -d '{"email":"ana@example.com","password":"correct-horse"}'
curl -X POST localhost:8080/api/auth/login  -H "Content-Type: application/json" -d '{"email":"ana@example.com","password":"correct-horse"}'
# {"token":"eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0YXNr…"}   copy it:
TOKEN=eyJhbGciOiJIUzI1NiJ9...
curl -X POST localhost:8080/api/projects -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Ana only"}'
curl localhost:8080/api/projects -H "Authorization: Bearer $TOKEN"
```

Paste the token into [jwt.io](https://jwt.io): the middle part holds `iss`, `sub` (the email), `uid`, `iat` and `exp`, readable by anyone, which is why a token never holds secrets. Then sign up `ben@example.com`, log in as Ben, and ask for Ana's project by its id: **404**. `GET /api/projects` as Ben is an empty list.

**✅ Checkpoint**

- [ ] Login answers `{"token":"…"}`; a wrong password answers 401 with `"detail":"Wrong email or password"`.
- [ ] With the token every endpoint works; without it, or with a changed one, 401.
- [ ] Two users never see each other's projects or tasks (404). `./mvnw test` passes. Commit: `step 9: JWT and ownership`.

**If it doesn't work:** an error about the key length (HS256 needs at least 256 bits) means `app.jwt.secret` is shorter than 32 characters. A 401 with a fresh token: check the header is exactly `Authorization: Bearer <token>`, with one space. Projects made before today have no owner, so they no longer show up for anyone; that's expected.

## 📝 Day 62 Recap

1. How does a stateless API know who you are? → **the client sends a token with every request**
2. Header used for tokens? → **`Authorization: Bearer <token>`**
3. Three parts of a JWT? → **header, payload and signature**
4. What does the signature prove? → **the token wasn't changed and was issued by the server**
5. Is a JWT payload secret? → **no, it's only Base64-encoded; anyone can read it**
6. Where does Spring store the authenticated user for a request? → **SecurityContextHolder**
7. Why are access tokens short-lived? → **they can't easily be revoked, so a stolen one is only useful briefly**
8. What is a refresh token for? → **getting a new access token without logging in again**
9. What is OAuth2/OpenID Connect used for? → **letting a trusted provider log users in and issue tokens ("Log in with Google")**
10. What is a resource server? → **an API that accepts and checks tokens issued by an authorization server**

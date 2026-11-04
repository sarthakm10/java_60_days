# Day 61 — Spring Security: The Basics

> Security is where small mistakes become headlines. Today covers the concepts and the basic setup; tomorrow adds tokens. Read each 🌱 **In simple words** box first.

**Today's goal:** know the difference between authentication and authorization, configure which endpoints need a login, store passwords safely, and allow a browser front end to call your API.

<!-- topic: b61_t1 -->
## 🌿 Spring Security — Basics

<!-- subtopic: b61_t1_s1 -->
### Authentication vs authorization

Two different questions, asked in this order:

| | Question | Example | Failure status (Day 45) |
|---|---|---|---|
| **Authentication** | **Who are you?** | logging in with email and password, or showing a token | **401 Unauthorized** |
| **Authorization** | **What are you allowed to do?** | only admins may delete products; users only see their own orders | **403 Forbidden** |

Think of an office building: the security desk checks your ID card (authentication), and your card only opens certain floors (authorization).

Authorization is usually based on **roles** (`USER`, `ADMIN`) and sometimes on ownership ("is this *your* order?"). Rules:

- **Deny by default**: every endpoint needs a login unless you deliberately make it public.
- **Check on the server, always.** Hiding the "Delete" button in the app is not security; anyone can send the HTTP request with curl.
- Never write your own password or crypto code. Use the framework's.

Add the **Spring Security** starter, and the moment you restart, **every** endpoint returns 401 and a generated password is printed in the log. Spring Security is deny-by-default out of the box; your job is to open up exactly what should be public.

<details>
<summary>Authentication vs authorization?</summary>

Authentication checks who you are (login); authorization checks what you're allowed to do (roles, ownership).
</details>

<details>
<summary>Is hiding a button in the front end enough to protect an action?</summary>

No. Anyone can send the HTTP request directly, so every rule must be checked on the server.
</details>

<!-- intro: d23_t1_s1 -->
Every request passes through a chain of **security filters** before it reaches your controller: checking the login, the token, the rules. You configure them with one **`SecurityFilterChain` bean** (Day 53's `@Bean`): which paths are public (`/api/auth/**`, `GET /api/products`), which need a login, and which need a role (`/api/admin/**` → `ADMIN`). Older tutorials extend `WebSecurityConfigurerAdapter`, which no longer exists in Spring Boot 3+.

<!-- intro: d23_t1_s8 -->
**Never store passwords as plain text.** If the database leaks, every user's password leaks too, and people reuse passwords everywhere. Store a **hash** instead: a one-way scramble that can be checked but not reversed. `BCryptPasswordEncoder` is the standard: `encoder.encode(password)` when someone registers, `encoder.matches(attempt, storedHash)` when they log in. BCrypt is deliberately slow and adds a random *salt*, so leaked hashes are very hard to crack.

<!-- intro: d23_t1_s6 -->
Besides URL rules, you can protect individual service methods: **`@PreAuthorize("hasRole('ADMIN')")`** on a method checks the role before it runs, and expressions can check ownership too (`#userId == authentication.principal.id`). Turn it on with `@EnableMethodSecurity`.

<!-- intro: d23_t1_s7 -->
Browsers block a web page on one origin (say a React app on `localhost:3000`) from calling an API on another (`localhost:8080`), unless the API says it's allowed. That permission system is **CORS**. Configure which front-end origins, methods and headers may call you, globally or with `@CrossOrigin`. You'll need this the moment a front end talks to your API.

👉 **Code Practice** sets up a security filter chain with roles and BCrypt. Use a **separate project** for security exercises, so they don't lock your other endpoints.

<!-- topic: b61_t2 -->
## 🛠️ Project — Task Manager API (Step 8)

<!-- subtopic: b61_t2_s1 -->
### Step 8: users, sign-up with BCrypt, and Spring Security

**Goal:** people can create an account (the password is stored as a BCrypt hash), and every endpoint except sign-up needs a login. Today the login is HTTP Basic (the email and password on every request); tomorrow it becomes a token. CORS is set up so the React app on another port can call the API.

**1. Add Spring Security** (and its test helpers) to `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

Restart and try `curl -i localhost:8080/api/projects`: **401**. Just adding the starter locks every endpoint and prints "Using generated security password" in the log. The rest of this step replaces that default with your own users and rules.

**2. Users.** A migration, an entity and a repository:

```sql
-- src/main/resources/db/migration/V2__create_users.sql
-- V2: accounts. Never change V1 once it has run anywhere: every schema change is a new file.

CREATE TABLE users (
    id            BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

```java
// src/main/java/com/example/taskmanager/user/AppUser.java
package com.example.taskmanager.user;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// A person with an account. Called AppUser because "User" is a reserved word in SQL and a class in Spring Security.
@Entity
@Table(name = "users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String passwordHash;          // a BCrypt hash, never the password itself

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected AppUser() {
    }

    public AppUser(String email, String passwordHash) {
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Instant getCreatedAt() { return createdAt; }
}
```

```java
// src/main/java/com/example/taskmanager/user/UserRepository.java
package com.example.taskmanager.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);
}
```

**3. Sign-up.** BCrypt only reads the first 72 bytes of a password, so longer ones are refused rather than silently cut:

```java
// src/main/java/com/example/taskmanager/user/SignupRequest.java
package com.example.taskmanager.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// BCrypt only uses the first 72 bytes of a password, so longer ones are refused rather than silently cut
public record SignupRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String password) {
}
```

```java
// src/main/java/com/example/taskmanager/user/UserResponse.java
package com.example.taskmanager.user;

// What the API shows about a user: never the password hash
public record UserResponse(Long id, String email) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getEmail());
    }
}
```

```java
// src/main/java/com/example/taskmanager/user/EmailTakenException.java
package com.example.taskmanager.user;

public class EmailTakenException extends RuntimeException {

    public EmailTakenException(String email) {
        super("An account with " + email + " already exists");
    }
}
```

```java
// src/main/java/com/example/taskmanager/user/AuthService.java
package com.example.taskmanager.user;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse signup(SignupRequest request) {
        String email = normalize(request.email());
        if (userRepository.existsByEmail(email)) throw new EmailTakenException(email);
        AppUser user = userRepository.save(new AppUser(email, passwordEncoder.encode(request.password())));
        return UserResponse.from(user);
    }

    // "Ana@Mail.com " and "ana@mail.com" are the same account
    static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
```

```java
// src/main/java/com/example/taskmanager/user/AuthController.java
package com.example.taskmanager.user;

import java.net.URI;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponse> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse user = authService.signup(request);
        return ResponseEntity.created(URI.create("/api/users/" + user.id())).body(user);
    }
}
```

A 409 for a taken email, in `GlobalExceptionHandler`:

```java
// in GlobalExceptionHandler.java
@ExceptionHandler(EmailTakenException.class)
public ProblemDetail handleEmailTaken(EmailTakenException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
}
```

**4. Security.** How Spring finds a user at login, and the rules:

```java
// src/main/java/com/example/taskmanager/security/DatabaseUserDetailsService.java
package com.example.taskmanager.security;

import java.util.Locale;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.taskmanager.user.UserRepository;

// How Spring Security finds a user when someone logs in: by email, from the users table.
// Spring then checks the password against the stored BCrypt hash itself.
@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public DatabaseUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .map(user -> User.withUsername(user.getEmail())
                        .password(user.getPasswordHash())
                        .roles("USER")
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("No user " + email));
    }
}
```

```java
// src/main/java/com/example/taskmanager/security/SecurityConfig.java
package com.example.taskmanager.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // No login page and no session cookie: each request proves who it is (HTTP Basic today, a JWT tomorrow).
                // CSRF attacks ride on cookies the browser sends by itself, so without cookies CSRF protection isn't needed.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(Customizer.withDefaults())                      // uses the corsConfigurationSource bean below
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/ping").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());                // Authorization: Basic base64(email:password)
        return http.build();
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

**5. Tests.** `@WebMvcTest` slices don't load `@Configuration` classes, so each one now imports `SecurityConfig`, and `@WithMockUser` runs the tests as a logged-in user. Change the top of `TaskControllerTest` and add a 401 test:

```java
// in TaskControllerTest.java
// Starts only the web layer (TaskController, GlobalExceptionHandler, JSON, validation): no services, no server.
// TaskService is replaced by a mock, so each test decides what the service returns.
// Security is on: @WithMockUser runs each test as a logged-in user, unless a test says otherwise.
@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
@WithMockUser
class TaskControllerTest {
```

```java
// in TaskControllerTest.java
@WithAnonymousUser
void withoutLoginIs401() throws Exception {
    mvc.perform(get("/api/tasks/5"))
            .andExpect(status().isUnauthorized());

    verifyNoInteractions(taskService);
}
```

(imports: `org.springframework.context.annotation.Import`, `org.springframework.security.test.context.support.WithMockUser`, `…support.WithAnonymousUser`, `com.example.taskmanager.security.SecurityConfig`.) Then tests for sign-up:

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

```java
// src/test/java/com/example/taskmanager/user/AuthServiceTest.java
package com.example.taskmanager.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;

    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder);
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
}
```

**6. Try it.**

```bash
curl -i -X POST localhost:8080/api/auth/signup -H "Content-Type: application/json" \
     -d '{"email":"ana@example.com","password":"correct-horse"}'
curl -i localhost:8080/api/projects                                   # 401, WWW-Authenticate: Basic
curl -u ana@example.com:correct-horse localhost:8080/api/projects     # 200
curl -u ana@example.com:wrong-pass -i localhost:8080/api/projects     # 401
```

In psql, `SELECT email, password_hash FROM users;` shows something like `$2a$10$Xq…`: the algorithm (`2a`), the cost (`10`), the salt and the hash. Sign up twice with the same password: the hashes differ, because each gets its own random salt.

CORS, as the browser checks it before a cross-origin request (the "preflight"). These are real answers:

```bash
curl -i -X OPTIONS localhost:8080/api/projects -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type"
```

```text
HTTP/1.1 200
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: authorization, content-type
```

The same request from `Origin: http://evil.example` gets `403 Invalid CORS request`.

Notice what's still missing: Ana and anyone else who signs up see the **same** projects. Tomorrow's step gives each project an owner.

**✅ Checkpoint**

- [ ] Sign-up answers 201 (409 for a taken email, 400 for a bad email or a short password), and the database holds a hash, never the password.
- [ ] Without a login every project and task endpoint answers 401; with `-u email:password` they work.
- [ ] `./mvnw test` passes. Commit: `step 8: users and Spring Security`.

**If it doesn't work:** a 403 on POST usually means CSRF protection is still on (the `csrf.disable()` line). A 401 with the right password: check the email is stored in lowercase, and that the `users` table has the BCrypt hash (starting `$2a$`).

## 📝 Day 61 Recap

1. Authentication? → **verifying who someone is**
2. Authorization? → **deciding what an authenticated user may do**
3. Status for "not logged in" vs "not allowed"? → **401 vs 403**
4. Default when Spring Security is added? → **every endpoint requires authentication**
5. Where do you configure URL rules? → **a SecurityFilterChain bean**
6. How are passwords stored? → **as BCrypt hashes, never plain text**
7. Check a password at login? → **encoder.matches(attempt, storedHash)**
8. Role check on a method? → **@PreAuthorize("hasRole('ADMIN')") with @EnableMethodSecurity**
9. What is CORS? → **the browser rule controlling which other origins may call your API**
10. Is front-end hiding enough for security? → **no, always check on the server**

# Day 62 — Spring Security: JWT Tokens

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** understand how a REST API remembers who you are between requests using tokens, and switch your project's login to JWTs. (Refresh tokens and "Log in with Google" come on Day 66.)

<!-- topic: b62_t1 -->
## 🌿 Spring Security — Tokens

<!-- intro: d23_t1_s2 -->
REST APIs are stateless (Day 45): the server doesn't remember you between requests. So after you log in, the server gives you a **token**, and you send it with every request in the `Authorization: Bearer <token>` header, like a wristband at a festival that you show at every gate. A **JWT** (JSON Web Token) is a common kind: three Base64 parts separated by dots, a header, a payload (who you are, your roles, when it expires) and a **signature**. The signature lets the server check that nobody changed the token, without storing anything. Note that the payload is only encoded, not encrypted: anyone can read it, so never put secrets in it.

<!-- intro: d23_t1_s3 -->
On every request, a security **filter** reads the `Authorization` header, verifies the JWT's signature and expiry, and if it's valid, records "this request is user X with roles Y" in the `SecurityContextHolder`. Controllers and `@PreAuthorize` then use that. The section shows writing this filter by hand; Spring's built-in resource-server support (used in Code Practice) does it for you.

<!-- topic: b62_t2 -->
## 🛠️ Project — Task Manager API (Step 9)

<!-- subtopic: b62_t2_s1 -->
### Step 9: log in once, then send a JWT

**Goal:** instead of sending the email and password with every request (HTTP Basic, yesterday), the user logs in once and gets a signed **JWT**, which the client sends as `Authorization: Bearer …` until it expires 15 minutes later. Everyone still sees every project for now; on Day 65 the token's user id is used to give each project an owner.

Today's notes build a `JwtAuthenticationFilter` by hand, to show what happens inside. In the project you use Spring Security's **OAuth2 resource server** instead: the same filter, built in and well tested, so you only supply the key (today's first practice exercise uses it too).

**1. Add the resource server starter** (it checks Bearer tokens):

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security-oauth2-resource-server</artifactId>
</dependency>
```

Delete `DatabaseUserDetailsService`: with tokens, the login endpoint checks the password itself.

**2. The signing key and the token lifetime** go at the end of `application.properties`:

```properties
# in application.properties
# The key that signs login tokens (at least 32 characters) and how long a token works.
# The default after the colon is for your laptop only; Day 63 makes production supply its own.
app.jwt.secret=${JWT_SECRET:dev-only-secret-0123456789-abcdefghij}
app.jwt.expiry=15m
```

**3. Making and checking tokens.** `TokenService` makes them at login; the `JwtDecoder` bean in `SecurityConfig` checks them on every request, replacing `httpBasic`. `CurrentUser` reads the user id back out of a token: you'll use it on Day 65.

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

**4. Login:**

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

**5. Tests.** `TokenServiceTest` checks real tokens: what's inside, and that a changed token or one signed with another key is refused:

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

The sign-up tests get login tests too. Open each one and replace your file:

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

`TaskControllerTest` doesn't change: `@WithMockUser` logs a test user in whichever way the real app checks logins.

**6. Try it:**

```bash
curl -X POST localhost:8080/api/auth/signup -H "Content-Type: application/json" -d '{"email":"ana@example.com","password":"correct-horse"}'
curl -X POST localhost:8080/api/auth/login  -H "Content-Type: application/json" -d '{"email":"ana@example.com","password":"correct-horse"}'
# {"token":"eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0YXNr…"}   copy it:
TOKEN=eyJhbGciOiJIUzI1NiJ9...
curl localhost:8080/api/projects -H "Authorization: Bearer $TOKEN"     # 200
curl -i localhost:8080/api/projects                                     # 401
curl -u ana@example.com:correct-horse -i localhost:8080/api/projects    # 401: Basic is switched off
```

Paste the token into [jwt.io](https://jwt.io): the middle part holds `iss`, `sub` (the email), `uid`, `iat` and `exp`, readable by anyone, which is why a token never holds secrets. Change one character of the token and call the API again: 401, because the signature no longer matches.

**✅ Checkpoint**

- [ ] Login answers `{"token":"…"}`; a wrong password answers 401 with `"detail":"Wrong email or password"`.
- [ ] With the token every endpoint works; without it, or with a changed one, 401.
- [ ] `./mvnw test` passes. Commit: `step 9: JWT login`.

**If it doesn't work:** an error about the key length (HS256 needs at least 256 bits) means `app.jwt.secret` is shorter than 32 characters. A 401 with a fresh token: check the header is exactly `Authorization: Bearer <token>`, with one space.

## 📝 Day 62 Recap

1. How does a stateless API know who you are? → **the client sends a token with every request**
2. Header used for tokens? → **`Authorization: Bearer <token>`**
3. Three parts of a JWT? → **header, payload and signature**
4. What does the signature prove? → **the token wasn't changed and was issued by the server**
5. Is a JWT payload secret? → **no, it's only Base64-encoded; anyone can read it**
6. Where does Spring store the authenticated user for a request? → **SecurityContextHolder**
7. Why are access tokens short-lived? → **they can't easily be revoked, so a stolen one is only useful briefly**
8. What does your login endpoint return? → **{"token": "…"}: a JWT signed with HS256, valid for 15 minutes**
9. What checks the Bearer token in your project? → **Spring Security's OAuth2 resource server, with a JwtDecoder bean**
10. What is a resource server? → **an API that accepts and checks tokens issued by an authorization server**

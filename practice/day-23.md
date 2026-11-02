Today you secure an API three ways: a `SecurityFilterChain` with roles and hashed passwords, stateless **JWT** login with Spring's built-in resource-server support, and method-level rules with `@PreAuthorize` plus CORS.

**Use a separate project for today** (e.g. artifact `security-practice`) — adding Spring Security to your main practice project would lock every other day's endpoints. Dependencies: Spring Web, Spring Security, **OAuth2 Resource Server** (`spring-boot-starter-security-oauth2-resource-server` on Boot 4, `spring-boot-starter-oauth2-resource-server` on Boot 3), and for tests `spring-boot-starter-security-test` (Boot 4) / `spring-security-test` (Boot 3) plus the web test starter from Day 20. Use package `com.example.practice` as before.

<!-- exercise: d23_e1 | Medium | A `SecurityFilterChain` with roles and BCrypt -->
**Concepts:** `SecurityFilterChain` bean (no more `WebSecurityConfigurerAdapter`) · `authorizeHttpRequests` rules · HTTP Basic for a stateless API · 401 vs 403 · `BCryptPasswordEncoder` · in-memory `UserDetailsService` · `@WithMockUser` and `httpBasic()` in tests

**Task.** Complete `SecurityConfig`:

- `/api/public/**` — open to everyone.
- `/api/admin/**` — role `ADMIN` only.
- Everything else — any authenticated user.
- Stateless sessions, CSRF disabled (token-less API clients), HTTP Basic login.
- Two users — `asha`/`asha-pass` (USER) and `boss`/`boss-pass` (ADMIN) — with **BCrypt-hashed** passwords.

**Starter code**

```java
// src/main/java/com/example/practice/d23/basic/SecureController.java
package com.example.practice.d23.basic;

import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SecureController {
    @GetMapping("/api/public/ping") public String ping() { return "pong"; }
    @GetMapping("/api/me") public String me(Principal principal) { return principal.getName(); }
    @GetMapping("/api/admin/stats") public String stats() { return "42 orders today"; }
}
```

```java
// src/main/java/com/example/practice/d23/basic/SecurityConfig.java
package com.example.practice.d23.basic;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
        // TODO: rules, stateless sessions, csrf off, http basic
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return null; // TODO
    }

    @Bean
    UserDetailsService users(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(); // TODO: asha (USER) and boss (ADMIN) with encoded passwords
    }
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d23/basic/SecurityConfigTest.java
package com.example.practice.d23.basic;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SecureController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired MockMvc mvc;
    @Autowired UserDetailsService users;

    @Test
    void publicEndpointNeedsNoLogin() throws Exception {
        mvc.perform(get("/api/public/ping")).andExpect(status().isOk()).andExpect(content().string("pong"));
    }

    @Test
    void anonymousCallerGets401() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void realCredentialsWork() throws Exception {
        mvc.perform(get("/api/me").with(httpBasic("asha", "asha-pass")))
                .andExpect(status().isOk()).andExpect(content().string("asha"));
    }

    @Test
    void wrongPasswordGets401() throws Exception {
        mvc.perform(get("/api/me").with(httpBasic("asha", "nope"))).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "asha", roles = "USER")
    void userWithoutAdminRoleGets403() throws Exception {
        mvc.perform(get("/api/admin/stats")).andExpect(status().isForbidden());
    }

    @Test
    void adminCanReachAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/stats").with(httpBasic("boss", "boss-pass"))).andExpect(status().isOk());
    }

    @Test
    void passwordsAreStoredAsBcryptHashes() {
        assertThat(users.loadUserByUsername("asha").getPassword()).startsWith("$2").doesNotContain("asha-pass");
    }
}
```

**Expected result**

```text
SecurityConfigTest: 7 tests passed
```

<!-- hints -->
- Rules are checked **in order** — put specific matchers before `anyRequest()`: `auth.requestMatchers("/api/public/**").permitAll().requestMatchers("/api/admin/**").hasRole("ADMIN").anyRequest().authenticated()`.
- `.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))`, `.csrf(csrf -> csrf.disable())`, `.httpBasic(Customizer.withDefaults())`.
- `User.withUsername("asha").password(encoder.encode("asha-pass")).roles("USER").build()` — `roles("USER")` stores the authority `ROLE_USER`, which is what `hasRole("USER")` checks.
- **401 Unauthorized** = we don't know who you are; **403 Forbidden** = we know, and you're not allowed.
- BCrypt hashes start with `$2a$`/`$2b$` and include a random salt, so hashing the same password twice gives different strings — compare with `encoder.matches(raw, hash)`.

<!-- solution -->
```java
// src/main/java/com/example/practice/d23/basic/SecurityConfig.java
package com.example.practice.d23.basic;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")     // checks ROLE_ADMIN
                .anyRequest().authenticated())                          // first match wins, so this goes last
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())                               // no browser session → no CSRF risk
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();                             // slow, salted hash
    }

    @Bean
    UserDetailsService users(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("asha").password(encoder.encode("asha-pass")).roles("USER").build(),
                User.withUsername("boss").password(encoder.encode("boss-pass")).roles("ADMIN").build());
    }
}
```

**In a real app** users come from the database via your own `UserDetailsService`, and the request flows through the filter chain: `BasicAuthenticationFilter` → `AuthenticationManager` → `DaoAuthenticationProvider` (loads the user, checks the BCrypt hash) → `SecurityContextHolder` → `AuthorizationFilter` applies your rules. Turn on `logging.level.org.springframework.security=TRACE` once to watch it happen.

<!-- exercise: d23_e2 | Hard | Stateless JWT login with the resource server -->
**Concepts:** issuing a signed JWT (HS256) with `NimbusJwtEncoder` · validating it with `NimbusJwtDecoder` via `oauth2ResourceServer().jwt()` · mapping a `roles` claim to authorities · `Authorization: Bearer …` · expiry · tampered tokens are rejected

**Task.** Build login → token → access, without writing your own JWT filter:

1. `TokenService.issue(username, roles)` creates a JWT: issuer `practice`, subject = username, claim `roles`, expiry in 15 minutes, signed with HS256.
2. `POST /api/auth/login` checks the credentials and returns `{"accessToken": "…"}` (401 on bad credentials).
3. `JwtSecurityConfig` permits `/api/auth/**`, requires `ADMIN` for `/api/admin/**`, authenticates everything else with **JWTs**, and turns the `roles` claim into `ROLE_…` authorities.

**Starter code**

```java
// src/main/java/com/example/practice/d23/jwt/TokenService.java
package com.example.practice.d23.jwt;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    // TODO: inject JwtEncoder
    public String issue(String username, List<String> roles) {
        return ""; // TODO: issuer, subject, roles claim, issuedAt, expiresAt (+15 min), HS256 header
    }
}
```

```java
// src/main/java/com/example/practice/d23/jwt/AuthController.java
package com.example.practice.d23.jwt;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    public record LoginRequest(String username, String password) { }

    // TODO: inject UserDetailsService, PasswordEncoder, TokenService

    @PostMapping("/api/auth/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.status(401).build(); // TODO: verify password, return {"accessToken": token}
    }
}
```

```java
// src/main/java/com/example/practice/d23/jwt/OrdersController.java
package com.example.practice.d23.jwt;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrdersController {
    @GetMapping("/api/orders") public String orders(@AuthenticationPrincipal Jwt jwt) { return "orders for " + jwt.getSubject(); }
    @GetMapping("/api/admin/report") public String report() { return "admin report"; }
}
```

```java
// src/main/java/com/example/practice/d23/jwt/JwtSecurityConfig.java
package com.example.practice.d23.jwt;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class JwtSecurityConfig {
    // demo only — load the secret from an environment variable / secrets manager in real apps
    static final SecretKey KEY = new SecretKeySpec(
            "practice-only-secret-change-me-0123456789".getBytes(StandardCharsets.UTF_8), "HmacSHA256");

    @Bean
    SecurityFilterChain jwtSecurity(HttpSecurity http) throws Exception {
        // TODO: permit /api/auth/**, ADMIN for /api/admin/**, authenticate the rest with oauth2ResourceServer JWTs,
        //       map the "roles" claim to ROLE_ authorities, stateless, csrf off
        return http.build();
    }

    @Bean JwtEncoder jwtEncoder() { return null; }   // TODO: NimbusJwtEncoder with an ImmutableSecret
    @Bean JwtDecoder jwtDecoder() { return null; }   // TODO: NimbusJwtDecoder.withSecretKey(KEY)

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    UserDetailsService users(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("asha").password(encoder.encode("asha-pass")).roles("USER").build(),
                User.withUsername("boss").password(encoder.encode("boss-pass")).roles("ADMIN").build());
    }
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d23/jwt/JwtFlowTest.java
package com.example.practice.d23.jwt;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({AuthController.class, OrdersController.class})
@Import({JwtSecurityConfig.class, TokenService.class})
class JwtFlowTest {

    @Autowired MockMvc mvc;

    String login(String user, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + user + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    @Test
    void loginReturnsASignedJwt() throws Exception {
        assertThat(login("asha", "asha-pass").split("\\.")).hasSize(3);    // header.payload.signature
    }

    @Test
    void wrongPasswordGets401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"asha\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bearerTokenGrantsAccess() throws Exception {
        String token = login("asha", "asha-pass");
        mvc.perform(get("/api/orders").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().string("orders for asha"));
    }

    @Test
    void missingTokenGets401() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
    }

    @Test
    void tamperedTokenGets401() throws Exception {
        String token = login("asha", "asha-pass");
        String tampered = token.substring(0, token.length() - 4) + (token.endsWith("AAAA") ? "BBBB" : "AAAA");
        mvc.perform(get("/api/orders").header("Authorization", "Bearer " + tampered)).andExpect(status().isUnauthorized());
    }

    @Test
    void rolesClaimIsEnforced() throws Exception {
        mvc.perform(get("/api/admin/report").header("Authorization", "Bearer " + login("asha", "asha-pass")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/report").header("Authorization", "Bearer " + login("boss", "boss-pass")))
                .andExpect(status().isOk());
    }
}
```

**Expected result**

```text
JwtFlowTest: 6 tests passed
```

<!-- hints -->
- Encoder: `new NimbusJwtEncoder(new ImmutableSecret<>(KEY))` (`com.nimbusds.jose.jwk.source.ImmutableSecret`). Decoder: `NimbusJwtDecoder.withSecretKey(KEY).macAlgorithm(MacAlgorithm.HS256).build()`.
- Claims: `JwtClaimsSet.builder().issuer("practice").subject(username).issuedAt(now).expiresAt(now.plus(15, MINUTES)).claim("roles", roles).build()`, then `encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue()`.
- Roles for the token: take the user's authorities (`ROLE_USER`) and strip `ROLE_` — the converter adds the prefix back.
- Authorities: `JwtGrantedAuthoritiesConverter g = new JwtGrantedAuthoritiesConverter(); g.setAuthoritiesClaimName("roles"); g.setAuthorityPrefix("ROLE_");` wrapped in a `JwtAuthenticationConverter`, passed to `.oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(converter)))`.
- `loadUserByUsername` throws `UsernameNotFoundException` for unknown users — treat it like a wrong password (same 401, so attackers can't probe usernames).

<!-- solution -->
```java
// src/main/java/com/example/practice/d23/jwt/TokenService.java
package com.example.practice.d23.jwt;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final JwtEncoder encoder;

    public TokenService(JwtEncoder encoder) { this.encoder = encoder; }

    public String issue(String username, List<String> roles) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("practice")
                .subject(username)
                .issuedAt(now)
                .expiresAt(now.plus(15, ChronoUnit.MINUTES))          // short-lived access token
                .claim("roles", roles)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
```

```java
// src/main/java/com/example/practice/d23/jwt/AuthController.java
package com.example.practice.d23.jwt;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    public record LoginRequest(String username, String password) { }

    private final UserDetailsService users;
    private final PasswordEncoder encoder;
    private final TokenService tokens;

    public AuthController(UserDetailsService users, PasswordEncoder encoder, TokenService tokens) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        UserDetails user;
        try {
            user = users.loadUserByUsername(request.username());
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();      // same answer as a bad password
        }
        if (!encoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replaceFirst("^ROLE_", ""))
                .toList();
        return ResponseEntity.ok(Map.of("accessToken", tokens.issue(user.getUsername(), roles)));
    }
}
```

```java
// src/main/java/com/example/practice/d23/jwt/JwtSecurityConfig.java
package com.example.practice.d23.jwt;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class JwtSecurityConfig {
    static final SecretKey KEY = new SecretKeySpec(
            "practice-only-secret-change-me-0123456789".getBytes(StandardCharsets.UTF_8), "HmacSHA256");

    @Bean
    SecurityFilterChain jwtSecurity(HttpSecurity http) throws Exception {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("roles");                       // read our custom claim
        roles.setAuthorityPrefix("ROLE_");                            // so hasRole("ADMIN") works
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(roles);

        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(converter)))   // validates Bearer tokens
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable());
        return http.build();
    }

    @Bean
    JwtEncoder jwtEncoder() { return new NimbusJwtEncoder(new ImmutableSecret<>(KEY)); }

    @Bean
    JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(KEY).macAlgorithm(MacAlgorithm.HS256).build();   // checks signature + exp
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    UserDetailsService users(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("asha").password(encoder.encode("asha-pass")).roles("USER").build(),
                User.withUsername("boss").password(encoder.encode("boss-pass")).roles("ADMIN").build());
    }
}
```

**Why not hand-roll a `JwtAuthenticationFilter`?** Many tutorials write a `OncePerRequestFilter` with jjwt — it works, but the resource server already parses the header, verifies signature, expiry and issuer, builds the `Authentication`, and returns proper 401s with `WWW-Authenticate`. In production you'd usually **not** sign tokens yourself at all: an identity provider (Keycloak, Cognito, Auth0) issues RS256 tokens and your service only sets `spring.security.oauth2.resourceserver.jwt.issuer-uri`. Pair short-lived access tokens with rotating refresh tokens.

<!-- exercise: d23_e3 | Medium | Method security with `@PreAuthorize` / `@PostAuthorize`, and CORS -->
**Concepts:** `@EnableMethodSecurity` · `@PreAuthorize` with SpEL (`hasRole`, comparing a parameter to `authentication.name`) · `@P` to name parameters · `@PostAuthorize` on `returnObject` · `AccessDeniedException` · CORS preflight with a `CorsConfigurationSource` bean

**Task.**

1. Protect `DocumentService`: `find(id)` returns the document only to its **owner** or an `ADMIN` (`@PostAuthorize`); `listFor(owner)` only for the owner themself (`@PreAuthorize`); `deleteAll()` only for `ADMIN`.
2. Configure CORS so the SPA at `https://app.example.com` may call `GET`/`POST` on the API, and any other origin is refused.

**Starter code**

```java
// src/main/java/com/example/practice/d23/method/Document.java
package com.example.practice.d23.method;

public record Document(String id, String owner, String text) { }
```

```java
// src/main/java/com/example/practice/d23/method/MethodSecurityConfig.java
package com.example.practice.d23.method;

import org.springframework.context.annotation.Configuration;

@Configuration
public class MethodSecurityConfig {   // TODO: enable method security
}
```

```java
// src/main/java/com/example/practice/d23/method/DocumentService.java
package com.example.practice.d23.method;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DocumentService {
    private final Map<String, Document> docs = Map.of(
            "d1", new Document("d1", "asha", "asha's notes"),
            "d2", new Document("d2", "ravi", "ravi's notes"));

    // TODO: only the owner or an ADMIN may receive the result
    public Document find(String id) { return docs.get(id); }

    // TODO: only when owner == the logged-in user's name
    public List<Document> listFor(String owner) {
        return docs.values().stream().filter(d -> d.owner().equals(owner)).toList();
    }

    // TODO: ADMIN only
    public String deleteAll() { return "deleted"; }
}
```

```java
// src/main/java/com/example/practice/d23/method/DocsController.java
package com.example.practice.d23.method;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DocsController {
    @GetMapping("/api/docs") public String docs() { return "docs"; }
}
```

```java
// src/main/java/com/example/practice/d23/method/CorsSecurityConfig.java
package com.example.practice.d23.method;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class CorsSecurityConfig {

    @Bean
    SecurityFilterChain corsChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(a -> a.anyRequest().permitAll()).csrf(c -> c.disable());
        // TODO: enable CORS using a CorsConfigurationSource bean
        return http.build();
    }

    // TODO: CorsConfigurationSource bean — origin https://app.example.com, methods GET and POST, all paths
}
```

**Given tests** (don't change them)

```java
// src/test/java/com/example/practice/d23/method/DocumentSecurityTest.java
package com.example.practice.d23.method;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringJUnitConfig({MethodSecurityConfig.class, DocumentService.class})
class DocumentSecurityTest {

    @Autowired DocumentService documents;

    @Test
    @WithMockUser(username = "asha")
    void ownerCanReadTheirDocument() {
        assertThat(documents.find("d1").text()).isEqualTo("asha's notes");
    }

    @Test
    @WithMockUser(username = "asha")
    void othersDocumentsAreDenied() {
        assertThatThrownBy(() -> documents.find("d2")).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> documents.listFor("ravi")).isInstanceOf(AccessDeniedException.class);
        assertThat(documents.listFor("asha")).hasSize(1);
    }

    @Test
    @WithMockUser(username = "boss", roles = "ADMIN")
    void adminCanReadAnythingAndDelete() {
        assertThat(documents.find("d2").owner()).isEqualTo("ravi");
        assertThat(documents.deleteAll()).isEqualTo("deleted");
    }

    @Test
    @WithMockUser(username = "asha")
    void regularUserCannotDelete() {
        assertThatThrownBy(() -> documents.deleteAll()).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void noAuthenticationAtAllIsRejected() {
        assertThatThrownBy(() -> documents.deleteAll()).isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }
}
```

```java
// src/test/java/com/example/practice/d23/method/CorsTest.java
package com.example.practice.d23.method;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DocsController.class)
@Import(CorsSecurityConfig.class)
class CorsTest {

    @Autowired MockMvc mvc;

    @Test
    void preflightFromTheSpaIsAllowed() throws Exception {
        mvc.perform(options("/api/docs")
                        .header("Origin", "https://app.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://app.example.com"));
    }

    @Test
    void preflightFromAnotherOriginIsRejected() throws Exception {
        mvc.perform(options("/api/docs")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
```

**Expected result**

```text
DocumentSecurityTest: 5 tests passed
CorsTest: 2 tests passed
```

<!-- hints -->
- `@EnableMethodSecurity` (Spring Security 6+) enables `@PreAuthorize`/`@PostAuthorize` by default; `@Secured` and JSR-250 need flags.
- `@PostAuthorize("returnObject.owner() == authentication.name or hasRole('ADMIN')")` runs **after** the method and checks what it returned.
- `@PreAuthorize("#owner == authentication.name")` with `@P("owner")` on the parameter (`org.springframework.security.core.parameters.P`) — `@P` makes the name available even without the `-parameters` compiler flag.
- CORS: `http.cors(Customizer.withDefaults())` picks up a `CorsConfigurationSource` bean. Build a `CorsConfiguration` with `setAllowedOrigins(List.of("https://app.example.com"))` and `setAllowedMethods(List.of("GET", "POST"))`, and register it for `"/**"` in a `UrlBasedCorsConfigurationSource`.
- CORS is enforced by **browsers** only — it is not authentication. `curl` ignores it entirely.

<!-- solution -->
```java
// src/main/java/com/example/practice/d23/method/MethodSecurityConfig.java
package com.example.practice.d23.method;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableMethodSecurity                      // proxies beans with @PreAuthorize / @PostAuthorize
public class MethodSecurityConfig {
}
```

```java
// src/main/java/com/example/practice/d23/method/DocumentService.java
package com.example.practice.d23.method;

import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;

@Service
public class DocumentService {
    private final Map<String, Document> docs = Map.of(
            "d1", new Document("d1", "asha", "asha's notes"),
            "d2", new Document("d2", "ravi", "ravi's notes"));

    @PostAuthorize("returnObject.owner() == authentication.name or hasRole('ADMIN')")
    public Document find(String id) { return docs.get(id); }

    @PreAuthorize("#owner == authentication.name")
    public List<Document> listFor(@P("owner") String owner) {
        return docs.values().stream().filter(d -> d.owner().equals(owner)).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public String deleteAll() { return "deleted"; }
}
```

```java
// src/main/java/com/example/practice/d23/method/CorsSecurityConfig.java
package com.example.practice.d23.method;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsSecurityConfig {

    @Bean
    SecurityFilterChain corsChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(a -> a.anyRequest().permitAll()).csrf(c -> c.disable())
            .cors(Customizer.withDefaults());                      // uses the CorsConfigurationSource bean
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of("https://app.example.com"));   // never "*" together with credentials
        cors.setAllowedMethods(List.of("GET", "POST"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cors.setMaxAge(3600L);                                        // browsers cache the preflight for an hour
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }
}
```

**URL rules or method rules?** Use URL rules in the `SecurityFilterChain` for coarse access (public vs authenticated vs admin areas) and method security for **business rules** that depend on data ("only the owner may read this order"). Method security also protects code paths that aren't HTTP at all — Kafka listeners, scheduled jobs.

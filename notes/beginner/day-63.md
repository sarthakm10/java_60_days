# Day 63 — Configuration, Profiles, Logging and Actuator

> The features that make an app ready to run on a real server. Read each 🌱 **In simple words** box first.

**Today's goal:** run the same app with different settings per environment, read configuration safely, log properly, and expose a health check. (Metrics come with observability on Day 78.)

<!-- topic: b63_t1 -->
## 🌿 Spring Boot — Production Features

<!-- intro: d25_t1_s4 -->
Your laptop, the test server and production each need different settings: a different database, a fake versus a real email sender. **Profiles** handle this: `application-dev.properties` and `application-prod.properties` hold the differences, and `spring.profiles.active=dev` picks one (the common `application.properties` always loads too). Day 53's `@Profile` beans switch on the same way.

<!-- intro: d25_t1_s5 -->
Reading many settings with `@Value` (Day 54) gets messy. **`@ConfigurationProperties(prefix = "app.mail")`** binds a whole group of settings into one typed class (a record works well), and adding `@Validated` with validation annotations (Day 56) makes the app refuse to start with a missing or invalid setting, which is far better than failing at 3 am.

<!-- intro: d25_t1_s6 -->
A setting can come from many places, and the higher ones win: command-line arguments, then **environment variables** (`SERVER_PORT=9090`), then profile files, then `application.properties`, then defaults. That's how servers and Docker (Day 73) inject real passwords without them ever being in your Git repository.

<!-- intro: d25_t1_s7 -->
Stop using `System.out.println` in real apps. A **logger** (SLF4J, built in) adds the time, level and class to every line, and you choose how much to see per package: `log.info("Order {} placed", id)`. Levels from noisiest to quietest: TRACE, DEBUG, INFO, WARN, ERROR. On servers, logs are often written as JSON so tools can search them, with a correlation id (MDC) to follow one request through every line.

<!-- intro: d25_t1_s1 -->
**Actuator** adds ready-made monitoring endpoints: `/actuator/health` (is the app and its database OK? Load balancers and Kubernetes ask this constantly), `/actuator/metrics`, `/actuator/info`. Add the starter, and choose which endpoints to expose; never expose them all publicly.

<!-- topic: b63_t2 -->
## 🛠️ Project — Task Manager API (Step 10)

<!-- subtopic: b63_t2_s1 -->
### Step 10: typed configuration, dev and prod profiles, health checks and logs

**Goal:** the same jar runs on your laptop and in production with different settings, production refuses to start with a missing or weak secret, there's a health endpoint for monitoring, and the logs say what happened without leaking anything.

**1. Add Actuator:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**2. Split the settings by environment.** What's the same everywhere stays in `application.properties`; `application-dev.properties` is your laptop (and the default); `application-prod.properties` takes everything from environment variables:

```properties
# src/main/resources/application.properties
# Settings for every environment. Without SPRING_PROFILES_ACTIVE the app runs with the dev profile,
# which adds application-dev.properties on top; production sets SPRING_PROFILES_ACTIVE=prod.
spring.application.name=taskmanager
spring.profiles.default=dev

# Flyway creates the tables (src/main/resources/db/migration); Hibernate only checks they match the entities
spring.jpa.hibernate.ddl-auto=validate
# Close the database session when the service returns (lazy data must be loaded inside the service)
spring.jpa.open-in-view=false

# ?size= can't ask for more than 100 rows at once
spring.data.web.pageable.max-page-size=100

# How long a login token works (the signing secret is per environment)
app.jwt.expiry=15m

# Actuator: only the health check is exposed over HTTP (it's public, for load balancers and uptime monitors)
management.endpoints.web.exposure.include=health
```

```properties
# src/main/resources/application-dev.properties
# Your laptop. Safe to commit: nothing here works anywhere else.

# PostgreSQL (Day 47). Create the database once: CREATE DATABASE taskmanager;
spring.datasource.url=jdbc:postgresql://localhost:5432/taskmanager
spring.datasource.username=${DB_USER:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}

# Print every SQL statement, and this app's debug logs
spring.jpa.show-sql=true
logging.level.com.example.taskmanager=DEBUG

app.jwt.secret=dev-only-secret-0123456789-abcdefghij
app.cors.allowed-origins=http://localhost:5173

management.endpoint.health.show-details=always
```

```properties
# src/main/resources/application-prod.properties
# Production. Every secret and address comes from an environment variable, with no default:
# if one is missing, the app refuses to start instead of running with a laptop setting.

spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}

app.jwt.secret=${JWT_SECRET}
# Comma-separated, e.g. https://tasks.example.com
app.cors.allowed-origins=${CORS_ORIGINS}

logging.level.root=INFO
```

**3. Typed settings instead of `@Value`.** A record per group, checked when the app starts:

```java
// src/main/java/com/example/taskmanager/security/JwtProperties.java
package com.example.taskmanager.security;

import java.time.Duration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// app.jwt.* settings, typed and checked at startup: a missing or short secret stops the app with a clear message
// instead of failing on the first login. "15m" in the properties file becomes a Duration.
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32, message = "must be at least 32 characters (256 bits) for HS256") String secret,
        @NotNull Duration expiry) {
}
```

```java
// src/main/java/com/example/taskmanager/security/CorsProperties.java
package com.example.taskmanager.security;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// app.cors.allowed-origins: the web addresses allowed to call this API from a browser (comma-separated)
@Validated
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(@NotEmpty List<String> allowedOrigins) {
}
```

`SecurityConfig` turns them on with `@EnableConfigurationProperties` and uses them for the key and the CORS origins; `TokenService` takes `JwtProperties` instead of a `@Value`. `/actuator/health` is public:

```java
// src/main/java/com/example/taskmanager/security/SecurityConfig.java
package com.example.taskmanager.security;

import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
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
@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class})
public class SecurityConfig {

    // One secret key both signs tokens (at login) and checks them (on every request): HMAC-SHA256
    private final SecretKey jwtKey;
    private final CorsProperties cors;

    public SecurityConfig(JwtProperties jwt, CorsProperties cors) {
        this.jwtKey = new SecretKeySpec(jwt.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        this.cors = cors;
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
                        .requestMatchers("/api/auth/**", "/api/ping", "/actuator/health").permitAll()
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

    // The React app runs on another origin (http://localhost:5173 in dev): the browser only lets it call this API
    // if the API says so with CORS headers. The allowed origins differ per environment, so they come from config.
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(cors.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

```java
// src/main/java/com/example/taskmanager/security/TokenService.java
package com.example.taskmanager.security;

import java.time.Instant;

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
    private final JwtProperties properties;

    public TokenService(JwtEncoder encoder, JwtProperties properties) {
        this.encoder = encoder;
        this.properties = properties;
    }

    public String issue(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("taskmanager")
                .subject(user.getEmail())          // "sub": the React app shows this
                .claim("uid", user.getId())        // the id the services use
                .issuedAt(now)
                .expiresAt(now.plus(properties.expiry()))   // "exp": checked on every request
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
```

**4. Logs that help without leaking.** Ids and events, never passwords, tokens or full request bodies:

```java
// src/main/java/com/example/taskmanager/user/AuthService.java
package com.example.taskmanager.user;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.taskmanager.security.TokenService;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

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
        log.info("New account: user {}", user.getId());          // ids in logs, never passwords or tokens
        return UserResponse.from(user);
    }

    // The same answer for an unknown email and a wrong password, so nobody can test which emails have accounts
    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmail(normalize(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> {
                    log.warn("Failed login");                    // many of these in a row means someone is guessing
                    return new BadCredentialsException("Wrong email or password");
                });
        log.debug("User {} logged in", user.getId());
        return new TokenResponse(tokenService.issue(user));
    }

    // "Ana@Mail.com " and "ana@mail.com" are the same account
    static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
```

**5. Tests.** `TokenServiceTest` builds `JwtProperties` now, and a small test runs the same checks Spring runs at startup:

```java
// in TokenServiceTest.java
JwtProperties settings = new JwtProperties("test-secret-0123456789-abcdefghijkl", Duration.ofMinutes(15));
SecurityConfig config = new SecurityConfig(settings, new CorsProperties(List.of("http://localhost:5173")));
TokenService tokenService = new TokenService(config.jwtEncoder(), settings);
```

```java
// src/test/java/com/example/taskmanager/security/JwtPropertiesTest.java
package com.example.taskmanager.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

import org.junit.jupiter.api.Test;

// The same checks Spring runs at startup, run directly
class JwtPropertiesTest {

    Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void aShortSecretIsRefused() {
        var problems = validator.validate(new JwtProperties("too-short", Duration.ofMinutes(15)));

        assertThat(problems).extracting(p -> p.getPropertyPath() + ": " + p.getMessage())
                .containsExactly("secret: must be at least 32 characters (256 bits) for HS256");
    }

    @Test
    void theDevSettingsAreValid() {
        assertThat(validator.validate(new JwtProperties("dev-only-secret-0123456789-abcdefghij", Duration.ofMinutes(15)))).isEmpty();
    }
}
```

**6. Try it.** `curl localhost:8080/actuator/health` shows `"status":"UP"`, and in dev also the database and disk checks. Now start it as production, with the database variables but **without** a JWT secret (stop the dev one first). In Git Bash or macOS/Linux:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/taskmanager DB_USER=postgres DB_PASSWORD=postgres
export CORS_ORIGINS=http://localhost:5173
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

It refuses to start:

```text
APPLICATION FAILED TO START

Description:

Binding to target com.example.taskmanager.security.JwtProperties failed:

    Property: app.jwt.secret
    Value: "${JWT_SECRET}"
    Origin: class path resource [application-prod.properties] - 8:16
    Reason: must be at least 32 characters (256 bits) for HS256
```

`${JWT_SECRET}` stayed as text because the variable doesn't exist, and the length check caught it. Set a strong random secret and it starts:

```bash
export JWT_SECRET=$(openssl rand -base64 48)
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

In PowerShell, set each one with `$env:JWT_SECRET = "…"`. In IntelliJ: *Run → Edit Configurations → Environment variables* and *Active profiles*.

**✅ Checkpoint**

- [ ] Without a profile the app runs as dev; with `prod` and no variables it refuses to start with a clear reason.
- [ ] `/actuator/health` answers without a login; `/actuator/env` doesn't (it isn't exposed).
- [ ] `./mvnw test` passes. Commit: `step 10: profiles and configuration`.

**If it doesn't work:** an error that shows `${DB_URL}` (or another `${…}`) is the prod profile working as designed: that variable isn't set in this terminal. If the dev profile isn't picked up, check the file is named exactly `application-dev.properties`, next to `application.properties`.

## 📝 Day 63 Recap

1. File for dev-only settings? → **application-dev.properties**
2. Activate a profile? → **spring.profiles.active=dev (or an environment variable)**
3. Bind a group of settings to a typed class? → **@ConfigurationProperties(prefix = "...")**
4. Make the app refuse to start with bad config? → **@Validated plus validation annotations on the properties class**
5. Which wins: an environment variable or application.properties? → **the environment variable**
6. Why use a logger instead of System.out? → **timestamps, levels, per-package control and structured output**
7. Log levels from noisiest to quietest? → **TRACE, DEBUG, INFO, WARN, ERROR**
8. Endpoint load balancers check? → **/actuator/health**
9. Expose only the health endpoint over HTTP? → **management.endpoints.web.exposure.include=health**
10. Why does the prod profile have no default secrets? → **so a missing variable stops the app instead of running with a laptop setting**

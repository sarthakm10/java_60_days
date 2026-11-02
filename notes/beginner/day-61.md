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

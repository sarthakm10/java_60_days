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

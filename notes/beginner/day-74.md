# Day 74 — Docker in Depth and Testcontainers

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** make images small and safe, and run your integration tests against a real database in a throwaway container.

<!-- topic: b74_t1 -->
## 🗄️ DevOps — Better Images & Real Tests

<!-- intro: d30_t1_s2 -->
Building the JAR needs Maven and a full JDK (hundreds of megabytes), but **running** it only needs a Java runtime. A **multi-stage** Dockerfile uses one stage to build and a second, slim stage that copies in only the finished JAR. The final image is a fraction of the size: faster to upload, faster to start, less to attack.

<!-- intro: d30_t1_s4 -->
Safer images: a `.dockerignore` file (like `.gitignore`, Day 12) so `target/`, `.git` and secrets never get copied in; a **non-root user** so a compromised app can't take over the container; and **minimal base images** (alpine, distroless) with fewer programs inside, so fewer things can have security holes.

<!-- intro: d24_t1_s7 -->
Tests against an in-memory database can pass while production PostgreSQL fails (different SQL features, different behaviour). **Testcontainers** starts a **real** PostgreSQL (or Redis, or Kafka) in Docker for your tests, and throws it away afterwards. Your Day 57 integration tests then run against the same database as production. It needs Docker running on the machine that runs the tests.

## 📝 Day 74 Recap

1. What is a multi-stage build? → **build in one stage, copy only the result into a slim final stage**
2. Why does it help? → **much smaller images: faster to ship and start, less attack surface**
3. Purpose of .dockerignore? → **keep files like target/, .git and secrets out of the image**
4. Why run as a non-root user? → **a compromised app can't take over the whole container**
5. Why minimal base images? → **fewer programs inside means fewer vulnerabilities**
6. What does Testcontainers do? → **starts real databases or services in Docker for tests, then removes them**
7. Why not only an in-memory database for tests? → **it can behave differently from production PostgreSQL**
8. What does Testcontainers need on the test machine? → **Docker**
9. JDK or JRE in the final runtime image? → **a runtime (JRE) is enough**
10. Where do settings like DB_URL come from in a container? → **environment variables**

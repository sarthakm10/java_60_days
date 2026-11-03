# Day 73 — Docker Basics

> **Phase 9: Deploy & Scale.** Your app works on your laptop. These nineteen days are about running it reliably on servers, splitting it into services, connecting them with events, and putting it in the cloud. It starts with containers. Read each 🌱 **In simple words** box first.

**Today's goal:** understand containers and images, write a Dockerfile for a Spring Boot app, and run your app with its database using Docker Compose.

<!-- topic: b73_t1 -->
## 🗄️ DevOps — Docker Basics

<!-- subtopic: b73_t1_s1 -->
### Containers: why "it works on my machine" happens

Your Task Manager runs on your laptop because your laptop happens to have: Java 21 (not 17), PostgreSQL 16 on port 5432, the right environment variables, and the right OS libraries. Hand the JAR to a teammate or a server with anything slightly different, and it breaks. "But it works on my machine!" is one of the oldest jokes in software.

A **container** packages your app **together with everything it needs to run**: the Java runtime, libraries, config and files. It runs the same way on any computer that has Docker. Think of a shipping container: whatever is inside, every ship, crane and truck in the world knows how to handle the box.

Three words to know:

| Word | Meaning | Analogy |
|---|---|---|
| **Image** | a read-only package: your app plus its whole environment, built from a `Dockerfile` | a recipe card, or a class (Day 13) |
| **Container** | a running instance of an image; you can run many from one image | a dish made from the recipe, or an object |
| **Registry** | a library of images (Docker Hub, Amazon ECR) | an app store for images |

Containers are not virtual machines. A VM fakes a whole computer with its own operating system (gigabytes, a minute to boot); containers share the host's OS kernel and only isolate the app (megabytes, they start in seconds). That's why a server can run dozens of them.

Install **Docker Desktop** (Windows/macOS) or Docker Engine (Linux), then try:

```bash
docker run hello-world                         # downloads a tiny image and runs it
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:16   # a PostgreSQL in 10 seconds
docker ps                                      # running containers
docker stop <id>                               # stop one
```

That second command gives you a working database without installing PostgreSQL at all. Containers are also how Testcontainers (Day 74) gives tests a real database.

<details>
<summary>Image vs container?</summary>

An image is the read-only package (app plus environment); a container is a running instance of an image. One image can run as many containers.
</details>

<details>
<summary>Why are containers lighter than virtual machines?</summary>

They share the host operating system's kernel and only isolate the app, instead of running a whole separate operating system.
</details>

<!-- intro: d30_t1_s1 -->
A **Dockerfile** is the recipe for an image, one instruction per line: `FROM` picks a starting image (e.g. a Java 21 runtime), `WORKDIR` sets the folder, `COPY` adds your files, `RUN` executes commands while building, `EXPOSE` documents the port, and `ENTRYPOINT`/`CMD` say what to run when a container starts. `docker build -t taskmanager .` builds the image; `docker run -p 8080:8080 taskmanager` runs it.

<!-- intro: d30_t1_s5 -->
For Spring Boot it's short: build the JAR with `./mvnw package`, then a Dockerfile that starts from a Java 21 runtime image, copies `target/*.jar`, and runs `java -jar app.jar`. Pass settings as environment variables (`-e DB_URL=...`), exactly the Day 63/67 setup, and set memory limits for the JVM (Day 43) so it fits the container.

<!-- intro: d30_t1_s3 -->
Your app needs a database (and later Redis, Kafka…). **Docker Compose** describes several containers in one `docker-compose.yml` file (app, PostgreSQL, their ports, environment variables and storage) and starts them all with `docker compose up`. A new teammate goes from cloning the repo to a running system with one command.

<!-- intro: d30_t1_s6 -->
Containers talk to each other over Docker **networks**. In Compose, every service can reach the others **by service name**: your app connects to `jdbc:postgresql://db:5432/taskmanager`, where `db` is the database service's name, not `localhost` (inside a container, `localhost` means that container itself).

## 📝 Day 73 Recap

1. What problem do containers solve? → **"works on my machine": they package the app with everything it needs**
2. Image vs container? → **an image is the package; a container is a running instance of it**
3. Containers vs VMs? → **containers share the host OS kernel, so they're much lighter and start faster**
4. What is a registry? → **a store of images, e.g. Docker Hub or Amazon ECR**
5. Build an image from a Dockerfile? → **docker build -t name .**
6. Run a container and publish port 8080? → **docker run -p 8080:8080 name**
7. Dockerfile instruction to pick the base image? → **FROM**
8. What does Docker Compose do? → **defines and starts several containers together from one YAML file**
9. Start everything in a Compose file? → **docker compose up**
10. How does the app container reach the database in Compose? → **by the database service's name, not localhost**

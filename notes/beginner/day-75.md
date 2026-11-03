# Day 75 — Microservices: Why and How to Split

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** understand monoliths vs microservices honestly (including the downsides), and the basic pieces that connect services.

<!-- topic: b75_t1 -->
## 🏗️ Microservices — Basics

<!-- intro: d27_t1_s1 -->
Your Task Manager is a **monolith**: one application, one deployment, one database. That's the right choice for most new projects. As a company grows to dozens of teams, a monolith gets painful: every change needs the whole app redeployed, and teams step on each other. **Microservices** split the system into small services (orders, payments, users), each owned by one team, deployed independently, with **its own database**. The price is high: network calls that can fail, data spread across databases, and much harder debugging. Start with a well-structured monolith; split when the pain is real.

<!-- intro: d27_t1_s2 -->
Clients shouldn't need to know about twenty services. An **API Gateway** is the single front door: it routes `/api/orders/**` to the orders service, checks the login token once, limits request rates, and handles HTTPS, like a hotel reception that directs each guest to the right department.

<!-- intro: d27_t1_s3 -->
Services start, stop and move between servers, so their addresses keep changing. With **service discovery**, each service registers itself in a directory (Eureka, Consul, or Kubernetes' built-in DNS, Day 84) and others look it up by name ("payments") instead of a hard-coded address.

<!-- intro: d28_t1_s3 -->
You rarely rewrite a big monolith from scratch. The **strangler fig** pattern moves it piece by piece: put a gateway in front, build one new service, route that feature's traffic to it, repeat, until the old system can be switched off. (The name comes from a vine that slowly grows around a tree.)

<!-- intro: d28_t1_s5 -->
Services talk in two ways. **Synchronous**: call and wait for the answer (REST, Day 55), simple but the caller is stuck if the other service is slow or down. **Asynchronous**: send a message or event and carry on (Kafka, RabbitMQ, SQS), so services don't depend on each other being up right now. Use sync when you need the answer immediately; async for "let others know this happened".

<!-- intro: d28_t1_s6 -->
**gRPC** is an alternative to REST for service-to-service calls: a compact binary format (Protocol Buffers) and a contract file that generates client and server code. It's faster and stricter than JSON over HTTP, and common inside large systems; public APIs usually stay REST.

## 📝 Day 75 Recap

1. Monolith vs microservices? → **one deployable app vs many small independently deployed services**
2. Biggest costs of microservices? → **network failures, data spread across databases, harder debugging and operations**
3. Should a new project start with microservices? → **usually no: start with a well-structured monolith**
4. Does each microservice share one database? → **no, each owns its own data**
5. What does an API Gateway do? → **one entry point: routing, auth, rate limiting, HTTPS**
6. What is service discovery? → **services register themselves and find each other by name**
7. Strangler fig pattern? → **replace a monolith gradually, feature by feature, behind a gateway**
8. Sync vs async communication? → **sync waits for a response (REST); async sends a message and carries on (Kafka)**
9. When is async better? → **for notifying other services that something happened, without depending on them being up**
10. What is gRPC? → **a fast, binary, contract-first alternative to REST for service-to-service calls**

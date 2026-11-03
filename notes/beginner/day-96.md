# Day 96 — Revision: Spring, Kafka and Cloud

> The backend half of your revision: the stack you'll actually be hired to work on.

**Today's goal:** answer the classic Spring, Kafka and AWS questions without notes, and name design patterns from descriptions.

<!-- topic: b96_t1 -->
## 🌿 Revision — Backend Stack

Today's checklist items are **self-tests**. Work through them in this order, out loud, without notes first:

1. **Spring rapid-fire** (Days 52–64): `@Transactional` pitfalls (self-invocation, checked exceptions), the N+1 problem and its fixes, the JWT flow end to end, the bean lifecycle, and how auto-configuration decides what to create.
2. **Spring self-test**: 20 minutes, including dependency injection, JPA and testing (`@WebMvcTest` vs `@SpringBootTest`).
3. **Kafka rapid-fire and self-test** (Days 79–83): delivery guarantees, consumer lag, partitions and ordering, the dead letter topic, rebalancing.
4. **AWS self-test** (Days 85–91): S3, EC2 vs ECS vs Lambda, IAM roles, VPC subnets, Terraform's workflow.
5. **Design patterns** (Days 69–70): for ten short descriptions, name the pattern ("wraps an object to add behaviour" → Decorator).

Your own Task Manager (Days 65–67) is the best revision tool: explain how each of these topics shows up in it, because interviewers will ask about your project.

## 📝 Day 96 Recap

1. Two @Transactional traps? → **self-invocation skips the proxy; checked exceptions don't roll back by default**
2. N+1 fixes? → **JOIN FETCH, @EntityGraph, @BatchSize**
3. JWT flow? → **login issues a signed token; the client sends it as Bearer; a filter verifies it on each request**
4. @WebMvcTest vs @SpringBootTest? → **web layer only vs the whole application**
5. Kafka delivery guarantee most systems use? → **at-least-once with idempotent consumers**
6. What is consumer lag? → **how far a consumer group is behind the latest events**
7. EC2 vs ECS Fargate vs Lambda? → **servers / managed containers / functions on demand**
8. IAM role? → **an identity that services or apps assume temporarily, instead of stored keys**
9. "Wraps an object to add behaviour" is which pattern? → **Decorator**
10. "Interchangeable algorithms chosen at run time"? → **Strategy**

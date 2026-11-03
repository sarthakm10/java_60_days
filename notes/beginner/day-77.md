# Day 77 — Microservices: Data and Transactions

> When each service has its own database, Day 60's `@Transactional` can no longer cover an operation that spans services. Today's patterns are how real systems stay consistent anyway. Read each 🌱 **In simple words** box first.

**Today's goal:** understand sagas, the outbox pattern, eventual consistency, CQRS, event sourcing and sidecars.

<!-- topic: b77_t1 -->
## 🏗️ Microservices — Data Patterns

<!-- intro: d27_t1_s6 -->
Placing an order touches three services: reserve stock, charge the card, book delivery. There's no single transaction across three databases, so a **saga** runs a sequence of local transactions, and if a later step fails, it runs **compensating** actions to undo the earlier ones (refund the card, release the stock), like cancelling a hotel booking when your flight is cancelled. Steps can be coordinated by one **orchestrator** service, or by services reacting to each other's events (**choreography**).

<!-- intro: d27_t1_s7 -->
A service saves an order **and** must publish an "OrderPlaced" event. If it saves and then crashes before publishing (or publishes and the save rolls back), the system disagrees with itself: the **dual-write** problem. The **outbox pattern** fixes it: in the **same** database transaction as the order, insert the event into an `outbox` table; a separate process then reads the outbox and publishes to Kafka. The event can't be lost or invented.

<!-- intro: d28_t1_s7 -->
Distributed transactions across services (two-phase commit) are slow and fragile, so microservices accept **eventual consistency**: for a short time, services may disagree (the order shows "paid" a second before the warehouse knows), but they converge. Combine sagas with **idempotency keys**, so a message processed twice has no double effect.

<!-- intro: d28_t1_s1 -->
**CQRS** (command query responsibility segregation) uses **separate models for writing and reading**: writes go to a normalised database (Day 51), and a read-optimised copy, often denormalised for fast queries, is kept up to date from events. Useful when reads and writes have very different needs; overkill for simple apps.

<!-- intro: d28_t1_s2 -->
**Event sourcing** stores **every change as an event** ("deposited 500", "withdrew 200") instead of just the current state, like a bank statement instead of only a balance. The current state is rebuilt by replaying events. You get a complete history and audit trail; the cost is more complexity. It pairs naturally with CQRS.

<!-- intro: d28_t1_s4 -->
A **sidecar** is a helper container running next to your app's container, handling shared concerns like network traffic, encryption or log shipping, so your code doesn't have to. In a **service mesh** (Istio, Linkerd) every service gets a sidecar proxy (Envoy) that adds retries, metrics and security to all calls between services.

## 📝 Day 77 Recap

1. What is a saga? → **a sequence of local transactions across services, with compensating actions on failure**
2. Orchestration vs choreography? → **one coordinator directs the steps vs services react to each other's events**
3. What is the dual-write problem? → **saving to the database and publishing an event can't be made atomic, so one may happen without the other**
4. How does the outbox pattern fix it? → **write the event to an outbox table in the same transaction, then publish it from there**
5. What is eventual consistency? → **services may briefly disagree but converge to the same state**
6. Why use idempotency keys? → **so a message processed twice has no double effect**
7. What is CQRS? → **separate models (often separate stores) for writes and reads**
8. What is event sourcing? → **storing every change as an event and rebuilding state by replaying them**
9. What is a sidecar? → **a helper container next to the app handling networking, security or logging**
10. Proxy used by service meshes? → **Envoy**

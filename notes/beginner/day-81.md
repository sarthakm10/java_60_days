# Day 81 — Kafka: Reliability and Error Handling

> What happens when things go wrong: a consumer crashes mid-event, an event can't be processed, a producer retries. Read each 🌱 **In simple words** box first.

**Today's goal:** understand delivery guarantees, how to handle failing events, and how consumers remember their place.

<!-- topic: b81_t1 -->
## 🏗️ Kafka — Delivery Guarantees & Errors

<!-- intro: d36_t1_s1 -->
Three promises a messaging system can make: **at-most-once** (never duplicated, but may be lost), **at-least-once** (never lost, but may be delivered twice) and **exactly-once** (neither). Most systems choose **at-least-once** and make consumers **idempotent** (Day 77): processing the same event twice has no extra effect.

<!-- intro: d36_t1_s2 -->
Kafka can achieve **exactly-once** within Kafka: an **idempotent producer** (retries don't create duplicates), **transactions** (several writes succeed or fail together) and consumers reading with `read_committed`. It works for Kafka-to-Kafka pipelines; once a database or email is involved, you're back to idempotent consumers.

<!-- intro: d36_t1_s3 -->
If processing an event throws an exception, Spring Kafka's **error handler** retries it a few times (with backoff, Day 76). If it still fails, a **recoverer** sends it somewhere safe so it doesn't block the partition forever. `@RetryableTopic` sets up retry topics with increasing delays for you.

<!-- intro: d36_t1_s4 -->
That "somewhere safe" is a **dead letter topic (DLT)**, usually named `<topic>.DLT`. Events that keep failing (bad data, a bug) go there, so the rest keep flowing. Someone then investigates them, fixes the cause and replays them.

<!-- intro: d36_t1_s5 -->
A consumer remembers how far it has read by **committing offsets**. Auto-commit is easy but can mark events as done before they're actually processed (a crash then **loses** them); committing **after** processing (manual commit) is safer and gives at-least-once delivery.

<!-- intro: d36_t1_s6 -->
Events change shape over time (a new field, a renamed one). A **Schema Registry** with a format like **Avro** stores each version of an event's schema and checks that new versions stay compatible, so a producer can't break every consumer with one deploy.

<!-- topic: b81_t2 -->
## 🌿 Kafka — Interview Q&A

<!-- intro: d36_t2_s1 -->
Practise explaining the three delivery guarantees with an example each: at-most-once for metrics where losing one point is fine, at-least-once with idempotent consumers for orders and payments, exactly-once for Kafka-to-Kafka stream processing.

<!-- intro: d36_t2_s2 -->
**Consumer lag** is how far a consumer group is behind: the newest offset minus the group's committed offset, per partition. Growing lag means consumers can't keep up; you add consumers (up to the partition count) or make processing faster. It's the number one Kafka metric to watch.

<!-- intro: d36_t2_s3 -->
Kafka only guarantees order **within a partition**. To keep events for one order in sequence, give them the same key (same partition), and make sure producer retries can't reorder them (the idempotent producer handles this).

## 📝 Day 81 Recap

1. Three delivery guarantees? → **at-most-once, at-least-once, exactly-once**
2. What do most systems use? → **at-least-once with idempotent consumers**
3. What is an idempotent consumer? → **one where processing the same event twice has no extra effect**
4. Exactly-once in Kafka needs? → **an idempotent producer, transactions and read_committed consumers**
5. Where do events that keep failing go? → **a dead letter topic (e.g. orders.DLT)**
6. Annotation that sets up retry topics? → **@RetryableTopic**
7. Risk of auto-committing offsets? → **events can be marked done before processing and lost on a crash**
8. Safer commit strategy? → **commit after processing (manual commit)**
9. What is consumer lag? → **how far a consumer group is behind the newest events**
10. How do you keep events for one order in order? → **use the order id as the key so they share a partition**

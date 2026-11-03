# Day 80 — Kafka with Spring Boot

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** send and receive Kafka events from Spring Boot, and know a few more Kafka features you'll meet in real systems.

<!-- topic: b80_t1 -->
## 🌿 Kafka — Spring Boot Integration

<!-- intro: d35_t2_s1 -->
Receiving events is one annotation: put **`@KafkaListener(topics = "orders", groupId = "email-service")`** on a method, and Spring calls it for every event, converting the JSON payload into your object (Day 45). `concurrency` runs several listener threads (up to the number of partitions, Day 79), and batch mode hands you a list of events at a time.

<!-- intro: d35_t2_s2 -->
Sending uses **`KafkaTemplate`**: `kafkaTemplate.send("orders", order.id(), event)`, with the key first so related events stay in order. `send` is asynchronous and returns a `CompletableFuture` (Day 40): attach a callback to log failures, or call `.get()` when you must be sure it was stored before continuing.

<!-- intro: d35_t2_s3 -->
When one topic carries several event types (OrderPlaced, OrderCancelled), a class-level `@KafkaListener` with one **`@KafkaHandler`** method per type routes each event to the right method by its type, like overloading (Day 17) for messages.

<!-- intro: d35_t1_s6 -->
Normally Kafka deletes old events after a retention time. With **log compaction**, it instead keeps **the latest event for each key**, forever: a topic of "current customer address per customer id". Sending a key with a `null` value (a *tombstone*) deletes that key.

<!-- intro: d35_t1_s7 -->
**Kafka Connect** moves data between Kafka and other systems **without writing code**: source connectors pull in (for example, every change in a PostgreSQL table, called change data capture), and sink connectors push out (into Elasticsearch, S3…). It's how the outbox pattern (Day 77) is often wired up.

<!-- intro: d36_t1_s7 -->
To test listeners and producers without a real Kafka cluster, Spring Kafka's **`@EmbeddedKafka`** starts a small Kafka inside your test. Testcontainers (Day 74) with a real Kafka image is the other common option.

## 📝 Day 80 Recap

1. Receive Kafka events in Spring? → **@KafkaListener(topics = ..., groupId = ...) on a method**
2. Send events in Spring? → **KafkaTemplate.send(topic, key, value)**
3. Why pass a key when sending? → **so related events go to the same partition and stay in order**
4. What does send() return? → **a CompletableFuture with the result**
5. Maximum useful listener concurrency? → **the number of partitions**
6. Several event types on one topic? → **one @KafkaHandler method per type in a class-level listener**
7. What is log compaction? → **keeping only the latest event per key**
8. What is a tombstone? → **an event with a null value that deletes a key in a compacted topic**
9. What is Kafka Connect for? → **moving data between Kafka and other systems without code**
10. Test Kafka code without a real cluster? → **@EmbeddedKafka (or Testcontainers)**

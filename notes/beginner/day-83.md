# Day 83 — Kafka: Interview Questions

> The questions interviewers actually ask about Kafka. For each one, answer out loud first, then read the section. Read each 🌱 **In simple words** box first.

**Today's goal:** answer the classic Kafka questions with confidence, and draw Kafka's architecture from memory.

<!-- topic: b83_t1 -->
## 🏗️ Kafka — Consumer Deep Dive

<!-- intro: d38_t1_s1 -->
"What happens when a consumer crashes?" It stops sending heartbeats; after a timeout Kafka declares it dead and **rebalances** (Day 82), giving its partitions to the other consumers in the group. They continue from the last **committed** offset, so events processed but not yet committed are processed again: one more reason for idempotent consumers.

<!-- intro: d38_t1_s2 -->
A **poison pill** is an event that always fails (corrupt data, a bug), which would block its partition forever if retried endlessly. Answer: limited retries, then the dead letter topic (Day 81), an alert, and a human looks at it.

<!-- intro: d38_t1_s3 -->
"How do you scale consumers?" Add consumers to the group, up to the number of partitions. Beyond that, add **partitions** (planned carefully, because changing the count changes which partition a key maps to).

<!-- intro: d38_t1_s4 -->
**Kafka vs RabbitMQ vs SQS:** Kafka is a durable, replayable log built for huge throughput and many independent consumer groups. RabbitMQ is a flexible message broker with rich routing, where messages are removed once consumed. SQS (Day 88) is AWS's fully managed, simple queue. Choose by: do you need replay and huge volume (Kafka), complex routing (RabbitMQ), or zero operations (SQS)?

<!-- intro: d38_t1_s5 -->
An **idempotent consumer** in practice: give each event a unique id, store the ids you've processed (in the same database transaction as the work), and skip any event whose id is already stored.

<!-- intro: d38_t1_s6 -->
The outbox pattern once more (Day 77): save the business change **and** the event in one local transaction, then publish from the outbox table, usually with change data capture through Kafka Connect (Day 80). It's the standard answer to "how do you update a database and publish an event reliably?".

<!-- intro: d38_t1_s7 -->
Draw it from memory: producers → a topic split into partitions, each replicated across brokers with a leader → consumer groups, each partition owned by one consumer per group → a dead letter topic for failures. Practise until it takes two minutes.

<!-- topic: b83_t2 -->
## 🏗️ Kafka — Review

<!-- intro: d40_t1_s1 -->
Whiteboard the whole Kafka flow once more, adding rebalancing and the DLT, and explain each arrow.

<!-- intro: d40_t1_s2 -->
Explain, without notes, the three delivery guarantees and how an idempotent producer plus idempotent consumers make a pipeline safe.

## 📝 Day 83 Recap

1. What happens when a consumer crashes? → **a rebalance gives its partitions to others, which resume from the last committed offset**
2. Why can events be processed twice after a crash? → **work done after the last offset commit is redone**
3. What is a poison pill? → **an event that always fails processing**
4. How do you handle one? → **limited retries, then the dead letter topic and an alert**
5. How do you scale consumers? → **add consumers up to the partition count, then add partitions**
6. Kafka vs RabbitMQ? → **durable replayable log with high throughput vs flexible broker that removes consumed messages**
7. When choose SQS? → **when you want a simple fully managed queue with no operations**
8. Implement an idempotent consumer? → **store processed event ids and skip ones already seen**
9. Reliable "update DB and publish event"? → **the outbox pattern**
10. Each partition in a group is owned by? → **one consumer**

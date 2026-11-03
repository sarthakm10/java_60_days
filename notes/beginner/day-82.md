# Day 82 — Kafka: Advanced Topics

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** understand rebalancing, ordering, transactions, stream processing and managed Kafka on AWS.

<!-- topic: b82_t1 -->
## 🏗️ Kafka — Advanced Topics

<!-- intro: d37_t1_s1 -->
When a consumer joins or leaves a group (a deploy, a crash, scaling up), Kafka **rebalances**: it redistributes partitions among the consumers. During a rebalance, consumption pauses briefly. **Static membership** lets a restarting consumer keep its partitions, avoiding needless rebalances, which helps a lot in Kubernetes (Day 84) where pods restart often.

<!-- intro: d37_t1_s2 -->
A recap worth repeating: order is guaranteed **within a partition only**, never across partitions. If two events must be processed in order, they need the same key.

<!-- intro: d37_t1_s3 -->
**Kafka transactions** let a producer write to several topics (and commit consumer offsets) **atomically**: either all the writes become visible, or none do. It's what makes "read from one topic, process, write to another" exactly-once (Day 81).

<!-- intro: d37_t1_s4 -->
**Kafka Streams** is a Java library for processing events as they flow: filter and transform them like Java streams (Day 35), or count, join and aggregate them over time ("orders per minute per city"), writing results to new topics. No separate cluster needed: it runs inside your app.

<!-- intro: d37_t1_s5 -->
Aggregating "per minute" needs **windows**: **tumbling** windows are fixed and don't overlap (every minute on the minute), **hopping** windows are fixed but overlap (5-minute windows starting every minute), and **session** windows group a user's activity until a gap of inactivity.

<!-- intro: d37_t1_s6 -->
To count or join, Kafka Streams keeps **state** (the running totals) in a local store, backed up to a Kafka **changelog** topic, so if the app crashes, a new instance rebuilds the state and carries on.

<!-- intro: d37_t1_s7 -->
Running Kafka yourself is real work. **Amazon MSK** is AWS's managed Kafka: AWS runs the brokers, storage and patching, and you just use the topics (Day 88 covers more managed services).

## 📝 Day 82 Recap

1. What triggers a rebalance? → **a consumer joining or leaving the group**
2. What happens during a rebalance? → **partitions are redistributed and consumption pauses briefly**
3. What does static membership help with? → **avoiding rebalances when consumers restart (e.g. in Kubernetes)**
4. Where is ordering guaranteed? → **within a single partition only**
5. What do Kafka transactions give? → **atomic writes across topics, enabling exactly-once processing**
6. What is Kafka Streams? → **a Java library for processing and aggregating events as they flow**
7. Tumbling vs hopping windows? → **fixed non-overlapping vs fixed overlapping time windows**
8. Session window? → **groups activity until a gap of inactivity**
9. Where does Kafka Streams keep state safely? → **in a local store backed up to a changelog topic**
10. AWS managed Kafka? → **Amazon MSK**

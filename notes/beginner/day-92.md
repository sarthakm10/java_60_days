# Day 92 — System Design Fundamentals, Part 1

> **Phase 10: System Design & Interview Prep.** System design interviews ask "how would you build Twitter / a URL shortener / a chat app?" at the level of boxes and arrows, not code. Everything from Phases 6–9 is your vocabulary. Read each 🌱 **In simple words** box first.

**Today's goal:** understand the CAP theorem, how databases scale, caching strategies, load balancing, and queues vs streams.

<!-- topic: b92_t1 -->
## 🏗️ HLD — Core Concepts

<!-- intro: d55_t1_s1 -->
When data is copied across several machines and the network between them breaks (a **partition**), a system must choose: keep answering with possibly stale data (**availability**), or refuse until the copies agree (**consistency**). That's the **CAP theorem**: during a partition you can't have both. A bank balance chooses consistency; a social media like-counter chooses availability. **PACELC** adds: even without a partition, you trade latency against consistency.

<!-- intro: d55_t1_s2 -->
When one database can't keep up: **scale up** (vertical: a bigger machine; simple but there's a ceiling) or **scale out** (horizontal: more machines). For reads, add **read replicas** (Day 88); for writes and huge data, split the data across machines with **sharding** (Day 93). Most systems go a long way with a bigger machine, replicas and a cache before needing sharding.

<!-- intro: d55_t1_s4 -->
A **cache** keeps hot data in fast memory (Redis, Day 88) to spare the database: **cache-aside** (the app checks the cache, fills it on a miss), **write-through** (writes go to the cache and database together) and **write-behind** (writes go to the cache and reach the database later, fast but riskier). A **CDN** caches images and files in data centres near users worldwide. The famous hard part is **invalidation**: when the data changes, stale cached copies must be updated or expire (TTL).

<!-- intro: d55_t1_s6 -->
A **load balancer** (Day 86) spreads requests across servers: **round-robin** (each in turn), **least connections** (whoever is least busy), or **consistent hashing** (the same user always goes to the same server, Day 93). It also removes unhealthy servers from rotation, which is how a system survives a server dying.

<!-- intro: d55_t1_s7 -->
**Queues** (SQS, RabbitMQ) hand each message to one worker and then delete it: perfect for background jobs like sending emails. **Event streams** (Kafka, Days 79–83) keep events in an ordered log that many independent consumers can read and replay: perfect for "something happened, and several systems care". Pick a queue for jobs, a stream for events.

## 📝 Day 92 Recap

1. CAP theorem in one line? → **during a network partition, choose consistency or availability**
2. Bank balance: C or A? → **consistency**
3. Vertical vs horizontal scaling? → **a bigger machine vs more machines**
4. First ways to scale reads? → **a cache and read replicas**
5. Cache-aside? → **check the cache; on a miss read the database and fill the cache**
6. Write-through vs write-behind? → **write cache and DB together vs write cache now and DB later**
7. What does a CDN do? → **serves static content from locations near users**
8. Hardest problem with caches? → **invalidation: keeping cached data from going stale**
9. Load-balancing strategies? → **round-robin, least connections, consistent hashing**
10. Queue vs event stream? → **a queue hands each job to one worker; a stream lets many consumers read and replay events**

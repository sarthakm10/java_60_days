# Day 88 — AWS: Databases, Caching and Messaging

> Managed versions of things you already know: PostgreSQL (Day 47), a cache, queues and pub/sub (Days 79–83). AWS runs them; you use them. Read each 🌱 **In simple words** box first.

**Today's goal:** know RDS, ElastiCache, SQS and SNS, and the Well-Architected Framework's checklist.

<!-- topic: b88_t1 -->
## 🗄️ AWS — Additional Services

<!-- intro: d48_t1_s1 -->
**RDS** is managed PostgreSQL/MySQL: AWS handles installation, backups, patching and failover. **Multi-AZ** keeps a standby copy in another availability zone that takes over automatically if the main one fails (for availability), while **read replicas** are extra copies that serve read queries (for scaling reads). **Aurora** is AWS's own faster, PostgreSQL/MySQL-compatible engine. Your Task Manager would point its `DB_URL` at RDS and need no code changes.

<!-- intro: d48_t1_s2 -->
**ElastiCache** is managed **Redis** (or Memcached): an in-memory key-value store, so reads take a fraction of a millisecond. The common **cache-aside** pattern: check the cache first; on a miss, read the database and store the result in the cache with an expiry (TTL, Day 72). Redis also holds sessions, rate-limit counters (Day 76) and distributed locks.

<!-- intro: d48_t1_s3 -->
**SQS** is a fully managed **queue** (Day 83's comparison): producers send messages, consumers poll and delete them. **Standard** queues are almost unlimited in throughput but may deliver a message twice or out of order; **FIFO** queues keep order and remove duplicates. A received message becomes invisible for a **visibility timeout** while it's processed; if the consumer doesn't delete it in time, it reappears for another try, and after too many tries it moves to a **dead-letter queue** (Day 81's DLT idea).

<!-- intro: d48_t1_s4 -->
**SNS** is **pub/sub**: publish one message to a topic, and every subscriber gets a copy (SQS queues, Lambda functions, email, SMS, mobile push). The **fan-out** pattern: SNS topic → several SQS queues, so each service gets its own queue of the same events.

<!-- intro: d48_t1_s5 -->
The **Well-Architected Framework** is AWS's checklist for good systems, in six pillars: **operational excellence** (run and improve it), **security**, **reliability** (recover from failures), **performance efficiency**, **cost optimisation** and **sustainability**. It's a useful structure for answering "how would you improve this design?" in interviews.

## 📝 Day 88 Recap

1. What is RDS? → **managed relational databases (PostgreSQL, MySQL...) run by AWS**
2. Multi-AZ vs read replicas? → **a standby for automatic failover vs extra copies for scaling reads**
3. What is ElastiCache? → **managed Redis or Memcached in-memory caching**
4. Cache-aside pattern? → **check the cache; on a miss read the database and store the result with a TTL**
5. SQS Standard vs FIFO? → **huge throughput with possible duplicates/reordering vs ordered, deduplicated**
6. What is the visibility timeout? → **the time a received message stays hidden while being processed**
7. Where do repeatedly failing SQS messages go? → **a dead-letter queue**
8. What is SNS? → **pub/sub: one published message delivered to every subscriber**
9. Fan-out pattern? → **an SNS topic delivering to several SQS queues**
10. Six Well-Architected pillars? → **operational excellence, security, reliability, performance efficiency, cost optimisation, sustainability**

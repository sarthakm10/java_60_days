# Day 93 — System Design Fundamentals, Part 2

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** understand sharding, rate limiting algorithms, consistent hashing and Bloom filters, and learn a step-by-step framework for any system design question.

<!-- topic: b93_t1 -->
## 🏗️ HLD — Scaling Techniques

<!-- intro: d55_t1_s3 -->
**Sharding** splits one huge table across several databases. By **range** (users A–M on shard 1, N–Z on shard 2: simple, but some shards get busier), by **hash** of the key (even spread, but range queries hit every shard) or with a **directory** (a lookup table of where each key lives). The pain: queries and joins across shards become hard, so choose the shard key around your most common queries.

<!-- intro: d55_t1_s5 -->
Rate limiting algorithms (Day 76): **token bucket** (allows short bursts up to the bucket size), **leaky bucket** (processes at a steady rate, smoothing bursts), **fixed window** (count per calendar minute: simple, but a burst at the boundary can double the allowed rate) and **sliding window** (counts over the last 60 seconds: accurate, a bit more work).

<!-- intro: d55_t1_s8 -->
With plain hashing (`key % numberOfServers`), adding one server changes the server for almost every key, so a cache cluster suddenly misses everything. **Consistent hashing** places servers and keys on a **ring**: each key goes to the next server clockwise, so adding or removing a server only moves the keys next to it. **Virtual nodes** (each server at many points on the ring) spread the load evenly. Redis Cluster, Cassandra and DynamoDB use the idea.

<!-- intro: d55_t1_s9 -->
A **Bloom filter** answers "have I seen this before?" using very little memory. It can say "definitely not" or "probably yes" (it never misses a real member, but occasionally says yes wrongly). Use it to skip expensive lookups, like checking whether a username might be taken before querying the database.

<!-- intro: d57_t1_s6 -->
Every system design interview, the same steps: (1) **requirements**: what must it do, how many users, which matters more, speed or consistency? (2) **API**: the main endpoints. (3) **High-level design**: boxes and arrows. (4) **Data**: which database, what tables or keys. (5) **Deep dive** into the hardest part. (6) **Bottlenecks and scaling**: what breaks first at 10× the traffic? Saying these steps out loud keeps you organised and shows the interviewer how you think.

👉 **Code Practice** builds a consistent-hash ring and a token-bucket rate limiter in plain Java.

## 📝 Day 93 Recap

1. What is sharding? → **splitting a large dataset across several databases**
2. Range vs hash sharding? → **simple but uneven vs even spread but hard range queries**
3. Biggest pain of sharding? → **queries and joins across shards**
4. Token bucket vs fixed window? → **allows controlled bursts vs simple per-window counts with boundary bursts**
5. Problem with key % N hashing? → **changing N moves almost every key**
6. How does consistent hashing help? → **adding or removing a server only moves keys next to it on the ring**
7. Why virtual nodes? → **to spread keys evenly across servers**
8. What can a Bloom filter say? → **"definitely not" or "probably yes"**
9. First step in a system design interview? → **clarify the requirements and scale**
10. Last step? → **identify bottlenecks and how to scale them**

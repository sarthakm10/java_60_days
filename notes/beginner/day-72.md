# Day 72 — Low-Level Design: Machine Coding II

> Four more classic LLD problems. Try each one yourself for 45 minutes **before** reading the section, then compare designs. Read each 🌱 **In simple words** box first.

**Today's goal:** design systems with scheduling, concurrency and expiry, and practise talking through trade-offs.

<!-- topic: b72_t1 -->
## 🏗️ LLD — More Machine Coding

<!-- intro: d34_t1_s4 -->
**Elevator system:** several lifts, requests from floors and from inside the cars. The heart of it is the **scheduling strategy**: which lift answers a call, and in what order a lift visits its floors (keep going in one direction while there are requests that way, like a lift really does). Model lift state with an enum (MOVING_UP, MOVING_DOWN, IDLE) and make the scheduler a Strategy so it can be swapped.

<!-- intro: d39_t1_s1 -->
**BookMyShow (ticket booking):** movies, theatres, screens, shows and seats. The hard part is **two users trying to book the same seat at the same moment**: you need locking (Day 41's locks in one app, or Day 60's optimistic locking / a database constraint across servers), plus a short "hold" so a seat is reserved while someone pays and released if they don't.

<!-- intro: d39_t1_s2 -->
**Snake and Ladder:** a board with snakes and ladders (a `Map` from start square to end square, Day 27), dice, players and a game loop. Keep the dice behind an interface so tests can use a fixed sequence of rolls instead of random ones: a small design choice that makes the whole game testable.

<!-- intro: d39_t1_s3 -->
**Key-value store with expiry (TTL):** `put(key, value, ttl)`, `get`, `delete`, where entries vanish after their time to live. Store an expiry time with each value and treat expired entries as missing when read (*lazy* expiry), optionally with a background clean-up (*active* expiry). This is a tiny version of Redis (Day 88).

## 📝 Day 72 Recap

1. Core of an elevator design? → **the scheduling strategy for choosing lifts and the order of stops**
2. Type for elevator state? → **an enum (MOVING_UP, MOVING_DOWN, IDLE)**
3. Hardest part of a ticket-booking design? → **two users booking the same seat at once**
4. Tools for that? → **locking (optimistic or pessimistic) and temporary seat holds**
5. Data structure for snakes and ladders? → **a Map from start square to end square**
6. Why put dice behind an interface? → **so tests can use fixed rolls**
7. What is TTL? → **time to live: how long an entry stays before it expires**
8. Lazy vs active expiry? → **lazy removes expired entries when read; active cleans them up in the background**
9. Real product that works like a TTL key-value store? → **Redis**
10. How to practise LLD problems? → **attempt for 45 minutes first, then compare with a reference design**

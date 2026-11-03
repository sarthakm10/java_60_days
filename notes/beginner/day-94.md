# Day 94 — System Design Practice

> Five classic design questions. For each, set a 45-minute timer, follow Day 93's framework on paper, and only then read the section. Read each 🌱 **In simple words** box first.

**Today's goal:** practise complete designs, and get comfortable drawing clear diagrams and talking through trade-offs.

<!-- topic: b94_t1 -->
## 🏗️ HLD — Practice Problems

<!-- intro: d57_t1_s1 -->
**URL shortener** (like TinyURL): turn a long URL into a short code and redirect when someone visits it. Key questions: how to generate short unique codes (a counter encoded in base 62, or a hash with collision handling), the redirect status (301 permanent and cacheable vs 302 if you want to count every click), and caching, because reads vastly outnumber writes.

<!-- intro: d57_t1_s2 -->
**Notification system**: send emails, SMS and push notifications for many events. The shape: events into a queue (Day 92), workers per channel, user preferences and rate limits ("no more than 3 marketing messages a day"), priorities (a password reset beats a newsletter) and retries with a dead-letter queue.

<!-- intro: d57_t1_s3 -->
**Chat application**: messages must arrive instantly, so clients keep an open **WebSocket** connection instead of repeatedly asking. Topics to cover: message ordering per conversation (a partition key, Day 81), delivery and read receipts, online/offline presence, and storing message history.

<!-- intro: d57_t1_s4 -->
**Rate limiter** as a service: Day 93's algorithms, with counters in Redis shared by all servers, limits per user, per API key and globally, and the `429` response with a header telling clients when to retry.

<!-- intro: d57_t1_s5 -->
**Search autocomplete**: suggestions as the user types. A **trie** (Day 41) of popular queries ranked by frequency, the top suggestions cached for each prefix, and updates from search logs computed in the background rather than on every keystroke.

<!-- intro: d57_t1_s7 -->
Clear diagrams win interviews: boxes for components, arrows labelled with what flows ("POST /orders", "OrderPlaced event"), databases drawn as cylinders, and the read path and write path made obvious. Practise with a free tool like Excalidraw or draw.io, or on paper.

## 📝 Day 94 Recap

1. How can a URL shortener generate codes? → **a counter encoded in base 62, or a hash with collision checks**
2. 301 vs 302 for the redirect? → **301 is permanent and cacheable; 302 lets you count every click**
3. Why cache heavily in a URL shortener? → **reads far outnumber writes**
4. Core shape of a notification system? → **events into a queue, workers per channel, preferences, priorities and retries**
5. How do chat clients receive messages instantly? → **an open WebSocket connection**
6. Keep chat messages in order? → **partition by conversation id**
7. Where does a distributed rate limiter keep counters? → **a shared store like Redis**
8. Data structure behind autocomplete? → **a trie of popular queries ranked by frequency**
9. What makes a good architecture diagram? → **labelled arrows, clear components, obvious read and write paths**
10. How should you practise system design? → **time-boxed attempts on paper with the framework, then compare**

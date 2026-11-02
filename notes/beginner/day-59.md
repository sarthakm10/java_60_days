# Day 59 — JPA Relationships and the N+1 Problem

> One of the most asked Spring interview topics, and one of the most common performance bugs in real apps. Read each 🌱 **In simple words** box first.

**Today's goal:** map relationships between entities, understand lazy loading and the N+1 problem, and fix it; then page and shape your query results.

<!-- topic: b59_t1 -->
## 🌿 Spring Data JPA — Relationships & Performance

<!-- intro: d21_t1_s2 -->
Day 47's foreign keys, in Java: a `Customer` has many `Order`s, so `Order` has a `@ManyToOne Customer customer` field (this side holds the foreign key column) and `Customer` can have a `@OneToMany(mappedBy = "customer") List<Order> orders` field. `@ManyToMany` maps a join table like enrolments. `mappedBy` tells JPA which side owns the relationship, so it doesn't create the link twice.

<!-- intro: d21_t1_s3 -->
When you load a customer, should JPA also load all their orders? **Lazy** loading waits until you actually touch `customer.getOrders()`; **eager** loading fetches them immediately. Lazy is usually right, but it causes the famous **N+1 problem**: load 100 customers (1 query), then touch each one's orders in a loop (100 more queries). 101 queries where 1 or 2 would do. Turn on `show-sql` (Day 58) and you'll see the flood.

<!-- intro: d21_t1_s4 -->
The fixes all say "fetch the related data in the **same** query": `JOIN FETCH` in a `@Query` (`SELECT c FROM Customer c JOIN FETCH c.orders`), an `@EntityGraph` on the repository method, or `@BatchSize` to fetch them in groups instead of one by one. Interviewers love asking for all three.

<!-- intro: d21_t1_s6 -->
Never return 100,000 rows to a client. **Paging** splits results into pages: pass a `Pageable` (page number, size, sort) to a repository method and get back a `Page<T>` with the items plus the total count. In a controller, `GET /api/products?page=0&size=20&sort=price` maps straight onto it.

<!-- intro: d21_t1_s8 -->
**Projections** load only the columns you need: declare an interface with just the getters you want (`interface ProductSummary { String getName(); double getPrice(); }`) or a DTO record (Day 55), and return that from a repository method. Less data loaded, less sent, and the entity's other fields are never touched.

<!-- topic: b59_t2 -->
## 🧮 DSA — Timed Interview Practice

A timed interview-style session: solve problems while thinking aloud, ask clarifying questions as if to an interviewer, check edge cases (empty input, one element, negatives, huge input) and state the complexity after each solution (Day 11). How you communicate matters as much as the code.

## 📝 Day 59 Recap

1. Which side of a one-to-many holds the foreign key? → **the "many" side, with @ManyToOne**
2. What does mappedBy mean? → **this side doesn't own the relationship; the other side's field does**
3. Lazy vs eager loading? → **lazy loads related data when first accessed; eager loads it immediately**
4. What is the N+1 problem? → **one query for a list, then one more query per item for its related data**
5. How do you spot N+1? → **turn on SQL logging and see many repeated queries**
6. Three fixes for N+1? → **JOIN FETCH, @EntityGraph, @BatchSize**
7. Repository paging parameter and result types? → **Pageable in, Page<T> out**
8. Paging query parameters? → **?page=0&size=20&sort=price**
9. What does a projection do? → **loads only the fields you need**
10. Why think aloud in coding interviews? → **interviewers assess your reasoning and communication, not just the code**

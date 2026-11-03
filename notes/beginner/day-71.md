# Day 71 — Low-Level Design: Machine Coding I

> In a **machine coding** (or LLD) interview you get a problem like "design a parking lot" and 60–90 minutes to produce working, well-structured code. It tests everything from Phases 2, 3 and 8 at once. Read each 🌱 **In simple words** box first.

**Today's goal:** learn a repeatable approach to LLD problems, and apply it to a parking lot and Tic-Tac-Toe.

<!-- topic: b71_t1 -->
## 🏗️ LLD — Machine Coding

<!-- intro: d34_t1_s1 -->
A reliable routine, which is the same one you used for the library on Day 23: (1) **ask questions** and write down the requirements (what's in scope, what isn't); (2) find the **nouns** (classes) and **verbs** (methods); (3) decide which class **owns** each rule and which parts should be **interfaces** so they can change (pricing, spot allocation); (4) code the core flow first and get it running; (5) only then add extras. A small, working, well-named design beats a huge unfinished one every time.

<!-- intro: d34_t1_s2 -->
**Parking lot:** floors with spots of different sizes, vehicles of different types, tickets on entry, payment on exit. The interesting decisions: an enum for vehicle and spot types (Day 20), a `SpotAllocationStrategy` interface (nearest spot, by floor…) so the rule can change (Day 70's Strategy), and a `PricingStrategy` for fees. Ask "what changes most often?" and put that behind an interface.

<!-- intro: d34_t1_s3 -->
**Tic-Tac-Toe:** a `Board`, `Player`s and a `Game` that alternates turns. The part interviewers watch: checking for a winner in a way that works for any board size (count per row, column and diagonal as moves happen, instead of scanning the whole board), and keeping input/output (`Scanner`) out of the game logic so it can be tested.

<!-- intro: d34_t1_s5 -->
After coding, review your own design as an interviewer would: is any class doing too much (a "God class", Day 68)? Could a new vehicle type or pricing rule be added without editing existing classes? Which patterns did you use, and can you say why? Naming them out loud scores points.

👉 **Code Practice** has the core of the parking lot as a checkable exercise.

## 📝 Day 71 Recap

1. First step in a machine coding round? → **clarify requirements and scope by asking questions**
2. How do you find the classes? → **from the nouns in the requirements; verbs become methods**
3. What goes behind an interface? → **the parts most likely to change (pricing, allocation rules)**
4. Order of work? → **core flow working first, extras after**
5. Pattern for swappable spot allocation? → **Strategy**
6. Type for vehicle and spot sizes? → **enums**
7. Efficient Tic-Tac-Toe winner check? → **keep counts per row, column and diagonal as moves are made**
8. Why keep Scanner out of the game logic? → **so the logic can be tested and reused**
9. What is a God class? → **one class that does too much; split it**
10. What should you say about your design at the end? → **which patterns you used and why, and how it would extend**

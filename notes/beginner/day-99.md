# Day 99 — Resume, LinkedIn and Your Project Story

> Make sure people can find you, and that what they find makes them want to interview you.

**Today's goal:** be ready to walk through your project in depth, and polish your resume, LinkedIn and GitHub.

<!-- topic: b99_t1 -->
## 🗄️ Behavioral — Project Deep-Dive

Interviewers will pick **one project and go deep**. Use your Task Manager (Days 65–67) and prepare each checklist item:

- **Architecture on a whiteboard:** client → controller → service → repository → PostgreSQL, plus security, Flyway and tests. Draw it in two minutes.
- **Three design decisions and their trade-offs:** for example, why ownership checks return 404, why Flyway instead of `ddl-auto`, how paging is capped. Every decision has a downside; name it.
- **A "production problem" story:** even in a personal project, describe a bug you hit, how you found it and fixed it, as a timeline.
- **A performance improvement** with before/after numbers (the N+1 fix is ideal).
- **"How do you ensure code quality?"**: tests (unit and `@WebMvcTest`), code review habits, CI running tests on every push (Day 84).

<!-- topic: b99_t2 -->
## 🏗️ Career — Resume & Online Presence

<!-- intro: d59_t1_s1 -->
Every resume bullet should show **impact**, ideally with a number: not "worked on an API" but "built a Spring Boot REST API with JWT auth and 40 tests; fixed an N+1 issue cutting a list endpoint from 101 queries to 2". Start bullets with a strong verb (built, designed, reduced, automated).

<!-- intro: d59_t1_s2 -->
List the technologies you can **actually discuss**: Java 21, Spring Boot, Spring Data JPA, PostgreSQL, JUnit/Mockito, Docker, Kafka, AWS, Terraform. Every word on your resume is a possible interview question, so leave out anything you've only read about.

<!-- intro: d59_t1_s3 -->
LinkedIn: a headline like "Java Backend Developer · Spring Boot · SQL · AWS", an about section that's a written version of your 60-second pitch (Day 98), the skills section filled in, and links to your projects.

<!-- intro: d59_t1_s4 -->
GitHub is your portfolio: pin your two or three best repositories (the Task Manager first), make sure each has a good README (Day 67), and keep commit history tidy. Recruiters really do look.

<!-- intro: d59_t1_s5 -->
Prepare three or four questions to ask your interviewers: what the team works on, how code reaches production, how new joiners learn, what success looks like in the first six months. Asking good questions shows real interest.

<!-- intro: d59_t1_s6 -->
Make a one-page cheat sheet of the 20 topics you'd most like to remember on the day (the HashMap flow, `@Transactional` traps, the JWT flow, Kafka guarantees, CAP…) and read it before each interview.

## 📝 Day 99 Recap

1. What makes a strong resume bullet? → **an action verb, what you built, and a measurable impact**
2. Which technologies belong on your resume? → **only ones you can discuss confidently**
3. What should a project deep-dive cover? → **architecture, design decisions with trade-offs, a problem story, results**
4. What do interviewers check about design decisions? → **that you know their trade-offs**
5. LinkedIn headline example? → **Java Backend Developer · Spring Boot · SQL · AWS**
6. What should pinned GitHub repos have? → **good READMEs and tidy history**
7. Why ask the interviewer questions? → **shows genuine interest and helps you judge the job**
8. Best project to deep-dive from this course? → **the Task Manager API**
9. Quality practices to mention? → **unit and slice tests, code review, CI on every push**
10. What goes on your final cheat sheet? → **the 20 topics most worth remembering on interview day**

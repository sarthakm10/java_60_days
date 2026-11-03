# Day 86 — AWS Compute: EC2, ECS and Lambda

> Three ways to run your code on AWS, from "rent a server" to "just run this function". Read each 🌱 **In simple words** box first.

**Today's goal:** know when to use EC2, ECS or Lambda, how auto scaling and load balancers work, and how the main pricing options differ.

<!-- topic: b86_t1 -->
## 🗄️ AWS — Compute Services

<!-- intro: d44_t1_s1 -->
**EC2** gives you **virtual servers** (instances) by the hour. Instance **types** are tuned for different jobs: general purpose (`t3`, `m6`), compute-heavy (`c6`), memory-heavy (`r6`, good for caches and big JVM heaps) and storage-heavy (`i3`). The `t` family is cheap and "burstable", fine for learning and small apps.

<!-- intro: d44_t1_s2 -->
Paying for EC2: **On-Demand** (by the second, no commitment, most expensive per hour), **Reserved** instances or **Savings Plans** (commit for 1–3 years, much cheaper), and **Spot** (spare capacity at up to 90% off, but AWS can take it back with two minutes' notice: great for batch jobs, bad for your only web server).

<!-- intro: d44_t1_s3 -->
An **Auto Scaling Group** keeps a fleet of identical instances at the right size: it adds servers when CPU or traffic goes up and removes them when it drops, and replaces any instance that fails its health check (Day 63's health endpoint again).

<!-- intro: d44_t1_s4 -->
A **launch template** is the recipe for new instances in that group: which machine image, instance type, security groups and a **user data** script that runs at first boot (install Java, start your app). Use launch templates; the older launch configurations are legacy.

<!-- intro: d44_t1_s5 -->
**ECS** runs your **Docker containers** (Day 73) for you. A **task definition** describes the containers (image, CPU, memory, environment), a **service** keeps N copies running, and a **cluster** is where they run. With the **Fargate** launch type you don't manage any servers at all: AWS finds room for your containers. ECS Fargate is often the easiest way to deploy a Spring Boot app.

<!-- intro: d44_t1_s6 -->
An ECS task has two roles, and mixing them up is a classic mistake: the **task role** is what *your app* is allowed to do (read this S3 bucket), and the **execution role** is what *ECS* needs to start it (pull the image, write logs).

<!-- intro: d44_t1_s7 -->
**Lambda** runs a single function on demand, with no server at all: it runs when an event happens (an HTTP request, a file uploaded to S3, a message in a queue) and you pay per millisecond of use. The catch: a **cold start** delay when a new instance spins up (noticeable for Java), and limits on run time and concurrency. Great for event glue and spiky workloads; less ideal for a busy, always-on API.

<!-- intro: d44_t1_s8 -->
A **load balancer** spreads traffic across your instances or containers and skips unhealthy ones. The **ALB** (Application Load Balancer) understands HTTP and can route by path or host (`/api/orders` to one service, `/api/users` to another); the **NLB** (Network Load Balancer) works at the lower TCP level for extreme speed. For Spring Boot APIs, you'll almost always use an ALB.

## 📝 Day 86 Recap

1. What is EC2? → **virtual servers rented by the hour or second**
2. Instance family for memory-heavy apps? → **r (memory optimised)**
3. Cheapest EC2 option, and its risk? → **Spot instances; AWS can reclaim them at short notice**
4. Cheaper option for steady long-term use? → **Reserved instances or Savings Plans**
5. What does an Auto Scaling Group do? → **adds or removes instances with load and replaces unhealthy ones**
6. What is ECS Fargate? → **running containers without managing any servers**
7. ECS task role vs execution role? → **what your app may do vs what ECS needs to start it**
8. What is Lambda? → **functions run on demand per event, paying only while they run**
9. Lambda's main drawback for Java? → **cold start delays**
10. Load balancer for HTTP path routing? → **ALB (Application Load Balancer)**

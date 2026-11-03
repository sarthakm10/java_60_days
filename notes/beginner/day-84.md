# Day 84 — Kubernetes, CI/CD and Team Git Workflows

> Docker runs one container. **Kubernetes** runs hundreds across many servers, restarts them when they crash, and scales them with traffic. And **CI/CD** gets code from a Git push to production automatically. Read each 🌱 **In simple words** box first.

**Today's goal:** know the main Kubernetes objects, how deployments roll out safely, what a CI/CD pipeline does, and how teams use Git together.

<!-- topic: b84_t1 -->
## 🗄️ DevOps — K8s & CI/CD

<!-- intro: d31_t1_s1 -->
**Kubernetes** (K8s) runs containers across a cluster of machines. You describe what you want in YAML, and it keeps reality matching. The objects to know: a **Pod** (one or more containers running together), a **Deployment** ("always keep 3 copies of this pod running, using this image"), a **Service** (a stable name and address for a set of pods, so others find them, Day 75's service discovery), **ConfigMap** and **Secret** (settings and passwords passed to pods, Day 63) and an **Ingress** (routes outside HTTP traffic to services).

<!-- intro: d31_t1_s2 -->
Kubernetes checks your app's health with **probes**: a **liveness** probe ("is it stuck? restart it") and a **readiness** probe ("is it ready for traffic yet?"). Spring Boot's Actuator health endpoints (Day 63) are made for this. Pods also declare **resource requests and limits** (CPU and memory), so the scheduler places them sensibly and one greedy app can't starve the others.

<!-- intro: d31_t1_s3 -->
Real apps need many YAML files per environment. **Helm** packages them as a **chart** with templates and a `values.yaml` file, so the same chart deploys to dev and production with different values, like a recipe with adjustable quantities.

<!-- intro: d31_t1_s4 -->
**CI/CD**: **Continuous Integration** means every push automatically builds the code and runs all tests (Day 57), so broken code is caught in minutes. **Continuous Delivery/Deployment** then builds the Docker image, scans it and deploys it. Tools: **GitHub Actions** (a YAML file in your repo, the easiest place to start), Jenkins, GitLab CI. Add a GitHub Actions workflow that runs `./mvnw test` on every push to your Task Manager: it's a small step that looks great on a CV.

<!-- intro: d31_t1_s5 -->
Releasing without downtime: a **rolling update** replaces pods a few at a time (Kubernetes' default); **blue-green** runs the new version beside the old and switches all traffic at once (easy rollback); **canary** sends a small share of users (say 5%) to the new version first and watches the metrics before going further.

<!-- intro: d31_t1_s6 -->
Container security in production: run as non-root with a read-only filesystem (Day 74), keep images minimal, and **scan** images for known vulnerabilities in the pipeline with a tool like Trivy, failing the build on serious ones.

<!-- topic: b84_t2 -->
## 🗄️ Tools — Git in a Team

<!-- intro: d54_t1_s5 -->
Teams agree on a **branching strategy**: **trunk-based** development (short-lived branches merged into `main` daily, used with CI) or **Git Flow** (long-lived develop/release branches, slower). Useful commands beyond Day 12: `rebase` (replay your commits on top of the latest main for a clean history), `cherry-pick` (copy one commit to another branch), `stash` (put unfinished changes aside) and `bisect` (binary search through history for the commit that introduced a bug: Day 15 in Git form).

<!-- intro: d54_t1_s6 -->
Good **code reviews**: small pull requests that are easy to read, comments about the code and not the person, explaining *why* rather than just "change this", and approving when it's good enough rather than perfect. **Conventional commit** messages (`feat: add task paging`, `fix: handle empty title`) make history easy to scan.

## 📝 Day 84 Recap

1. What does Kubernetes do? → **runs and manages containers across a cluster, keeping the desired state**
2. What is a Pod? → **the smallest unit: one or more containers running together**
3. What does a Deployment do? → **keeps a set number of pod copies running with a given image**
4. What does a Service give pods? → **a stable name and address**
5. Liveness vs readiness probe? → **liveness: restart if stuck; readiness: send traffic only when ready**
6. What is Helm? → **a package manager for Kubernetes: templated charts with values files**
7. Continuous integration? → **build and test automatically on every push**
8. Rolling vs blue-green vs canary? → **replace gradually / switch all at once / try on a small share first**
9. What does git bisect do? → **binary-searches history for the commit that introduced a bug**
10. Trunk-based development? → **short-lived branches merged into main frequently, with CI**

# Day 85 — AWS: Accounts, IAM and Networking

> Seven days of cloud. Most backend jobs ask for AWS experience, and the ideas carry over to Azure and Google Cloud. Read each 🌱 **In simple words** box first.

**Today's goal:** understand what "the cloud" is, set up an AWS account safely, and learn the two foundations everything else sits on: IAM (who may do what) and VPC (the private network).

<!-- topic: b85_t1 -->
## 🗄️ AWS — Getting Started

<!-- subtopic: b85_t1_s1 -->
### Cloud in simple words

Running your own servers means buying machines, a room with power and cooling, network connections, and people to replace failed disks at 3 am. The **cloud** means **renting** computing from a provider like **AWS** (Amazon Web Services) by the hour or second, over the internet: servers, databases, storage, queues. You start in minutes, grow when traffic grows, and pay for what you use, like electricity from the grid instead of running your own generator.

Three levels of "how much do you manage yourself":

| Model | You manage | Example |
|---|---|---|
| **IaaS** (infrastructure) | the OS and everything above it | an EC2 virtual server (Day 86) |
| **PaaS** / managed services | just your app or data | RDS managed PostgreSQL (Day 88), ECS Fargate |
| **Serverless** | only your code, run on demand | AWS Lambda |

**Where it runs:** AWS is split into **regions**, separate geographic areas like Mumbai (`ap-south-1`) or Ireland (`eu-west-1`). Pick one near your users (lower latency) and where the law allows your data to live. Each region has several **availability zones (AZs)**: separate data centres a few kilometres apart, with their own power and network. Spreading your app across two or three AZs means one data centre's fire or power cut doesn't take you down.

<details>
<summary>Region vs availability zone?</summary>

A region is a geographic area (e.g. Mumbai); an availability zone is one of several separate data centres inside a region. Running in multiple AZs survives a single data centre failing.
</details>

<!-- subtopic: b85_t1_s2 -->
### Create an AWS account safely

Cloud mistakes cost real money, and leaked keys get abused within minutes. Do these steps on day one:

1. **Sign up** at aws.amazon.com. New accounts get a **free tier** (small servers, some storage and database time free for 12 months, plus always-free allowances). Read what's included before creating anything.
2. **Protect the root user** (the email you signed up with): turn on **MFA** (multi-factor authentication, an authenticator app), and then **stop using it** for daily work.
3. **Create an IAM user (or IAM Identity Center user) for yourself** with admin rights, with MFA, and log in as that from now on.
4. **Set a budget alarm**: Billing → Budgets → a monthly budget of, say, $5 with an email alert. This single step saves beginners from surprise bills.
5. **Never put access keys in code or in Git** (Day 12). Use `aws configure` locally, and IAM roles for anything running inside AWS (next section).
6. **Delete what you create** after practising: a forgotten database or load balancer keeps charging.

<details>
<summary>Two things to do immediately after creating an AWS account?</summary>

Turn on MFA for the root user (and stop using it day to day), and set a budget alarm. Also create a separate admin user for daily work.
</details>

<!-- intro: d45_t1_s5 -->
**IAM** (Identity and Access Management) decides **who can do what** in your account. **Users** are people; **groups** collect users; **roles** are identities that services or apps *assume* temporarily (your server's code gets a role instead of stored keys); **policies** are JSON documents listing allowed actions ("may read objects in bucket X"). The golden rule is **least privilege**: give each identity only the permissions it actually needs.

<!-- intro: d45_t1_s6 -->
IAM habits: no daily use of the root user, MFA everywhere, roles instead of long-lived keys, rotating any keys that must exist, and **STS** temporary credentials for access between accounts. Most cloud security incidents start with a leaked key or an over-powerful role.

<!-- intro: d45_t1_s8 -->
A **VPC** (virtual private cloud) is your own private network inside AWS. You divide it into **subnets**: **public** ones (reachable from the internet, for load balancers) and **private** ones (not reachable directly, for your app servers and databases). **Security groups** are firewalls around each server ("allow port 8080 only from the load balancer"); **NACLs** are coarser firewalls on whole subnets. Rule of thumb: databases always live in private subnets.

## 📝 Day 85 Recap

1. What is the cloud? → **renting computing resources over the internet, paying for what you use**
2. IaaS vs managed vs serverless? → **you manage the OS / just the app or data / only your code**
3. What is a region? → **a geographic area containing several AWS data centres**
4. Why use several availability zones? → **so one data centre failing doesn't take the app down**
5. First security step for a new account? → **MFA on the root user, then stop using root**
6. What stops surprise bills? → **a budget alarm**
7. IAM role vs user? → **a role is assumed temporarily by services or apps; a user is a person's identity**
8. What is least privilege? → **giving each identity only the permissions it needs**
9. Public vs private subnet? → **reachable from the internet vs not; databases go in private subnets**
10. What is a security group? → **a firewall controlling traffic to a resource**

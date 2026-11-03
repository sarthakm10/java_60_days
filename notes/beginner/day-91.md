# Day 91 — Terraform Practice and Cloud Review

> Hands-on Terraform, then a review of Days 85–90. If you practise in a real AWS account, keep your budget alarm on (Day 85) and run `terraform destroy` when you finish. Read each 🌱 **In simple words** box first.

**Today's goal:** write Terraform for a server and a bucket, and explain the AWS services you've met in one or two sentences each.

<!-- topic: b91_t1 -->
## 🗄️ DevOps — Terraform Practice & AWS Review

<!-- intro: d47_t1_s1 -->
Write Terraform for a small EC2 instance (Day 86), a **security group** that only allows SSH from your IP and HTTP on port 8080 (Day 85), and an **IAM role** the instance assumes (no keys on the server). Run `plan`, read it, `apply`, check it in the console, then `destroy`.

<!-- intro: d47_t1_s2 -->
Write Terraform for an S3 bucket with versioning, encryption and a lifecycle rule moving old objects to cheaper storage (Day 87), and block all public access. This is a realistic, safe exercise that costs almost nothing.

<!-- intro: d47_t1_s3 -->
Review: when would you pick EC2, ECS Fargate or Lambda for a new service (Day 86)? Explain the S3 storage classes and when each is worth it (Day 87).

<!-- intro: d47_t1_s4 -->
Review: a VPC's public and private subnets, security groups vs NACLs, and the IAM habits that prevent most incidents (Day 85).

<!-- intro: d47_t1_s5 -->
Review: how you'd monitor a Spring Boot service on AWS (Day 89): logs to CloudWatch Logs, metrics with alarms on errors and latency, X-Ray traces, and health checks on the load balancer.

<!-- intro: d49_t1_s5 -->
Draw a production setup for your Task Manager: users → ALB in public subnets → ECS Fargate tasks in private subnets → RDS PostgreSQL (Multi-AZ) and ElastiCache, files in S3, secrets in Secrets Manager, everything reporting to CloudWatch. If you can draw and explain this, you can hold a cloud conversation in an interview.

<!-- intro: d49_t1_s1 -->
Rapid-fire on S3: storage classes, presigned URLs, and the three encryption options.

<!-- intro: d49_t1_s3 -->
Rapid-fire on IAM and secrets: a role vs a policy, and KMS vs Secrets Manager.

<!-- intro: d49_t1_s4 -->
Rapid-fire on Terraform: the workflow, why state is remote and locked, and what a module is.

## 📝 Day 91 Recap

1. Always run before terraform apply? → **terraform plan, and read it**
2. How does an EC2 instance get AWS permissions safely? → **through an IAM role, not stored keys**
3. Security group for a Spring Boot server? → **port 8080 from the load balancer (and SSH only from your IP)**
4. Make an S3 bucket safe by default? → **block public access, enable encryption and versioning**
5. Where do app containers and databases run in a VPC? → **in private subnets**
6. EC2 vs Fargate vs Lambda? → **manage servers / managed containers / functions on demand**
7. KMS vs Secrets Manager? → **encryption keys vs stored secrets like passwords**
8. Production picture for a Spring Boot app? → **ALB → ECS Fargate → RDS + ElastiCache + S3, monitored by CloudWatch**
9. Last step after practising in AWS? → **terraform destroy (and check the bill)**
10. What does a presigned URL allow? → **temporary access to one S3 object without AWS credentials**

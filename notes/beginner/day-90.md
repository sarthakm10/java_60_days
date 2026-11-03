# Day 90 — Terraform: Infrastructure as Code

> Clicking around the AWS console works once, but nobody can review it, repeat it or undo it. **Infrastructure as Code** describes your servers, databases and networks in text files that live in Git, just like your app. Read each 🌱 **In simple words** box first.

**Today's goal:** read and write basic Terraform, use its workflow safely, and understand state, modules and lifecycle rules.

<!-- topic: b90_t1 -->
## 🗄️ DevOps — Terraform IaC

<!-- intro: d46_t1_s1 -->
Terraform files use **HCL**, a simple configuration language. The building blocks: a **resource** is something to create (`resource "aws_s3_bucket" "uploads" { bucket = "taskmanager-uploads" }`), a **data source** reads something that already exists, **variables** are inputs (like method parameters, Day 6), **outputs** are values to print or pass on, and **locals** are named helper values. You describe the **end state** you want; Terraform works out the steps.

<!-- intro: d46_t1_s2 -->
The workflow: `terraform init` (download the AWS provider), `terraform validate` (check syntax), **`terraform plan`** (show exactly what would be created, changed or destroyed, without doing it), `terraform apply` (do it, after confirming) and `terraform destroy` (remove everything, ideal after practising so nothing keeps billing). Always read the plan: it's your code review before touching real infrastructure.

<!-- intro: d46_t1_s3 -->
Terraform remembers what it created in a **state** file, mapping your code to the real resources' ids. On a team, state lives in a shared remote place (an S3 bucket, with a DynamoDB table as a **lock** so two people can't apply at once). The state file can contain secrets, so never commit it to Git. **Workspaces** keep separate state for dev and prod.

<!-- intro: d46_t1_s4 -->
A **module** is a reusable folder of Terraform with inputs and outputs, like a method you call with different arguments: one "service" module used for orders, payments and users. Modules can come from a local path, Git or the public Terraform Registry.

<!-- intro: d46_t1_s5 -->
To create several similar resources, use `count` (a number of copies) or **`for_each`** (one per item in a map or set). Prefer `for_each`: each resource is identified by a stable key, so removing one item from the middle doesn't make Terraform rebuild the others.

<!-- intro: d46_t1_s6 -->
**Lifecycle rules** change how Terraform replaces things: `create_before_destroy` (build the new one before removing the old, avoiding downtime), `prevent_destroy` (refuse to delete something precious like a production database) and `ignore_changes` (don't fight changes made outside Terraform, such as an auto-scaled count).

<!-- intro: d46_t1_s7 -->
Already have resources created by hand? `terraform import` brings them under Terraform's management. **Terragrunt** is a wrapper that reduces repetition when many environments share the same modules.

## 📝 Day 90 Recap

1. What is infrastructure as code? → **describing infrastructure in versioned text files instead of clicking in a console**
2. Terraform's configuration language? → **HCL**
3. What does terraform plan do? → **shows what would be created, changed or destroyed, without doing it**
4. Order of the main commands? → **init, validate, plan, apply (destroy to clean up)**
5. What is Terraform state? → **the record mapping your code to the real resources**
6. Where should team state live? → **remote (e.g. S3) with locking (e.g. DynamoDB)**
7. Should the state file be committed to Git? → **no, it can contain secrets**
8. What is a module? → **a reusable folder of Terraform with inputs and outputs**
9. count or for_each? → **for_each: stable keys avoid rebuilding unrelated resources**
10. Stop Terraform from ever deleting a resource? → **lifecycle { prevent_destroy = true }**

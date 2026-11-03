# Day 87 — AWS Storage with S3

> S3 stores files ("objects") for almost every app on AWS: user uploads, images, backups, logs, static websites. Read each 🌱 **In simple words** box first.

**Today's goal:** store and protect files in S3, choose cheaper storage classes for old data, and let users upload and download files securely.

<!-- topic: b87_t1 -->
## 🗄️ AWS — S3 Deep Dive

<!-- intro: d43_t1_s1 -->
**S3** stores files (called **objects**) in **buckets**, each object found by its **key** (like a path: `invoices/2026/1001.pdf`). Access can be controlled in two places: **IAM policies** (attached to a user or role: "this role may read bucket X") and **bucket policies** (attached to the bucket: "these principals may read me"). ACLs are an older mechanism, now usually turned off. Keep buckets private; "public bucket leaks" are a classic data breach.

<!-- intro: d43_t1_s2 -->
S3 has **storage classes** at different prices: **Standard** for data used often, **Standard-IA** (infrequent access) for data read rarely but needed fast, **Glacier** tiers for archives (very cheap, slower or paid retrieval), and **Intelligent-Tiering**, which moves objects between tiers automatically based on use.

<!-- intro: d43_t1_s3 -->
**Lifecycle policies** move or delete objects automatically by age: "after 30 days move logs to Standard-IA, after 90 days to Glacier, after a year delete them". Set them once and storage costs stop growing forever.

<!-- intro: d43_t1_s4 -->
**Versioning** keeps every version of an object, so an accidental overwrite or delete can be undone. **MFA Delete** demands a second factor for permanent deletes, and **Object Lock** makes objects unchangeable for a period (write-once, required by some regulations).

<!-- intro: d43_t1_s5 -->
Encryption at rest: **SSE-S3** (AWS manages the keys, on by default), **SSE-KMS** (keys in AWS KMS, Day 89, with an audit log of every use) and **SSE-C** (you provide the key with each request). SSE-KMS is the common choice when you need to prove who accessed what.

<!-- intro: d43_t1_s6 -->
Big files (over about 100 MB) should use **multipart upload**: the file is sent in parts, in parallel, and a failed part is simply retried. **Transfer Acceleration** routes uploads through AWS's nearby edge locations for faster long-distance transfers.

<!-- intro: d43_t1_s7 -->
S3 can **notify** other services when objects change: "a new image was uploaded" → trigger a Lambda (Day 86) to make a thumbnail, or send a message to SQS (Day 88). This is event-driven design (Day 79) built into storage.

<!-- intro: d43_t1_s8 -->
How do users upload a profile picture without your server handling the bytes, and without giving them AWS keys? Your API creates a **presigned URL**: a temporary link, signed with your app's permissions, that allows one specific upload or download until it expires. The browser talks to S3 directly.

<!-- intro: d43_t1_s9 -->
Extras to recognise: **Access Points** (named entry points with their own permissions for different apps), **S3 Select** (run a simple SQL filter on a CSV or JSON file inside S3) and **cross-region replication** (copy objects to another region for disaster recovery).

## 📝 Day 87 Recap

1. What is an S3 object key? → **the object's name/path inside a bucket**
2. Bucket policy vs IAM policy? → **attached to the bucket vs attached to a user or role**
3. Storage class for rarely read data needed quickly? → **Standard-IA**
4. Storage class for cheap archives? → **Glacier**
5. What do lifecycle policies do? → **move or delete objects automatically by age**
6. What does versioning protect against? → **accidental overwrites and deletes**
7. Encryption with an audit trail of key use? → **SSE-KMS**
8. How should big files be uploaded? → **multipart upload**
9. React automatically to a new upload? → **S3 event notifications (to Lambda, SQS or SNS)**
10. Let a user upload directly without AWS keys? → **a presigned URL**

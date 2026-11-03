# Day 89 — AWS: Monitoring and Security

> Day 63 and Day 78's ideas (metrics, logs, traces) on AWS, plus how secrets and encryption keys are kept safe. Read each 🌱 **In simple words** box first.

**Today's goal:** watch your app with CloudWatch metrics, logs and alarms, trace requests with X-Ray, and keep keys and passwords in the right place.

<!-- topic: b89_t1 -->
## 🗄️ AWS — Monitoring & Keys

<!-- intro: d45_t1_s1 -->
**CloudWatch Metrics** collects numbers over time from every AWS service (CPU, requests, errors) and from your app (custom metrics, like Day 63's Micrometer counters). Metrics are grouped by **namespace** and labelled with **dimensions** (which instance, which service), and graphed on dashboards.

<!-- intro: d45_t1_s2 -->
**CloudWatch Logs** collects your app's log output (Day 78's centralised logging): **log groups** per app, **log streams** per container or instance. **Logs Insights** lets you query them with a SQL-like language ("errors per minute in the last hour"), and **metric filters** turn log patterns into metrics.

<!-- intro: d45_t1_s3 -->
**CloudWatch Alarms** watch a metric and act when it crosses a threshold: "if 5xx errors exceed 1% for 5 minutes, email the on-call developer" or "add servers". Anomaly detection learns normal patterns, and composite alarms combine several conditions to reduce noisy alerts.

<!-- intro: d45_t1_s4 -->
**X-Ray** is AWS's distributed tracing (Day 78): it shows each request's path through your services as a map and a timeline of **segments**, so you can see where the time went. Sampling rules record only a share of requests to keep costs down.

<!-- intro: d45_t1_s7 -->
Never store passwords or API keys in code or config files in Git. **Secrets Manager** stores secrets (like the database password), can rotate them automatically, and your app reads them at startup through its IAM role. **Parameter Store** is a cheaper option for plain settings and simple secrets. **KMS** manages the **encryption keys** behind it all (S3's SSE-KMS, Day 87), and logs every use of a key.

## 📝 Day 89 Recap

1. What does CloudWatch Metrics store? → **numeric measurements over time from AWS services and your app**
2. What are metric dimensions? → **labels like instance or service name that identify a metric's source**
3. Log group vs log stream? → **a group per app; a stream per container or instance**
4. Query logs in CloudWatch? → **Logs Insights**
5. What does a CloudWatch Alarm do? → **acts (notify, scale) when a metric crosses a threshold**
6. AWS distributed tracing? → **X-Ray**
7. Where should the database password live? → **Secrets Manager (or Parameter Store), read via the app's IAM role**
8. Advantage of Secrets Manager? → **automatic rotation of secrets**
9. What is KMS for? → **managing encryption keys, with an audit log of their use**
10. Why use sampling in tracing? → **to record only a share of requests and keep costs down**

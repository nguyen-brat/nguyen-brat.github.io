---
section: 39
title: "AWS Security Services"
part: "Security & Infrastructure as Code"
kind: concept
status: done
readingTime: 9
lectures: ["Encryption at Rest & Encryption in Transit","AWS KMS - AWS managed keys","Using AWS KMS CMK (Customer Managed Key)","Encryption and Decryption Workflow - Small File 4KB","Encryption & Decryption Workflow - Large File","Using kms:Encrypt & kms:Decrypt","Using kms:GenerateDataKey","AWS WAF Intro","Web ACL & Rule Types","AWS WAF Pricing"]
quiz:
  - question: "You must encrypt a 2 GB backup file with a KMS key. Calling kms:Encrypt on the whole file fails. What is the right approach?"
    options:
      - "Split the file into 4 KB pieces and call kms:Encrypt on each one."
      - "Call kms:GenerateDataKey, encrypt the file locally with the plaintext data key, then store the encrypted data key next to the file."
      - "Switch to an AWS managed key, which has no size limit."
    answer: 1
    explanation: "Envelope encryption keeps the big data local and only sends the small data key to KMS. Option A works in theory but is slow and chatty, and the key type does not change the 4 KB direct limit."
  - question: "A company must share an encrypted EBS snapshot with another AWS account. Which key type makes this possible?"
    options:
      - "AWS managed key (aws/ebs)"
      - "Customer managed key with a key policy that allows the other account"
      - "Any key, KMS keys are global"
    answer: 1
    explanation: "AWS managed keys can only be used inside your own account. A customer managed key lets you edit the key policy and grant another account access."
  - question: "Your public website behind an Application Load Balancer is hit by SQL injection attempts and a flood of requests from a few IPs. Which service fits?"
    options:
      - "AWS WAF web ACL with managed rules and a rate-based rule"
      - "AWS KMS"
      - "Security group rules on the ALB"
    answer: 0
    explanation: "WAF inspects HTTP requests at layer 7 and has SQLi managed rules and rate-based rules. Security groups only filter by port and IP, so they cannot see SQL in a request."
  - question: "You add a new WAF rule and are afraid it will block real customers. How do you test it safely?"
    options:
      - "Set the rule action to Count first and review the metrics and logs."
      - "Set the web ACL default action to Block."
      - "Put it last in the priority order."
    answer: 0
    explanation: "Count is non-terminating: it records matches without changing the outcome. Priority order does not stop a Block rule from blocking when it matches."
  - question: "A web ACL has rule 1 (priority 0) set to Allow for office IPs and rule 2 (priority 1) set to Block for a bad user-agent. A request from an office IP has that user-agent. What happens?"
    options:
      - "It is blocked, because Block always wins."
      - "It is allowed, because Allow matched first and stops evaluation."
      - "It is counted and sent to the default action."
    answer: 1
    explanation: "Rules run from the lowest priority number, and Allow and Block are terminating, so rule 2 is never reached. Only Count is non-terminating."
---

## What it is

Security on AWS has two jobs: protect your data (encryption) and protect your entry points (filtering and detection). This chapter covers **AWS KMS**, which manages the keys for encryption, and **AWS WAF**, a firewall for HTTP requests. A final table maps the other common security services to the threat each one handles.

```mermaid
flowchart LR
  D["📄 Data"] -->|"at rest: KMS keys"| S["🪣 S3 / EBS / RDS"]
  U["👤 User"] -->|"in transit: TLS"| A["🌐 App"]
  U -->|"HTTP requests"| W["🛡️ WAF"] --> A
```
*Encryption protects stored and moving data; WAF filters what reaches the app.*

Use KMS when data must be encrypted and you must control or audit the key. Use WAF when a public web app or API needs protection from bad HTTP requests.

## Key concepts

### Encryption at rest vs in transit

| | At rest | In transit |
|---|---|---|
| Protects | Data stored on disk | Data moving over the network |
| Typical tool | KMS keys (S3, EBS, RDS use them) | TLS/HTTPS with certificates |
| Threat | Stolen disk, snapshot, or bucket | Eavesdropping on the wire |

- Do both. They protect different moments.
- Most AWS storage services have an "encrypt with KMS" checkbox; you pick the key.

### KMS key types

```mermaid
flowchart TD
  K["🔑 KMS keys"] --> O["AWS owned<br/>(hidden, service-internal)"]
  K --> M["AWS managed<br/>alias aws/service"]
  K --> C["Customer managed (CMK)<br/>you create and control"]
```
*Three kinds of key; you only control the last one.*

| | AWS managed | Customer managed |
|---|---|---|
| Created by | The AWS service, in your account | You |
| Key policy | You cannot change it | You write it |
| Rotation | Automatic every year, fixed | You choose to enable it and set it |
| Cross-account use | No | Yes, via key policy |
| Monthly fee | None, you pay for use | Yes, plus usage (check KMS pricing) |

- AWS managed keys are the easy default: free to exist, auditable in CloudTrail.
- Pick a customer managed key when you need sharing, your own policy, rotation control, or compliance evidence.
- Every KMS key has a key policy. IAM policies alone are not enough unless the key policy allows IAM to control access (see [IAM](/chapters/04-aws-identity-and-access-management-iam/)).

### Small data: direct Encrypt and Decrypt

```mermaid
sequenceDiagram
  participant App as 👤 App
  participant KMS as 🔑 KMS
  App->>KMS: kms:Encrypt(keyId, plaintext ≤ 4 KB)
  KMS-->>App: ciphertext
  App->>KMS: kms:Decrypt(ciphertext)
  KMS-->>App: plaintext
```
*Small secrets go to KMS directly; the key never leaves KMS.*

- Direct calls accept up to 4 KB of data. Good for passwords and small tokens.
- The caller needs `kms:Encrypt` and/or `kms:Decrypt` on that key (plus the key policy must allow it).
- Decrypt does not need the key ID for symmetric keys; the ciphertext carries it.

### Large data: envelope encryption

```mermaid
sequenceDiagram
  participant App as 👤 App
  participant KMS as 🔑 KMS
  participant S3 as 🪣 Storage
  App->>KMS: kms:GenerateDataKey(keyId)
  KMS-->>App: plaintext data key + encrypted data key
  App->>App: encrypt big file locally, then discard plaintext key
  App->>S3: encrypted file + encrypted data key
  Note over App,S3: To read: kms:Decrypt the data key, then decrypt file locally
```
*Only the small data key travels to KMS; the large file stays local.*

- `GenerateDataKey` returns two copies of one key: plaintext (use once, then drop it) and encrypted (store it with the data).
- Why: sending gigabytes to KMS is slow; sending a 32-byte key is not.
- This is what S3, EBS and others do for you behind the checkbox. The caller needs `kms:GenerateDataKey` to write and `kms:Decrypt` to read.

### AWS WAF: web ACL and rules

```mermaid
flowchart LR
  R["👤 Request"] --> ACL{"Web ACL<br/>rules by priority"}
  ACL -->|"Allow / Block"| End["stop here"]
  ACL -->|"Count"| Next["next rule"]
  ACL -->|"no match"| Def["default action"]
```
*Rules run from the lowest priority number; Allow and Block end the evaluation.*

- A **web ACL** is the set of rules you attach to a resource: CloudFront, ALB, API Gateway REST API, AppSync, Cognito user pool, and others.
- Actions: Allow, Block, Count (non-terminating, for testing), plus CAPTCHA and Challenge for bots.
- Rule types you will meet:

| Rule type | Matches on |
|---|---|
| IP set / geo match | Source IP list or country |
| String, regex, size, SQLi, XSS | Content of headers, URI, query string, body |
| Rate-based | Too many requests from one source in a time window |
| Managed rule groups | Ready-made sets from AWS or Marketplace sellers |
| Your own rule groups | Reusable rules you maintain |

- WAF works at layer 7 (HTTP/HTTPS). It does not stop network-level floods.

### AWS WAF pricing

- You pay per web ACL, per rule, and per million requests inspected. Each rule group you add also has a monthly fee. Fees are prorated hourly.
- Extras cost more: Bot Control, Fraud Control, CAPTCHA attempts, Challenge responses, large request bodies, and web ACLs above the default capacity.
- WAF is billed on top of CloudFront, ALB or API Gateway. Check the [WAF pricing page](https://aws.amazon.com/waf/pricing/) for current numbers.

## X vs Y

### Which security service for which threat

| Threat | Service | One-line job |
|---|---|---|
| Stolen or exposed data | KMS | Create and control encryption keys |
| SQL injection, XSS, bad bots, HTTP floods | WAF | Filter HTTP requests at layer 7 |
| Network DDoS (layer 3/4) | Shield | Absorb volumetric and protocol attacks |
| Compromised account or instance | GuardDuty | Detect threats from logs and behaviour |
| Vulnerable software | Inspector | Scan for known vulnerabilities |
| PII in S3 buckets | Macie | Find sensitive data with ML |
| Leaked passwords and DB credentials | Secrets Manager | Store and rotate secrets |
| Unencrypted traffic | ACM | Issue and renew TLS certificates |
| Too many alerts | Security Hub | Collect findings in one place |
| Who called which API | CloudTrail | Audit log (see [CloudWatch and CloudTrail](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/)) |

### WAF vs Shield

| | WAF | Shield Standard | Shield Advanced |
|---|---|---|---|
| Layer | 7 (HTTP) | 3 and 4 (plus common attacks) | 3, 4 and 7 |
| Cost | Pay per ACL, rule, request | Free, always on | Extra subscription |
| Extras | Your own rules | None to configure | Response team, attack visibility |

Pick WAF when the attack looks like web requests. Pick Shield Advanced when downtime from DDoS is costly and you want expert help; Standard is already on.

### Secrets Manager vs Parameter Store

| | Secrets Manager | Parameter Store |
|---|---|---|
| Built-in rotation | Yes (Lambda-driven) | No |
| Cross-Region replication | Yes | No |
| Best for | DB passwords, API keys | Config values, plain or encrypted |

Pick Secrets Manager for credentials that must rotate. Pick Parameter Store for general configuration. Check current pricing for both.

### GuardDuty vs Inspector vs Macie

| | GuardDuty | Inspector | Macie |
|---|---|---|---|
| Question | "Is someone attacking me?" | "Is my software vulnerable?" | "Where is my sensitive data?" |
| Looks at | Account activity and logs | Compute workloads | S3 objects |

### AWS managed key vs customer managed key

Pick AWS managed when you only need encryption and an audit trail. Pick customer managed when you must share the key, set its policy, or control rotation.

## Job notes

```mermaid
flowchart LR
  A["Deploy new web app"] --> B["Encrypt storage with KMS"]
  B --> C["Attach WAF in Count mode"]
  C --> D["Review logs and metrics"]
  D --> E["Switch tuned rules to Block"]
```
*Safe rollout: encrypt, observe, then enforce.*

- Access denied on an encrypted resource is often missing KMS permission (`kms:Decrypt`, `kms:GenerateDataKey`) or a key policy that does not allow the role.
- A KMS key cannot be deleted at once; deletion is scheduled with a waiting period, so mistakes can be undone.
- Never block with a new managed rule group straight away; start in Count and look at what it matches.
- Put cheap rules first. Terminating matches stop evaluation, which also avoids charges for later paid rule groups.
- Every KMS call lands in CloudTrail, which gives you proof of who used the key.
- Check the current KMS and WAF quotas and prices before sizing a design.

## Cheat sheet

- At rest: KMS. In transit: TLS (certificates from ACM).
- Key types: AWS owned, AWS managed (`aws/...`), customer managed.
- AWS managed keys: auto-rotate yearly, no edits, same account only.
- Encrypt/Decrypt directly: up to 4 KB.
- Big data: `GenerateDataKey`, encrypt locally, store the encrypted key with the data.
- WAF: layer 7, attaches to CloudFront, ALB, API Gateway, AppSync, Cognito and more.
- Actions: Allow, Block (terminating); Count (test); CAPTCHA, Challenge.
- Rules run by priority; default action applies if nothing terminates.
- WAF cost: per web ACL + per rule + per million requests (+ extras).
- Shield Standard is free; Advanced is a paid subscription.

## AWS docs

- [AWS KMS cryptography essentials](https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html)
- [AWS KMS keys (AWS managed and customer managed)](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)
- [What is AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html)
- [How AWS WAF handles rule actions](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-rule-actions.html)
- [How Shield and Shield Advanced work](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-overview.html)

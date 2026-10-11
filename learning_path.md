# AWS Architecting: The Ultimate Course — Fast Learning Path

Built from the real curriculum (60 sections / 800 items / ~77.5 h). Goal assumed: **broad, exam-grade AWS architect knowledge (SAA-C03) in the least time**.

## Assumptions (change these and tell me, I'll regenerate)
- Start **Mon 12 Oct 2026**; **2 h/day Mon–Sat**, **Sunday = review only** (no new video).
- Concept lectures at **1.5× speed**, key labs at **1.25×**. Hands-on labs are limited to 4 that teach the most.
- Resulting video time: **~33 h of playback** (vs 77.5 h full course) → finishes **Fri 30 Oct 2026**, then 1 week of practice exams.

## The method (how to learn fast, not just watch fast)
1. **Before each session**: read the phase 'Focus' list below (30 s). You are hunting for those answers.
2. **During**: pause only to write one line per service: *what it is · when to choose it · key limit/gotcha*.
3. **After**: close the video and, from memory, sketch the architecture / write 5 'X vs Y' comparisons. Gaps → rewatch only that lecture.
4. **Sunday review**: redo that week's comparisons + 15–20 practice questions on the week's topics.
5. **Skip rule**: a lecture whose title you can already explain → watch at 2×, or skip.

## Learning path overview

| Phase | Sections | Playback (h) | Days |
|---|---|---|---|
| Phase 1: Foundations & Security | 2, 3, 4, 39 | 3.9 | 12 Oct – 13 Oct |
| Phase 2: Networking (the hardest, most-tested block) | 5, 29, 30, 31, 32, 33 | 5.6 | 13 Oct – 16 Oct |
| Phase 3: Compute & Scaling | 6, 26, 8, 7* | 6.0 | 16 Oct – 20 Oct |
| Phase 4: Storage | 10, 12, 14 | 4.1 | 20 Oct – 22 Oct |
| Phase 5: Databases | 19, 20, 21, 23, 24, 25* | 5.6 | 22 Oct – 26 Oct |
| Phase 6: Serverless & Integration | 35, 37, 36* | 3.1 | 26 Oct – 27 Oct |
| Phase 7: Operations, Delivery & Edge | 28, 40, 34, 48, 49* | 3.3 | 27 Oct – 29 Oct |
| Phase 8: Resilience, Governance & AI | 53, 52, 50 | 1.1 | 29 Oct – 29 Oct |
| Phase 9: Exam Readiness | 60 | 0.4 | 29 Oct – 30 Oct |

\* = hands-on lab (do it in your own AWS account, free-tier / delete resources afterwards to avoid charges).

### Phase 1 — Foundations & Security
**Goal:** Understand the AWS global model, shared responsibility, and who can do what.  
**Focus:** Regions/AZs/edge, shared responsibility, IAM users/groups/roles/policies (evaluation logic, least privilege, STS/assume-role), KMS/Secrets/Shield/WAF basics.  
**Sections:** #2 Architecting Foundations; #3 Create & Setup Your AWS Account; #4 AWS Identity & Access Management (IAM); #39 AWS Security Services

### Phase 2 — Networking (the hardest, most-tested block)
**Goal:** Be able to draw a VPC from memory and explain every connection option.  
**Focus:** CIDR/subnets/route tables, IGW vs NAT, Security Group vs NACL (stateful vs stateless), VPC Endpoints (gateway vs interface), Peering vs Transit Gateway vs PrivateLink, VPN/Direct Connect.  
**Sections:** #5 Networking Basic; #29 AWS Networking Services - VPC Endpoints; #30 AWS Networking Services - VPC Peering; #31 AWS Networking Services - AWS Transit Gateway; #32 AWS Networking Services - Hybrid Connections; #33 AWS Networking Services - AWS PrivateLink

### Phase 3 — Compute & Scaling
**Goal:** Choose the right compute service and make it scale and stay available.  
**Focus:** EC2 families/purchasing options/placement groups, ELB types (ALB vs NLB vs GWLB), Auto Scaling policies, Lambda limits/concurrency, ECS/Fargate vs EKS.  
**Sections:** #6 AWS Compute Services - Amazon EC2; #26 AWS Auto Scaling; #8 AWS Computes - AWS Lambda & Containers; #7 LAB 01 - Build First 3-Tiers Web Application on Amazon EC2 and AWS ELB 🧪

### Phase 4 — Storage
**Goal:** Match workload to block / file / object storage and its cost tier.  
**Focus:** EBS volume types & snapshots, EFS vs FSx, S3 storage classes, lifecycle, versioning, replication, encryption, presigned URLs, performance.  
**Sections:** #10 AWS Storage Services - AWS EBS; #12 AWS Storage Services - Amazon EFS and FSx; #14 AWS Storage Services - Amazon S3

### Phase 5 — Databases
**Goal:** Pick the right database and know its HA / scaling model.  
**Focus:** RDS Multi-AZ vs Read Replicas, Aurora architecture/Global DB/Serverless, DynamoDB keys/GSI/LSI/capacity/DAX/streams, ElastiCache, DMS/SCT.  
**Sections:** #19 AWS Database Services Intro; #20 AWS Database Services - Amazon RDS; #21 AWS Database Services - Amazon Aurora; #23 AWS Database Services - Amazon DynamoDB; #24 AWS Database Caching & Migration; #25 LAB 09 - Build A CRUD Application with AWS Lambda & Amazon DynamoDB 🧪

### Phase 6 — Serverless & Integration
**Goal:** Decouple systems with queues, topics and events.  
**Focus:** API Gateway, SQS (standard vs FIFO, DLQ), SNS fan-out, EventBridge, Step Functions, Kinesis.  
**Sections:** #35 AWS Serverless Services - Lambda & DynamoDB & API Gateway; #37 AWS Serverless Services - Messaging Services; #36 LAB 11 - Serverless Todo Application 🧪

### Phase 7 — Operations, Delivery & Edge
**Goal:** Monitor, automate and accelerate delivery.  
**Focus:** CloudWatch metrics/alarms/logs, CloudTrail vs Config, IaC concepts (CloudFormation), Route 53 routing policies, CloudFront, Global Accelerator, Snow family/DataSync.  
**Sections:** #28 AWS Monitoring - Amazon CloudWatch & AWS CloudTrail; #40 AWS Operation Services - IaC; #34 AWS Data Transfer; #48 AWS Edge Services; #49 LAB 15 - Configure Amazon CloudFront Distribution with Amazon S3 Origin 🧪

### Phase 8 — Resilience, Governance & AI
**Goal:** Design for failure and know the multi-account / AI picture.  
**Focus:** RTO/RPO, backup & restore vs pilot light vs warm standby vs active-active, Organizations/SCPs/Control Tower, Bedrock/SageMaker at overview level.  
**Sections:** #53 AWS Disaster Recovery; #52 Multi-Account Strategy; #50 AWS ML/AI Services

### Phase 9 — Exam Readiness
**Goal:** Convert knowledge into passing score.  
**Focus:** Course exam-prep section, then timed practice exams (external) — review every wrong answer back to the matching section.  
**Sections:** #60 Exam Prep SAA-C03

## Day-by-day schedule

Lecture numbers are the order inside each section (see `course_structure.md`).

| Date | Plan | Playback |
|---|---|---|
| Mon 12 Oct | **#2** Architecting Foundations  L1–7/7; **#3** Create & Setup Your AWS Account  L1–15/15; **#4** AWS Identity & Access Management (IAM)  L1–6/30 | 120 min |
| Tue 13 Oct | **#4** AWS Identity & Access Management (IAM)  L7–30/30; **#39** AWS Security Services  L1–10/10; **#5** Networking Basic  L1–2/46 | 127 min |
| Wed 14 Oct | **#5** Networking Basic  L3–31/46 | 124 min |
| Thu 15 Oct | **#5** Networking Basic  L32–46/46; **#29** AWS Networking Services - VPC Endpoint…  L1–8/8; **#30** AWS Networking Services - VPC Peering  L1–9/9; **#31** AWS Networking Services - AWS Transit …  L1/5 | 124 min |
| Fri 16 Oct | **#31** AWS Networking Services - AWS Transit …  L2–5/5; **#32** AWS Networking Services - Hybrid Conne…  L1–4/4; **#33** AWS Networking Services - AWS PrivateL…  L1–9/9; **#6** AWS Compute Services - Amazon EC2  L1–13/39 | 122 min |
| Sat 17 Oct | **#6** AWS Compute Services - Amazon EC2  L14–39/39; **#26** AWS Auto Scaling  L1–10/13 | 121 min |
| Sun 18 Oct | 🔁 **Review**: redo the week's comparison notes + practice questions | – |
| Mon 19 Oct | **#26** AWS Auto Scaling  L11–13/13; **#8** AWS Computes - AWS Lambda & Containers  L1–25/25; **#7** LAB 01 - Build First 3-Tiers Web Appli… 🧪 L1–7/22 | 122 min |
| Tue 20 Oct | **#7** LAB 01 - Build First 3-Tiers Web Appli… 🧪 L8–22/22; **#10** AWS Storage Services - AWS EBS  L1–13/13; **#12** AWS Storage Services - Amazon EFS and …  L1–2/7 | 120 min |
| Wed 21 Oct | **#12** AWS Storage Services - Amazon EFS and …  L3–7/7; **#14** AWS Storage Services - Amazon S3  L1–24/43 | 121 min |
| Thu 22 Oct | **#14** AWS Storage Services - Amazon S3  L25–43/43; **#19** AWS Database Services Intro  L1–5/5; **#20** AWS Database Services - Amazon RDS  L1–6/13 | 121 min |
| Fri 23 Oct | **#20** AWS Database Services - Amazon RDS  L7–13/13; **#21** AWS Database Services - Amazon Aurora  L1–23/23; **#23** AWS Database Services - Amazon DynamoD…  L1–5/34 | 123 min |
| Sat 24 Oct | **#23** AWS Database Services - Amazon DynamoD…  L6–34/34; **#24** AWS Database Caching & Migration  L1–2/11 | 121 min |
| Sun 25 Oct | 🔁 **Review**: redo the week's comparison notes + practice questions | – |
| Mon 26 Oct | **#24** AWS Database Caching & Migration  L3–11/11; **#25** LAB 09 - Build A CRUD Application with… 🧪 L1–6/6; **#35** AWS Serverless Services - Lambda & Dyn…  L1–13/13; **#37** AWS Serverless Services - Messaging Se…  L1/18 | 129 min |
| Tue 27 Oct | **#37** AWS Serverless Services - Messaging Se…  L2–18/18; **#36** LAB 11 - Serverless Todo Application 🧪 L1–9/9; **#28** AWS Monitoring - Amazon CloudWatch & A…  L1–6/13 | 124 min |
| Wed 28 Oct | **#28** AWS Monitoring - Amazon CloudWatch & A…  L7–13/13; **#40** AWS Operation Services - IaC  L1–2/2; **#34** AWS Data Transfer  L1–7/7; **#48** AWS Edge Services  L1–15/26 | 121 min |
| Thu 29 Oct | **#48** AWS Edge Services  L16–26/26; **#49** LAB 15 - Configure Amazon CloudFront D… 🧪 L1–4/4; **#53** AWS Disaster Recovery  L1–6/6; **#52** Multi-Account Strategy  L1/1; **#50** AWS ML/AI Services  L1/1; **#60** Exam Prep SAA-C03  L1/2 | 120 min |
| Fri 30 Oct | **#60** Exam Prep SAA-C03  L2/2 | 22 min |

## After the videos — Exam week (31 Oct →)
- Take 2–3 full timed SAA-C03 practice exams (65 q / 130 min); target ≥ 80 %.
- For every miss, write the rule in one line and re-watch only the related lecture.
- Do the weakest phase's skipped optional section (see below) if you still score low there.

## Skipped / optional (come back only if needed)
- #1 Intro — 0.8 h
- #9 LAB 02 - Build Your First Container Cluster with Amazon ECS — 1.4 h
- #11 LAB 03 - Build Image Uploader Application with Amazon EC2 & Amazon EBS — 0.4 h
- #13 LAB 04 - Build Image Uploader Application with Amazon EFS — 0.2 h
- #15 LAB 05 - Build Image Upload Application with Amazon S3 — 0.8 h
- #16 LAB 06 - Build A Data Lake with Amazon S3 & AWS Lake Formation — 3.2 h
- #17 LAB 07 - Serverless Image Converter with Amazon S3 & AWS Lambda — 0.5 h
- #18 Amazon S3 Files - NEW — 1.2 h
- #22 LAB 08 - Build A Single Application with Amazon EC2 & Amazon Aurora — 0.4 h
- #27 LAB 10 - Auto Scaling — 1.3 h
- #38 LAB 12 - Automation with Amazon EventBridge Schedule — 0.8 h
- #41 LAB 13 - Infrastructure as Code - AWS CloudFormation — 3.5 h
- #42 LAB 13- Infrastructure as Code - AWS CDK — 1.1 h
- #43 AWS DevOps Services — 0.0 h
- #44 LAB 14 - CI/CD Part 1 - Amazon EC2 — 1.8 h
- #45 LAB 14 - CI/CD Part 2 - ALB & ASG — 1.5 h
- #46 LAB 14 - CI/CD Part 3 - Amazon ECS (Rolling Update) — 1.2 h
- #47 LAB 14 - CI/CD Part 3 - Amazon ECS (Blue/Green Deployment) — 0.9 h
- #51 LAB 16 - Build RAG system with Amazon Bedrock — 0.9 h
- #54 LAB 17 - Build DR Site on AWS - Setup — 0.5 h
- #55 LAB 17 - Build DR Site on AWS - Backup & Restore Strategy — 1.2 h
- #56 LAB 17 - Build DR Site on AWS - Pilot Light — 1.3 h
- #57 LAB 17 - Build DR Site on AWS - Warm Standby Strategy — 1.5 h
- #58 LAB 17 - Build DR Site on AWS - Multi-Site Active-Active Strategy — 1.1 h
- #59 CAPSTONE PROJECT — 1.1 h
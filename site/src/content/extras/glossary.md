---
title: "Glossary"
order: 1
status: done
---

AWS terms from the chapters, A to Z. Each entry links to the chapter that teaches it.

## A

- **ACM** — AWS Certificate Manager; issues the TLS certificates used for encryption in transit. [chapter 39](/chapters/39-aws-security-services/)
- **Active-active (multi-site)** — DR strategy running full capacity in more than one site at once. [chapter 58](/chapters/58-lab-17-build-dr-site-on-aws-multi-site-active-acti/)
- **ACU** — Aurora Capacity Unit; the compute unit Aurora Serverless scales and bills per second. [chapter 21](/chapters/21-aws-database-services-amazon-aurora/)
- **Alarm (CloudWatch)** — Watches a metric and acts on a state change: OK, ALARM or INSUFFICIENT_DATA. [chapter 28](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/)
- **ALB (Application Load Balancer)** — Layer 7 (HTTP/HTTPS) load balancer that spreads requests across targets. [chapter 26](/chapters/26-aws-auto-scaling/)
- **Alias record (Route 53)** — Route 53 record pointing at an AWS resource; works at the zone apex. [chapter 48](/chapters/48-aws-edge-services/)
- **Amazon Bedrock** — Serverless access to foundation models through one API, with knowledge bases, agents and guardrails. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Amazon Comprehend** — AI service that finds insights in text. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Amazon Lex** — AI service for building chatbots. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Amazon Polly** — AI service that turns text into speech. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Amazon Rekognition** — AI service for analysing images and video. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Amazon Textract** — AI service that extracts content from documents. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Amazon Transcribe** — AI service that turns speech into text. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Amazon Translate** — AI service that translates between languages. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **AMI (Amazon Machine Image)** — Template of OS and software (snapshots plus metadata) used to launch EC2 instances. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **API Gateway** — Front door for serverless APIs: HTTP, REST and WebSocket types, with stages and throttling (429). [chapter 35](/chapters/35-aws-serverless-services-lambda-and-dynamodb-and-ap/)
- **Athena** — Query service used with S3 and Glue in the data lake lab. [chapter 16](/chapters/16-lab-06-build-a-data-lake-with-amazon-s3-and-aws-la/)
- **Aurora** — MySQL/PostgreSQL-compatible database with compute split from a shared storage volume (6 copies, 3 AZs). [chapter 21](/chapters/21-aws-database-services-amazon-aurora/)
- **Aurora Global Database** — Cross-Region Aurora setup for disaster recovery; seconds RPO, minutes RTO. [chapter 21](/chapters/21-aws-database-services-amazon-aurora/)
- **Aurora Replica** — Read node on Aurora's shared volume; also the automatic failover target. [chapter 21](/chapters/21-aws-database-services-amazon-aurora/)
- **Aurora Serverless** — Aurora that scales within an ACU range and bills per second. [chapter 21](/chapters/21-aws-database-services-amazon-aurora/)
- **Auto Scaling group (ASG)** — Group of EC2 instances kept between min and max size from a launch template, across AZs. [chapter 26](/chapters/26-aws-auto-scaling/)
- **Availability Zone (AZ)** — One or more data centers inside a Region; a subnet and an instance each live in one AZ. [chapter 02](/chapters/02-architecting-foundations/)
- **AWS Backup** — Scheduled backups with cross-Region copies; used in DR plans. [chapter 53](/chapters/53-aws-disaster-recovery/)
- **AWS CDK** — Write infrastructure as code in a programming language; `cdk synth` makes a CloudFormation template. [chapter 42](/chapters/42-lab-13-infrastructure-as-code-aws-cdk/)
- **AWS Config** — Records resource configuration history. [chapter 28](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/)
- **AWS Glue** — Data service used with Athena and Lake Formation in the data lake lab. [chapter 16](/chapters/16-lab-06-build-a-data-lake-with-amazon-s3-and-aws-la/)
- **AWS Organizations** — Groups many accounts under a management account with OUs and consolidated billing. [chapter 52](/chapters/52-multi-account-strategy/)

## B

- **Backtrack** — Aurora MySQL in-place rewind of the database (max 72 h). [chapter 21](/chapters/21-aws-database-services-amazon-aurora/)
- **Backup and restore** — Cheapest DR strategy: restore from backups after a disaster; slowest recovery. [chapter 55](/chapters/55-lab-17-build-dr-site-on-aws-backup-and-restore-str/)
- **Bedrock Guardrails** — Bedrock safety controls for model input and output. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Bedrock Knowledge Bases** — Bedrock feature that implements RAG over your documents. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Blackhole route** — Route whose target was deleted, so matching traffic is dropped. [chapter 05](/chapters/05-networking-basic/)
- **Block Public Access** — S3 setting that prevents buckets from being made public. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **Blue/green deployment** — Run the new version (green) beside the old (blue), move traffic, and move it back if needed. [chapter 47](/chapters/47-lab-14-ci-cd-part-3-amazon-ecs-blue-green-deployme/)
- **Bucket (S3)** — Container for S3 objects; the name is global, the data sits in one Region. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **Bucket policy** — JSON resource policy on a bucket; works cross-account. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **Budgets** — Alerts when cost or usage crosses a threshold. [chapter 03](/chapters/03-create-and-setup-your-aws-account/)

## C

- **CIDR** — IP range notation for a VPC or subnet, such as /16; peered or attached VPCs must not overlap. [chapter 05](/chapters/05-networking-basic/)
- **Client VPN** — Managed OpenVPN service for individual users. [chapter 32](/chapters/32-aws-networking-services-hybrid-connections/)
- **CloudFormation** — Declarative IaC: a template creates a stack of resources and rolls back on failure. [chapter 41](/chapters/41-lab-13-infrastructure-as-code-aws-cloudformation/)
- **CloudFront** — CDN that caches content at edge locations; uses origins, behaviors, TTLs and OAC. [chapter 48](/chapters/48-aws-edge-services/)
- **CloudFront Functions** — Light code run on viewer events at the edge. [chapter 48](/chapters/48-aws-edge-services/)
- **CloudTrail** — Audit log of API calls; event history keeps 90 days of management events. [chapter 28](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/)
- **CloudTrail Lake** — SQL queries over CloudTrail events. [chapter 28](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/)
- **CloudWatch** — Metrics, logs, alarms and dashboards for monitoring. [chapter 28](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/)
- **CloudWatch agent** — Needed for memory and disk-used metrics on EC2 (namespace `CWAgent`). [chapter 28](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/)
- **CodeArtifact** — Private package repository for build dependencies. [chapter 43](/chapters/43-aws-devops-services/)
- **CodeBuild** — Builds and tests code, driven by `buildspec.yml`. [chapter 43](/chapters/43-aws-devops-services/)
- **CodeConnections** — Links pipelines to third-party Git providers. [chapter 43](/chapters/43-aws-devops-services/)
- **CodeDeploy** — Releases code to EC2/on-premises, Lambda or ECS, driven by `appspec.yml`. [chapter 43](/chapters/43-aws-devops-services/)
- **CodePipeline** — Orchestrates a pipeline: source, build, test, approval, deploy. [chapter 43](/chapters/43-aws-devops-services/)
- **Cognito** — User sign-in service; a WAF and API Gateway integration point. [chapter 39](/chapters/39-aws-security-services/)
- **Cold start** — Lambda Init phase delay on a new environment; reduce with smaller packages or provisioned concurrency. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **Compute Optimizer** — Rightsizing recommendations (opt-in). [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **Control Tower** — Landing zone with guardrail controls and Account Factory for multi-account setups. [chapter 52](/chapters/52-multi-account-strategy/)
- **Cooldown** — Wait after a simple scaling action (default 300 s). [chapter 26](/chapters/26-aws-auto-scaling/)
- **Cost Explorer** — Charts of your spending. [chapter 03](/chapters/03-create-and-setup-your-aws-account/)
- **Cross-account role** — Role in the target account plus trust policy and AssumeRole. [chapter 52](/chapters/52-multi-account-strategy/)
- **Customer gateway** — Customer-side device or definition at the end of a Site-to-Site VPN. [chapter 32](/chapters/32-aws-networking-services-hybrid-connections/)

## D

- **Dead-letter queue (DLQ)** — SQS queue for messages that fail too often, set by a redrive policy and `maxReceiveCount`. [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **Dedicated Host** — Physical server for licence and compliance needs; billed per host. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **Dedicated Instance** — EC2 instance with hardware isolation; billed per instance. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **Direct Connect** — Dedicated private link to AWS using virtual interfaces; private but not encrypted by default. [chapter 32](/chapters/32-aws-networking-services-hybrid-connections/)
- **Direct Connect gateway** — One virtual interface reaching VPCs in many Regions. [chapter 32](/chapters/32-aws-networking-services-hybrid-connections/)
- **DMS (Database Migration Service)** — Moves data with full load and/or CDC while the source stays online. [chapter 24](/chapters/24-aws-database-caching-and-migration/)
- **DocumentDB** — Document database. [chapter 19](/chapters/19-aws-database-services-intro/)
- **DynamoDB** — Key-value NoSQL database; items up to 400 KB, keyed by partition key or partition plus sort key. [chapter 23](/chapters/23-aws-database-services-amazon-dynamodb/)
- **DynamoDB Accelerator (DAX)** — Cache for microsecond DynamoDB reads. [chapter 23](/chapters/23-aws-database-services-amazon-dynamodb/)
- **DynamoDB global tables** — Multi-Region active-active DynamoDB tables. [chapter 23](/chapters/23-aws-database-services-amazon-dynamodb/)
- **DynamoDB Streams** — 24-hour log of item changes. [chapter 23](/chapters/23-aws-database-services-amazon-dynamodb/)

## E

- **EBS (Elastic Block Store)** — Network disk for one EC2 instance; lives in one AZ and survives stop. [chapter 10](/chapters/10-aws-storage-services-aws-ebs/)
- **EBS Multi-Attach** — io2 feature to attach one volume to up to 16 Nitro instances in the same AZ. [chapter 10](/chapters/10-aws-storage-services-aws-ebs/)
- **EBS snapshot** — Incremental, Region-scoped backup of a volume; copy it to move across AZs or Regions. [chapter 10](/chapters/10-aws-storage-services-aws-ebs/)
- **EC2 (Elastic Compute Cloud)** — Virtual servers (instances) rented in a Region. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **ECR (Elastic Container Registry)** — Stores container images. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **ECS (Elastic Container Service)** — Simpler, AWS-native container scheduler. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **Edge location** — Site that caches content near users. [chapter 02](/chapters/02-architecting-foundations/)
- **EFS (Elastic File System)** — Shared NFS file system for Linux; grows and shrinks automatically; mount target per AZ. [chapter 12](/chapters/12-aws-storage-services-amazon-efs-and-fsx/)
- **EKS (Elastic Kubernetes Service)** — Kubernetes-based container scheduler. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **Elastic Beanstalk** — Upload code and AWS runs EC2, load balancer and scaling. [chapter 40](/chapters/40-aws-operation-services-iac/)
- **Elastic Disaster Recovery** — Continuous server replication with drills and failback. [chapter 53](/chapters/53-aws-disaster-recovery/)
- **Elastic IP** — Static public IPv4 address; public IPv4 addresses are billed. [chapter 05](/chapters/05-networking-basic/)
- **ElastiCache** — In-memory cache in front of a database; engines Valkey, Redis OSS, Memcached. [chapter 24](/chapters/24-aws-database-caching-and-migration/)
- **ELB (Elastic Load Balancing)** — Family of ALB, NLB and GWLB load balancers; billed by hours plus LCUs. [chapter 26](/chapters/26-aws-auto-scaling/)
- **EventBridge** — Event bus with rules (event patterns) and targets; routes by content. [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **EventBridge Scheduler** — Runs targets on a schedule. [chapter 38](/chapters/38-lab-12-automation-with-amazon-eventbridge-schedule/)

## F

- **Fan-out** — One SNS topic delivering a message to many SQS queues. [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **Fargate** — Runs containers without managing servers. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **FIFO queue** — SQS queue with ordering per group and dedup in 5 minutes; name ends `.fifo`. [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **FSx** — Managed file systems: Windows (SMB + AD), Lustre, ONTAP, OpenZFS. [chapter 12](/chapters/12-aws-storage-services-amazon-efs-and-fsx/)
- **Function URL** — Built-in HTTPS endpoint for a Lambda function, `AWS_IAM` or `NONE` auth. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)

## G

- **Gateway endpoint** — Free VPC endpoint for S3 and DynamoDB, added through route tables. [chapter 29](/chapters/29-aws-networking-services-vpc-endpoints/)
- **Glacier** — Colder S3 classes (Instant, Flexible, Deep Archive): cheaper storage, retrieval fee, minimum duration. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **Global Accelerator** — Static anycast IPs and TCP/UDP routing to endpoints; no cache. [chapter 48](/chapters/48-aws-edge-services/)
- **GP3** — Default EBS SSD type with 3,000 IOPS and 125 MiB/s included. [chapter 10](/chapters/10-aws-storage-services-aws-ebs/)
- **GuardDuty** — Security threat-detection service. [chapter 39](/chapters/39-aws-security-services/)
- **GWLB (Gateway Load Balancer)** — Layer 3 load balancer using GENEVE, for firewalls and appliances. [chapter 26](/chapters/26-aws-auto-scaling/)

## H

- **Health check (Route 53)** — Endpoint, calculated or CloudWatch-alarm check used for DNS failover. [chapter 48](/chapters/48-aws-edge-services/)
- **High availability (HA)** — Surviving small failures, for example with Multi-AZ. [chapter 53](/chapters/53-aws-disaster-recovery/)
- **Horizontal scaling** — Add more instances; vertical scaling makes one bigger and needs a restart. [chapter 26](/chapters/26-aws-auto-scaling/)
- **Hosted zone** — Route 53 container of records for a domain. [chapter 48](/chapters/48-aws-edge-services/)

## I

- **IAM** — Decides who may call an AWS API and what they may do; global. [chapter 04](/chapters/04-aws-identity-and-access-management-iam/)
- **IAM group** — Collection of users; not a principal. [chapter 04](/chapters/04-aws-identity-and-access-management-iam/)
- **IAM policy** — JSON of Effect, Action, Resource and optional Condition; explicit Deny beats Allow. [chapter 04](/chapters/04-aws-identity-and-access-management-iam/)
- **IAM role** — Identity with temporary STS credentials, assumed by users, services or accounts. [chapter 04](/chapters/04-aws-identity-and-access-management-iam/)
- **IAM user** — Identity with long-term keys. [chapter 04](/chapters/04-aws-identity-and-access-management-iam/)
- **Identity Center** — Permission sets giving people access across accounts. [chapter 52](/chapters/52-multi-account-strategy/)
- **Inspector** — Security service for vulnerability scanning. [chapter 39](/chapters/39-aws-security-services/)
- **Instance refresh** — Rolling update of an ASG to a new launch template. [chapter 26](/chapters/26-aws-auto-scaling/)
- **Instance store** — Temporary disk lost on stop and terminate. [chapter 10](/chapters/10-aws-storage-services-aws-ebs/)
- **Instance type** — Size and family of an EC2 instance, such as m7g.large. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **Interface endpoint** — VPC endpoint using an ENI and private IP; billed hourly plus per GB. [chapter 29](/chapters/29-aws-networking-services-vpc-endpoints/)
- **Internet gateway (IGW)** — Gateway giving a VPC a route to the internet. [chapter 05](/chapters/05-networking-basic/)

## K

- **KMS (Key Management Service)** — Encrypts data at rest; keys are AWS owned, AWS managed or customer managed. [chapter 39](/chapters/39-aws-security-services/)

## L

- **Lake Formation** — Service for building and governing a data lake on S3. [chapter 16](/chapters/16-lab-06-build-a-data-lake-with-amazon-s3-and-aws-la/)
- **Lambda** — Runs your code on events with no servers; pay per request and GB-second. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **Lambda layer** — Shared package unpacked into `/opt`; up to five per function. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **Lambda@Edge** — Heavier edge code on viewer and origin events. [chapter 48](/chapters/48-aws-edge-services/)
- **Launch template** — Versioned definition of how to launch EC2 instances. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **Lazy loading** — Cache pattern: read, miss, load from DB, fill cache. [chapter 24](/chapters/24-aws-database-caching-and-migration/)
- **Lifecycle hook** — ASG pause points `Pending:Wait` and `Terminating:Wait`. [chapter 26](/chapters/26-aws-auto-scaling/)
- **Lifecycle policy (S3)** — Rule that transitions or expires objects. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **Local Zone** — Your compute placed near a city. [chapter 48](/chapters/48-aws-edge-services/)

## M

- **Macie** — Security service for sensitive data in S3. [chapter 39](/chapters/39-aws-security-services/)
- **Memcached** — Simple, multithreaded cache engine. [chapter 24](/chapters/24-aws-database-caching-and-migration/)
- **Mount target** — EFS network endpoint, one per AZ, port 2049. [chapter 12](/chapters/12-aws-storage-services-amazon-efs-and-fsx/)
- **Mountpoint for S3** — Client (`mount-s3`) that mounts a bucket; no locking. [chapter 18](/chapters/18-amazon-s3-files-new/)
- **Multi-AZ** — Standby in another AZ with automatic failover for high availability. [chapter 20](/chapters/20-aws-database-services-amazon-rds/)
- **Multi-AZ DB cluster** — One writer plus two readable standbys across 3 AZs. [chapter 20](/chapters/20-aws-database-services-amazon-rds/)
- **Multipart upload** — Upload an S3 object in parts; use from about 100 MB. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)

## N

- **NACL (network ACL)** — Stateless allow and deny rules, numbered, on a subnet; needs ephemeral ports. [chapter 05](/chapters/05-networking-basic/)
- **NAT gateway** — Outbound-only internet access for private subnets; sits in a public subnet. [chapter 05](/chapters/05-networking-basic/)
- **Neptune** — Graph database. [chapter 19](/chapters/19-aws-database-services-intro/)
- **NLB (Network Load Balancer)** — Layer 4 (TCP/UDP) load balancer with fixed IPs. [chapter 26](/chapters/26-aws-auto-scaling/)

## O

- **OAC (Origin Access Control)** — Lets CloudFront reach a private S3 origin. [chapter 48](/chapters/48-aws-edge-services/)
- **Object (S3)** — A file plus metadata stored under a flat key. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **OLAP** — Big analytic queries, e.g. Redshift. [chapter 19](/chapters/19-aws-database-services-intro/)
- **OLTP** — Many small transactions. [chapter 19](/chapters/19-aws-database-services-intro/)
- **On-Demand** — Pay-as-you-go EC2 purchase option. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **OU (organizational unit)** — Group of accounts inside Organizations. [chapter 52](/chapters/52-multi-account-strategy/)
- **Outposts** — AWS rack installed in your site. [chapter 48](/chapters/48-aws-edge-services/)

## P

- **Parameter group** — Database settings; static need a reboot, defaults cannot be edited. [chapter 20](/chapters/20-aws-database-services-amazon-rds/)
- **Pilot light** — DR strategy with data on and servers off. [chapter 56](/chapters/56-lab-17-build-dr-site-on-aws-pilot-light/)
- **Point-in-time recovery (PITR)** — Restore to a chosen moment into a new database or table. [chapter 23](/chapters/23-aws-database-services-amazon-dynamodb/)
- **Predictive scaling** — Scaling for recurring cycles, plus a dynamic policy. [chapter 26](/chapters/26-aws-auto-scaling/)
- **Presigned URL** — Temporary S3 access link. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **PrivateLink** — Private one-way access to a single service via interface endpoint; overlapping CIDRs are fine. [chapter 33](/chapters/33-aws-networking-services-aws-privatelink/)
- **Provisioned concurrency** — Pre-warmed Lambda capacity; paid. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)

## R

- **RAG (retrieval-augmented generation)** — Embed the question, retrieve chunks, prompt the model with them. [chapter 51](/chapters/51-lab-16-build-rag-system-with-amazon-bedrock/)
- **RDS (Relational Database Service)** — Managed SQL: no OS access, AWS runs patches, backups and failover. [chapter 20](/chapters/20-aws-database-services-amazon-rds/)
- **RDS Proxy** — Pools connections (useful for Lambda); supports IAM and Secrets Manager. [chapter 20](/chapters/20-aws-database-services-amazon-rds/)
- **Read replica** — Asynchronous copy for scaling reads, promoted manually. [chapter 20](/chapters/20-aws-database-services-amazon-rds/)
- **Redshift** — Data warehouse for OLAP. [chapter 19](/chapters/19-aws-database-services-intro/)
- **Region** — Geographic area containing AZs; chosen for compliance, services, latency and cost. [chapter 02](/chapters/02-architecting-foundations/)
- **Reserved concurrency** — Lambda guarantee and cap; free. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)
- **Reserved Instance** — 1 or 3 year commitment purchase option. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **Root user** — Email and password owner of the account; enable MFA, no access keys. [chapter 03](/chapters/03-create-and-setup-your-aws-account/)
- **Route 53** — DNS service with routing policies and health checks. [chapter 48](/chapters/48-aws-edge-services/)
- **Route 53 failover** — Health check plus primary/secondary records. [chapter 53](/chapters/53-aws-disaster-recovery/)
- **RPO** — Recovery point objective: how much data you can lose. [chapter 53](/chapters/53-aws-disaster-recovery/)
- **RTO** — Recovery time objective: how long you can be down. [chapter 53](/chapters/53-aws-disaster-recovery/)

## S

- **S3 (Simple Storage Service)** — Object storage in buckets; unlimited size, 48.8 TiB per object. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **S3 Files** — Shared file system view of an S3 bucket, built on EFS. [chapter 18](/chapters/18-amazon-s3-files-new/)
- **S3 Intelligent-Tiering** — S3 class that moves objects between tiers. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **S3 replication (SRR/CRR)** — Async copy of new objects to another bucket; versioning required on both. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **S3 Transfer Acceleration** — Faster uploads through edge locations. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **S3 Vectors** — S3 feature for vectors; index settings fixed after creation. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **SageMaker AI** — Build, train and deploy your own models; renamed Dec 2024. [chapter 50](/chapters/50-aws-ml-ai-services/)
- **Savings Plans** — Commitment-based EC2 pricing option. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **Scheduled scaling** — Scaling at known peak times. [chapter 26](/chapters/26-aws-auto-scaling/)
- **SCP (service control policy)** — Maximum permissions for accounts; never grants. [chapter 52](/chapters/52-multi-account-strategy/)
- **Secrets Manager** — Stores secrets; usable with RDS Proxy. [chapter 20](/chapters/20-aws-database-services-amazon-rds/)
- **Security group** — Stateful, allow-only firewall on the network interface. [chapter 05](/chapters/05-networking-basic/)
- **Shield** — DDoS protection; Standard is free, Advanced is paid. [chapter 39](/chapters/39-aws-security-services/)
- **Site-to-Site VPN** — Encrypted tunnels using VGW or TGW, customer gateway and 2 tunnels. [chapter 32](/chapters/32-aws-networking-services-hybrid-connections/)
- **Snowball Edge** — Offline data transfer device. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **SNS (Simple Notification Service)** — Push topics with subscriptions, filter policies and fan-out. [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **Spot** — Cheap EC2 capacity with a 2-minute interruption warning. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)
- **SQS (Simple Queue Service)** — Pull queue storing messages up to 14 days; Standard or FIFO. [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **Stage (API Gateway)** — Named deployment of an API. [chapter 35](/chapters/35-aws-serverless-services-lambda-and-dynamodb-and-ap/)
- **Step Functions** — Workflow service covered with messaging services. [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **Storage Gateway** — Local file, volume or tape access backed by AWS. [chapter 34](/chapters/34-aws-data-transfer/)
- **Subnet** — Slice of a VPC IP range in one AZ; AWS reserves 5 IPs. [chapter 05](/chapters/05-networking-basic/)
- **Systems Manager Session Manager** — Shell access with no inbound port; preferred over bastion hosts. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)

## T

- **Target tracking** — Scaling policy that holds a metric near a target; default for web apps. [chapter 26](/chapters/26-aws-auto-scaling/)
- **Throttling** — API Gateway returns 429 when a request limit is exceeded. [chapter 35](/chapters/35-aws-serverless-services-lambda-and-dynamodb-and-ap/)
- **Transfer Family** — Managed SFTP in front of AWS storage. [chapter 34](/chapters/34-aws-data-transfer/)
- **Transit Gateway (TGW)** — Regional hub router connecting VPCs, VPN and Direct Connect. [chapter 31](/chapters/31-aws-networking-services-aws-transit-gateway/)
- **Trusted Advisor** — Best-practice checks. [chapter 08](/chapters/08-aws-computes-aws-lambda-and-containers/)

## U

- **User data** — Boot script that runs on first boot by default. [chapter 06](/chapters/06-aws-compute-services-amazon-ec2/)

## V

- **Valkey** — Redis-compatible cache engine. [chapter 24](/chapters/24-aws-database-caching-and-migration/)
- **Versioning (S3)** — Keeps old object versions; deletes add a delete marker. [chapter 14](/chapters/14-aws-storage-services-amazon-s3/)
- **Visibility timeout** — SQS time a received message is hidden from other consumers (default 30 s). [chapter 37](/chapters/37-aws-serverless-services-messaging-services/)
- **VPC (Virtual Private Cloud)** — Your private network in one Region with subnets, route tables and gateways. [chapter 05](/chapters/05-networking-basic/)
- **VPC endpoint** — Private path to AWS services without the internet. [chapter 29](/chapters/29-aws-networking-services-vpc-endpoints/)
- **VPC peering** — Private 1:1 link between two VPCs; no transitive routing. [chapter 30](/chapters/30-aws-networking-services-vpc-peering/)

## W

- **WAF** — Layer 7 firewall using web ACLs and rules. [chapter 39](/chapters/39-aws-security-services/)
- **Warm standby** — DR strategy with a small full copy running. [chapter 57](/chapters/57-lab-17-build-dr-site-on-aws-warm-standby-strategy/)
- **Well-Architected pillars** — Six: operational excellence, security, reliability, performance efficiency, cost optimization, sustainability. [chapter 02](/chapters/02-architecting-foundations/)
- **Write-through** — Cache pattern: write to DB and cache together. [chapter 24](/chapters/24-aws-database-caching-and-migration/)

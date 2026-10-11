---
section: 59
title: "CAPSTONE PROJECT"
part: "Capstone & Exam Prep"
kind: intro
status: done
readingTime: 7
lectures: ["Github Intro","Github Repo","VPC Setup","Create Data Layer with Amazon Aurora & DynamoDB & S3","Configure AWS Secret Manager for Aurora","Launch Application","Configure Products Table on Aurora PostgeSQL","Fix Secret Manager Issue","Fix S3 Endpoint Connection & Permissions Issue","Fix DynamoDB & EFS Connection Issue","Using Amazon Route 53 with Custom Domain","Configure SSL/TLS with AWS Certificate Manager","Configure HTTPS Redirection","Configure ASG","Configure Aurora High Availability","Clean Up!"]
quiz:
  - question: "Your app on EC2 in private subnets cannot read an S3 bucket, and there is no NAT gateway. What is the cheapest fix that keeps traffic inside AWS?"
    options:
      - "Add a gateway endpoint for S3 and a route to it in the private route tables"
      - "Give each instance a public IP"
      - "Move the instances to a public subnet"
    answer: 0
    explanation: "A gateway endpoint adds a prefix-list route so private subnets reach S3 without internet or NAT. Public IPs break the private design and still need an internet route."
  - question: "The app must stop storing the Aurora password in its config file. Which approach fits the capstone?"
    options:
      - "Put the password in an EC2 user-data script"
      - "Let Aurora manage the password in Secrets Manager and give the instance role permission to read the secret"
      - "Store the password in an S3 object"
    answer: 1
    explanation: "Secrets Manager holds and can rotate the credential, and the IAM role controls who reads it. User data and S3 objects are plain storage with no rotation."
  - question: "Users type http://shop.example.com and must end up on HTTPS. Where do you configure this?"
    options:
      - "In the Auto Scaling group"
      - "In Route 53 with a second alias record"
      - "On the ALB: an HTTPS listener with an ACM certificate plus an HTTP listener that redirects to 443"
    answer: 2
    explanation: "The ALB terminates TLS with the ACM certificate and its port 80 listener can return a redirect to 443. Route 53 only resolves names; it does not change the protocol."
---

## What it is

The capstone assembles the whole course into one three-tier app: a web app on EC2 behind a load balancer, with Aurora PostgreSQL, DynamoDB, S3 and EFS as data stores. Then it hardens it with a custom domain, HTTPS, Auto Scaling and a multi-AZ database. You build it stage by stage and fix the permission and connection errors you hit on the way.

> Inferred from the lecture titles only (no lecture content available). The exact app and repo are in the lectures "Github Intro" and "Github Repo"; treat the shapes below as the likely design, not a copy of the course.

```mermaid
flowchart TB
  U["👤 User"] --> R53["🌐 Route 53"]
  R53 --> ALB["⚖️ ALB<br/>HTTPS + ACM cert"]
  subgraph VPC["☁️ VPC, 2 AZs"]
    ALB --> ASG["🖥️ ASG: EC2 app"]
    ASG --> AUR[("🗄️ Aurora PostgreSQL<br/>writer + replica")]
    ASG --> EFS["📁 EFS"]
    ASG -.-> EP["🔌 Gateway endpoints"]
  end
  EP --> S3["🪣 S3"]
  EP --> DDB[("⚡ DynamoDB")]
  ASG -.-> SM["🔒 Secrets Manager"]
  ASG -.-> ROLE["🪪 IAM instance role"]
```
*Public edge (DNS, ALB), private app tier, and four data stores reached with an IAM role.*

Use this chapter when: you want a portfolio project that shows VPC, compute, data, security and HA in one place.

## Key concepts

### Build order

```mermaid
flowchart LR
  A["1 Repo"] --> B["2 VPC"] --> C["3 Data layer"] --> D["4 Secret"] --> E["5 Launch app"] --> F["6 Fix issues"] --> G["7 Domain + HTTPS"] --> H["8 ASG + HA"] --> I["9 Clean up"]
```
*Each stage works on its own; do not skip ahead until the previous one is verified.*

| # | Stage (lecture) | What you do | Revisit |
|---|---|---|---|
| 1 | GitHub intro and repo | Clone the sample app; read how it reads config (DB, bucket, table, mount) | [CI/CD services](/chapters/43-aws-devops-services/) |
| 2 | VPC setup | Public subnets for ALB, private for app and DB, across 2 AZs; route tables and security groups | [Networking basics](/chapters/05-networking-basic/), [VPC endpoints](/chapters/29-aws-networking-services-vpc-endpoints/) |
| 3 | Data layer: Aurora, DynamoDB, S3 | Create the Aurora cluster, a DynamoDB table and an S3 bucket | [Aurora](/chapters/21-aws-database-services-amazon-aurora/), [DynamoDB](/chapters/23-aws-database-services-amazon-dynamodb/), [S3](/chapters/14-aws-storage-services-amazon-s3/) |
| 4 | Secrets Manager for Aurora | Store the DB credential as a secret; allow the app role to read it | [IAM](/chapters/04-aws-identity-and-access-management-iam/), [Security services](/chapters/39-aws-security-services/) |
| 5 | Launch application, products table | Launch EC2 with an instance profile; create the products table in PostgreSQL | [EC2](/chapters/06-aws-compute-services-amazon-ec2/), [Lab 08](/chapters/22-lab-08-build-a-single-application-with-amazon-ec2/) |
| 6 | Three fix lectures | Debug secret, S3 and DynamoDB/EFS access (see below) | [EFS and FSx](/chapters/12-aws-storage-services-amazon-efs-and-fsx/), [CloudWatch](/chapters/28-aws-monitoring-amazon-cloudwatch-and-aws-cloudtrai/) |
| 7 | Route 53, ACM, HTTPS redirect | Domain, certificate, 443 listener, 80 to 443 redirect | [Edge services](/chapters/48-aws-edge-services/) |
| 8 | ASG and Aurora HA | Launch template + ASG behind the ALB; add an Aurora replica in a second AZ | [Auto Scaling](/chapters/26-aws-auto-scaling/), [3-tier lab](/chapters/07-lab-01-build-first-3-tiers-web-application-on-amaz/) |
| 9 | Clean up | Delete in reverse order (see Cheat sheet) | [IaC](/chapters/40-aws-operation-services-iac/) |

### The "fix it" lectures

```mermaid
flowchart TD
  ERR["❌ App error"] --> Q{"Which service?"}
  Q -->|"Secret"| S1["Role lacks secretsmanager:GetSecretValue<br/>or wrong secret name/Region"]
  Q -->|"S3"| S2["No gateway endpoint route<br/>or role/bucket policy denies"]
  Q -->|"DynamoDB"| S3["No endpoint route or missing dynamodb:* on role"]
  Q -->|"EFS"| S4["Mount target SG must allow NFS 2049 from app SG"]
```
*Almost every capstone failure is one of: IAM permission, missing network path, or security group.*

- **Secret.** Aurora can generate and manage its master password in Secrets Manager; the app role needs permission to read that secret.
- **S3 and DynamoDB.** From private subnets you need either NAT or a gateway endpoint; gateway endpoints add a prefix-list route to each subnet route table. Check the role policy too.
- **EFS.** The EFS cause (security group port 2049) is inferred from the title, not verified in the docs here.
- **Debug habit.** Read the app log in CloudWatch, then check role, route, security group in that order.

### Domain, HTTPS and scaling

```mermaid
sequenceDiagram
  participant U as 👤 Browser
  participant D as 🌐 Route 53
  participant A as ⚖️ ALB
  participant E as 🖥️ EC2 (ASG)
  U->>D: shop.example.com?
  D-->>U: alias to ALB
  U->>A: HTTP :80
  A-->>U: 301 redirect to HTTPS
  U->>A: HTTPS :443 (ACM cert)
  A->>E: forward to healthy target
```
*TLS ends at the ALB; instances can stay on plain HTTP inside the VPC.*

- **Route 53.** Use an alias record pointing to the ALB; it also works for the zone apex.
- **ACM.** Request a public certificate (DNS validation is the usual route) and attach it to the HTTPS listener.
- **ASG.** Spread instances over 2 AZs, register to the ALB target group, scale on a metric.
- **Aurora HA.** Add a reader in another AZ so the cluster can fail over; the app keeps using the cluster endpoints.

## Cheat sheet

- Order: repo, VPC, data, secret, app, fixes, domain, HTTPS, ASG, Aurora HA, cleanup.
- Errors: IAM, then route/endpoint, then security group.
- ALB: 443 listener with ACM cert, 80 listener redirects to 443.
- Route 53 alias record to the ALB, not an IP.
- Cleanup order: ASG (set 0) and ALB, Route 53 records, Aurora instances then cluster (no final snapshot if unwanted), DynamoDB, S3 (empty first), EFS, endpoints, NAT/VPC, secret, ACM cert.
- Not verified here: exact app, instance sizes and cleanup order of the course.

## AWS docs

- [Password management with Aurora and Secrets Manager](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-secrets-manager.html)
- [Gateway endpoints for S3 and DynamoDB](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html)
- [Redirect HTTP to HTTPS on an ALB](https://repost.aws/knowledge-center/elb-redirect-http-to-https-using-alb)
- [Route 53 FAQs: alias to a load balancer](https://aws.amazon.com/route53/faqs/)

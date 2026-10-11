---
section: 48
title: "AWS Edge Services"
part: "Edge, AI & Multi-Account"
kind: concept
status: done
readingTime: 9
lectures: ["Intro","Amazon CloudFront Intro","Amazon CloudFront Demo","Price Class","Amazon CloudFront Pricing","AWS Local Zone - Vietnam","Service & Resource Types Supported by AWS Vietnam Local Zone","AWS Việt Nam Local Zone Highlights","Amazon CloudFront vs AWS Local Zone","AWS Outposts","Amazon Route 53 Intro","Register Domain with Route 53","Create Public Hosted Zone","Amazon Route 53 Pricing - Basic","Setup EC2 Instances Multi Regions Demo","Simple Routing Policy Demo","GeoLocation Routing Policy Demo","Latency Routing Policy Demo","Weighted Routing Policy Demo","Failover Routing Policy Demo","Route 53 Health Check","IP-based Routing Policy Demo","Multi-Values Routing Policy Demo","GeoProximity Routing Policy Demo","Clean Up!","Resources"]
quiz:
  - question: "Your static site lives in a private S3 bucket behind CloudFront. Users must reach files only through CloudFront, never the bucket URL. What do you configure?"
    options:
      - "Make the bucket public and hide the bucket name."
      - "An origin access control (OAC) on the S3 origin plus a bucket policy that allows the distribution."
      - "A Route 53 weighted record to the bucket."
    answer: 1
    explanation: "OAC makes CloudFront sign its requests to S3, and the bucket policy trusts only that distribution. A public bucket can be fetched directly, which defeats the goal."
  - question: "You deployed a new logo.png but viewers still see the old one for hours. What is the quickest fix and the better long-term habit?"
    options:
      - "Delete the distribution; use shorter DNS TTLs."
      - "Create an invalidation for the path; long term, use versioned file names or sensible Cache-Control."
      - "Enable a Route 53 health check."
    answer: 1
    explanation: "Invalidation expires cached copies at the edges (it takes a few minutes). Versioned names avoid the need and its cost. DNS TTL controls resolver caching, not CloudFront's object cache."
  - question: "You run an app in two Regions. Users should be sent to the Region with the lowest network delay, and unhealthy Regions must be skipped. Which Route 53 setup fits?"
    options:
      - "Simple record with two IP addresses."
      - "Latency records, one per Region, each with a health check."
      - "Geolocation record for 'Default' only."
    answer: 1
    explanation: "Latency routing picks the best Region and health checks remove failing ones. A simple record returns all values in random order and cannot use health checks."
  - question: "A partner firewall allows only two fixed IP addresses to reach your TCP service running behind load balancers in two Regions. What do you use?"
    options:
      - "CloudFront with a custom domain."
      - "AWS Global Accelerator, which gives static anycast IPs."
      - "A Route 53 alias record to each load balancer."
    answer: 1
    explanation: "Global Accelerator provides fixed entry IPs that stay while you change endpoints. Load balancer and CloudFront IPs can change, and CloudFront is aimed at HTTP content, not arbitrary TCP."
  - question: "You must make example.com (the zone apex) point to a CloudFront distribution. Which record works?"
    options:
      - "A CNAME record."
      - "An alias A record to the distribution."
      - "An MX record."
    answer: 1
    explanation: "DNS forbids a CNAME at the zone apex, but a Route 53 alias record can sit there. Alias queries to CloudFront are also not charged."
---

## What it is

"Edge" means serving users from places close to them instead of from one Region. Three services do the job: **Route 53** answers DNS questions, **CloudFront** caches content at edge locations, and **Global Accelerator** speeds up traffic to your apps over the AWS network.

```mermaid
flowchart LR
  U["👤 User"] --> R53["🧭 Route 53<br/>name to IP"]
  U --> CF["☁️ CloudFront<br/>edge cache"]
  U --> GA["🚀 Global Accelerator<br/>static anycast IPs"]
  CF -->|miss| O["🪣 Origin<br/>S3 / ALB / custom"]
  GA --> E["⚖️ ALB / NLB / EC2<br/>in 1+ Regions"]
  R53 -.points to.-> CF
  R53 -.points to.-> E
```

*Route 53 finds the door, CloudFront serves cached content, Global Accelerator speeds the road to your Regions.*

Use it when users are spread out, you need failover between Regions, or the same files are requested again and again.

## Key concepts

### DNS resolution and Route 53 basics (intro, domain, hosted zone, pricing)

A **hosted zone** is the container of DNS records for one domain. A **public** zone answers the internet; a private zone answers inside a VPC. Registering a domain in Route 53 (or transferring one) and creating a public zone gives you four name servers; set them at the registrar if the domain was bought elsewhere.

```mermaid
sequenceDiagram
  participant U as 👤 Browser
  participant RES as 🔎 Resolver (ISP / VPC)
  participant ROOT as 🌍 Root / TLD
  participant R53 as 🧭 Route 53 zone
  U->>RES: www.example.com?
  RES->>ROOT: who serves .com / example.com?
  ROOT-->>RES: Route 53 name servers
  RES->>R53: www.example.com?
  R53-->>RES: A 203.0.113.10 (TTL 60)
  RES-->>U: 203.0.113.10 (cached for TTL)
```

*The resolver does the walking and caches the answer for the record's TTL.*

| Record | Maps | Note |
|---|---|---|
| A / AAAA | name to IPv4 / IPv6 | most common |
| CNAME | name to another name | not allowed at the zone apex |
| MX / TXT | mail routing / text (verification) | |
| NS / SOA | zone's name servers / zone info | created automatically |
| **Alias** | name to an AWS resource | Route 53 only; works at the apex; no charge for queries to some AWS targets such as CloudFront |

- Alias targets include CloudFront, load balancers, API Gateway, Elastic Beanstalk, S3 static websites, Global Accelerator and VPC interface endpoints.
- Pricing is per hosted zone per month plus per million queries, plus health checks and domain registration. Check the current pricing page.

### Routing policies and health checks (all the policy demos)

Every record has a routing policy. The decision flow:

```mermaid
flowchart TD
  S["What do you need?"] --> A{"One resource,<br/>no health check?"}
  A -->|yes| SIMPLE["Simple"]
  A -->|no| B{"Active-passive<br/>failover?"}
  B -->|yes| FAIL["Failover + health check"]
  B -->|no| C{"Split by %?"}
  C -->|yes| W["Weighted"]
  C -->|no| D{"Decide by what?"}
  D -->|"fastest Region"| L["Latency"]
  D -->|"user country / continent"| G["Geolocation"]
  D -->|"distance to resources, with bias"| GP["Geoproximity"]
  D -->|"client IP range (CIDR)"| IP["IP-based"]
  D -->|"up to 8 healthy answers"| MV["Multivalue answer"]
```

*Pick the policy by the question you are answering, then add health checks where failure matters.*

- **Simple**: standard DNS; one record can hold several values, returned in random order. No health check.
- **Weighted**: send, say, 10 percent to a new version. Weight 0 stops traffic to a record.
- **Latency**: resources must be in AWS Regions; picks the lowest-latency Region.
- **Geolocation**: by user location. Add a **Default** record for users who match nothing.
- **Geoproximity**: by distance between user and resource; a bias shifts traffic toward or away from a location.
- **IP-based**: by the client's CIDR block, for example send a known ISP to a given endpoint.
- **Multivalue**: up to eight healthy records at random; client-side load spreading, not a load balancer.

**Health checks** are Route 53 probes from outside. Types: HTTP/HTTPS, with optional string match on the first 5,120 bytes, TCP, CloudWatch alarm based, and calculated (combines other checks). For private resources, use the CloudWatch alarm type because probes come from the internet.

```mermaid
stateDiagram-v2
  [*] --> Primary
  Primary --> Secondary: primary health check fails
  Secondary --> Primary: primary healthy again
```

*Failover: a primary record and a secondary record; Route 53 answers with the secondary only while the primary is unhealthy.*

Demo recipe used in the course: launch EC2 web servers in two or more Regions (each page shows its Region), create records with each policy, then test with `dig` or `nslookup`.

```bash
dig +short app.example.com
```

Keep TTL low (about 60 seconds) on failover records, because clients cache answers for the TTL.

### CloudFront (intro, demo, price class, pricing)

CloudFront is a content delivery network. A **distribution** has **origins** (S3, ALB, any HTTP server) and **cache behaviors** that match path patterns.

```mermaid
sequenceDiagram
  participant U as 👤 Viewer
  participant E as ☁️ Edge location
  participant O as 🪣 Origin
  U->>E: GET /logo.png
  alt cache hit
    E-->>U: cached object
  else cache miss
    E->>O: GET /logo.png (signed by OAC)
    O-->>E: object + Cache-Control
    E-->>U: object (cached for TTL)
  end
```

*Hits are served at the edge; only misses travel to the origin.*

- **TTL**: the origin's `Cache-Control: max-age` wins within the behavior's Minimum and Maximum TTL. With no header, the Default TTL applies (24 hours if no cache policy is used).
- **Invalidation**: forces objects out of the cache (`/images/*` counts as one path). It takes minutes and extra paths beyond a monthly free amount are billed. Prefer **versioned file names**.
- **OAC (origin access control)**: keeps the S3 bucket private; CloudFront signs requests and the bucket policy allows only your distribution. Use the S3 REST endpoint, not the website endpoint. OAC replaces the legacy OAI.
- **Signed URLs / cookies**: private content. A URL grants one file; cookies grant many files under a path. Sign with a key pair in a trusted key group.
- **Edge code**: **CloudFront Functions** are tiny JavaScript functions on viewer request/response (redirects, header edits, cache-key tweaks, JWT checks). **Lambda@Edge** runs Node.js or Python on viewer and origin events for heavier work such as network calls or third-party libraries.
- **Price class**: by default all edge locations serve you. A cheaper class limits which Regions' edges are used; users outside them may see higher latency. Check the pricing page for what each class contains.
- **Pricing**: mainly data transfer out and request counts by Region, plus invalidation and edge-function charges. Check the current pricing page, including any flat-rate plans.
- HTTPS on a custom domain needs an ACM certificate in us-east-1.

### Local Zones and Outposts (Vietnam Local Zone lectures)

```mermaid
flowchart LR
  REG["🏢 AWS Region"] --- LZ["📍 Local Zone<br/>in a metro, AWS-owned"]
  REG --- OP["🖥️ Outposts rack<br/>in your data center"]
  CF2["☁️ CloudFront edge<br/>cache only"] -.static content.-> USER["👤 Users"]
  LZ -->|run compute near| USER
```

*Local Zone and Outposts run your compute; CloudFront only caches content.*

- **Local Zone**: an extension of a parent Region near a big city. You opt in, create a subnet in it, and launch supported resources (compute, storage, some databases) for low latency. It uses normal VPC rules and connects to the Region over AWS's network.
- **Local Zone service and resource support** is a short list, not every service. Check the Local Zones docs for the exact list for Vietnam (Hanoi or Ho Chi Minh City) and its current status.
- **Outposts**: AWS-built racks in your own site, managed by AWS, for workloads that must stay on-premises (latency, data residency). You handle facility, power and connectivity.
- **CloudFront vs Local Zone**: CloudFront caches and delivers content (static files, video, accelerated APIs). A Local Zone runs your servers or databases near users. Many designs use both.

## X vs Y

### Route 53 routing policies

| Policy | Decides by | Health check | Typical use |
|---|---|---|---|
| Simple | nothing | no | one server |
| Weighted | your percentages | yes | canary, A/B |
| Latency | lowest latency Region | yes | multi-Region app |
| Geolocation | user country/continent | yes | content law, language |
| Geoproximity | distance + bias | yes | shift load between sites |
| IP-based | client CIDR | yes | known ISP or network |
| Failover | primary health | required for primary | active-passive DR |
| Multivalue | random healthy set | yes | simple spreading |

Pick **Latency** for speed, **Geolocation** for rules about where users are, **Weighted** for gradual rollouts, **Failover** for a standby.

### CloudFront vs Global Accelerator

| | CloudFront | Global Accelerator |
|---|---|---|
| Job | Cache and deliver content | Route traffic over AWS backbone |
| Protocols | HTTP/HTTPS (and WebSocket) | TCP and UDP |
| Caching | Yes | No |
| Entry point | Domain name (IPs vary) | Two static anycast IPv4 addresses (plus two IPv6 if dual-stack) |
| Endpoints | S3, ALB, custom origins | ALB, NLB, EC2, Elastic IP |
| Failover | Origin groups | Health-based between endpoints and Regions |

Pick **CloudFront** when content is cacheable or you need edge code and signed URLs. Pick **Global Accelerator** when you need fixed IPs, non-HTTP traffic, or fast failover without waiting for DNS TTLs.

## Job notes

- Put the S3 bucket behind CloudFront with OAC and keep Block Public Access on. See [S3](/chapters/14-aws-storage-services-amazon-s3/).
- Point `example.com` to CloudFront with an alias A record, not a CNAME.
- Cache bug after deploy: use versioned file names; invalidate only when you must.
- Failover not happening: check health check status, that the record has the health check attached, and the TTL.
- Health checks cannot reach private IPs; use a CloudWatch alarm based check.
- Cost traps: invalidating many paths, high-volume DNS queries on non-alias records, forgotten health checks and hosted zones.
- Clean up: delete records (not the default NS/SOA), hosted zones, health checks, disable then delete the distribution, terminate EC2 test servers, release Elastic IPs.

```mermaid
flowchart LR
  D["Deploy new files"] --> V{"Versioned names?"}
  V -->|yes| OK["Done: new URL"]
  V -->|no| I["Invalidate paths"] --> OK2["Wait a few minutes"]
```

*Versioning beats invalidating.*

## Cheat sheet

- Hosted zone = records of a domain; alias = Route 53 record to an AWS resource, works at the apex.
- Policies: simple, weighted, latency, geolocation, geoproximity, IP-based, failover, multivalue.
- Health checks: endpoint, calculated, CloudWatch alarm.
- CloudFront: distribution, origin, behavior, TTL, OAC, signed URL/cookie, invalidation.
- CloudFront Functions: light, viewer events. Lambda@Edge: heavier, viewer and origin events.
- Price class limits edge locations to lower cost.
- Global Accelerator: static anycast IPs, TCP/UDP, no cache.
- Local Zone: your compute near a city. Outposts: AWS rack in your site.
- For prices and quotas, check the current pricing and quota pages.

## AWS docs

- [Choosing a routing policy](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html)
- [Choosing between alias and non-alias records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html)
- [Types of Route 53 health checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-types.html)
- [Restrict access to an S3 origin (OAC)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront Functions vs Lambda@Edge](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-choosing.html)

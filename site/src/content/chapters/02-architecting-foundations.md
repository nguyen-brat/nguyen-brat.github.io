---
section: 2
title: "Architecting Foundations"
part: "Getting Started"
kind: concept
status: done
readingTime: 7
lectures: ["What is AWS?","AWS's approach to build systems","Why Cloud?","Successful Solution Architect","AWS Global Infrastructure","How to Select AWS Region","Resources"]
quiz:
  - question: "Your app runs in one Availability Zone and that AZ has an outage. What is the best fix?"
    options:
      - "Run the app in two or more AZs in the same Region"
      - "Move the app to an edge location"
      - "Buy a bigger instance"
      - "Move to another account"
    answer: 0
    explanation: >-
      Correct: AZs are isolated from each other, so spreading across AZs survives one AZ failing. Edge locations only cache content and do not run your servers.
  - question: "A law says customer data must stay in Germany. What decides your Region first?"
    options:
      - "Lowest price"
      - "Compliance and data residency"
      - "Number of edge locations"
      - "The newest service being available"
    answer: 1
    explanation: >-
      Correct: compliance is a hard requirement, so you filter Regions by it before comparing cost or latency. Price is only compared among Regions that already pass.
  - question: "Which Well-Architected pillar is about recovering from failures?"
    options:
      - "Cost optimization"
      - "Sustainability"
      - "Reliability"
      - "Performance efficiency"
    answer: 2
    explanation: >-
      Correct: Reliability covers recovering from disruptions and performing correctly when expected. Performance efficiency is about using resources well, not recovery.
  - question: "Why is the cloud called pay-as-you-go cheaper to start than a data center?"
    options:
      - "No upfront hardware purchase; you rent capacity and stop paying when you delete it"
      - "AWS never charges for storage"
      - "Prices are identical in every Region"
      - "You must sign a 3-year contract"
    answer: 0
    explanation: >-
      Correct: you trade big upfront capital cost for usage-based cost. Prices differ by Region and there is no required long contract, so those options are wrong.
  - question: "Users in Asia see slow page loads from a site hosted in us-east-1. Cheapest first step?"
    options:
      - "Rewrite the app"
      - "Put CloudFront (edge locations) in front to cache content near users"
      - "Move the database to another account"
      - "Disable encryption"
    answer: 1
    explanation: >-
      Correct: CloudFront caches content at edge locations close to users, cutting latency without moving the app. Rewriting is costly and does not fix distance.
---

## What it is

AWS is a rented set of computing, storage, database and network services that you use over the internet and pay for by usage. You build systems from these services instead of buying servers. An architect chooses the services and how they connect.

```mermaid
flowchart LR
  U[👤 Users] --> A[☁️ AWS services]
  A --> C[🖥️ Compute]
  A --> S[🪣 Storage]
  A --> D[🗄️ Database]
  A --> N[🌐 Network]
```
*You rent building blocks and combine them.*

Use it when you want to launch fast, scale up or down, and avoid buying hardware.

## Key concepts

### Why cloud

| Data center | AWS |
|---|---|
| Buy hardware upfront | Pay as you go |
| Guess capacity | Scale on demand |
| Weeks to get a server | Minutes |
| You run the buildings | AWS runs the buildings |

- You still own what you put on AWS (configuration, data, access). AWS runs the physical layer.
- Delete a resource and its charge stops.

### AWS approach to building systems: Well-Architected

```mermaid
flowchart TD
  W[Well-Architected] --> O[Operational excellence]
  W --> S[Security]
  W --> R[Reliability]
  W --> P[Performance efficiency]
  W --> C[Cost optimization]
  W --> U[Sustainability]
```
*Six pillars to judge any design.*

- Security: protect data and access.
- Reliability: recover from failure.
- Cost optimization: pay only for what you need.
- Ask "which pillar does this choice hurt?" for every design decision.

### Successful solution architect

```mermaid
flowchart LR
  A[Requirements] --> B[Choose services] --> C[Design for failure and cost] --> D[Explain trade-offs]
```
*The job is decisions and trade-offs, not memorising services.*

- Ask what the business needs first: users, data, uptime, budget.
- Keep designs simple; prefer managed services.
- Write down why you chose each option.

### AWS global infrastructure

```mermaid
flowchart TD
  G[🌍 Global] --> R1[Region]
  G --> R2[Region]
  R1 --> AZ1[AZ a]
  R1 --> AZ2[AZ b]
  R1 --> AZ3[AZ c]
  G --> E[Edge locations]
```
*Region contains AZs; edge locations sit near users.*

| Piece | What it is |
|---|---|
| Region | A separate geographic area, e.g. `us-east-1` |
| Availability Zone (AZ) | Isolated location inside a Region, one or more data centers |
| Edge location | Caches content close to users (CloudFront) |
| Local Zone / Wavelength Zone | Compute closer to users or to 5G networks |

- Most services are regional; resources in one Region are not visible in another.
- Spread across AZs to survive an AZ failure. Region and AZ counts change, so check the global infrastructure page.

### How to select a Region

```mermaid
flowchart TD
  A[Shortlist Regions] --> B{Compliance OK?}
  B -- no --> X[Drop]
  B -- yes --> C{Services available?}
  C -- no --> X
  C -- yes --> D[Compare latency and cost]
  D --> E[✅ Pick Region]
```
*Filter on hard rules first, then trade latency against cost.*

- Compliance and data residency are hard rules.
- Test latency from your users; use the pricing calculator for cost, because prices differ by Region.
- Latency-insensitive work (batch, analytics) can go to the cheapest Region.

### Resources

Course slides and links are the supporting material; the docs below are the reference.

## X vs Y

| | Region | AZ | Edge location |
|---|---|---|---|
| Purpose | Geographic area | Fault isolation | Content caching |
| You deploy servers? | Yes (choose one) | Yes (choose several) | No |

Pick multiple AZs when you need high availability. Pick another Region for data residency, user proximity or disaster recovery. Use edge locations to speed up content delivery.

## Job notes

- Always check which Region the console shows before creating anything.
- Default to two or more AZs for production.
- Compare Region cost before deploying big workloads; dev/test can run in cheaper Regions if rules allow.
- Not every service or feature exists in every Region; check regional availability first.

```mermaid
flowchart LR
  A[Requirement] --> B[Compliance] --> C[Services] --> D[Latency] --> E[Cost]
```
*Order for choosing a Region.*

## Cheat sheet

- AWS = rented building blocks, pay per use.
- Six pillars: operational excellence, security, reliability, performance efficiency, cost optimization, sustainability.
- Region contains AZs; edge locations cache near users.
- Multi-AZ for availability.
- Region choice: compliance, services, latency, cost.

## AWS docs

- [AWS Regions and Availability Zones](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions-availability-zones.html)
- [Well-Architected pillars](https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/well-architected-framework-pillars.html)
- [Choose Regions based on cost](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/cost_pricing_model_region_cost.html)

---
section: 53
title: "AWS Disaster Recovery"
part: "Disaster Recovery"
kind: concept
status: done
readingTime: 8
lectures: ["Intro","Architecting for Resilence","Business Continuity Plan (BCP)","RPO vs RTO","BCP Examples - 6 Scenarios","DR Strategies on AWS"]
quiz:
  - question: "The business says: 'After an outage we can lose at most 15 minutes of orders, and the site must be back within 1 hour.' Which two numbers is that?"
    options:
      - "RTO = 15 minutes, RPO = 1 hour"
      - "RPO = 15 minutes, RTO = 1 hour"
      - "RPO = 1 hour, RTO = 1 hour"
    answer: 1
    explanation: "RPO is how much data (in time) you can lose; RTO is how long you can be down. Option A swaps them."
  - question: "Your app runs in three Availability Zones behind a load balancer with Multi-AZ RDS. A whole Region becomes unavailable. Does this design cover it?"
    options:
      - "Yes, three AZs is disaster recovery."
      - "No, it is high availability inside one Region; you need data and a recovery path in a second Region."
      - "Yes, but only if you add more instances in the same AZs."
    answer: 1
    explanation: "Multi-AZ survives a failure of one data center, not of the Region. DR needs a copy of data and a way to run the workload in another Region."
  - question: "A company can accept several hours of downtime and wants the lowest possible DR cost. Data is in S3 and RDS. Which strategy fits?"
    options:
      - "Multi-site active-active"
      - "Warm standby"
      - "Backup and restore, with backups copied to another Region"
    answer: 2
    explanation: "Backup and restore costs mainly storage and has the slowest recovery. Active-active and warm standby run live capacity all the time, which is wasted money for a tolerant workload."
  - question: "You need recovery in minutes with a scaled-down but fully working copy already running in the recovery Region, and you will scale it up on failover. Which strategy is this?"
    options:
      - "Pilot light"
      - "Warm standby"
      - "Backup and restore"
    answer: 1
    explanation: "Warm standby keeps a small but complete, running environment. Pilot light keeps only the core data layer on; servers are not running until you start them."
  - question: "You must protect on-premises servers by replicating them continuously into AWS, with cheap staging storage and point-in-time recovery, and launch them only during a drill or disaster. Which service?"
    options:
      - "AWS Backup"
      - "AWS Elastic Disaster Recovery"
      - "Route 53 health checks"
    answer: 1
    explanation: "Elastic Disaster Recovery replicates servers continuously into a low-cost staging area and launches instances on demand. AWS Backup takes scheduled backups; it does not continuously replicate running servers for fast launch."
---

## What it is

**Disaster recovery (DR)** is the plan and setup to get a workload running again after a big failure, such as losing a whole Region, a bad deployment that destroys data, or ransomware. Two numbers drive every decision: **RPO** (how much data you can lose) and **RTO** (how long you can be down).

```mermaid
flowchart LR
  A["💾 Last good<br/>data copy"] -- "RPO: data lost" --> B["💥 Disaster"]
  B -- "RTO: downtime" --> C["✅ Service back"]
```

*RPO looks backward from the disaster; RTO looks forward to recovery.*

Use it when the business cannot accept losing the workload for good, and pick the cheapest design that still meets the agreed RPO and RTO.

## Key concepts

### Resilience, high availability and DR (Intro, Architecting for Resilience)

```mermaid
flowchart TD
  F["Failure type"] --> I["🖥️ Instance / disk"]
  F --> Z["🏢 One AZ"]
  F --> R["🌍 Whole Region"]
  F --> D["🧨 Data loss / attack"]
  I --> H["Auto Scaling, health checks"]
  Z --> H2["Multi-AZ: HA"]
  R --> DR["Second Region: DR"]
  D --> BK["Backups, versioning: DR"]
```

*High availability handles small, frequent failures; DR handles rare, large ones.*

| | High availability (HA) | Disaster recovery (DR) |
|---|---|---|
| Goal | Keep running through small failures | Recover after a major event |
| Scope | Usually several AZs, one Region | Usually another Region or site |
| Downtime | Near zero, automatic | Minutes to hours, often a decision plus a runbook |

- Resilience means the workload recovers from failures; design for failure, automate recovery, and test it.
- Multi-AZ is not DR for a Region outage. See [RDS Multi-AZ](/chapters/20-aws-database-services-amazon-rds/).

### Business Continuity Plan and the 6 scenarios (BCP)

A **Business Continuity Plan (BCP)** says how the business keeps its critical functions running during and after a disruption. DR is the IT part of it.

```mermaid
flowchart LR
  BIA["📋 Business impact<br/>analysis"] --> OBJ["🎯 Set RPO / RTO<br/>per workload"]
  OBJ --> STR["🧩 Choose DR<br/>strategy"]
  STR --> TEST["🧪 Test and drill"]
  TEST --> BIA
```

*Rank workloads by business impact first; the tech choice comes after.*

Typical scenarios the course walks through, and the strategy they usually point to (the course's exact six may differ):

| Scenario | RPO / RTO need | Likely strategy |
|---|---|---|
| Internal wiki, reports | hours / a day | Backup and restore |
| Back-office app | minutes / hours | Pilot light |
| Customer web shop | seconds-minutes / minutes | Warm standby |
| Payments, trading | near zero / near zero | Multi-site active-active |
| Ransomware or bad delete | point in time before the attack | Versioned, immutable backups |
| On-premises data center fire | depends on tier | Replicate servers into AWS |

- Different workloads get different tiers; do not pay for active-active everywhere.

### RPO vs RTO

| | RPO | RTO |
|---|---|---|
| Asks | How much data can we lose? | How long can we be down? |
| Measured | Time between last recovery point and disaster | Time from outage to restored service |
| Lowered by | Frequent backups, continuous replication | Pre-built infrastructure, automation, warm capacity |

- Example: nightly backup gives an RPO of up to 24 hours. Replication lag of seconds gives an RPO of seconds.
- Lower numbers always cost more.

### DR strategies on AWS

```mermaid
flowchart LR
  BR["💾 Backup & restore<br/>cheapest, slowest"] --> PL["💡 Pilot light"]
  PL --> WS["♨️ Warm standby"]
  WS --> AA["⚡ Multi-site<br/>active-active<br/>costliest, fastest"]
```

*Moving right: cost and complexity go up, RPO and RTO go down.*

```mermaid
flowchart TB
  subgraph PL["💡 Pilot light"]
    direction LR
    P1["🌍 Primary"] -- "data replication" --> P2["🗄️ DB on, servers off"]
  end
  subgraph WS["♨️ Warm standby"]
    direction LR
    W1["🌍 Primary"] -- "data replication" --> W2["🗄️ DB on + small<br/>full stack running"]
  end
```

*Pilot light has only the data layer on; warm standby has a whole small copy running.*

- **Backup and restore**: copy backups to another Region; after a disaster, rebuild infrastructure (with infrastructure as code) and restore data.
- **Pilot light**: data is replicated and always on in the recovery Region; app servers are created or started only on failover.
- **Warm standby**: a scaled-down but complete environment always runs; on failover you scale it up.
- **Multi-site active-active**: both Regions serve live traffic; failover means traffic shifts away from the failed side.
- Whatever the strategy, make sure failover works by testing it; an untested plan is a guess.

### AWS services that help

```mermaid
flowchart LR
  subgraph PR["🌍 Primary Region"]
    APP["App"] --> S3a["🪣 S3"]
    APP --> DBa["🗄️ RDS / Aurora"]
    APP --> DDa["⚡ DynamoDB"]
  end
  subgraph DRR["🛟 Recovery Region"]
    S3b["🪣 S3 replica"]
    DBb["🗄️ Replica / secondary"]
    DDb["⚡ Replica table"]
  end
  S3a -- "CRR" --> S3b
  DBa -- "cross-Region replica / Global Database" --> DBb
  DDa -- "global tables" --> DDb
  R53["🧭 Route 53 failover"] -.-> APP
  R53 -.-> DRR
```

*Data layers replicate by themselves; Route 53 moves the users.*

| Service | Role in DR |
|---|---|
| **AWS Backup** | One policy-based place for scheduled backups and cross-Region (and cross-account) copies, for supported services. |
| **S3 Cross-Region Replication** | Automatic, asynchronous copy of new objects to a bucket in another Region. Existing objects need S3 Batch Replication. |
| **RDS cross-Region read replica** | Replica in another Region; promote it to a standalone database on disaster. Watch replication lag. |
| **Aurora Global Database** | Storage-level replication to secondary Regions; RPO typically seconds, RTO in minutes by promoting a secondary. |
| **DynamoDB global tables** | Multi-Region, multi-active replicas; any replica serves reads and writes, so shifting traffic gives low or zero RPO. |
| **Route 53 failover** | Health checks plus a failover (active-passive) policy return the secondary when the primary is unhealthy. |
| **AWS Elastic Disaster Recovery** | Continuous block-level replication of servers (on-premises or cloud) into a cheap staging area in AWS; launch instances for drills or recovery, then fail back. |

## X vs Y

### The four strategies

| | Backup & restore | Pilot light | Warm standby | Multi-site active-active |
|---|---|---|---|---|
| RPO | hours | minutes | seconds | near zero or none |
| RTO | up to about 24 hours | tens of minutes | minutes | near zero |
| What runs in recovery Region | nothing (backups only) | data layer only | small full stack | full stack, live |
| Cost | $ | $$ | $$$ | $$$$ |
| Complexity | low | medium | medium-high | highest |

```mermaid
quadrantChart
  title Cost vs recovery time
  x-axis "Low cost" --> "High cost"
  y-axis "Fast recovery" --> "Slow recovery"
  "Backup and restore": [0.12, 0.88]
  "Pilot light": [0.38, 0.62]
  "Warm standby": [0.65, 0.32]
  "Active-active": [0.9, 0.1]
```

*Illustrative positions only: the more you pay, the shorter the recovery.*

Pick **backup and restore** when hours of downtime and data loss are acceptable. Pick **pilot light** when you need recovery in under an hour but cannot pay for idle app servers. Pick **warm standby** when minutes of downtime are the limit and you want to be able to test on live capacity. Pick **multi-site active-active** when almost no downtime or data loss is allowed and you can afford, and operate, two live sites.

## Job notes

- Start by asking: what are the RPO and RTO per workload? Then choose a strategy, not the other way round.
- Back up outside the failure domain: copy to another Region and ideally another account.
- Use infrastructure as code so the recovery site is built the same way each time.
- Drill regularly; Elastic Disaster Recovery supports non-disruptive drills.
- Keep Route 53 failover TTLs low, since clients cache answers; see [Edge services](/chapters/48-aws-edge-services/).
- Cost traps: cross-Region data transfer, idle warm standby capacity, backup copies never expired.
- Replication copies mistakes too: a deleted or corrupted record is replicated. Keep point-in-time backups or versioning as well.

```mermaid
sequenceDiagram
  participant M as 📟 Monitoring
  participant O as 🧑‍💻 On-call
  participant R as 🧭 Route 53
  participant S as 🛟 Recovery Region
  M->>O: primary health check failed
  O->>S: promote DB, scale up
  R->>R: primary unhealthy
  R-->>S: DNS now answers secondary
  O->>M: verify, then plan failback
```

*A typical failover: detect, promote data, scale, shift DNS, verify.*

Hands-on labs follow: [setup](/chapters/54-lab-17-build-dr-site-on-aws-setup/), [backup and restore](/chapters/55-lab-17-build-dr-site-on-aws-backup-and-restore-str/), [pilot light](/chapters/56-lab-17-build-dr-site-on-aws-pilot-light/), [warm standby](/chapters/57-lab-17-build-dr-site-on-aws-warm-standby-strategy/), [multi-site active-active](/chapters/58-lab-17-build-dr-site-on-aws-multi-site-active-acti/).

## Cheat sheet

- RPO = data you can lose. RTO = time you can be down.
- HA = survives small failures (Multi-AZ). DR = survives a Region-sized loss.
- Order, cheap to costly: backup and restore, pilot light, warm standby, active-active.
- Pilot light: data on, servers off. Warm standby: small full copy running.
- AWS Backup: scheduled, cross-Region copies. S3 CRR: object replication.
- Aurora Global Database: seconds RPO, minutes RTO. DynamoDB global tables: multi-active.
- Route 53 failover: health check plus primary/secondary records.
- Elastic Disaster Recovery: continuous server replication, drills, failback.
- Test the plan; check current pricing for cross-Region transfer.

## AWS docs

- [REL13-BP02 Use defined recovery strategies](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html)
- [What is AWS Elastic Disaster Recovery?](https://docs.aws.amazon.com/drs/latest/userguide/what-is-drs.html)
- [Creating backup copies across AWS Regions](https://docs.aws.amazon.com/aws-backup/latest/devguide/cross-region-backup.html)
- [Aurora Global Database switchover and failover](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-disaster-recovery.html)
- [Route 53 active-passive failover](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-types.html)

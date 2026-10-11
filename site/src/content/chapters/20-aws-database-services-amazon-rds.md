---
section: 20
title: "AWS Database Services - Amazon RDS"
part: "Databases"
kind: concept
status: done
readingTime: 9
lectures: ["Intro","Multi A-Z","Handle Heavy Write Operation on RDS","Handle Heavy Read Operation on RDS","Create RDS Free Tier Instance","RDS Endpoints","Connect RDS Database from EC2 Instance","RDS Multi-AZ Instance","RDS Multi-AZ Cluster","Using CloudShell","RDS Multi-AZ Instances vs Muli-AZ Clusters","Resources"]
quiz:
  - question: "Your production MySQL database on RDS must survive the loss of an Availability Zone with no data loss and no manual steps. Which feature do you enable?"
    options:
      - "A cross-Region read replica"
      - "Multi-AZ"
      - "Storage auto scaling"
      - "A longer backup retention period"
    answer: 1
    explanation: >-
      Correct: Multi-AZ keeps a synchronous standby in another AZ and fails over automatically, so no committed data is lost.
      A read replica is wrong because replication is asynchronous (data can lag) and promoting it is a manual step.
  - question: "A reporting dashboard runs heavy SELECT queries and slows down the main RDS PostgreSQL database. Users only need data that is a few seconds old. What is the best fix?"
    options:
      - "Convert the database to Multi-AZ DB instance and query the standby"
      - "Create one or more read replicas and point the dashboard at their endpoints"
      - "Increase the backup retention period"
      - "Turn on encryption"
    answer: 1
    explanation: >-
      Correct: read replicas take read traffic off the source and tolerate small replication lag.
      A Multi-AZ DB instance standby is wrong because it does not serve any read traffic; it only waits for a failover.
  - question: "You must restore an RDS database to 10:42 yesterday, right before a bad DELETE statement ran. Which feature gives you this?"
    options:
      - "A manual snapshot taken last week"
      - "Point-in-time recovery from automated backups, which creates a new DB instance"
      - "A failover to the Multi-AZ standby"
      - "Rebooting the instance with a different parameter group"
    answer: 1
    explanation: >-
      Correct: automated backups plus transaction logs let you restore to a chosen second inside the retention period, as a new instance.
      Failover is wrong because the standby already contains the bad DELETE, since it is a synchronous copy.
  - question: "Hundreds of Lambda functions open database connections and the RDS instance runs out of connections during spikes. What should you add?"
    options:
      - "RDS Proxy in front of the database"
      - "A second Multi-AZ standby"
      - "A larger gp3 volume"
      - "An option group"
    answer: 0
    explanation: >-
      Correct: RDS Proxy pools and shares database connections, so many short-lived clients no longer exhaust the database.
      Storage size is wrong because the limit is connections, not disk space.
  - question: "You need Multi-AZ with a standby that can also serve read queries, and you want a typical failover under about 35 seconds. Which option fits?"
    options:
      - "Multi-AZ DB instance deployment"
      - "Single-AZ with a read replica"
      - "Multi-AZ DB cluster deployment"
      - "Multi-AZ DB instance plus a second backup window"
    answer: 2
    explanation: >-
      Correct: a Multi-AZ DB cluster has a writer and two readable standbys in three AZs, with typical failover under 35 seconds.
      A Multi-AZ DB instance is wrong because its single standby serves no reads and failover usually takes one to two minutes.
---

## What it is

Amazon RDS (Relational Database Service) runs a database engine for you: AWS handles the OS, patching, backups, failover and storage, and you handle schema, queries and tuning. You connect with a normal DB client through a DNS endpoint. You cannot SSH into the host.

```mermaid
flowchart LR
  APP["🖥️ App on EC2<br/>(public subnet)"] -->|"port 3306/5432"| EP["🔗 DB endpoint (DNS)"]
  subgraph PRIV["Private subnets (DB subnet group)"]
    EP --> DB["🗄️ RDS instance"]
    DB --- ST["💽 EBS storage"]
  end
  DB -. "backups, snapshots" .-> S3["🪣 S3 (managed by AWS)"]
```
*Your app talks to a DNS name; RDS manages the instance, disk and backups behind it.*

Engines: Aurora (own chapter), MySQL, MariaDB, PostgreSQL, Oracle, SQL Server and Db2.

**Use it when** you need a relational (SQL) database with joins and transactions and want AWS to run it. Use [DynamoDB](/chapters/23-aws-database-services-amazon-dynamodb/) for key-value access at huge scale.

## Key concepts

### Instance classes and storage

| Part | What to know |
|---|---|
| Instance class | `db.t*` burstable (dev/test), `db.m*` general purpose, `db.r*`/`db.x*` memory optimised (big databases). A "g" suffix means Graviton. |
| Storage | EBS-backed. General Purpose SSD (gp3) is the usual default; Provisioned IOPS SSD (io1/io2) for heavy I/O. |
| Auto scaling | Set a **maximum storage threshold** and RDS grows the disk when space runs low. |
| Limits | You can grow storage but not shrink it. After a storage change you must wait (about 6 hours) before the next one. |

- Scaling up the instance class causes a short outage (a reboot). Storage scaling usually does not.
- Not every class exists for every engine and Region. Check the [instance class page](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.Support.html).

### Free tier instance and connecting from EC2

Create it: RDS console, **Create database**, **Standard create**, pick MySQL or PostgreSQL, template **Free tier**, `db.t3.micro` or `db.t4g.micro`, Single-AZ, set the master user and password, choose the VPC.

```mermaid
sequenceDiagram
  participant You
  participant EC2 as 🖥️ EC2 (sg-app)
  participant RDS as 🗄️ RDS (sg-db)
  You->>EC2: SSH or Session Manager
  EC2->>RDS: DNS lookup of endpoint, private IP
  EC2->>RDS: mysql -h endpoint -u admin -p (port 3306)
  RDS-->>EC2: sg-db allows 3306 from sg-app, login OK
```
*Security group of the DB allows the port only from the app's security group.*

```bash
mysql -h mydb.abc123xyz.eu-west-1.rds.amazonaws.com -u admin -p     # MySQL
psql  -h mydb.abc123xyz.eu-west-1.rds.amazonaws.com -U postgres      # PostgreSQL
```

- Free-tier rules changed in 2025. Accounts created after that use a Free plan with credits, older accounts keep 12 months of 750 hours. Free tier is Single-AZ only. Check the [RDS free tier page](https://aws.amazon.com/rds/free/).
- Keep **Public access = No**. Let the DB security group accept the DB port from the app security group, not from `0.0.0.0/0`.
- **Using CloudShell:** open AWS CloudShell, then run the client command only if the DB is reachable from it. A private DB is not, so run it from the EC2 instance. CloudShell is handy for `aws rds` CLI commands (create replica, failover, snapshot) with no local setup.

### Endpoints

```mermaid
flowchart LR
  subgraph INST["DB instance (Single-AZ / Multi-AZ instance)"]
    E1["🔗 one instance endpoint"] --> P1["🗄️ primary"]
    P1 -. standby .- S1["🗄️ standby (no endpoint)"]
  end
  subgraph CL["Multi-AZ DB cluster"]
    W["🔗 cluster (writer) endpoint"] --> WR["🗄️ writer"]
    R["🔗 reader endpoint"] --> RD1["🗄️ reader 1"]
    R --> RD2["🗄️ reader 2"]
  end
  RR["🔗 each read replica<br/>has its own endpoint"]
```
*Always connect by DNS name. After a failover the name points to the new primary; the IP changes.*

- A Multi-AZ DB instance exposes one endpoint. Failover flips the DNS record (CNAME) to the standby, so keep **retry logic** and a low DNS cache TTL in your app.
- A Multi-AZ DB cluster has a writer endpoint, a reader endpoint, and per-instance endpoints.
- Each read replica has its own endpoint. RDS does not balance reads across replicas for you; the app (or [RDS Proxy](#rds-proxy)) chooses.

### Multi-AZ (high availability)

```mermaid
flowchart LR
  APP["👤 App"] --> P["🗄️ Primary<br/>AZ-a"]
  P ==>|"synchronous"| S["🗄️ Standby<br/>AZ-b"]
  P -. "AZ fails: DNS flips" .-> S
```
*Multi-AZ is for availability, not for scaling.*

- Two deployment shapes. **Multi-AZ DB instance**: one standby, serves no reads. **Multi-AZ DB cluster**: two readable standbys (see the comparison below).
- Failover triggers include an AZ outage, loss of network to the primary, compute failure or storage failure. It can also be forced by rebooting with failover.
- In-flight queries are cut during failover, so the app must reconnect.
- Enabling it on an existing instance is a modify action: RDS snapshots, builds the standby, then syncs.

### Handle heavy reads: read replicas

```mermaid
flowchart LR
  W["✍️ Writes"] --> SRC["🗄️ Source DB"]
  SRC -. "async replication" .-> R1["📖 Replica 1"]
  SRC -. async .-> R2["📖 Replica 2"]
  SRC -. "async, other Region" .-> R3["📖 Replica (DR Region)"]
  RA["📊 Reports / read APIs"] --> R1
  RA --> R2
```
*Replicas copy changes from the source (asynchronously) and answer SELECT queries only.*

- Up to 15 replicas for MySQL, MariaDB and PostgreSQL; Oracle and SQL Server up to 5; Db2 up to 3. Check the [current limits](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html).
- The source needs automated backups on (retention above 0).
- Replicas can be in another AZ or Region, and can be promoted to a standalone DB (a DR option, a manual step).
- Replication lag is possible: only send reads that tolerate slightly old data.
- Other read fixes: add a cache such as ElastiCache ([caching chapter](/chapters/24-aws-database-caching-and-migration/)), or move to Aurora.

### Handle heavy writes

Replicas never absorb writes. Options, cheapest first:

```mermaid
flowchart TD
  Q{"Writes too heavy?"} --> A["Scale up: bigger instance class"]
  Q --> B["Faster storage: more IOPS (gp3 / io2)"]
  Q --> C["Multi-AZ DB cluster:<br/>lower write latency"]
  Q --> D["Buffer: put an SQS queue or stream<br/>in front, write in batches"]
  Q --> E["Re-architect: shard, or Aurora /<br/>DynamoDB for write scale"]
```
*Writes go to a single primary, so you scale it up, speed it up, smooth the spikes, or change the engine.*

- Check CloudWatch first: CPU, `WriteIOPS`, `WriteLatency`, queue depth, and whether the instance class caps EBS throughput.
- A Multi-AZ DB cluster typically has lower write latency than a Multi-AZ DB instance.

### Backups, PITR and snapshots

```mermaid
flowchart LR
  AB["🗓️ Automated backup<br/>daily snapshot + transaction logs<br/>(1 to 35 days)"] -->|"restore to a time"| NEW["🗄️ NEW instance"]
  MS["📸 Manual snapshot<br/>(kept until you delete it)"] -->|restore| NEW
  MS -->|"copy / share"| OTH["Other Region or account"]
```
*Restores always create a new instance with a new endpoint; the original stays.*

- Automated backups are on by default. Retention is 1 to 35 days; 0 turns them off. Point-in-time recovery (PITR) restores to any second in that window (latest restorable time is about 5 minutes ago).
- For longer retention, take manual snapshots or use AWS Backup. Manual snapshots do not expire.
- After restoring, repoint the app to the new endpoint (or rename instances).
- Backup storage up to the size of your database is not charged extra in a Region; beyond that it is. Check [RDS pricing](https://aws.amazon.com/rds/pricing/).

### Parameter groups, option groups, maintenance

| Item | Purpose | Gotcha |
|---|---|---|
| Parameter group | Engine settings (`max_connections`, character set, timeouts) | Default groups are read-only: create a custom one. **Static** parameters need a manual reboot; **dynamic** apply at once. |
| Option group | Extra engine features (for example Oracle and SQL Server options, MariaDB/MySQL plugins) | Mainly for those engines. PostgreSQL uses extensions instead. |
| Maintenance window | Weekly slot for patches and pending changes | Minor version upgrades can be automatic; major upgrades are your choice. |

- A "pending-reboot" parameter status does not reboot the DB by itself. Reboot it when you accept the downtime.
- Multi-AZ reduces maintenance downtime because RDS patches the standby first, then fails over.

### Security and encryption

- **Network:** private subnets via a DB subnet group, a security group per tier, no public access.
- **Encryption at rest:** KMS (AES-256); covers storage, backups, replicas and snapshots. Decide at creation. You cannot switch an existing unencrypted instance: copy a snapshot with encryption on, then restore it.
- **In transit:** use TLS to the endpoint.
- **Authentication:** master password stored in Secrets Manager, or IAM database authentication (a short-lived token instead of a password).
- Oracle and SQL Server also support their own Transparent Data Encryption (TDE).

### RDS Proxy

```mermaid
flowchart LR
  L["λ Lambda x 500"] --> PX["🔀 RDS Proxy<br/>(connection pool)"]
  PX -->|"few, reused connections"| DB["🗄️ RDS"]
  SM["🔑 Secrets Manager"] -.-> PX
```
*The proxy keeps a warm pool of DB connections and shares them among many short-lived clients.*

- Solves "too many connections", typically from Lambda or autoscaled fleets.
- Speeds up failover for the app because it holds connections and routes to the new primary.
- Clients can authenticate with IAM; the proxy reads DB credentials from Secrets Manager (or uses end-to-end IAM).
- It runs in your VPC and is billed on top of the database. Check [RDS Proxy pricing](https://aws.amazon.com/rds/proxy/pricing/).

## X vs Y

### Multi-AZ vs read replica

| | Multi-AZ (instance) | Read replica |
|---|---|---|
| Purpose | High availability | Read scaling, DR |
| Replication | Synchronous | Asynchronous |
| Serves reads | No | Yes |
| Failover | Automatic (DNS flip) | Manual promote |
| Region | Same Region, other AZ | Same AZ, other AZ or other Region |
| Own endpoint | No, shares the primary's | Yes |
| Data loss on failure | None | Possible (lag) |

They are not exclusive: a Multi-AZ source can also have read replicas.

### Multi-AZ DB instance vs Multi-AZ DB cluster

| | Multi-AZ DB instance | Multi-AZ DB cluster |
|---|---|---|
| Nodes | 1 primary + 1 standby | 1 writer + 2 readable standbys |
| AZs | 2 | 3 |
| Replication | Synchronous (storage level) | Semi-synchronous (needs 1 reader to acknowledge) |
| Standby serves reads | No | Yes (reader endpoint) |
| Typical failover | 1 to 2 minutes | Under 35 seconds |
| Write latency | Higher | Typically lower |
| Engines | All RDS engines | Fewer: MySQL and PostgreSQL |
| Endpoints | One | Writer, reader, per instance |

For MySQL clusters, give every table a primary key to avoid replication errors.

### RDS vs Aurora

| | RDS (MySQL, PostgreSQL ...) | Aurora |
|---|---|---|
| Storage | EBS volume per instance, you size it | Shared cluster volume, six copies across 3 AZs, grows automatically |
| Replicas | Up to 15 (engine-dependent), async | Up to 15 Aurora Replicas on the same storage |
| Engines | 6 or more incl. Oracle, SQL Server | MySQL- and PostgreSQL-compatible only |
| Cost | Usually lower for small workloads | Higher floor, better at scale |

Details are in the [Aurora chapter](/chapters/21-aws-database-services-amazon-aurora/).

**Pick Multi-AZ when** the database must survive an AZ failure. **Pick read replicas when** reads are the bottleneck or you need a cross-Region copy. **Pick the Multi-AZ cluster when** you want HA plus readable standbys and faster failover on MySQL or PostgreSQL. **Pick the Multi-AZ instance when** you need Oracle, SQL Server or Db2, or simpler and cheaper HA. **Pick Aurora when** you need more scale, faster failover or storage that grows on its own.

## Job notes

```mermaid
flowchart LR
  A["Subnet group<br/>+ security groups"] --> B["Create DB<br/>(encrypted, Multi-AZ for prod)"] --> C["Store secret"] --> D["Connect via endpoint"] --> E["Backups + alarms"] --> F["Replicas / Proxy<br/>when load grows"]
```
*Typical life of a production database.*

- **Production default:** Multi-AZ, encrypted, private, automated backups of 7 days or more, deletion protection on, final snapshot on delete.
- **Cannot connect?** Check in order: endpoint name, security group on the DB port, route and subnet, public access setting, credentials.
- **Cost traps:** Multi-AZ doubles instance cost; idle instances still bill; Provisioned IOPS; manual snapshots left behind; replicas nobody uses; cross-Region replication data transfer. A stopped instance is restarted by AWS after 7 days.
- **Slow after failover?** App is holding the old connection; add retry and use the DNS name, never an IP.
- **Test failover** before launch: reboot with failover, or `aws rds failover-db-cluster` for a Multi-AZ cluster.
- **Cleanup lab resources:** delete the instance (skip the final snapshot only if it is disposable), then delete leftover manual snapshots.
- **Monitor:** CloudWatch `CPUUtilization`, `FreeStorageSpace`, `DatabaseConnections`, `ReplicaLag`.

## Cheat sheet

- RDS = managed SQL: no OS access, AWS runs patches, backups and failover.
- Engines: Aurora, MySQL, MariaDB, PostgreSQL, Oracle, SQL Server, Db2.
- Always connect through the DNS endpoint; never an IP.
- Multi-AZ = HA, synchronous standby, automatic failover. Read replica = scale reads, asynchronous, manual promote, up to 15 (5 for Oracle/SQL Server).
- Multi-AZ cluster = 1 writer + 2 readable standbys, 3 AZs, failover typically under 35 s. Multi-AZ instance = 1 unreadable standby, failover 1 to 2 min.
- Writes scale up, not out: bigger class, more IOPS, queue in front, or move to Aurora/DynamoDB.
- Automated backups: 1 to 35 days, PITR creates a new instance. Manual snapshots stay until deleted.
- Static parameters need a reboot; dynamic apply now. Default parameter groups cannot be edited.
- Encryption must be chosen at creation (or via encrypted snapshot copy). KMS, AES-256.
- RDS Proxy pools connections (Lambda!) and can use IAM plus Secrets Manager.
- Storage can grow (auto scaling with a maximum), never shrink.
- Free tier: Single-AZ `db.t3.micro` / `db.t4g.micro`, check current terms.

## AWS docs

- [What is Amazon RDS?](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
- [Multi-AZ deployments for Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
- [Working with read replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Backing up and restoring an RDS DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
- [Amazon RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html)

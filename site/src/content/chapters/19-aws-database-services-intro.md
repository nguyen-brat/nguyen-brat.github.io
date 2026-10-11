---
section: 19
title: "AWS Database Services Intro"
part: "Databases"
kind: concept
status: done
readingTime: 7
lectures: ["Intro","Unmanaged vs Managed","SQL vs NoSQL","AWS Database Services"]
quiz:
  - question: "A team runs PostgreSQL on an EC2 instance and spends every weekend patching and testing restores. They want to keep PostgreSQL but stop doing that work. What should they move to?"
    options:
      - "Amazon RDS for PostgreSQL"
      - "A bigger EC2 instance with a cron job for backups"
      - "Amazon DynamoDB"
      - "Amazon ElastiCache"
    answer: 0
    explanation: "RDS runs the same engine but AWS handles provisioning, patching, backups and failure detection. A bigger EC2 instance keeps all the work with you, and DynamoDB is a different (NoSQL) engine that would force an application rewrite."
  - question: "An online shop needs orders, customers and payments stored with foreign keys, joins and ACID transactions. Which data model fits best?"
    options:
      - "Key-value"
      - "Relational (SQL)"
      - "Graph"
      - "Time series"
    answer: 1
    explanation: "Relational databases use tables with keys and joins and give strong transactional consistency, which is what order and payment data need. Key-value stores are fast for lookups by key but do not model joins across tables."
  - question: "A game needs single-digit-millisecond reads and writes at very large scale, with items always fetched by player ID. Which service is the natural choice?"
    options:
      - "Amazon Redshift"
      - "Amazon Neptune"
      - "Amazon DynamoDB"
    answer: 2
    explanation: "DynamoDB is a managed key-value and document database built for low-latency access by key at scale. Redshift is a data warehouse for analytics, not for per-item request traffic."
  - question: "The finance team runs heavy reports that scan billions of rows and aggregate them. These queries slow down the production order database. Where should the reporting data go?"
    options:
      - "A larger RDS instance for the same database"
      - "Amazon ElastiCache in front of the database"
      - "Amazon Redshift, a columnar data warehouse built for OLAP"
      - "Amazon DynamoDB with on-demand capacity"
    answer: 2
    explanation: "Redshift stores data in columns and is built for complex analytic (OLAP) queries over large data sets. A bigger RDS instance is a row-based OLTP engine; it would still compete with orders for resources."
  - question: "A social app must answer 'friends of friends who like the same band' quickly, across highly connected data. Which database type is purpose-built for this?"
    options:
      - "Graph, with Amazon Neptune"
      - "In-memory cache, with ElastiCache"
      - "Document, with Amazon DocumentDB"
      - "Relational, with many self-joins"
    answer: 0
    explanation: "Graph databases store nodes and relationships directly, so multi-hop relationship queries stay fast. Relational self-joins can do it but get slower and harder to write with every extra hop."
---

## What it is

A **database** is software that stores data and lets applications read and change it safely. On AWS you can run one yourself on a server, or use a **managed** service where AWS runs the servers, patching, backups and failover. AWS offers many database types because no single engine is best for every job.

```mermaid
flowchart LR
  A["👤 App"] --> B{"Who runs the DB?"}
  B -->|"You: DB on EC2"| C["🖥️ Unmanaged"]
  B -->|"AWS: RDS, DynamoDB..."| D["☁️ Managed"]
  C --> E["You: OS, patches, backups, HA"]
  D --> F["AWS: servers, patches, backups, failover"]
```
*Managed means AWS takes over the routine admin work; you keep the data and the schema.*

Use it when: you start with a managed service by default, and run your own database on EC2 only when you need OS-level control.

## Key concepts

### Unmanaged vs managed

| Task | Self-managed on EC2 | Managed (e.g. RDS) |
| --- | --- | --- |
| Hardware and OS | You | AWS |
| DB software install and patching | You | AWS |
| Backups and restore | You build it | Automated, you configure retention |
| High availability and failover | You design it | Option such as Multi-AZ |
| Schema, queries, indexes, access rules | You | You |

- RDS offers these engines: Aurora MySQL-compatible, Aurora PostgreSQL-compatible, MySQL, MariaDB, PostgreSQL, Oracle, SQL Server and Db2.
- You still own your data design and who can access it. "Managed" is not "no work".
- Trade-off: less control over the OS and engine internals. RDS Custom exists for cases that need more access.

### SQL vs NoSQL

```mermaid
flowchart TB
  subgraph SQL["Relational (SQL)"]
    T1["Customers table"] --- T2["Orders table"]
    T2 --- T3["Products table"]
  end
  subgraph NoSQL["Non-relational (NoSQL)"]
    K["🔑 Key-value"]
    D["📄 Document"]
    G["🕸️ Graph"]
    W["📈 Time series"]
  end
```
*Relational data lives in linked tables; NoSQL covers several other data models.*

| | Relational (SQL) | Non-relational (NoSQL) |
| --- | --- | --- |
| Model | Tables, rows, columns, fixed schema | Key-value, document, graph, wide-column, time series |
| Relationships | Joins and foreign keys | Usually modelled in the item or by key |
| Transactions | Strong ACID support | Varies by service |
| Scaling | Mostly vertical, plus read replicas | Designed for horizontal scale |
| Query | SQL, flexible ad hoc | Access by key or defined patterns |

- ACID means a transaction is atomic, consistent, isolated and durable: all of it happens, or none of it.
- NoSQL does not mean "no structure"; it means a model chosen for a specific access pattern.

### OLTP vs OLAP

```mermaid
flowchart LR
  A["🛒 App: many small reads and writes"] --> B[("OLTP: RDS, Aurora, DynamoDB")]
  B -->|"copy data"| C[("OLAP: Redshift data warehouse")]
  C --> D["📊 Reports and BI"]
```
*Operational data is copied to a warehouse so heavy reports do not slow the live app.*

- **OLTP** (online transaction processing): many small, fast operations such as "place order". Data is stored in rows.
- **OLAP** (online analytical processing): few, big queries that scan and aggregate lots of data. Redshift stores data in columns for this.
- Most companies use both together.

### The AWS database family

```mermaid
mindmap
  root((AWS databases))
    Relational
      Aurora
      RDS
    Key-value / document
      DynamoDB
      DocumentDB
    In-memory
      ElastiCache
      MemoryDB
    Graph
      Neptune
    Time series
      Timestream
    Wide-column
      Keyspaces
    Warehouse
      Redshift
```
*Purpose-built engines: pick by data model and access pattern.*

- AWS describes the families as relational, key-value, document, in-memory, graph, time series and ledger.
- Warehouse (Redshift) is for analytics, not application traffic.

## X vs Y

Which AWS database for which workload:

| Workload | Service | Why |
| --- | --- | --- |
| Classic app with tables, joins, transactions | RDS or Aurora | Familiar SQL engines, managed |
| Same, but needs higher performance and fast failover | Aurora | Cloud-built MySQL/PostgreSQL-compatible engine |
| Huge scale, low latency, access by key | DynamoDB | Managed key-value and document |
| MongoDB-style JSON documents | Amazon DocumentDB | Document database, MongoDB compatibility |
| Cache, sessions, leaderboards | ElastiCache (or MemoryDB) | Data in memory, very fast |
| Highly connected data (social, fraud) | Neptune | Graph model |
| Metrics, IoT, time-stamped data | Timestream | Time series |
| Cassandra-compatible wide-column | Amazon Keyspaces | Managed Cassandra-compatible |
| Analytics over huge data | Redshift | Columnar OLAP warehouse |

```mermaid
flowchart TD
  S["New workload"] --> Q1{"Analytics on huge data?"}
  Q1 -->|Yes| RS["Redshift"]
  Q1 -->|No| Q2{"Need joins and ACID?"}
  Q2 -->|Yes| Q3{"Need top performance or fast failover?"}
  Q3 -->|Yes| AU["Aurora"]
  Q3 -->|No| RDS["RDS"]
  Q2 -->|No| Q4{"Access pattern?"}
  Q4 -->|"By key, huge scale"| DDB["DynamoDB"]
  Q4 -->|"JSON documents"| DOC["DocumentDB"]
  Q4 -->|"Relationships"| NEP["Neptune"]
  Q4 -->|"Time-stamped"| TS["Timestream"]
  Q4 -->|"Microsecond cache"| EC["ElastiCache"]
```
*Start from the access pattern, not from the product name.*

Pick relational (RDS/Aurora) when data is structured and you need joins and transactions. Pick NoSQL when one access pattern dominates and you need scale or a special model.

## Job notes

- Default for a new app that needs SQL: RDS or Aurora, Multi-AZ for production.
- Mistake: forcing everything into one database. Many systems use several, for example RDS for orders plus ElastiCache for sessions.
- Mistake: running reports on the production OLTP database. Copy data to a warehouse.
- Mistake: choosing NoSQL "because it scales" without knowing the access patterns first.
- Security default: place databases in private subnets and allow access only from the app's security group.
- Cost trap: instances that run all day, over-sized instances and forgotten snapshots. Check current pricing on each service page.

## Cheat sheet

- Managed = AWS runs servers, patching, backups, failover. You own schema and access.
- SQL = tables, joins, ACID. NoSQL = key-value, document, graph, wide-column, time series.
- OLTP = many small transactions. OLAP = big analytic queries (Redshift).
- RDS/Aurora: relational. DynamoDB: key-value. DocumentDB: documents. Neptune: graph.
- ElastiCache/MemoryDB: in-memory. Timestream: time series. Keyspaces: Cassandra-compatible. Redshift: warehouse.
- Choose by data model and access pattern.

## AWS docs

- [What is Amazon RDS?](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
- [Choosing an AWS NoSQL database](https://docs.aws.amazon.com/whitepapers/latest/choosing-an-aws-nosql-database/types-of-nosql-databases.html)
- [OLTP vs OLAP](https://aws.amazon.com/compare/the-difference-between-olap-and-oltp/)
- [Well-Architected: Database](https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/perf-db.html)

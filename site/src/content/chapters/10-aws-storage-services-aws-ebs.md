---
section: 10
title: "AWS Storage Services - AWS EBS"
part: "Storage"
kind: concept
status: done
readingTime: 8
lectures: ["Intro","Object Storage vs Block Storage","Amazon Elastic Block Store (EBS)","Attach Multiple EBS Volumes to an EC2 Instance","Auto Mount EC2 Volumes to EC2 Instance","EBS Operation Scope & Attach An Existing EBS to EC2 Instance","Attach Existing EBS Volume to EC2 Demo","EBS Types","EBS Pricing","Attach Single EBS Volume to Multiple EC2 Instances","EBS Volume vs Instance Store","Resources"]
quiz:
  - question: "A team runs a MySQL database on one EC2 instance. It needs steady 12,000 IOPS and 400 MiB/s, and the team wants the lowest cost without paying for extra disk space. Which volume type fits best?"
    options:
      - "gp3, with the IOPS and throughput provisioned above the baseline"
      - "st1, because it has the best throughput per dollar"
      - "sc1, because it is the cheapest per GB"
      - "gp2, because performance grows automatically with size"
    answer: 0
    explanation: >-
      Correct: gp3 lets you set IOPS and throughput separately from size, so you pay only for the extra performance you need. It is the general-purpose default for single-instance databases.
      st1 is wrong because HDD volumes are built for large sequential I/O, with a very low IOPS ceiling, and cannot serve a random-I/O database.
      gp2 is wrong because its performance is tied to volume size, so you would have to buy extra space to get the speed.
  - question: "You created an EBS volume in eu-west-1a. Your new EC2 instance runs in eu-west-1b and the attach fails. What is the correct way to get the data to the instance?"
    options:
      - "Enable Multi-Attach on the volume so it can cross Availability Zones."
      - "Take a snapshot of the volume, then create a new volume from it in eu-west-1b."
      - "Detach the volume and attach it again after a reboot of the instance."
      - "Copy the volume to the instance store of the instance."
    answer: 1
    explanation: >-
      Correct: an EBS volume lives in one Availability Zone, but a snapshot is stored regionally. You can create a new volume from the snapshot in any AZ of the Region.
      Multi-Attach is wrong because it only works for instances in the same AZ as the volume.
      Rebooting is wrong because the AZ mismatch does not go away. The volume simply cannot attach across AZs.
  - question: "Your company must run a clustered application on four Nitro EC2 instances in one AZ that all write to the same block device. Which setup is supported?"
    options:
      - "One gp3 volume attached to all four instances with Multi-Attach, formatted with XFS."
      - "One io2 volume with Multi-Attach, used with a cluster-aware file system or application."
      - "One st1 volume attached to all four instances."
      - "Four instance store volumes that sync automatically."
    answer: 1
    explanation: >-
      Correct: Multi-Attach works only on Provisioned IOPS SSD volumes (io1 and io2), for Nitro instances in the same AZ. Your software must coordinate writes, so you need a cluster-aware file system or application.
      gp3 is wrong because it does not support Multi-Attach. Even where it is allowed, plain XFS or ext4 is not designed for concurrent access from several servers.
      Instance store volumes are wrong because they are local to one instance and never sync.
  - question: "A compliance rule says every new EBS volume in the account must be encrypted, with no action from developers. What should you do?"
    options:
      - "Encrypt each volume by hand after launch."
      - "Enable EBS encryption by default in each Region you use."
      - "Encrypt the snapshots only, since volumes are protected by the AZ."
      - "Enable encryption in the IAM console once for the whole account."
    answer: 1
    explanation: >-
      Correct: EBS encryption by default is a per-Region account setting, so new volumes are always created encrypted. It does not change existing unencrypted volumes.
      Encrypting by hand is wrong because it depends on people remembering. Encrypting only snapshots is wrong because the volume itself would stay unencrypted.
  - question: "A batch job on an i-family EC2 instance writes scratch data to a local NVMe instance store volume. The instance is stopped overnight to save money. What happens to the scratch data?"
    options:
      - "It is kept, because the instance store is backed up to S3 automatically."
      - "It is kept, because only terminate deletes instance store data."
      - "It is lost, because instance store data does not survive a stop."
      - "It moves to the root EBS volume on stop."
    answer: 2
    explanation: >-
      Correct: instance store data survives a reboot but not a stop, hibernate or terminate. Use it only for temporary data such as caches and scratch files.
      "Only terminate deletes it" is wrong because a stop also erases it.
      The S3 backup option is wrong because AWS does not back up instance store volumes. Copy needed data to EBS or S3 yourself.
---

## What it is

Amazon EBS (Elastic Block Store) gives an EC2 instance a virtual hard disk over the network. The disk (a **volume**) lives independently of the instance, so you can detach it, snapshot it and attach it elsewhere. The OS sees it as a raw block device, so you format it and mount it like a local disk.

```mermaid
flowchart LR
  subgraph AZ["Availability Zone"]
    EC2["🖥️ EC2 instance"] --- ROOT["💽 Root volume<br/>(OS)"]
    EC2 --- DATA["💽 Data volume<br/>(database files)"]
  end
  DATA -. snapshot .-> SNAP["📸 Snapshot<br/>(Region-wide)"]
  SNAP -. restore .-> NEW["💽 New volume<br/>(any AZ)"]
```
*A volume is tied to one AZ; snapshots carry data across AZs and Regions.*

**Use it when** an EC2 instance needs a disk that survives stop and terminate, such as an OS disk, a database, or a file system you manage.

## Key concepts

### Block vs object storage

| | Block (EBS) | Object ([S3](/chapters/14-aws-storage-services-amazon-s3/)) |
|---|---|---|
| Unit | Fixed-size blocks, you add a file system | Whole object plus metadata |
| Access | Mounted on one instance, like a disk | HTTP API, from anywhere |
| Update | Change a few blocks in place | Replace the whole object |
| Best for | OS, databases, low latency | Files, backups, static sites, data lakes |

Shared file systems (many instances at once) are a third type, covered in [EFS and FSx](/chapters/12-aws-storage-services-amazon-efs-and-fsx/).

### Scope: one volume, one AZ

```mermaid
flowchart TB
  V["💽 Volume in eu-west-1a"] --> OK["🖥️ Instance in eu-west-1a ✅"]
  V -. cannot attach .-> NO["🖥️ Instance in eu-west-1b ❌"]
  V --> S["📸 Snapshot"] --> V2["💽 New volume in eu-west-1b"]
  V2 --> OK2["🖥️ Instance in eu-west-1b ✅"]
```
*To move a volume to another AZ, snapshot it and restore in the target AZ.*

- A normal volume attaches to **one instance at a time** (see Multi-Attach below for the exception).
- One instance can have **many volumes**. The maximum depends on instance type and size.
- The root volume has `DeleteOnTermination` set to true by default, so terminating the instance deletes it. Set it to false to keep the disk.

### Attach, mount and auto-mount

Attaching only connects the disk. You still must format (first time only) and mount it.

```mermaid
sequenceDiagram
  participant You
  participant EC2 as 🖥️ Instance
  You->>EC2: Attach volume (console or CLI)
  You->>EC2: lsblk (find device, e.g. nvme1n1)
  You->>EC2: sudo mkfs -t xfs /dev/nvme1n1 (new volume only)
  You->>EC2: sudo mount /dev/nvme1n1 /data
  You->>EC2: Add line to /etc/fstab (auto-mount)
```
*An existing volume that already holds data skips the `mkfs` step; formatting erases it.*

```bash
aws ec2 attach-volume --volume-id vol-0abc --instance-id i-0abc --device /dev/sdf
lsblk -f                                   # find the device and its UUID
sudo mount /dev/nvme1n1 /data
# /etc/fstab: mount by UUID so a device rename does not break boot
UUID=<uuid-from-lsblk>  /data  xfs  defaults,nofail  0  2
```

- Use the **UUID** in `/etc/fstab`, not the device name. Device names can change.
- Add `nofail` so a missing volume does not block the instance from booting.
- Attaching an existing volume to another instance: stop using it, detach, attach in the **same AZ**, then mount (no format).
- Nitro instances show EBS volumes as NVMe devices (`/dev/nvme1n1`), whatever name you chose at attach time.

### Volume types

```mermaid
flowchart TD
  Q{"Workload?"} -->|"Random I/O, general use, boot"| GP["gp3 (default)"]
  Q -->|"Extreme IOPS, sub-ms latency, 99.999% durability"| IO["io2 Block Express"]
  Q -->|"Big sequential reads and writes"| ST["st1 (HDD)"]
  Q -->|"Rarely accessed, lowest cost"| SC["sc1 (HDD)"]
```
*SSD types are for IOPS (small random I/O); HDD types are for MB/s (large sequential I/O).*

The full side-by-side table is in the X vs Y section below.

- **gp3** gives a baseline of 3,000 IOPS and 125 MiB/s in the price of storage. You can buy more IOPS and throughput without growing the disk.
- **gp2** is the older type: speed grows with size and uses burst credits. Prefer gp3 for new volumes.
- Only **SSD** types can be boot volumes. st1 and sc1 cannot.
- You can change type, size and IOPS on a live volume with **Elastic Volumes** (`aws ec2 modify-volume`). Size can only grow; afterwards extend the file system.

### Snapshots

```mermaid
flowchart LR
  A["Snap A<br/>full copy 10 GiB"] --> B["Snap B<br/>+4 GiB changed"] --> C["Snap C<br/>+1 GiB changed"]
  C -->|restore| V["💽 Full volume"]
  B -->|"copy to another Region"| R["📸 Copy in DR Region"]
```
*Only the first snapshot is full; later ones store changed blocks. Deleting an old one never breaks a newer one.*

- Snapshots are stored by AWS in S3 (you do not see the bucket) and are Region-scoped. Copy them to another Region for disaster recovery.
- Automate with **Amazon Data Lifecycle Manager** or AWS Backup, not cron jobs.
- **Recycle Bin** retention rules let you recover accidentally deleted snapshots.
- The **archive tier** is cheaper for rarely used snapshots, with a 90-day minimum and a restore time of up to 72 hours. Use it for monthly or yearly copies, not daily ones.

### Encryption

- Encrypted volumes protect data at rest, data moving between the volume and the instance, all snapshots, and all volumes restored from those snapshots.
- Uses AES-256 keys from AWS KMS. The default is the AWS managed key `aws/ebs`; use a customer managed key if you need to control rotation, disabling or sharing.
- Turn on **EBS encryption by default** per Region (EC2 console, Settings). It affects only new volumes.
- Unencrypted snapshot to encrypted volume: copy the snapshot with encryption on, or choose encryption when restoring.
- You can share a snapshot with another account only if it is encrypted with a **customer managed key**, and you must share the key too.

### Multi-Attach

```mermaid
flowchart LR
  VOL["💽 io2 volume<br/>Multi-Attach on"] --- A["🖥️ Node 1"]
  VOL --- B["🖥️ Node 2"]
  VOL --- C["🖥️ Node 3"]
  note["Same AZ, Nitro instances, up to 16"]
```
*One shared disk for a cluster. Your software, not EBS, must coordinate writes.*

- Only Provisioned IOPS SSD (**io1/io2**). Same AZ. Up to 16 Nitro instances. Not for boot volumes.
- Linux supports io1 and io2; Windows supports io2 only.
- XFS and ext4 are not designed for several writers. Use a cluster-aware file system or application.
- For a shared file system that needs no special software, use EFS instead.

### Pricing

```mermaid
flowchart LR
  P["💲 EBS bill"] --> S1["Provisioned GB-month<br/>(even if empty)"]
  P --> S2["Provisioned IOPS / throughput<br/>(gp3 extras, io1, io2)"]
  P --> S3["Snapshot storage<br/>(GB-month, changed blocks)"]
```
*You pay for what you provision, not what you use.*

- Billing is per GB-month of provisioned size. A 100 GiB volume holding 10 GiB still costs 100 GiB.
- Unattached volumes still cost money. Delete what you do not need.
- Snapshots are billed by stored data, and deleting one may not cut cost if later snapshots reference its blocks.
- Prices differ per Region and change. Check [EBS pricing](https://aws.amazon.com/ebs/pricing/) for current values.

## X vs Y

### EBS volume types vs instance store

Volume types (use the [volume types page](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html) for current limits):

| | gp3 | io2 Block Express | st1 | sc1 |
|---|---|---|---|---|
| Media | SSD | SSD | HDD | HDD |
| Optimised for | IOPS, general use | IOPS, latency, durability | MB/s, sequential | MB/s, cold data |
| Max IOPS per volume | 80,000 | 256,000 | 500 | 250 |
| Max throughput | 2,000 MiB/s | 4,000 MiB/s | 500 MiB/s | 250 MiB/s |
| Size | 1 GiB to 64 TiB | 4 GiB to 64 TiB | 125 GiB to 16 TiB | 125 GiB to 16 TiB |
| Durability | 99.8-99.9% | 99.999% | 99.8-99.9% | 99.8-99.9% |
| Multi-Attach | No | Yes | No | No |
| Boot volume | Yes | Yes | No | No |
| Typical use | Boot, dev/test, most databases | Largest, latency-critical databases | Logs, data warehouse, Kafka | Infrequent, cheapest |

EBS vs instance store:

| | EBS volume | Instance store |
|---|---|---|
| Location | Network-attached, separate from host | Disks physically in the host server |
| After reboot | Kept | Kept |
| After stop / terminate | Kept (root volume deleted on terminate by default) | Lost |
| Detach and move | Yes | No, only attached at launch |
| Snapshots | Yes | No |
| Size and type | Choose, resize when running | Fixed by instance type |
| Cost | Pay for provisioned volume | Included in instance price |
| Use for | OS, databases, anything to keep | Cache, buffers, scratch, replicated data |

**Pick gp3 when** you do not have a special reason; it is the default for boot and databases. **Pick io2** when you need more than gp3 limits, sub-millisecond latency, higher durability, or Multi-Attach. **Pick st1/sc1** for large streaming data where cost per GB matters, never for boot. **Pick instance store** when data is disposable or replicated elsewhere and you want local speed.

## Job notes

```mermaid
flowchart LR
  A["Create volume<br/>(same AZ)"] --> B["Attach"] --> C["mkfs + mount<br/>+ fstab UUID"] --> D["Snapshot policy<br/>(DLM / Backup)"] --> E["Monitor and resize<br/>(Elastic Volumes)"]
```
*Typical life of a data disk.*

- **Default choice:** gp3, encrypted, with a scheduled snapshot policy.
- **Cannot attach?** Check AZ first, then that the volume state is `available`.
- **Out of space?** Modify size, then extend partition and file system. Shrinking is not possible; create a smaller volume and copy data.
- **Slow disk?** Check the instance limit too: instance type caps EBS throughput. Use EBS-optimised instances to reach full IOPS.
- **Cost traps:** unattached volumes after terminating instances, old snapshots, over-provisioned io2 IOPS.
- **Security:** enable default encryption, never make snapshots public, and share only with named accounts.
- **Do not store** the only copy of important data on instance store.

## Cheat sheet

- EBS = network disk for EC2. One AZ. Survives stop. Snapshot to move across AZs or Regions.
- Default type: **gp3** (3,000 IOPS and 125 MiB/s included). SSD for IOPS, HDD (st1/sc1) for throughput, HDD is never a boot volume.
- **io2** for top IOPS, latency, durability and **Multi-Attach** (same AZ, Nitro, up to 16, clustered software).
- Snapshots: incremental, Region-scoped, copy for DR, archive tier for long retention, Recycle Bin for mistakes.
- Encryption: KMS, AES-256, enable by default per Region. Covers volume, snapshots and restored volumes.
- Mount flow: attach, `lsblk`, `mkfs` (new only), `mount`, `/etc/fstab` with UUID and `nofail`.
- Billing: provisioned GB-month plus provisioned IOPS and throughput extras plus snapshots.
- Instance store = temporary, lost on stop and terminate, kept on reboot.

## AWS docs

- [What is Amazon EBS?](https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html)
- [Amazon EBS volume types](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html)
- [Make an EBS volume available for use](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-using-volumes.html)
- [Attach a volume to multiple instances (Multi-Attach)](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes-multi.html)
- [Amazon EBS pricing](https://aws.amazon.com/ebs/pricing/)

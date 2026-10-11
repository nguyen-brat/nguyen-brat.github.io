---
section: 7
title: "LAB 01 - Build First 3-Tiers Web Application on Amazon EC2 and AWS ELB"
part: "Compute & Containers"
kind: lab
status: done
readingTime: 9
lectures: ["Intro","Github Repo","Setup NAT Gateway","Launch Database instance in Private subnet","Configure dbadmin","Configure Authentication on Database","Launch Web Application in Public Subnet","Verify Application","Using UserData for Application","Protect Application behind an Elastic Load Balancing (ELB)","Create Application Load Balancer (ALB) & Target Group","AWS ELB Pricing","Configure ALB","Target Group Health Check","Summary","Using Application with Network Load Balancer (NLB)","Build App with Launch Template","Verify Application with NLB","NLB & EIP 1","NLB & EIP 2","NLB & EIP 3","Clean Up!"]
quiz:
  - question: "Your web instances sit behind an ALB. You want them to accept HTTP only from the load balancer, not from the internet. What is the cleanest rule?"
    options:
      - "Allow port 80 from 0.0.0.0/0 on the instance security group"
      - "Allow port 80 on the instance security group with the ALB's security group as the source"
      - "Allow port 80 from the VPC CIDR on the NACL only"
      - "Put the instances in a public subnet and remove the security group"
    answer: 1
    explanation: "Referencing the ALB's security group as the source means only traffic that comes through the ALB is accepted, even if its IPs change. Opening 0.0.0.0/0 would let anyone reach the instances directly."
  - question: "The database instance in a private subnet cannot run its package install at boot. The private route table has only the local route. What is missing?"
    options:
      - "An internet gateway attached to the private subnet"
      - "A route 0.0.0.0/0 to a NAT gateway that lives in a public subnet"
      - "A public IP on the database"
      - "An inbound rule on port 3306"
    answer: 1
    explanation: "Outbound-only internet access for a private subnet comes from a NAT gateway in a public subnet plus a default route to it. A public IP would expose the database, which defeats the private tier."
  - question: "A customer must allow-list a fixed IP address for your public endpoint, per Availability Zone. Which load balancer fits?"
    options:
      - "ALB, because it has static IPs"
      - "NLB, with an Elastic IP attached to each Availability Zone subnet"
      - "Either; both keep the same IPs forever"
      - "ALB with a larger subnet"
    answer: 1
    explanation: "An internet-facing NLB lets you assign an Elastic IP per AZ, giving static addresses. ALB node IPs can change as it scales, so clients use its DNS name."
---

## What you build

A classic three-tier app: browser, a public web tier, and a database that is never reachable from the internet. You first run one web server directly, then put it behind an Application Load Balancer, then swap in a Network Load Balancer with static IPs.

```mermaid
flowchart LR
  U["👤 User"] --> ALB["⚖️ ALB<br/>public subnets A+B"]
  ALB --> W1["🖥️ Web EC2<br/>public subnet"]
  W1 --> DB["🗄️ DB EC2<br/>private subnet"]
  DB -. "updates/packages" .-> NAT["🚪 NAT gateway<br/>public subnet"]
  NAT --> IGW["☁️ Internet gateway"]
```

_Caption: users reach only the load balancer; the database talks out only through the NAT gateway._

Prerequisite: a VPC with public and private subnets and an internet gateway (see [Networking Basic](/chapters/05-networking-basic/)). Instance basics are in [Amazon EC2](/chapters/06-aws-compute-services-amazon-ec2/). The course provides the app code in a GitHub repository; clone the URL the lab gives you in the web instance's user data.

## Architecture

```mermaid
sequenceDiagram
  participant U as 👤 Browser
  participant L as ⚖️ ALB (sg-alb)
  participant W as 🖥️ Web (sg-web)
  participant D as 🗄️ DB (sg-db)
  U->>L: HTTP :80
  L->>W: forward :80 (health check GET /)
  W->>D: DB query :3306 (assumed MySQL port)
  D-->>W: rows
  W-->>L: HTML
  L-->>U: response
```

_Caption: each hop is allowed by a security group that names the previous tier as its source._

```mermaid
flowchart TB
  A["sg-alb<br/>in: 80 from 0.0.0.0/0"] --> B["sg-web<br/>in: 80 from sg-alb"]
  B --> C["sg-db<br/>in: DB port from sg-web"]
```

_Caption: security group chaining. No tier is open to anything but the tier in front of it._

- **Public subnets (2 AZs):** ALB nodes, the NAT gateway, optionally the web instances. An ALB needs at least two subnets in different AZs.
- **Private subnet:** the database instance. Its route table sends `0.0.0.0/0` to the NAT gateway.
- **NAT gateway:** outbound-only internet for private instances. It lives in a public subnet and uses an Elastic IP.
- **Target group:** the list of web instances plus the health check the ALB uses to decide who gets traffic.
- **Launch template:** saved instance settings (AMI, type, security group, user data) so you can create identical web servers.

## Steps

**Part 1: network and database**

1. **NAT gateway.** Console: VPC > NAT gateways > Create. Choose a public subnet, connectivity type Public, allocate an Elastic IP. Then VPC > Route tables > private table > add `0.0.0.0/0` to the NAT gateway.
   ```bash
   aws ec2 create-nat-gateway --subnet-id <public-subnet> --allocation-id <eipalloc>
   aws ec2 create-route --route-table-id <private-rtb> --destination-cidr-block 0.0.0.0/0 --nat-gateway-id <nat-id>
   ```
2. **Launch the database instance.** EC2 > Launch instance > private subnet, auto-assign public IP disabled, security group `sg-db` with the database port allowed from `sg-web` only.
3. **Configure `dbadmin` and authentication.** Connect (Session Manager or from the web instance), install the DB server, create an admin user (`dbadmin`) with a password, and create the app database and a limited app user. Allow the app user to connect only from the web tier's address range. The exact commands are in the course repo.
4. **Launch the web instance.** Public subnet, public IP enabled, `sg-web` allowing HTTP from your IP for now. Paste the setup script into Advanced details > User data (install web server, clone the repo, point it at the DB's private IP).
5. **Verify.** Open `http://<public-ip>` and check that the page reads and writes data. If it is blank, read `/var/log/cloud-init-output.log` on the instance.

**Part 2: ALB**

6. **Create the target group.** EC2 > Target groups > Create: type Instances, protocol HTTP :80, health check path `/`, register the web instance.
7. **Create the ALB.** EC2 > Load balancers > Create > Application Load Balancer, internet-facing, pick two subnets in different AZs, security group `sg-alb`, listener HTTP :80 forwarding to the target group.
   ```bash
   aws elbv2 create-load-balancer --name web-alb --subnets <subnet-a> <subnet-b> --security-groups <sg-alb>
   aws elbv2 create-target-group --name web-tg --protocol HTTP --port 80 --vpc-id <vpc> --target-type instance
   aws elbv2 create-listener --load-balancer-arn <alb-arn> --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=<tg-arn>
   ```
8. **Lock the web tier.** Edit `sg-web`: replace the open HTTP rule with port 80 from `sg-alb`.
9. **Check health.** Target group > Targets: wait for status `healthy`, then browse to the ALB DNS name. Tune interval/threshold only if you need faster failover.

**Part 3: NLB, launch template, Elastic IPs**

10. **Launch template.** EC2 > Launch templates > Create: AMI, instance type, `sg-web`, the same user data. Launch a web instance from it.
11. **Create an NLB.** Load balancers > Create > Network Load Balancer, internet-facing, TCP :80 to a new target group holding the template-built instance.
12. **Static IPs.** In the NLB's network mapping, select an Elastic IP for each AZ subnet. Without your own choice, AWS assigns one Elastic IP per AZ.
13. **Verify.** Browse to the NLB DNS name and to each Elastic IP. NLB targets can keep the client's source IP, so check `sg-web` allows the client range, or allow the NLB's security group if it has one (add it at creation; it cannot be added later if you created without one).

Expected result: the app works via ALB DNS and via NLB DNS/Elastic IPs; the database has no public IP.

| | ALB | NLB |
|---|---|---|
| Layer | 7 (HTTP/HTTPS) | 4 (TCP/UDP/TLS) |
| Static IP | No, use DNS name | One Elastic IP per AZ |
| Typical use | Websites, path routing | Fixed IPs, non-HTTP |

## Common mistakes

- **Same route table for public and private subnets.** Traffic then does not route to the internet; use separate tables.
- **NAT gateway placed in a private subnet.** It must be in a public subnet with an internet-gateway route.
- **Target stays unhealthy.** Check that the web server is running, the health check path returns 200, and `sg-web` allows the ALB on the health check port too.
- **ALB in one AZ or tiny subnets.** It needs two AZ subnets, each with at least 8 free IPs (a /27 or larger is recommended).
- **User data not re-running.** By default it runs only at first launch; changing it later does nothing for a running instance. Scripts run as root, so skip `sudo`.
- **NLB without a security group.** A security group cannot be added to an NLB created without one.

## Cleanup

Delete in this order so nothing blocks deletion and no charges remain. ELB charges per hour, NAT gateways per hour plus per GB, and public IPv4 addresses (including Elastic IPs) are billed too.

```mermaid
flowchart LR
  A["1 ALB + NLB<br/>(listeners go with them)"] --> B["2 Target groups"]
  B --> C["3 Auto Scaling groups<br/>(if any)"]
  C --> D["4 EC2 instances<br/>web + DB"]
  D --> E["5 NAT gateway"]
  E --> F["6 Release Elastic IPs"]
  F --> G["7 Launch template, SGs,<br/>route entries, VPC"]
```

_Caption: load balancers first, NAT gateway and its Elastic IP last among billable items._

1. Delete the ALB and the NLB (EC2 > Load balancers).
2. Delete both target groups.
3. Terminate web and database instances (and confirm no EBS volumes remain).
4. Delete the NAT gateway and wait until it is `deleted`. This disassociates its Elastic IP but does not release it, and the private route stays as a blackhole until removed.
5. Release every Elastic IP (VPC > Elastic IPs > Release), including the ones used for the NLB.
6. Delete the launch template, then remove the extra security groups (`sg-web`, `sg-alb`, `sg-db`).
7. Delete the lab VPC if you created it only for this lab.

Check Billing > Bills afterwards for NAT, ELB, and public IPv4 lines.

## On the job

- Put only load balancers and NAT gateways in public subnets; keep web and DB in private subnets where possible. The lab's public web instance is for learning.
- A NAT gateway costs money even with no traffic (hourly plus per GB processed). For a one-AZ lab, remember to delete it the same day. Check the [VPC pricing](https://aws.amazon.com/vpc/pricing/) and [ELB pricing](https://aws.amazon.com/elasticloadbalancing/pricing/) pages for current rates.
- ALB bills hours plus LCUs (charged on whichever of new connections, active connections, bytes, or rule evaluations is highest).
- Use security group chaining instead of IP ranges between tiers.
- Use a launch template so every instance is identical; this is the base for Auto Scaling later.

## AWS docs

- [NAT gateway use cases](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-scenarios.html)
- [Security groups for your Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-update-security-groups.html)
- [Health checks for ALB target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
- [Update the Availability Zones for your Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/availability-zones.html)
- [Run commands at launch with EC2 user data](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)

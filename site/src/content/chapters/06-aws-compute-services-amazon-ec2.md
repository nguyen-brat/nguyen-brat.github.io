---
section: 6
title: "AWS Compute Services - Amazon EC2"
part: "Compute & Containers"
kind: concept
status: done
readingTime: 9
lectures: ["Amazon EC2 Intro","Amazon Machine Image (AMI)","Instance Types","Launch Graviton EC2 Instance & Install packages","Using UserData","Using Troubleshooting logs for EC2 instance","Create custom AMI","Launch EC2 instance from custom AMI","Custom AMI and Snapshot pricing","EC2 Image Builder - Hands on","EC2 Image Builder - Distribution Settings","Access EC2 - Using EC2 Instance Connect","AWS Managed Prefix List","AWS Systems Manager - Session Manager Intro","Using SSM Session Manager","Note for New SSM UI","Session Manager Cost?","Using Session Manager for Private instances with AWS NAT Gateway","Access EC2 Access Comparison","Using Launch Template","Configure Default Launch Template Version","Change EC2 Instance Type","EC2 Termination Protection","EC2 Pricing Model Intro","EC2 Pricing Model - On Demands","EC2 Pricing Model - Reserved Instances (RI)","EC2 Pricing Model - Saving Plans (SP)","EC2 Pricing Model - Spot Instances","Dedicated Instance vs Dedicated Host","Dedicated Instance Pricing","Dedicated Host Pricing","Create Spot Fleet Request Demo","Cancel Spot Request Request","Create Dedicated Host Demo","Release Dedicated Host","Create Dedicated Instance Demo","Amazon EC2 Cost Estimation Practice","Resources"]
quiz:
  - question: "Your web server runs on a t3.large and is slow. You want a bigger size of the same EBS-backed instance and can accept a short outage. What is the correct procedure?"
    options:
      - "Stop the instance, change the instance type, then start it again."
      - "Change the instance type while the instance is running; EC2 resizes it live."
      - "Terminate the instance and edit the type on the terminated instance."
      - "Create a new AMI; the type of an existing instance can never change."
    answer: 0
    explanation: >-
      Correct: an EBS-backed instance must be stopped before its type can be changed, and it may get a new public IPv4 address after the start unless you use an Elastic IP.
      "Change while running" is wrong because the instance must be in the stopped state. Terminated instances cannot be edited or started, and making a new AMI is not needed for a simple resize.
  - question: "A private-subnet instance has no public IP and the security group has no inbound rules. The security team forbids SSH keys and bastion hosts, but you still need a shell and an audit trail. What fits best?"
    options:
      - "EC2 Instance Connect from the console, with port 22 open to the EC2 Instance Connect prefix list."
      - "Session Manager, with an instance profile allowing SSM and a route to the SSM endpoints (NAT gateway or VPC endpoints)."
      - "A bastion host in the public subnet with a shared key pair."
      - "Open port 22 to 0.0.0.0/0 for one hour."
    answer: 1
    explanation: >-
      Correct: SSM Agent opens the connection outbound over HTTPS, so no inbound port, key or bastion is needed. The instance needs the AmazonSSMManagedInstanceCore-style permissions and a path to the Systems Manager endpoints.
      EC2 Instance Connect is wrong here because it needs inbound port 22 to be reachable. A bastion with a shared key and a world-open port 22 both break the stated rules.
  - question: "You run a steady 24x7 database server on one m6i.xlarge in one Region for three years, and you do not expect to change the family. You also run a nightly batch that can be restarted at any time. Which pairing is cheapest and sensible?"
    options:
      - "Spot for the database, Reserved Instance or Savings Plan for the batch."
      - "On-Demand for both, because commitments are risky."
      - "Reserved Instance or Savings Plan for the database, Spot for the batch."
      - "Dedicated Host for both, because it is always cheaper."
    answer: 2
    explanation: >-
      Correct: a steady, predictable workload suits a 1 or 3 year commitment, and an interruptible job suits Spot, which can be reclaimed with a two-minute notice.
      Spot for the database is wrong because an interruption would take the database down. Dedicated Hosts are for licensing or compliance needs and are not automatically cheaper.
  - question: "Your company has per-socket Windows Server licences it wants to reuse on AWS and must report on physical cores. Which option do you choose?"
    options:
      - "Dedicated Instances, because they give socket and core visibility."
      - "Spot Instances with a high maximum price."
      - "Dedicated Hosts, because you see sockets, cores and host ID and control placement."
      - "On-Demand Instances in a separate account."
    answer: 2
    explanation: >-
      Correct: a Dedicated Host is a whole physical server with visibility of sockets and cores and with instance placement control, which is what server-bound licences require.
      Dedicated Instances are wrong because they give hardware isolation but no host-level visibility or affinity. A separate account does not change the underlying shared hardware.
  - question: "You put a bootstrap script in User data that installs nginx. After you stop and start the instance, the script does not run again. Where do you look first if the first run also failed?"
    options:
      - "The EC2 status checks, since they record script errors."
      - "AWS CloudTrail, since it stores the script output."
      - "The OS-level logs on the instance, such as /var/log/cloud-init-output.log on Linux."
      - "The AMI, since scripts are stored inside it."
    answer: 2
    explanation: >-
      Correct: User data is run by an agent inside the OS (cloud-init on Linux), so its output lives in OS logs. By default it runs only on the first boot.
      Status checks only report reachability and system health, not script output. CloudTrail records API calls, not what a script printed.
---

## What it is

Amazon EC2 rents you virtual servers (instances) in a Region. You choose an image (AMI), a size (instance type), a network and a way to log in, and AWS starts the machine.

```mermaid
flowchart LR
  AMI["💿 AMI<br/>OS + software"] --> L["🚀 Launch"]
  IT["📏 Instance type<br/>CPU / RAM / network"] --> L
  UD["📝 User data<br/>boot script"] --> L
  L --> I["🖥️ Instance<br/>in a subnet + security group"]
  I --> V["🗄️ EBS volume"]
  I -. "snapshot" .-> AMI2["💿 Custom AMI"]
```
*An instance is an AMI plus a type plus settings; a custom AMI is made from a running instance.*

Use it when you need full control of the OS, long-running servers, licensed software or custom networking. For event-driven code or containers see [Lambda and containers](/chapters/08-aws-computes-aws-lambda-and-containers/).

## Key concepts

### Instance lifecycle and termination protection

```mermaid
stateDiagram-v2
  [*] --> pending: launch
  pending --> running
  running --> rebooting: reboot
  rebooting --> running
  running --> stopping: stop / hibernate
  stopping --> stopped
  stopped --> pending: start
  running --> shutting_down: terminate
  stopped --> shutting_down: terminate
  shutting_down --> terminated
  terminated --> [*]
```
*Compute billing applies in `running` only; a terminated instance cannot be restarted.*

- Stopped instances keep their EBS volumes (you still pay for storage). Stop and start may move the instance to new hardware and change a non-Elastic public IPv4.
- **Termination protection** (`DisableApiTermination`) blocks API/console termination. It does not stop an OS shutdown when shutdown behaviour is "terminate", does not stop Auto Scaling scale-in, and is not available for Spot Instances.
- **Change instance type**: stop, change type, start. Not possible for Spot Instances; plan for downtime.

### AMI, custom AMI and snapshots

- An AMI is the template (OS, software, volume layout). Creating an AMI from an instance snapshots its EBS volumes; by default the instance reboots for consistency (`NoReboot` risks filesystem integrity).
- Instance store data is not copied into the AMI.
- **Cost**: you pay for the snapshots behind an AMI until you deregister the AMI and delete the snapshots. Check current snapshot prices on the [EBS pricing page](https://aws.amazon.com/ebs/pricing/).
- Hands-on flow: launch, install packages, create image, launch a new instance from the custom AMI, then clean up AMI and snapshots.

```mermaid
flowchart LR
  P["⏰ Schedule or manual run"] --> R["📋 Image recipe<br/>base image + components"]
  R --> B["🔨 Build + test instance<br/>(infrastructure config)"]
  B --> A["💿 New AMI"]
  A --> D["🌍 Distribution settings<br/>Regions, accounts, launch template"]
```
*EC2 Image Builder automates the custom-AMI loop as a pipeline.*

- **Image Builder** pipeline = recipe (base image + build/test components) + infrastructure configuration (where the build runs) + distribution settings (where the AMI goes, e.g. other Regions or accounts) + optional schedule.

### Instance types and Graviton

| Name part | Meaning | Example |
| --- | --- | --- |
| First letter | Series: M general, C compute, R memory, T burstable, I storage, G/P GPU | `m` |
| Number | Generation | `7` |
| Option letters | `g` Graviton, `a` AMD, `i` Intel, `d` local disk, `n` network | `g` |
| After the dot | Size | `large`, `4xlarge` |

- `m7g.large` is general purpose, 7th generation, Graviton (Arm). Pick an Arm64 AMI for Graviton; your software must support Arm.
- Pick by bottleneck: CPU (C), RAM (R), balanced (M), spiky and cheap (T).

### User data and troubleshooting

- User data is a script or cloud-init config passed at launch. On Linux cloud-init runs it, by default only on the first boot.
- It runs as root and its output goes to OS logs, not to the EC2 console.

```bash
#!/bin/bash
dnf install -y nginx
systemctl enable --now nginx
# debug: sudo cat /var/log/cloud-init-output.log
```

- Troubleshooting order: check status checks, **Monitor and troubleshoot > Get system log / screenshot** in the console, then cloud-init logs on the box.

### Launch templates

- A launch template stores AMI, type, key, security groups, user data and tags as numbered versions.
- Console and Auto Scaling can pick a specific version, `$Latest` or `$Default`. If you do not specify a version, the default is used.
- To roll forward: create a new version, then **Set default version**. See [Auto Scaling](/chapters/26-aws-auto-scaling/).

### Ways to access an instance

```mermaid
sequenceDiagram
  participant U as 👤 You
  participant S as ☁️ AWS service
  participant I as 🖥️ Instance
  Note over U,I: EC2 Instance Connect
  U->>S: IAM call pushes temp public key
  S->>I: SSH on port 22 (from EIC prefix list)
  Note over U,I: Session Manager
  I->>S: SSM Agent connects out on 443
  U->>S: IAM-authorised session
  S-->>I: shell over the existing connection
```
*Instance Connect needs inbound port 22; Session Manager needs no inbound port.*

- **Instance Connect** needs a supported Linux with the package installed, IAM permission to push the key, and port 22 allowed from the service range.
- **AWS-managed prefix list**: a named set of CIDRs maintained by AWS, for example `com.amazonaws.<region>.ec2-instance-connect`. Use it as a security group source instead of typing IP ranges. You cannot edit it, and a referenced list counts toward the rule quota by its weight (see the VPC docs).
- **Session Manager** needs: SSM Agent, an instance profile with the `AmazonSSMManagedInstanceCore` policy, and outbound HTTPS to the `ssm`, `ssmmessages` and `ec2messages` endpoints.
- **Private instances**: give them a route through a NAT gateway, or create the three VPC interface endpoints (no internet needed). See [Networking basics](/chapters/05-networking-basic/).
- **Cost**: Session Manager has no extra charge for EC2 instances (check the [pricing page](https://aws.amazon.com/systems-manager/pricing/)); a NAT gateway or interface endpoints do cost money.
- The Systems Manager console UI has been redesigned; the same features exist, so search by name (Session Manager, Fleet Manager) if menus differ from a tutorial.

### Pricing models

```mermaid
flowchart TD
  Q{"Workload?"}
  Q -->|"Unknown or short"| OD["On-Demand<br/>per-second, no commitment"]
  Q -->|"Steady, 1 or 3 years"| C{"Flexible on type?"}
  C -->|"Yes, any Region/family"| CSP["Compute Savings Plan"]
  C -->|"One family in a Region"| ISP["EC2 Instance Savings Plan"]
  C -->|"Fixed config / AZ capacity"| RI["Reserved Instance"]
  Q -->|"Can be interrupted"| SP["Spot<br/>2-minute notice"]
  Q -->|"Licence or compliance"| DED["Dedicated Host / Instance"]
```
*Commit for what is steady, use Spot for what can stop, pay On-Demand for the rest.*

| Option | You commit to | Notes |
| --- | --- | --- |
| On-Demand | Nothing | Per-second billing on Linux; flexible |
| Savings Plans | $ per hour for 1 or 3 years | Compute SP spans Region, family, OS, tenancy and also covers Fargate and Lambda; EC2 Instance SP is one family in a Region with a larger discount |
| Reserved Instances | Instance configuration and Region, 1 or 3 years | Standard or Convertible; All, Partial or No Upfront |
| Spot | Nothing | Spare capacity, can be interrupted with a two-minute notice; default action is terminate |

- Discount percentages change; read them on the [EC2 pricing page](https://aws.amazon.com/ec2/pricing/).
- **Spot demo flow**: request a Spot Fleet, check its instances, then cancel the request. Cancelling can also terminate the instances (`--terminate-instances`) or leave them running (`--no-terminate-instances`).

### Dedicated Hosts and Dedicated Instances

| | Dedicated Instance | Dedicated Host |
| --- | --- | --- |
| Hardware | Single-tenant, per customer | Whole physical server |
| Billing | Per instance (plus a per-Region fee) | Per host, whatever runs on it |
| Sockets, cores, host ID visible | No | Yes |
| Placement control and affinity | No | Yes |
| Bring server-bound licences | No | Yes |

- Release a Dedicated Host only after every instance on it is stopped or terminated; billing for an On-Demand host stops on release.
- Dedicated Instances can share hardware with your own non-dedicated instances.
- Prices: see the [Dedicated Hosts](https://aws.amazon.com/ec2/dedicated-hosts/pricing/) and [Dedicated Instances](https://aws.amazon.com/ec2/pricing/dedicated-instances/) pages.

### Cost estimation practice

Estimate with the [AWS Pricing Calculator](https://calculator.aws/): instance hours x rate, plus EBS volumes, snapshots, public IPv4 addresses, NAT gateway and data transfer. Compare On-Demand against a Savings Plan for the steady part.

## X vs Y

| Access method | Inbound port | Key pair | Needs internet/NAT | Audit | Best for |
| --- | --- | --- | --- | --- | --- |
| SSH with key | 22 from your IP | Yes | Public IP or VPN | Weak | Quick tests |
| EC2 Instance Connect | 22 from the EIC prefix list | No (temp key) | Public reachability | IAM + CloudTrail | Browser access to public instances |
| Session Manager | None | No | Outbound 443 or VPC endpoints | Session logging options | Private instances, no bastion |

Pick Session Manager when the instance is private or the rules forbid open ports. Pick Instance Connect for quick browser access to a public Linux instance. Use SSH keys only when a tool needs raw SSH.

## Job notes

```mermaid
flowchart LR
  G["🛠️ Configure once"] --> I2["💿 Golden AMI<br/>(Image Builder)"]
  I2 --> LT["📋 Launch template<br/>new version"]
  LT --> ASG["📈 Fleet / Auto Scaling"]
  ASG --> SSM["🔒 Session Manager"]
```
*Bake software into an AMI, launch from a template, log in with Session Manager.*

- Prefer bake-in (AMI) for slow installs and user data for small, instance-specific config.
- Attach roles through an instance profile, never keys in the instance. See [IAM](/chapters/04-aws-identity-and-access-management-iam/).
- Stop idle instances, but remember EBS, snapshots and Elastic IP/public IPv4 still cost money.
- Delete old AMIs and their snapshots; deregistering the AMI alone leaves the snapshots billing.
- Turn on termination protection for important single servers.
- Cannot SSH? Check security group, route to the internet gateway, key pair and the instance's status checks.
- Session Manager instance missing from the console? Check the instance profile, the three endpoints or NAT route, and that SSM Agent runs.
- Change type, change user data and similar edits need the instance to be stopped.

## Cheat sheet

- Lifecycle: pending, running, stopping, stopped, shutting-down, terminated; compute billed when running.
- AMI = snapshots + metadata; snapshots keep billing until deleted.
- Type name `m7g.large`: series, generation, option, size.
- User data: first boot only by default; logs at `/var/log/cloud-init-output.log`.
- Launch template: versions, with a default version.
- Resize: stop, modify, start.
- Access: Instance Connect (port 22, prefix list), Session Manager (no inbound port, IAM + SSM Agent + endpoints).
- Pricing: On-Demand, Savings Plans, Reserved, Spot (2-minute warning).
- Dedicated Host = licence and compliance, per host; Dedicated Instance = isolation, per instance.
- Always check current prices and quotas on the AWS pages.

## AWS docs

- [Amazon EC2 billing and purchasing options](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html)
- [Instance type naming conventions](https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-type-names.html)
- [Run commands at launch with user data](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)
- [Change the instance type](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/change-instance-type-of-ebs-backed-instance.html)
- [Termination protection](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_ChangingDisableAPITermination.html)

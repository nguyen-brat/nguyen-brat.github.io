---
section: 32
title: "AWS Networking Services - Hybrid Connections"
part: "Advanced Networking & Data Transfer"
kind: concept
status: done
readingTime: 8
lectures: ["AWS Site-To-Site VPN","AWS Direct Connect","AWS S2S VPN vs Direct Connect","Resources"]
quiz:
  - question: "You create a Site-to-Site VPN connection. How many tunnels does AWS give you, and what should you do with them?"
    options:
      - "One tunnel; add a second VPN connection for backup"
      - "Two tunnels in different Availability Zones; configure both on your customer gateway device"
      - "Two tunnels; use only one because the other is reserved for AWS maintenance"
      - "Four tunnels, two per direction"
    answer: 1
    explanation: "Each connection has two tunnels ending in different AZs, and AWS maintenance can briefly disable one. Configure both so failover is automatic; leaving one unused removes the redundancy."
  - question: "A VPN connection must be up this week, with no hardware to order, to link a branch office to one VPC. Which option fits?"
    options:
      - "Direct Connect dedicated connection"
      - "Site-to-Site VPN with a virtual private gateway"
      - "Client VPN endpoint"
      - "Direct Connect gateway"
    answer: 1
    explanation: "Site-to-Site VPN runs over the internet and is set up in minutes with a customer gateway device. Direct Connect needs a physical circuit and takes much longer; Client VPN is for individual users, not sites."
  - question: "A company has 50 remote engineers who need laptop access to private subnets. What should you use?"
    options:
      - "AWS Client VPN"
      - "Site-to-Site VPN, one connection per engineer"
      - "Direct Connect hosted connection"
      - "VPC peering"
    answer: 0
    explanation: "Client VPN is a managed, OpenVPN-based service for individual users. Site-to-Site VPN joins whole networks, not laptops."
  - question: "A Direct Connect link must reach VPCs in three Regions through one private virtual interface. What do you add?"
    options:
      - "A public virtual interface"
      - "One hosted connection per Region"
      - "A Direct Connect gateway"
      - "VPC peering between the Regions"
    answer: 2
    explanation: "A Direct Connect gateway is a global resource that lets one private VIF reach VPCs in many Regions (not China). A public VIF reaches public AWS services, not private VPC addresses."
  - question: "Compliance requires encrypted traffic, and the link must be live during a Direct Connect outage. What is a common design?"
    options:
      - "Direct Connect as primary, Site-to-Site VPN as backup"
      - "Two VPN connections to the same device"
      - "Direct Connect only; it is encrypted by default"
      - "Client VPN as backup for the data center"
    answer: 0
    explanation: "Direct Connect gives steady performance and the VPN gives a fast, encrypted backup path. Direct Connect is private but not encrypted by default (use MACsec or VPN over it)."
---

## What it is

**Hybrid connectivity** joins your on-premises network (data center, office, laptops) to your VPCs. AWS offers three tools: **Site-to-Site VPN** (encrypted tunnels over the internet), **Direct Connect** (a dedicated private circuit) and **Client VPN** (single users, from anywhere). VPC basics are in [Networking Basic](/chapters/05-networking-basic/).

```mermaid
flowchart LR
  OFF["🏢 Office / DC"] -->|"🔒 IPsec over internet"| VPN["Site-to-Site VPN"]
  OFF -->|"🧵 private fibre"| DX["Direct Connect"]
  USER["👤 Laptop"] -->|"🔑 OpenVPN"| CVPN["Client VPN"]
  VPN --> VPC["☁️ VPC"]
  DX --> VPC
  CVPN --> VPC
```
*Three ways in: site by VPN, site by dedicated line, user by client.*

Use them when workloads span on-premises and AWS, or staff need private access to VPC resources.

## Key concepts

### Site-to-Site VPN

A VPN connection has two tunnels between AWS and your side. The pieces:

```mermaid
flowchart LR
  subgraph ONP["🏢 On-premises"]
    LAN["LAN"] --- CGWD["Customer gateway device 🖥️"]
  end
  CGWD <-->|"tunnel A (AZ 1)"| VGW
  CGWD <-->|"tunnel B (AZ 2)"| VGW
  subgraph AWS["☁️ AWS"]
    VGW["Virtual private gateway"] --- VPC["VPC"]
  end
```
*One VPN connection = two encrypted tunnels from your device to the virtual private gateway.*

- **Virtual private gateway (VGW):** the AWS-side VPN endpoint, attached to one VPC. A **transit gateway** can be the AWS side instead, to serve many VPCs.
- **Customer gateway (CGW):** an AWS resource that tells AWS about your device (mainly its public IP). The **customer gateway device** is the real router or firewall you configure yourself.
- **Tunnels:** two per connection, in different Availability Zones. If one fails or AWS does maintenance, traffic moves to the other, so configure both.
- **Routing:** use **dynamic (BGP)** if your device supports it (better failure detection, automatic routes); otherwise **static** routes. Enable route propagation in the VPC route table.
- **Bandwidth:** standard tunnel is about 1.25 Gbps; larger tunnels exist on Transit Gateway or Cloud WAN. ECMP across tunnels needs Transit Gateway and BGP. Check current quotas.

Setup steps: create VGW and attach to VPC, create CGW with your public IP, create VPN connection, download the config for your device, apply it, enable route propagation.

```bash
aws ec2 create-customer-gateway --type ipsec.1 --public-ip 203.0.113.12 --bgp-asn 65000
aws ec2 create-vpn-gateway --type ipsec.1
aws ec2 attach-vpn-gateway --vpn-gateway-id vgw-123 --vpc-id vpc-123
aws ec2 create-vpn-connection --type ipsec.1 --customer-gateway-id cgw-123 --vpn-gateway-id vgw-123
```

### Direct Connect

Direct Connect is a physical link from your network to AWS at a Direct Connect location. You then create **virtual interfaces (VIFs)**, each a VLAN with a BGP session.

```mermaid
flowchart LR
  ON["🏢 On-premises router"] ---|"🧵 cross-connect"| LOC["Direct Connect location"]
  LOC -->|"Private VIF"| DXGW["Direct Connect gateway"]
  LOC -->|"Public VIF"| PUB["🪣 Public AWS services (S3...)"]
  LOC -->|"Transit VIF"| DXGW
  DXGW --> VGW1["VGW + VPC (Region 1)"]
  DXGW --> VGW2["VGW + VPC (Region 2)"]
  DXGW --> TGW["Transit Gateway"]
```
*One physical link, several VIFs, one Direct Connect gateway to reach many VPCs and Regions.*

| Connection type | Who provides it | Speeds | Notes |
|---|---|---|---|
| Dedicated | AWS gives you a port; you or a provider run the cross-connect | Whole ports (check current options) | Many VIFs allowed; can group into a LAG |
| Hosted | A Direct Connect Partner | From 50 Mbps up to 25 Gbps, partner-dependent | Exactly one VIF per hosted connection; set up in a short time |

| VIF | Reaches |
|---|---|
| Private | A VPC by private IP (via VGW or Direct Connect gateway) |
| Public | Public AWS services by public IP |
| Transit | Transit Gateways via a Direct Connect gateway |

- **Direct Connect gateway:** a global resource; one private VIF can reach VPCs in many Regions (not China). It does not allow VPC-to-VPC traffic through it, and the VPC CIDRs cannot overlap.
- **Hosted VIF:** lets another AWS account use your connection; they must accept it.
- **Not encrypted by default.** Add **MACsec** (layer 2, selected high-speed dedicated connections) or run a Site-to-Site VPN over Direct Connect for end-to-end encryption.
- **Resilience:** one link is a single point of failure. Use a second connection at another location, or a VPN as backup.

### Client VPN

A managed, OpenVPN-based service so individual users reach VPC and on-premises resources.

```mermaid
sequenceDiagram
  participant U as 👤 Laptop (OpenVPN client)
  participant E as Client VPN endpoint
  participant S as Subnet (target network)
  participant R as 🗄️ Private resource
  U->>E: Connect (certificate / AD / SAML auth)
  E->>E: Check authorization rules
  E->>S: Traffic via associated subnet
  S->>R: Private IP access
```
*Users authenticate at the regional endpoint, rules decide what they reach.*

- **Endpoint:** regional; you associate it with subnets (target networks) and add routes and authorization rules.
- **Authentication:** mutual certificates, directory, or federated (SAML).

## X vs Y

VPN vs Direct Connect:

| | Site-to-Site VPN | Direct Connect |
|---|---|---|
| Path | Internet (encrypted IPsec) | Dedicated private circuit |
| Encryption | Yes, built in | No by default (MACsec or VPN over it) |
| Setup time | Minutes | Slower: circuit, partner, cross-connect |
| Performance | Varies with the internet; about 1.25 Gbps per standard tunnel | Consistent, higher bandwidth |
| Cost | Hourly per connection plus data out (check pricing) | Port-hours plus data out; usually cheaper per GB at volume (check pricing) |
| Redundancy | Two tunnels built in | You must build it (second link) |
| Best for | Quick start, small sites, backup | Steady, large or latency-sensitive traffic |

Pick **VPN** when you need connectivity fast, bandwidth is modest, or as a backup. Pick **Direct Connect** when you need steady throughput and low jitter, or move lots of data. Pick **Client VPN** for people, not sites.

```mermaid
flowchart TD
  Q1{"Users or sites?"} -->|"Users"| C["Client VPN"]
  Q1 -->|"Sites"| Q2{"Need steady high bandwidth?"}
  Q2 -->|"No / need it now"| V["Site-to-Site VPN"]
  Q2 -->|"Yes"| D["Direct Connect"]
  D --> Q3{"Must stay up if link fails?"}
  Q3 -->|"Yes"| B["Add 2nd DX or VPN backup"]
```
*Decision path for hybrid connectivity.*

## Job notes

- **Backup pattern:** Direct Connect primary, VPN backup; BGP prefers the Direct Connect path in the common design, so test failover.
- **Encryption needed over Direct Connect:** run IPsec VPN on top, or use MACsec where supported.
- **Many VPCs:** attach VPN or Direct Connect to a Transit Gateway (transit VIF) instead of one link per VPC. See [VPC peering](/chapters/30-aws-networking-services-vpc-peering/) for why peering cannot share these links.
- **VPN troubleshooting:** tunnel DOWN means check IKE settings and public IP on the CGW; tunnel UP but no traffic means routes (propagation, BGP advertisements), security groups, NACLs.
- **Overlapping CIDRs** between on-premises and VPC break routing; plan ranges first.
- **Cost traps:** idle Client VPN endpoints and VPN connections bill by the hour; Direct Connect ports bill even when idle. Check current pricing.

## Cheat sheet

- Site-to-Site VPN = VGW (or TGW) + customer gateway + device; 2 tunnels in different AZs; BGP preferred.
- Direct Connect = dedicated or hosted connection + VIFs (private, public, transit); hosted = 1 VIF each.
- Direct Connect gateway = one VIF to VPCs in many Regions; no VPC-to-VPC through it, no overlapping CIDRs.
- Direct Connect is private, not encrypted by default: MACsec or VPN over it.
- Client VPN = managed OpenVPN for users; endpoint + target subnets + auth rules.
- Fast and cheap start: VPN. Steady and big: Direct Connect. Resilient: both.

## AWS docs

- [What is AWS Site-to-Site VPN?](https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html)
- [AWS Site-to-Site VPN customer gateway devices](https://docs.aws.amazon.com/vpn/latest/s2svpn/your-cgw.html)
- [Direct Connect virtual interfaces](https://docs.aws.amazon.com/directconnect/latest/UserGuide/WorkingWithVirtualInterfaces.html)
- [Direct Connect gateways](https://docs.aws.amazon.com/directconnect/latest/UserGuide/direct-connect-gateways-intro.html)
- [What is AWS Client VPN?](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/what-is.html)

---
section: 31
title: "AWS Networking Services - AWS Transit Gateway"
part: "Advanced Networking & Data Transfer"
kind: concept
status: done
readingTime: 7
lectures: ["Intro","AWS Transit Gateway Demo","Transit Gateway Peering Demo","Clean Up!","Resources"]
quiz:
  - question: "You have 30 VPCs and one Site-to-Site VPN. You want every VPC to reach on-premises and each other without a mesh. What do you build?"
    options:
      - "30 VPC peering connections, each with its own VPN"
      - "One Transit Gateway with a VPC attachment per VPC and one VPN attachment"
      - "A PrivateLink endpoint in each VPC"
      - "A NAT gateway in each VPC"
    answer: 1
    explanation: "Transit Gateway is a regional hub: each network attaches once and routes through the hub. Peering would need a mesh and cannot share a VPN."
  - question: "Dev and Prod VPCs are both attached to a Transit Gateway. Dev must NOT reach Prod, but both must reach a Shared Services VPC. What achieves this?"
    options:
      - "Security groups on the Transit Gateway"
      - "Separate TGW route tables: Dev and Prod associated to tables that only contain the Shared Services route; Shared Services table has both"
      - "Delete the default route table"
      - "Peer Dev and Prod to each other"
    answer: 1
    explanation: "Segmentation is done with association and propagation. Dev and Prod tables hold only the shared route, so they have no route to each other. Security groups are not attached to a Transit Gateway."
  - question: "A VPC is attached to the Transit Gateway, but its instances cannot reach other VPCs even though the TGW route table has the right routes. What is a likely missing piece?"
    options:
      - "A route in the VPC subnet route table pointing the other CIDRs to the Transit Gateway"
      - "An Elastic IP on the Transit Gateway"
      - "A second Transit Gateway"
      - "An internet gateway"
    answer: 0
    explanation: "The attachment only connects the VPC to the hub. The VPC route tables still need routes with the Transit Gateway as target. An internet gateway is not involved."
  - question: "You peer Transit Gateways in two Regions and accept the request. Traffic still does not flow. What is required?"
    options:
      - "Nothing, routes propagate over peering automatically"
      - "A static route in each TGW route table pointing the remote CIDR to the peering attachment"
      - "A VPN between the two gateways"
      - "Overlapping CIDRs on both sides"
    answer: 1
    explanation: "Peering attachments use static routes; the docs say to add a static route that targets the peering attachment. Routes are not propagated over it."
  - question: "Two VPCs both use 10.0.0.0/16 and need to connect. Which statement is right?"
    options:
      - "Transit Gateway routes overlapping CIDRs by default"
      - "A transit gateway cannot route overlapping ranges; re-address or expose a service with PrivateLink"
      - "Peering supports overlapping CIDRs but Transit Gateway does not"
      - "Add a static /32 route and it works"
    answer: 1
    explanation: "Neither peering nor Transit Gateway can route between overlapping ranges. PrivateLink works because it exposes one service, not the whole network."
---

## What it is

**AWS Transit Gateway (TGW)** is a managed, regional router that connects many VPCs and on-premises networks through one hub. Each network is plugged in once with an **attachment**, instead of being linked to every other network. It supports transitive routing, which VPC peering ([previous chapter](/chapters/30-aws-networking-services-vpc-peering/)) does not. VPC basics are in [Networking Basic](/chapters/05-networking-basic/).

```mermaid
flowchart LR
  A["☁️ VPC A"] --- TGW(("🔀 Transit Gateway"))
  B["☁️ VPC B"] --- TGW
  C["☁️ VPC C"] --- TGW
  TGW --- VPN["🏢 Site-to-Site VPN"]
  TGW --- DX["🏢 Direct Connect gateway"]
  TGW --- P["🌍 Peer TGW (other Region)"]
```
*Hub and spoke: every network attaches once, the hub routes between them.*

Use it when you have many VPCs, need on-premises shared by all, or need to control who can talk to whom.

## Key concepts

### Attachments

An attachment is the plug between a network and the TGW. Supported types include VPC, VPN, Direct Connect gateway, peering with another TGW, Connect (SD-WAN appliance), and Client VPN.

- **VPC attachment:** you pick one subnet per Availability Zone. The TGW places a network interface (one IP) in each chosen subnet. Use at least two AZs for availability. An AZ with no subnet in the attachment cannot reach the TGW.
- Attachments in another account need to be shared (via AWS RAM) and accepted, unless auto-accept is on.
- Attaching is only half the job: the **VPC route tables** still need routes whose target is the TGW.

```mermaid
sequenceDiagram
  participant V as VPC subnet
  participant R as VPC route table
  participant T as Transit Gateway
  participant D as Other VPC
  V->>R: dst 10.2.0.0/16?
  R->>T: route: 10.2.0.0/16 -> tgw-id
  T->>T: lookup in TGW route table of source attachment
  T->>D: forward via destination attachment
```
*Two route lookups: first the VPC table, then the TGW table.*

### Route tables, association, propagation

A TGW has a default route table and can have more. Two verbs control everything:

| Term | Meaning |
|---|---|
| **Association** | An attachment is tied to exactly one route table. That table decides where its traffic goes. A table can have many associations |
| **Propagation** | An attachment advertises its routes (VPC CIDRs, BGP routes from VPN/DX) into a table. One attachment can propagate to many tables |
| **Static route** | Added by hand, for example to a peering attachment. Wins over a propagated route with the same destination |

```mermaid
flowchart LR
  subgraph Att["Attachments"]
    VA["VPC A"]
    VB["VPC B"]
  end
  VA -- "associated to" --> RT["📋 Route table"]
  VB -- "associated to" --> RT
  VA -. "propagates 10.1.0.0/16" .-> RT
  VB -. "propagates 10.2.0.0/16" .-> RT
```
*Association = "which table do I use"; propagation = "which tables learn my routes".*

### Segmentation

With the default table (all attachments associated and propagating) everything reaches everything. For isolation, create several tables and control propagation. You do not need one table per VPC.

```mermaid
flowchart LR
  Dev["Dev VPC"] --> RTD["Table: Spoke"]
  Prod["Prod VPC"] --> RTD
  Shared["🛠️ Shared Services VPC"] --> RTS["Table: Shared"]
  Shared -. "propagates to" .-> RTD
  Dev -. "propagates to" .-> RTS
  Prod -. "propagates to" .-> RTS
```
*Dev and Prod are associated to the Spoke table, which only knows Shared Services. They cannot see each other.*

### Peering and inter-Region

TGWs in the same or different Regions (and accounts) can be peered. The owner of the other TGW must accept the request. Then add a **static route** in the TGW route table that points to the peering attachment, on both sides.

```mermaid
flowchart LR
  subgraph R1["Region 1"]
    V1["VPC 10.1.0.0/16"] --- T1(("TGW 1"))
  end
  subgraph R2["Region 2"]
    V2["VPC 10.2.0.0/16"] --- T2(("TGW 2"))
  end
  T1 <-->|"🔗 peering attachment (static routes)"| T2
```
*Inter-Region: one TGW per Region, joined by peering; routes are static.*

- Use a unique ASN per TGW (recommended in the docs).
- Inter-Region traffic is encrypted and stays on the AWS backbone.
- DNS name resolution of private names across a TGW peering is not supported by Route 53 Resolver in the other Region; use IPs or other DNS design.
- Use blackhole routes for prefixes the other side must not reach.

### Demo recap (VPC attachments, then peering)

1. Create the TGW (VPC console, Transit gateways, Create). Note the ASN and the default association/propagation options.
2. Create a VPC attachment per VPC: pick the VPC and one subnet per AZ. Wait for `available` (accept if cross-account).
3. In each VPC route table, add the other CIDRs with target the TGW.
4. Allow ICMP/HTTP in security groups from the peer CIDRs; ping private IPs.
5. For the peering demo: create a TGW in a second Region, create a **peering attachment**, accept it there, then add static routes in both TGW route tables.
6. **Clean up** in this order: delete VPC routes to the TGW, delete peering attachment, delete VPC attachments (wait until `deleted`), then delete the TGW and the test instances.

```bash
aws ec2 create-transit-gateway --description lab
aws ec2 create-transit-gateway-vpc-attachment \
  --transit-gateway-id tgw-123 --vpc-id vpc-aaa --subnet-ids subnet-a subnet-b
aws ec2 create-route --route-table-id rtb-aaa \
  --destination-cidr-block 10.2.0.0/16 --transit-gateway-id tgw-123
```

## X vs Y

Transit Gateway vs VPC peering vs PrivateLink:

| | Transit Gateway | VPC peering | PrivateLink |
|---|---|---|---|
| Model | Hub and spoke | Point to point | One service to consumers |
| Transitive routing | Yes | No | n/a |
| On-premises sharing | Yes (VPN/DX attached once) | No | No |
| Segmentation | TGW route tables | Security groups, routes | Per service |
| Overlapping CIDR | No | No | Yes |
| Cost | Hourly per attachment plus per-GB processing (check pricing) | No hourly fee; cross-AZ/Region data charged | Hourly per endpoint plus data (check pricing) |
| Latency | Extra hop | Lowest | Test it |
| Scale | Very large, regional quota on attachments (check quota) | Mesh gets hard to manage | Many consumers |

Pick **Transit Gateway** when you have many VPCs, hybrid links to share, or need segmentation. Pick **VPC peering** when two or a few VPCs need cheap, fast, direct links. Pick **PrivateLink** to expose one service, or when CIDRs overlap. They can be combined: peering for a high-throughput pair, TGW for shared services.

## Job notes

- **Plan CIDRs first**: a TGW cannot route overlapping ranges.
- **Troubleshoot in order:** attachment `available`, VPC route table to TGW, association, TGW route table has the destination (propagation on?), security groups/NACLs, return path.
- **Centralised egress or inspection:** route through a shared VPC with NAT or a firewall. For inspection set appliance mode on that VPC attachment to keep traffic symmetric.
- **Cost traps:** you pay per attachment-hour and per GB processed, so chatty VPC pairs may be cheaper with peering. Check current pricing.
- **Multi-account:** create the TGW in a network account and share it with AWS RAM.
- **Prefer segmentation by propagation** over many tables; remember static routes beat propagated ones.

## Cheat sheet

- TGW = regional hub router; attach VPC, VPN, DX gateway, peering, Connect.
- VPC attachment: one subnet per AZ; still add routes to the TGW in VPC route tables.
- Association: one table per attachment. Propagation: advertise routes into tables.
- Default table = everything talks; extra tables + propagation = segmentation.
- Peering (same or other Region/account): accept, then static routes both sides.
- No overlapping CIDRs. Not for DNS across peering.
- Clean up: routes, peering, attachments, then the TGW.

## AWS docs

- [What is AWS Transit Gateway?](https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html)
- [Transit gateway route tables](https://docs.aws.amazon.com/vpc/latest/tgw/tgw-route-tables.html)
- [Transit gateway peering attachments](https://docs.aws.amazon.com/vpc/latest/tgw/tgw-peering.html)
- [Communicating across VPCs and Regions (peering vs TGW)](https://docs.aws.amazon.com/prescriptive-guidance/latest/secure-outbound-network-traffic/vpc-region-communication.html)

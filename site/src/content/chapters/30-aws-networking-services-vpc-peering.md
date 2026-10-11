---
section: 30
title: "AWS Networking Services - VPC Peering"
part: "Advanced Networking & Data Transfer"
kind: concept
status: done
readingTime: 7
lectures: ["Intro","VPC Peering Pricing - Data Transfer","VPC Peering Demo - Setup","VPC Peering Demo - Web Server","VPC Peering Demo - Create Peering Connection & Route Table","Verify Speed via Peering Connection in Same Region","Verify Speed via Peering Connection in Cross Region","VPC Peering - Pros & Cons","Resources"]
quiz:
  - question: "VPC A is peered with VPC B, and VPC B is peered with VPC C. An instance in A tries to reach an instance in C. What happens?"
    options:
      - "It works, traffic transits through B"
      - "It fails; peering is not transitive, so A and C need their own peering connection"
      - "It works only if B has an internet gateway"
      - "It works if you add a route in A pointing to B's peering connection"
    answer: 1
    explanation: "Peering is point-to-point only; traffic cannot pass through an intermediary VPC. A route to B's connection does not change that."
  - question: "You create a peering request to a VPC with the same 10.0.0.0/16 range as yours. What is the result?"
    options:
      - "It works if you add specific /32 routes"
      - "The connection is created but only IPv6 works"
      - "The request fails because the CIDR blocks overlap"
      - "AWS translates the addresses with NAT"
    answer: 2
    explanation: "VPCs with matching or overlapping CIDR blocks cannot be peered. Re-address one VPC, or use PrivateLink, which tolerates overlapping ranges."
  - question: "The peering connection is active, but pings between instances in the two VPCs time out. Security groups allow the traffic. What is the most likely missing piece?"
    options:
      - "A NAT gateway in each VPC"
      - "A route to the peer CIDR via the peering connection in the route tables"
      - "An Elastic IP on each instance"
      - "Accepting the request a second time"
    answer: 1
    explanation: "Active peering creates no routes. Each side needs a route whose destination is the peer VPC CIDR and whose target is the peering connection (pcx-...). NAT is not involved."
  - question: "Which traffic over a peering connection is free of data transfer charges?"
    options:
      - "Traffic that stays within one Availability Zone"
      - "Any traffic between accounts"
      - "Any traffic within one Region"
      - "Traffic between Regions"
    answer: 0
    explanation: "Same-AZ traffic over peering is free even across accounts. Cross-AZ and cross-Region traffic is charged, so inter-Region is the most expensive choice."
  - question: "Fifty VPCs must all talk to each other and to on-premises through one VPN. Which fits best?"
    options:
      - "A full mesh of VPC peering connections"
      - "PrivateLink endpoints in every VPC"
      - "A Transit Gateway"
      - "Peering plus the VPN in one VPC"
    answer: 2
    explanation: "Transit Gateway is a hub that supports transitive routing and shared hybrid links. Peering would need a mesh and cannot use a peer's VPN."
---

## What it is

A **VPC peering connection** is a private, direct link between two VPCs. Instances talk using private IP addresses as if on one network, over the AWS network, not the internet. The VPCs can be in the same account or different accounts, and in the same Region or different Regions. VPC basics are in [Networking Basic](/chapters/05-networking-basic/).

```mermaid
flowchart LR
  subgraph A["☁️ VPC A 10.0.0.0/16"]
    EA["🖥️ App"]
  end
  subgraph B["☁️ VPC B 172.31.0.0/16"]
    EB["🗄️ DB"]
  end
  EA <-->|"🔗 pcx-123 (peering)"| EB
```
*Two VPCs, one peering connection, private IPs end to end.*

Use it when you have a few VPCs that must talk directly and you control both sides.

## Key concepts

### Request, accept, route

The **requester** VPC owner sends the request; the **accepter** VPC owner accepts it. In one account you do both yourself. A request left alone expires after 7 days.

```mermaid
sequenceDiagram
  participant R as Requester VPC owner
  participant X as Peering connection
  participant C as Accepter VPC owner
  R->>X: Create request (pending-acceptance)
  C->>X: Accept request
  X-->>R: active
  R->>R: Add route: peer CIDR -> pcx-id
  C->>C: Add route: peer CIDR -> pcx-id
  Note over R,C: Then open security groups / NACLs
```
*Active peering carries no traffic until both sides have routes and firewall rules.*

- **Route tables:** add a route on BOTH sides, destination = the other VPC's CIDR, target = the `pcx-...` connection. Do it for every route table whose subnets need access.
- **Security groups and NACLs** still apply. Allow the peer CIDR, or, where supported, reference the peer's security group (check the docs for same-Region and cross-account rules).
- **Cross-account:** the accepter account must accept (and see the trust warning below). **Cross-Region:** works, traffic stays on the AWS backbone; you accept in the accepter's Region.

### Rules that bite

```mermaid
flowchart LR
  A["VPC A"] --- B["VPC B"] --- C["VPC C"]
  A -. "❌ no transit via B" .-> C
  B -. "❌ no use of B's IGW / NAT / VPN" .-> NET(("🌐 / 🏢"))
```
*Peering is point-to-point: no transitive routing and no edge-to-edge routing.*

| Rule | Meaning |
|---|---|
| Non-overlapping CIDR | Matching or overlapping IPv4/IPv6 ranges cannot be peered (request goes `failed`) |
| Not transitive | A-B and B-C does not give A-C; add A-C |
| No edge-to-edge | A peer cannot use your IGW, NAT, VPN or Direct Connect |
| One connection per pair | Not more than one peering between the same two VPCs |
| Quota | Active peerings per VPC are limited; check the current quota |

### DNS resolution

By default a peer's private DNS name may not resolve to the private IP. Turn on **DNS resolution** for the peering connection (each side's owner does their own side) and make sure DNS hostnames and DNS support are on in both VPCs. The docs say this option is not available for peered VPCs in different accounts or Regions for the "local VPC query" modify option, so for those cases test it, or use your own private DNS records. You cannot query the Amazon DNS server of a peer VPC directly.

### Pricing and data transfer

- No charge to create a peering connection.
- Data transfer within one Availability Zone is free, even across accounts.
- Cross-AZ and cross-Region traffic is charged per GB; check current EC2 data transfer pricing.

```mermaid
flowchart LR
  S["Same AZ"] -->|"free"| P1["💲 0"]
  X["Cross AZ"] -->|"per GB"| P2["💲 charged"]
  R["Cross Region"] -->|"per GB (inter-Region rate)"| P3["💲 charged"]
```
*Keep chatty services in the same AZ ID to cut cost.*

### Demo and speed tests (lab recap)

1. Create two VPCs with non-overlapping CIDRs, each with a public subnet and a web server (EC2).
2. VPC console: Peering connections, Create, pick requester and accepter, then Actions, Accept request.
3. Add a route in each VPC route table to the other CIDR via `pcx-...`; allow ICMP/HTTP from the peer CIDR.
4. Test from one server to the other's **private IP** (ping, `curl`, or `iperf3` for speed).

```bash
aws ec2 create-vpc-peering-connection --vpc-id vpc-aaa --peer-vpc-id vpc-bbb
aws ec2 accept-vpc-peering-connection --vpc-peering-connection-id pcx-123
aws ec2 create-route --route-table-id rtb-aaa \
  --destination-cidr-block 172.31.0.0/16 --vpc-peering-connection-id pcx-123
```

Speed results: same-Region peering behaves like the same network, so latency is lowest. Cross-Region adds distance latency, so expect higher latency than in-Region (measure with your own test; the numbers depend on the Regions).

### Pros and cons

| Pros | Cons |
|---|---|
| Simple, no extra device or hourly fee | Not transitive: many VPCs means a mesh (n(n-1)/2 connections) |
| Lowest latency, no single bottleneck | CIDRs must not overlap |
| Works cross-account and cross-Region | No sharing of VPN/Direct Connect/IGW/NAT |
| Security groups and NACLs control access | Each connection and route is managed by hand |

## X vs Y

VPC peering vs Transit Gateway vs PrivateLink:

| | VPC peering | Transit Gateway | PrivateLink |
|---|---|---|---|
| Model | Point-to-point, full VPC to VPC | Hub-and-spoke | One service exposed to consumers |
| Transitive | No | Yes | n/a |
| Overlapping CIDR | Not allowed | Not allowed in routing | Allowed |
| On-prem sharing | No | Yes (VPN/DX attached once) | No |
| Direction | Both ways | Both ways | Consumer to provider |
| Cost | No hourly fee | Hourly per attachment plus data (check pricing) | Hourly per endpoint plus data (check pricing) |
| Scale | Fewer than about 10 VPCs is comfortable | Thousands of VPCs | Many consumers |

Pick **VPC peering** when a few VPCs need full, cheap, low-latency connectivity. Pick **Transit Gateway** when you have many VPCs or need on-premises sharing and transitive routing. Pick **PrivateLink** when you expose one service to others, or the VPC CIDRs overlap.

## Job notes

- **Plan CIDRs first.** Overlap is the one thing you cannot fix without re-creating a VPC.
- **Do not accept** peering requests from accounts you do not know (peer phishing); reject or let them expire.
- **Troubleshoot in order:** peering is `active`, routes on both sides, security group, NACL, DNS.
- Use specific routes (peer CIDR), not `0.0.0.0/0`, to the peering connection.
- Hybrid traffic: attach VPN or Direct Connect to each VPC, or move to Transit Gateway.
- Cost trap: cross-AZ and cross-Region data. Check current pricing.

## Cheat sheet

- Peering = private, direct, 1:1 link between two VPCs (cross-account and cross-Region OK).
- Request, accept (7-day expiry), route both sides, open firewalls.
- CIDRs must not overlap. No transitive routing. No edge-to-edge (IGW/NAT/VPN/DX).
- Turn on DNS resolution for private names.
- Same-AZ data free; cross-AZ and cross-Region charged.
- Many VPCs or hybrid: Transit Gateway. One service or overlapping CIDR: PrivateLink.

## AWS docs

- [What is VPC peering?](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
- [How VPC peering connections work](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html)
- [Accept or reject a VPC peering connection](https://docs.aws.amazon.com/vpc/latest/peering/accept-vpc-peering-connection.html)
- [Building a scalable, secure multi-VPC network: VPC peering](https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/vpc-peering.html)

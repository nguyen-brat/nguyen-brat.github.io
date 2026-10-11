---
section: 3
title: "Create & Setup Your AWS Account"
part: "Getting Started"
kind: concept
status: done
readingTime: 7
lectures: ["Understanding AWS Free Tier (New update)","AWS Free Tier Examples","Free Account Eligible Conditions - IMPORTANT","AWS Account MFA Setup","Setup Budget Alert to Increase $20 AWS Credit","How to Increase AWS Free Tier to $200","Increase $20 AWS Credit by Launching an Amazon EC2 Instance","Increase $20 AWS Credit by Launching an Amazon RDS Database","Increase $20 AWS Credit by Creating Lambda Function URL","Increase $20 AWS Credit by Using an Amazon Bedrock Foundation Model","Upgrade to Paid Plan","Mindset to Start - IMPORTANT!!!","Using AWS Cost Explorer","Configure Dark mode","Resources"]
quiz:
  - question: "You opened a Free plan account 7 months ago and never upgraded. What is the state of the account?"
    options:
      - "It keeps running on always-free limits forever"
      - "The Free plan period has ended; you must upgrade to a Paid plan within the grace window or the account is closed"
      - "It is silently moved to a Paid plan and billed"
      - "Only the credits expire; resources keep running"
    answer: 1
    explanation: "A Free plan account ends after 6 months or when credits run out, whichever is first. You then have a limited window (90 days at the time of writing) to upgrade, otherwise the account and its content are deleted. It is not auto-billed."
  - question: "Right after creating the account, which single action protects you most?"
    options:
      - "Creating an access key for the root user"
      - "Turning on MFA for the root user and using an IAM/Identity Center user for daily work"
      - "Sharing the root password with the team"
      - "Changing the Region"
    answer: 1
    explanation: "The root user can do everything, so it gets MFA and is kept for rare tasks only. Root access keys are the opposite of what you want."
  - question: "You want an email before spending passes 80% of $50 this month. Which tool fits?"
    options:
      - "AWS Cost Explorer"
      - "AWS Budgets"
      - "AWS Free Tier page"
      - "Amazon CloudFront"
    answer: 1
    explanation: "AWS Budgets sends alerts when actual or forecast cost crosses a threshold. Cost Explorer only shows charts and history; it does not alert."
  - question: "You joined your account to an AWS Organization while on the Free plan. What happens?"
    options:
      - "Nothing changes"
      - "You get extra credits"
      - "The account is upgraded to a Paid plan and you can no longer earn Free Tier credits"
      - "The account is closed immediately"
    answer: 2
    explanation: "Per the Free Tier terms, enrolling in AWS Organizations upgrades a Free plan account to Paid and ends credit earning. It is not closed, and credits are not added."
  - question: "You finished the EC2 credit activity but left the instance running for a week. Why is that a problem?"
    options:
      - "It is not; credits cover everything forever"
      - "Running resources keep consuming credits (or money on a Paid plan), so you should terminate what you no longer need"
      - "AWS deletes the instance automatically"
      - "It voids your earlier credits"
    answer: 1
    explanation: "Credits are a balance that usage draws down; they are not a free pass. Terminate lab resources when done."
---

## What it is

An AWS account is the container for everything you create and the unit AWS bills. When you sign up you become the **root user** (the email + password owner), and you pick a **Free plan** (credits, no bills, limited services, 6 months) or a **Paid plan** (all services, pay for usage beyond credits).

```mermaid
flowchart LR
    A["👤 Sign up<br/>email + card"] --> B{Pick plan}
    B -->|Free plan| C["🎁 $100 credits<br/>6 months max"]
    B -->|Paid plan| D["🎁 $100 credits<br/>all services"]
    C --> E["🔒 Root MFA"]
    D --> E
    E --> F["💰 Budget + alerts"]
    F --> G["🧪 Earn up to $100 more"]
```
*Day-one path: sign up, secure, set a budget, then learn by doing.*

Use it when: you start learning AWS. Do the safety steps (MFA, budget) before you build anything.

## Key concepts

### Free Tier today (check current terms)

Free Tier changed from the old "12 months free" model. The program is now credit based, and terms change, so always read the [Free Tier terms](https://aws.amazon.com/free/terms/) and [FAQs](https://aws.amazon.com/free/free-tier-faqs/) before you rely on a number.

| | Free plan | Paid plan |
|---|---|---|
| Sign-up credits | $100 | $100 |
| Extra credits | up to $100 (5 activities x $20) | up to $100 |
| Services | Some enterprise services blocked | All |
| Ends | 6 months or credits gone, first wins | Never; usage beyond credits is billed on-demand |
| Credits expire | 12 months after account creation | same |

- Free plan means no charges until you upgrade. Paid plan means credits are applied first, then you pay.
- Some services also have "always free" monthly limits for all customers.
- Example: $100 credit and a small EC2 instance running for a few days uses a few dollars of credit; a forgotten database or NAT gateway drains it for weeks.

### Eligibility traps

```mermaid
flowchart TD
    A[New account] --> B{"Join AWS Organizations<br/>or Control Tower?"}
    B -->|Yes| C["Upgraded to Paid<br/>no more credits"]
    B -->|No| D{"6 months passed<br/>or credits used?"}
    D -->|Yes| E["Free plan ends:<br/>upgrade within grace window"]
    E -->|Not upgraded| F["❌ Account closed,<br/>content deleted"]
    D -->|No| G["✅ Keep learning"]
```
*Things that end the Free plan early.*

- Credits are for new customers, one account per person. Credits cannot be earned for more than one account.
- Earn-credit activities must be done within 6 months of opening the account.
- Turning on advanced features (Organizations, Control Tower) stops credit earning.

### Secure the root user (MFA)

```mermaid
sequenceDiagram
    participant U as 👤 You
    participant C as Console
    U->>C: Sign in as root (email + password)
    U->>C: Account menu > Security credentials > Assign MFA
    C-->>U: Choose passkey / authenticator app / hardware token
    U->>C: Register device, enter codes
    C-->>U: MFA active
    Note over U,C: Next: create an IAM or Identity Center user for daily work
```
*Root MFA setup.*

- AWS requires MFA for the root user of all account types; prefer a passkey or security key (phishing resistant).
- Keep your account email and phone current: they are the recovery path if the MFA device is lost.
- Never create root access keys. Daily work uses an admin user, covered in [IAM](/chapters/04-aws-identity-and-access-management-iam/).

### Budget alert (first $20 credit)

1. Console > **Billing and Cost Management > Budgets > Create budget**.
2. Choose **Use a template (simplified) > Monthly cost budget**.
3. Name it, set the amount (the course example uses 100), enter your email, create.
4. Check **Credits** in the billing console; it can take a few minutes to show.

- You can set several alerts per budget, for example actual above 80% and forecast above 100%.
- Budgets data refreshes a few times per day, so it is a warning, not a hard stop.

### Earn the other credits (up to $200 total)

Each activity is a guided task in the **Explore AWS** widget on the Console home. Each gives $20 when completed.

| Activity | What you do | Remember to |
|---|---|---|
| Budget | Create a monthly cost budget | Keep it |
| EC2 | Launch an instance, then terminate it | Terminate |
| RDS | Walk through launching a database (basic options) | Delete DB |
| Lambda | Build a function with a **function URL** (small web app) | Delete function |
| Bedrock | Send a prompt in the text playground | Nothing to clean |

```mermaid
flowchart LR
    S["🎁 $100 sign-up"] --> T(("💰 up to $200"))
    A["Budgets +$20"] --> T
    B["EC2 +$20"] --> T
    C["RDS +$20"] --> T
    D["Lambda +$20"] --> T
    E["Bedrock +$20"] --> T
```
*Credits add up: $100 plus five $20 activities.*

Activity details can change; follow the instructions the widget shows you.

### Upgrade to Paid plan

- Upgrade from the account/billing page whenever you want; you cannot downgrade back to Free.
- Unused credits still apply to eligible usage until they expire (12 months after sign-up).
- Needed for services blocked on the Free plan and for anything past the 6 months.

### Cost Explorer and mindset

- **Cost Explorer** (Billing > Cost Explorer) charts spend by service, Region and day, up to the last 13 months. The console UI is free. First use can take about 24 hours for data to appear.
- Use it daily while learning: group by **Service**, filter by **Region**, find the forgotten resource.

```mermaid
flowchart LR
    L["🧪 Build a lab"] --> V["✅ Verify it works"]
    V --> D["🗑️ Delete everything"]
    D --> CE["📊 Check Cost Explorer next day"]
    CE --> L
```
*The learning loop that keeps bills near zero.*

Mindset: AWS bills per use, so every lab ends with cleanup. Break things in a sandbox account; never learn on a production account.

### Console quality of life

- **Dark mode**: Console > settings (gear icon) > Unified settings > Visual mode. Also set your default Region there.
- **Region** (top right) decides where resources are created. Many things you "lost" are just in another Region.
- Course resource links are in the AWS docs section below.

## X vs Y

Free plan vs Paid plan.

| | Free plan | Paid plan |
|---|---|---|
| Risk of bill | None until you upgrade | Yes, after credits |
| Services | Limited set | All |
| Lifetime | 6 months max | Unlimited |
| Good for | Learning, labs | Job work, real projects, anything long |

Pick **Free** when you are just learning and want zero bill risk. Pick **Paid** when you need a blocked service, want to keep resources past 6 months, or run real work (with budgets on).

## Job notes

- First 15 minutes on any new account: root MFA, billing contact, budget, admin user, then stop using root.
- Real companies use multiple accounts under Organizations; credits apply to standalone learner accounts, so keep your learning account separate.
- Cost traps: running EC2/RDS left on, NAT gateways, unattached EBS volumes and Elastic IPs, data transfer out.
- Use budget alerts plus Cost Explorer; also tag lab resources (for example `env=lab`) to find them later.
- Never commit access keys to Git; never use the root user's keys.
- Budgets lag a few hours. For safety, delete resources, do not rely on alerts alone.

## Cheat sheet

- Root user = email + password owner. MFA on, no access keys, rare use.
- Free plan: $100 credits, up to 6 months, limited services. Paid plan: all services, pay beyond credits.
- Earn up to $100 more with 5 x $20 activities (Budgets, EC2, RDS, Lambda URL, Bedrock).
- Joining Organizations or Control Tower ends Free plan benefits.
- Not upgraded after expiry: the account is closed after the grace window.
- Budgets = alerts. Cost Explorer = charts. Credits page = balance.
- Every lab ends with deleting resources.
- Verify all numbers on the current Free Tier terms page.

## AWS docs

- [AWS Free Tier terms](https://aws.amazon.com/free/terms/)
- [Free Tier FAQs](https://aws.amazon.com/free/free-tier-faqs/)
- [MFA for the root user](https://docs.aws.amazon.com/IAM/latest/UserGuide/enable-mfa-for-root.html)
- [Creating a budget](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-create.html)
- [Analyzing costs with Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)

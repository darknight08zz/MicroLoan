---
name: clone-frontend
description: Clone a frontend interface from screenshots, URLs, or design references into the current Micro Loan DApp while preserving the project's architecture and adapting the visual system to original product branding.
---

# Frontend Cloning Workflow

## Purpose

Use this workflow whenever the task is to recreate a frontend interface from a reference URL, screenshot, Figma design, or supplied visual asset.

For this project, the primary visual reference is:

https://lendasat.com/

The target product is the project's **Micro Loan DApp**, not Lendasat.

The goal is to reproduce useful visual and UX characteristics while creating original product content, branding, and blockchain-specific behavior.

---

# 1. Inspect Before Editing

Before writing code:

1. Inspect the repository structure.
2. Read `AGENTS.md`.
3. Inspect `package.json`.
4. Identify the current framework.
5. Identify the current styling system.
6. Identify existing components.
7. Identify existing wallet/blockchain integration.
8. Identify existing contract ABIs and addresses.
9. Locate any supplied screenshots/assets/references.

Do not replace the existing stack unless explicitly instructed.

---

# 2. Analyze the Reference

Study the supplied reference material.

For a live URL, inspect:

- Header/navigation
- Hero section
- Page width
- Grid structure
- Typography hierarchy
- Buttons
- Cards
- Borders
- Shadows
- Radius
- Spacing
- Background sections
- Forms
- Tables
- Mobile layout
- Footer
- Empty/loading states

For screenshots, identify the same properties visually.

Create a mental/component map before implementation.

Example:

```text
Page
├── Navbar
├── Hero
│   ├── Heading
│   ├── Description
│   └── CTA group
├── Stats
├── Loan Marketplace
│   ├── Filters
│   └── LoanCard[]
├── How It Works
└── Footer
```

---

# 3. Separate Visual Structure From Product Logic

Do not copy the reference's product assumptions.

Translate the reference into Micro Loan DApp concepts.

For example:

```text
Reference concept
        ↓
Micro Loan DApp concept

Marketplace
        ↓
Loan Marketplace

Asset/product card
        ↓
Loan Card

Buy/action CTA
        ↓
Fund Loan / Borrow

Account
        ↓
Wallet + Dashboard

Transaction/history
        ↓
Loan transaction history
```

The final interface must make sense as a decentralized lending application.

---

# 4. Build the Design System First

Before implementing many pages, establish shared visual primitives.

Create or reuse:

```text
Button
Card
Badge
Input
Select
Modal
Container
Section
Heading
StatCard
ProgressBar
WalletButton
```

Define consistent values for:

- Typography
- Spacing
- Radius
- Borders
- Shadows
- Container widths
- Breakpoints
- Button heights

If Tailwind is already installed, use Tailwind utilities and existing project tokens.

Do not introduce another styling system just for the clone.

---

# 5. Componentize the Page

Break the target into reusable components.

For the Micro Loan DApp, prefer components such as:

```text
Navbar
WalletButton
Hero
PlatformStats
LoanMarketplace
LoanCard
LoanStatusBadge
LoanProgress
LoanTerms
LoanDetails
CreateLoanForm
Dashboard
BorrowerDashboard
LenderDashboard
RepaymentPanel
RepaymentSummary
DueDate
PenaltyIndicator
TransactionStatus
Footer
```

Avoid a single giant page component.

---

# 6. Implement the Shell First

Build:

1. Global background.
2. Main container.
3. Header.
4. Navigation.
5. Page sections.
6. Footer.
7. Responsive breakpoints.

Only after the shell is visually correct should you implement complex Web3 data and interactions.

---

# 7. Match Visual Hierarchy

Prioritize visual similarity in this order:

1. Page structure
2. Section positioning
3. Container width
4. Typography scale
5. Spacing
6. Card dimensions
7. Buttons
8. Borders/radius/shadows
9. Icons
10. Micro-interactions

Do not spend excessive time reproducing tiny details while the overall composition is wrong.

---

# 8. Create Original Branding

The reference is an inspiration source.

Do not reproduce:

- Lendasat logo
- Lendasat wordmark
- Lendasat brand name
- Proprietary illustrations
- Exact marketing copy
- Claims of affiliation

Use the project's own Micro Loan DApp identity.

If a logo has not been provided, use a neutral placeholder/icon that can later be replaced.

---

# 9. Adapt Content to the DApp

Use terminology appropriate for the loan protocol.

Examples:

```text
Borrow
Lend
Loan Request
Fund Loan
Repay
Outstanding
Principal
Repayment Fee
Due Date
Penalty
Amount Funded
Remaining
Active
Overdue
Repaid
```

Do not use unrelated marketplace terminology.

---

# 10. Loan Card Specification

A reusable loan card should be able to display:

```text
Borrower
Requested amount
Amount funded
Funding progress
Repayment fee
Total repayment
Due date
Loan status
Fund Loan button
```

Example conceptual structure:

```text
┌──────────────────────────────────┐
│ Loan #1024                 ACTIVE │
│                                  │
│ Borrower                         │
│ 0xA8...92F                       │
│                                  │
│ Requested        0.50 ETH        │
│ Funded           0.30 ETH        │
│ Repayment fee    5%              │
│ Due date         20 Oct 2026     │
│                                  │
│ ███████████░░░ 60% funded        │
│                                  │
│              [Fund Loan]         │
└──────────────────────────────────┘
```

The exact appearance should follow the approved visual reference.

---

# 11. Borrower Flow

The borrower experience should support:

```text
Connect Wallet
      ↓
Create Loan Request
      ↓
Enter Loan Terms
      ↓
Submit Transaction
      ↓
Loan Created
      ↓
Loan Appears in Marketplace
      ↓
Loan Gets Funded
      ↓
Repayment
      ↓
Loan Repaid
```

Every blockchain transition must expose its status to the user.

---

# 12. Lender Flow

The lender experience should support:

```text
Connect Wallet
      ↓
Browse Loan Marketplace
      ↓
Open Loan Details
      ↓
Review Terms
      ↓
Fund Loan
      ↓
Confirm Wallet Transaction
      ↓
Loan Funded
      ↓
Track Repayment
      ↓
Receive Principal + Fee
```

The UI must not claim a loan was funded until the blockchain transaction has actually succeeded.

---

# 13. Repayment Fee

The current project requirement is that the **repayment percentage fee is given by the lender**.

Reflect this consistently throughout the UI.

When showing repayment, distinguish:

```text
Principal
Lender Fee %
Fee Amount
Total Repayment
```

Do not calculate the fee using a hardcoded percentage.

Use contract data.

If the contract architecture changes, update the UI to match the contract rather than preserving an outdated assumption.

---

# 14. Due Date

The due date must be visible in:

- Loan creation/terms
- Loan marketplace card
- Loan details
- Borrower dashboard
- Lender dashboard
- Repayment screen

The UI should communicate:

```text
Due: 20 Oct 2026
5 days remaining
```

or:

```text
Due: 20 Oct 2026
Overdue by 2 days
```

The exact calculation must use the blockchain timestamp/contract data where appropriate.

---

# 15. Penalty

Penalty is an overdue-loan mechanism.

The frontend must show a penalty only when the smart contract defines and applies one.

Do not invent:

- Penalty percentage
- Grace period
- Daily penalty
- Maximum penalty

unless those rules exist in the contract/specification.

Represent it clearly:

```text
Principal       0.50 ETH
Lender fee      0.025 ETH
Penalty         0.010 ETH
────────────────────────
Total due       0.535 ETH
```

---

# 16. Blockchain State Handling

Every write operation needs:

```text
idle
↓
preparing
↓
wallet confirmation
↓
submitted
↓
confirmed
```

Error path:

```text
failed
```

The UI should provide useful feedback for:

- User rejected transaction
- Insufficient balance
- Wrong network
- Contract revert
- RPC error
- Transaction pending
- Transaction confirmed

Never show fake success states.

---

# 17. Auto Refresh

The project may use approximately 10-second refresh intervals for blockchain-dependent transaction/loan information.

Prefer this strategy:

1. Refresh immediately after a successful transaction.
2. Listen for contract events where practical.
3. Use periodic refresh only where necessary.
4. Avoid multiple duplicate polling loops.
5. Clean up timers/listeners on component unmount.

Do not make the entire application re-render unnecessarily every 10 seconds.

---

# 18. Responsive Implementation

Build desktop first only if that matches the existing development workflow, then explicitly verify mobile.

At mobile widths:

- Stack cards.
- Collapse navigation.
- Preserve readable financial values.
- Make primary CTAs full-width when useful.
- Convert wide tables to cards or controlled horizontal scrolling.
- Keep wallet controls accessible.
- Avoid horizontal overflow.

---

# 19. Visual Verification Loop

After implementation:

1. Run the application.
2. Capture/inspect the target page.
3. Compare against the reference.
4. Identify the largest visual differences.
5. Fix those differences.
6. Repeat.

Prioritize:

```text
Structure
→ spacing
→ typography
→ sizing
→ alignment
→ colors
→ borders/shadows
→ icons
→ animations
```

Do not declare the clone complete after the first implementation.

---

# 20. Data Integrity

Never fabricate blockchain data.

Avoid code like:

```ts
const balance = "10 ETH";
const interest = "5%";
const dueDate = "20 Oct";
```

when those values are supposed to come from the contract.

Use:

```text
contract / wallet / API
        ↓
data layer
        ↓
hooks
        ↓
components
```

Mock data is acceptable only for an explicitly designated development/demo state.

Clearly label mock data if it is visible.

---

# 21. Negative Constraints

Do not:

- Rewrite working smart-contract code unless asked.
- Change contract addresses accidentally.
- Remove wallet integration.
- Remove existing routes without checking dependencies.
- Add unnecessary packages.
- Hardcode blockchain state.
- Copy proprietary branding from the reference.
- Claim affiliation with the reference website.
- Put secrets in frontend source.
- Store private keys.
- Create fake transaction confirmations.
- Invent financial rules.
- Invent penalty rules.
- Hide transaction failures.
- Break mobile layouts to match desktop.
- Duplicate large components when reusable components are appropriate.

---

# 22. Completion Checklist

Before finishing, verify:

### Visual

- [ ] Layout matches the reference direction.
- [ ] Typography hierarchy is consistent.
- [ ] Spacing is consistent.
- [ ] Cards/buttons/forms are reusable.
- [ ] Mobile layout works.
- [ ] Branding is original.

### Product

- [ ] Borrower flow is clear.
- [ ] Lender flow is clear.
- [ ] Loan status is visible.
- [ ] Repayment fee is visible.
- [ ] Due date is visible.
- [ ] Penalty is shown only when applicable.
- [ ] Total repayment is understandable.

### Web3

- [ ] Wallet connection works.
- [ ] Network state is clear.
- [ ] Transaction states are handled.
- [ ] Successful transactions are confirmed from the chain.
- [ ] Errors are surfaced.
- [ ] Refresh/event logic is cleaned up.

### Engineering

- [ ] Existing project conventions are followed.
- [ ] No unnecessary dependencies were added.
- [ ] TypeScript errors are resolved.
- [ ] Lint passes when configured.
- [ ] Production build passes.
- [ ] No secrets are committed.

---

# 23. Expected Agent Output

When implementing a clone task, report:

1. What reference material was analyzed.
2. Which components were created/reused.
3. Which pages/routes were changed.
4. Which Web3 interactions were connected.
5. Any assumptions made.
6. Any remaining visual differences.
7. Build/test status.

Keep the report concise and factual.

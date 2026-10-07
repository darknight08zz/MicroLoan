# AGENTS.md

## Project Overview

This repository contains a **Micro Loan Decentralized Application (DApp)** for peer-to-peer borrowing and lending on an EVM-compatible blockchain.

The frontend should provide a clean, modern lending-market interface inspired by the visual structure and UX patterns of:

- Reference website: https://lendasat.com/

Use the reference for **layout, information hierarchy, interaction patterns, spacing, cards, navigation, typography direction, and overall visual quality**. Do not copy Lendasat branding, logos, proprietary assets, text, or identity. Our application must have its own Micro Loan DApp identity.

## Product Goal

The application allows users to:

1. Connect a Web3 wallet.
2. Act as a borrower.
3. Act as a lender.
4. Create loan requests.
5. Browse available loan requests.
6. Fund loans.
7. Track active loans.
8. Make repayments.
9. Track repayment progress.
10. Handle lender-defined repayment fees.
11. Handle due dates.
12. Apply/display penalties for overdue repayments.
13. View transaction status and blockchain activity.

The interface should make the lending/borrowing lifecycle easy to understand for a first-time Web3 user.

---

## Technology

Unless the existing repository specifies otherwise, prefer:

- React
- Vite
- TypeScript
- Tailwind CSS
- EVM-compatible wallet integration
- ethers.js or viem, depending on the existing codebase
- Solidity smart contracts
- Sepolia for development/testing when configured by the project

### Important

Before adding a new dependency:

1. Check `package.json`.
2. Reuse an existing library if it already solves the problem.
3. Do not introduce a large UI framework unless explicitly requested.
4. Do not replace the project's existing architecture unnecessarily.

---

## Repository Conventions

Prefer a structure similar to:

```text
/
├── AGENTS.md
├── .agents/
│   └── skills/
│       └── clone-frontend/
│           └── SKILL.md
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── contracts/
│   ├── types/
│   ├── assets/
│   └── styles/
├── public/
├── contracts/
└── README.md
```

Adapt this to the existing project instead of restructuring an already-working repository without a reason.

### Naming

- React components: `PascalCase`
- Hooks: `useSomething`
- Utility functions: `camelCase`
- Types/interfaces: descriptive `PascalCase`
- Constants: `UPPER_SNAKE_CASE` where appropriate
- Files should use the naming convention already established by the repository.

---

## Design Direction

The frontend should feel like a modern DeFi lending product:

- Clean
- Financial
- Trustworthy
- Minimal
- Responsive
- Data-oriented
- Professional
- Easy to scan

Use the Lendasat reference as a visual benchmark, not as a source of copied identity.

### Visual priorities

1. Strong typography hierarchy.
2. Spacious layout.
3. Clear primary CTA.
4. High-quality loan cards.
5. Strong distinction between borrower and lender actions.
6. Clear financial numbers.
7. Clear status indicators.
8. Consistent border radius.
9. Consistent spacing.
10. Responsive mobile behavior.
11. Wallet/transaction states that are easy to understand.

---

## Core Screens

The frontend should support these screens or equivalent routes:

### Landing / Home

Show:

- Product value proposition
- Borrow / Lend CTAs
- Platform statistics
- Featured or recent loans
- How it works
- Trust/security information

### Loan Marketplace

Show:

- Available loan requests
- Requested amount
- Interest/repayment fee
- Duration
- Due date
- Borrower information
- Funding progress
- Status
- Lend/Fund CTA

Include filtering/sorting where useful.

### Create Loan Request

Borrower inputs:

- Loan amount
- Purpose
- Interest/repayment fee if borrower-controlled by the contract design
- Requested duration or due-date preference
- Optional description

If the contract requires the lender to define the repayment percentage fee, the UI must reflect that rule instead of inventing borrower controls.

### Loan Details

Show:

- Principal
- Fee/interest
- Total repayment
- Amount funded
- Remaining amount
- Due date
- Penalty rules
- Borrower
- Lender(s), if supported
- Current status
- Transaction history
- Relevant actions

### Dashboard

Provide separate or clearly grouped:

#### Borrower

- Active loans
- Pending requests
- Repayment amount
- Due dates
- Overdue loans
- Penalties
- Repayment progress

#### Lender

- Funded loans
- Total supplied
- Expected repayment
- Earned fees
- Repayment percentage
- Outstanding principal
- Loan status

### Repayment

Show:

- Outstanding principal
- Lender-defined fee/interest
- Penalty if applicable
- Total amount due
- Due date
- Days remaining/overdue
- Repay button
- Transaction status

---

## Web3 UX Rules

Every blockchain action must communicate its state.

Use states such as:

- Connect wallet
- Wallet connected
- Preparing transaction
- Awaiting wallet confirmation
- Transaction submitted
- Transaction confirmed
- Transaction failed

Never make the user guess whether a transaction succeeded.

### Auto-refresh

The application may refresh blockchain-dependent data approximately every 10 seconds where appropriate.

Do not aggressively poll unnecessarily.

Prefer:

- Event listeners when available.
- Explicit refresh after transactions.
- Moderate polling for data that genuinely needs periodic updates.

---

## Financial Display Rules

Always distinguish:

- Principal
- Fee/interest
- Penalty
- Total repayment

Do not combine these into a single unexplained number.

Example:

```text
Principal       0.50 ETH
Lender fee      5%
Fee             0.025 ETH
Penalty         0.010 ETH
Total due       0.535 ETH
```

Use the actual contract calculation in production UI. Never hardcode financial calculations that should come from the smart contract.

---

## Due Date and Penalty UX

The due date is a core part of the loan lifecycle.

The UI should clearly communicate:

- Due date
- Time remaining
- Whether the loan is overdue
- Penalty rate/rule
- Current penalty amount
- Total amount due

Use status states such as:

- `Active`
- `Due Soon`
- `Overdue`
- `Repaid`
- `Funded`
- `Partially Funded`
- `Cancelled`

The frontend must match the smart contract's actual rules.

Do not invent a penalty formula.

---

## Security / Trust Rules

Never expose:

- Private keys
- Seed phrases
- Wallet secrets
- API secrets
- Contract deployment secrets

Never ask users to paste a private key into the application.

Contract addresses and network configuration should come from environment variables or a centralized configuration module.

---

## Environment Variables

Use `.env` for development configuration.

Example:

```env
VITE_CHAIN_ID=
VITE_RPC_URL=
VITE_CONTRACT_ADDRESS=
VITE_EXPLORER_URL=
```

Never commit private secrets.

Provide `.env.example` where appropriate.

---

## Component Rules

Build reusable components instead of duplicating markup.

Examples:

```text
Navbar
WalletButton
LoanCard
LoanStatusBadge
LoanAmount
LoanProgress
DueDate
PenaltyBadge
RepaymentSummary
TransactionStatus
DashboardCard
StatCard
Modal
Button
Input
Select
```

Financial components should accept data as props.

Do not hardcode a particular loan into reusable components.

---

## Responsive Rules

The application must work on:

- Desktop
- Tablet
- Mobile

Do not simply shrink the desktop layout.

On mobile:

- Navigation should remain usable.
- Loan cards should stack.
- Tables may become cards or horizontally scroll.
- Primary actions should remain easy to reach.
- Financial figures should remain readable.

---

## Accessibility

Use:

- Semantic HTML
- Keyboard-accessible controls
- Visible focus states
- Proper form labels
- Sufficient contrast
- `aria-*` attributes when necessary
- Meaningful button labels

Do not rely solely on color to communicate loan status.

---

## Clone Guardrails

When cloning the reference visual style:

### Do

- Analyze screenshots and page structure.
- Recreate layout hierarchy.
- Recreate spacing rhythm.
- Recreate card patterns.
- Recreate responsive behavior.
- Recreate interaction patterns where appropriate.
- Replace content with Micro Loan DApp content.
- Create original branding and assets.

### Do not

- Copy the Lendasat logo.
- Copy proprietary illustrations.
- Copy their exact marketing copy.
- Copy their brand name.
- Pretend this DApp is affiliated with Lendasat.
- Scrape private data.
- Hardcode values that should come from the blockchain.
- Add dependencies without checking the existing project.
- Rewrite working blockchain logic merely to change the UI.

---

## Verification

Before considering a frontend task complete:

1. Run the project's build command.
2. Run lint/type checks if configured.
3. Verify responsive layouts.
4. Verify wallet connection UI.
5. Verify transaction loading/success/error states.
6. Verify financial calculations are sourced from the correct contract logic.
7. Verify due-date and penalty displays.
8. Verify no secrets are exposed.
9. Verify console errors are resolved.
10. Compare the implementation visually against the supplied reference.

Typical commands, if present in `package.json`:

```bash
npm install
npm run dev
npm run build
npm run lint
```

Do not assume every command exists. Inspect `package.json` first.

---

## Definition of Done

A frontend implementation is complete when:

- The intended screen is implemented.
- It follows the project's existing architecture.
- It visually matches the approved reference direction.
- It uses reusable components.
- It is responsive.
- Web3 states are represented clearly.
- Blockchain-derived values are not fabricated.
- Due dates, repayment fees, and penalties are clearly represented.
- Build/type/lint checks pass when configured.
- No unnecessary dependencies were introduced.

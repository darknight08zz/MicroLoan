<p align="center">
  <img src="public/logo.png" width="96" height="96" alt="MicroLoan App Icon" />
</p>

<h1 align="center">MicroLoan DApp 💸</h1>

<p align="center">
  A decentralized, non-custodial peer-to-peer micro-lending platform built on Ethereum Sepolia. Borrowers can create custom loan requests with flexible interest rates and precise due dates, while lenders fund requests directly on-chain and earn transparent yield.
</p>

---

## 🌟 Key Features

### 👤 Borrower Workspace
- **Custom Loan Requests**: Specify principal in ETH and custom repayment amounts or interest rates.
- **Flexible Interest Selector**: Quick rate presets (5% Low, 10% Standard, 15% Fast, 20% Urgent) and interactive slider.
- **Granular Due Dates**: Full timestamp support (hours, minutes, seconds) and quick presets (`+2m`, `+5m`, `+1h`, `+1d`, `+7d`, `+30d`) for rapid testnet verification.
- **Transparent Terms Breakdown**: Real-time calculation of lender fees, percentage yields, and annualized rates (APR).
- **Loan Management**: Single-click fund withdrawal once funded, real-time repayment tracking, and instant full repayment.

### 💼 Lender Marketplace & Portfolio
- **Marketplace Discovery**: Filter loans by status (`Open Requests`, `Funded`, `Withdrawn`, `Settled`, `Defaulted`, `Cancelled`), search by Loan ID or borrower address, and sort by yield or due date.
- **Direct On-Chain Funding**: Trustless escrow via smart contract with automated status updates.
- **Portfolio Tracking**: Real-time metrics for total capital supplied, expected returns, earned interest, and outstanding principal.

### 🤖 Automated Keeper Daemon
- **Background Settlement**: Standalone Node.js daemon that monitors Sepolia for past-due loans every 15 seconds.
- **Automatic Liquidation / Expiration**:
  - Unwithdrawn past-due loans are transitioned to `Expired` and automatically refund the lender.
  - Active past-due withdrawn loans are marked `Defaulted`.
- **Zero Manual Clicks**: Settles loans automatically on-chain with visible Etherscan transaction proofs.

### 🎨 Design & Experience
- **Architectural Design System**: Clean, editorial typography with crisp hairline borders and high contrast.
- **Dual Theme Support**: Pure white light mode and dark graphite mode with zero FOUC and full hydration safety.
- **Live Blockchain Sync**: Auto-refreshing poll indicators (every 10–12s) synchronized with Sepolia network block times.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (Turbopack) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Web3 & Blockchain** | [Ethers.js v6](https://docs.ethers.org/v6/) |
| **Smart Contracts** | [Solidity ^0.8.20](https://soliditylang.org/) |
| **Network** | Ethereum Sepolia Testnet |

---

## 📜 Smart Contract Architecture

The core contract is [`MicroLoan.sol`](contracts/MicroLoan.sol), deployed and verified on the Ethereum Sepolia Testnet.

- **Contract Address:** `0xE01D216A527d0FA37763EE9B8fFCEB2750005351`
- **Explorer:** [View on Etherscan Sepolia](https://sepolia.etherscan.io/address/0xE01D216A527d0FA37763EE9B8fFCEB2750005351)

### State Machine Lifecycle

```
             ┌─────────────────────────────────────────────────────────┐
             │                                                         │
             ▼                                                         │
[0: Requested] ───────────────► [1: Funded] ────────► [2: Withdrawn]   │
       │                               │                     │         │
       │ (Past Due)                    │ (Past Due)          │ (Repay) │ (Past Due)
       ▼                               ▼                     ▼         ▼
 [5: Expired]                    [5: Expired]           [3: Repaid] [4: Defaulted]
 (No capital loss)          (Principal refunded)
```

| Status Code | Status Name | Description |
|---|---|---|
| `0` | **Requested** | Loan request registered by borrower; open for funding in marketplace. |
| `1` | **Funded** | Lender deposited principal into contract escrow; ready for borrower withdrawal. |
| `2` | **Withdrawn** | Borrower withdrew capital; active repayment countdown starts. |
| `3` | **Repaid** | Borrower submitted full repayment; funds transferred to lender. |
| `4` | **Defaulted** | Borrower failed to repay before due date; marked defaulted. |
| `5` | **Expired / Cancelled** | Unfunded or unwithdrawn loan passed due date; lender refunded if funded. |

### Contract Methods

- `requestLoan(uint256 principal, uint256 repayment, uint64 durationSeconds)`: Registers a new loan.
- `fund(uint256 loanId)`: `payable` function called by lender to lock principal in escrow.
- `withdraw(uint256 loanId)`: Called by borrower to release escrowed principal to their wallet.
- `repay(uint256 loanId)`: `payable` function called by borrower to settle principal + interest.
- `markExpired(uint256 loanId)`: Public method called when an unfunded or unwithdrawn loan passes its deadline (refunds lender if funded).
- `markDefault(uint256 loanId)`: Public method called when an active withdrawn loan passes its due date unpaid.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.17+ or v20+
- [MetaMask](https://metamask.io/) or any EVM-compatible Web3 wallet
- Sepolia Testnet ETH (available from [Sepolia Faucets](https://sepoliafaucet.com/))

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/darknight08zz/MicroLoan.git
cd MicroLoan
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Sepolia Contract Address
NEXT_PUBLIC_MICROLOAN_CONTRACT_ADDRESS=0xE01D216A527d0FA37763EE9B8fFCEB2750005351

# Sepolia Public RPC URL
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Optional: Private Key for Automated Keeper Bot
KEEPER_PRIVATE_KEY=your_sepolia_private_key_here
```

> **Security Note:** Never commit `.env.local` or share private keys. Keep keys strictly on testnet accounts with test ETH.

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run the Automated Keeper Daemon (Optional)

To automatically liquidate defaulted loans and expire past-due requests in the background:

```bash
npm run keeper
```

---

## 📁 Repository Structure

```text
microloan-app/
├── contracts/
│   └── MicroLoan.sol              # Solidity smart contract
├── scripts/
│   └── keeper.mjs                 # Automated background liquidation & expiry bot
├── src/
│   ├── app/
│   │   ├── globals.css            # Design system, theme variables & Tailwind v4 config
│   │   ├── layout.tsx             # Root layout with anti-FOUC theme script
│   │   └── page.tsx               # Main application controller & route switcher
│   ├── components/
│   │   ├── borrower/
│   │   │   ├── CreateLoanRequest.tsx  # Loan creation form with rate & time presets
│   │   │   └── BorrowerDashboard.tsx  # Active loans tracker, withdrawal & repayment
│   │   ├── lender/
│   │   │   └── LenderDashboard.tsx    # Supplied capital, earned fees & active portfolio
│   │   ├── marketplace/
│   │   │   ├── LoanMarketplace.tsx    # Marketplace grid, filtering & sorting
│   │   │   ├── LoanCard.tsx           # Loan card with live due countdown & laser tags
│   │   │   └── LoanDetailsModal.tsx   # Detailed modal with contract state breakdown
│   │   ├── ui/
│   │   │   ├── Button.tsx             # Monochromatic interactive buttons
│   │   │   ├── Card.tsx               # Reusable card surface
│   │   │   ├── Input.tsx              # Form inputs with prefix/suffix elements
│   │   │   ├── Navbar.tsx             # Header, navigation, wallet button & theme switch
│   │   │   ├── ThemeToggle.tsx        # Hydration-safe light/dark theme toggle
│   │   │   └── TransactionBanner.tsx  # Web3 transaction lifecycle banners
│   ├── context/
│   │   ├── ThemeContext.tsx       # Hydration-safe theme state & local persistence
│   │   └── WalletContext.tsx      # MetaMask wallet connection & network listeners
│   ├── contracts/
│   │   ├── abi/MicroLoan.json     # Smart contract ABI interface
│   │   ├── config.ts              # Contract addresses & Sepolia configuration
│   │   └── hooks/                 # Custom React hooks for contract interaction
│   │       ├── useCreateLoan.ts   # Loan creation hook
│   │       ├── useFundLoan.ts     # Marketplace funding hook
│   │       ├── useLoans.ts        # Auto-refreshing loans query hook
│   │       ├── useMarkDefault.ts  # Settlement & expiry hook
│   │       ├── useRepayLoan.ts    # Loan repayment hook
│   │       └── useWithdrawLoan.ts # Borrower capital withdrawal hook
│   ├── types/
│   │   └── loan.ts                # TypeScript interfaces & loan status definitions
│   └── utils/
│       ├── dateUtils.ts           # Due date formatting & live countdown calculations
│       ├── errorParser.ts         # User-friendly smart contract revert decoding
│       ├── formatUtils.ts         # ETH amount and address formatting helpers
│       └── statusUtils.ts         # Status mapping & lifecycle helpers
├── .env.example                   # Template environment variables
├── next.config.ts                 # Next.js configuration & allowedDevOrigins
├── package.json                   # Project scripts and dependencies
└── README.md                      # Project documentation
```

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the local development server at `localhost:3000`. |
| `npm run build` | Compiles an optimized production build and performs TypeScript checks. |
| `npm run start` | Starts the production server after building. |
| `npm run keeper` | Runs the automated keeper bot to settle expired and defaulted loans on Sepolia. |
| `npm run lint` | Runs ESLint to check code quality. |

---

## 🔒 Security & Best Practices

- **Reentrancy Protection**: Uses a custom `nonReentrant` mutex modifier on all state-changing external functions transferring ETH.
- **Checks-Effects-Interactions**: State is updated before sending external value transfers (`_sendValue`).
- **Granular Custom Errors**: Gas-efficient custom Solidity errors (`InvalidState`, `BorrowerCannotFundOwnLoan`, `DeadlinePassed`, etc.) parsed into user-friendly UI messages.
- **Client-Side Secret Isolation**: Private keys are only used locally in the standalone keeper script via `.env.local` and never bundled into frontend assets.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

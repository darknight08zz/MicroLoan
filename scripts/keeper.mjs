import { ethers } from "ethers";
import { readFileSync } from "fs";
import { resolve } from "path";

// 1. Configuration
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_MICROLOAN_CONTRACT_ADDRESS?.trim() ||
  "0xE01D216A527d0FA37763EE9B8fFCEB2750005351";
const RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim() ||
  "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY?.trim() || "";
const INTERVAL_SEC = parseInt(process.env.KEEPER_INTERVAL_SEC || "15", 10);

const STATUS_NAMES = ["Requested", "Funded", "Withdrawn", "Repaid", "Defaulted", "Expired"];

console.log("=================================================");
console.log("       MicroLoan Automated Keeper Daemon         ");
console.log("=================================================");
console.log(`Target Contract: ${CONTRACT_ADDRESS}`);
console.log(`Sepolia RPC:     ${RPC_URL}`);
console.log(`Poll Interval:   Every ${INTERVAL_SEC} seconds`);

const provider = new ethers.JsonRpcProvider(RPC_URL);
const abiPath = resolve(process.cwd(), "src/contracts/abi/MicroLoan.json");
const abi = JSON.parse(readFileSync(abiPath, "utf8"));

let signer = null;
if (PRIVATE_KEY) {
  try {
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Keeper Wallet:   ${signer.address} (Active - Automated execution enabled)`);
  } catch (err) {
    console.error("Invalid KEEPER_PRIVATE_KEY provided:", err.message);
  }
} else {
  console.log("Keeper Wallet:   NONE (Read-Only Monitor Mode)");
  console.log("Notice: Set KEEPER_PRIVATE_KEY=0x... in .env.local to execute on-chain settlements.");
}
console.log("=================================================\n");

let isRunning = false;

async function checkAndSettleLoans() {
  if (isRunning) return;
  isRunning = true;

  try {
    const contract = signer
      ? new ethers.Contract(CONTRACT_ADDRESS, abi, signer)
      : new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    const totalLoans = await contract.nextLoanId();
    const count = Number(totalLoans);
    const now = Math.floor(Date.now() / 1000);

    let settledCount = 0;

    for (let i = 0; i < count; i++) {
      const loan = await contract.loans(i);
      const statusCode = Number(loan.status);
      const dueDate = Number(loan.dueDate);

      // Statuses 3 (Repaid), 4 (Defaulted), 5 (Expired) are terminal.
      if (statusCode >= 3) continue;

      if (now > dueDate) {
        const timeDiff = now - dueDate;
        console.log(
          `\n[${new Date().toLocaleTimeString()}] ⚠ Loan #${i} (${STATUS_NAMES[statusCode]}) is past due by ${timeDiff}s (Due: ${new Date(
            dueDate * 1000
          ).toLocaleString()})`
        );

        if (!signer) {
          console.log(`  -> [Read-Only Mode] Requires on-chain settlement (${statusCode === 2 ? "markDefault" : "markExpired"}). Set KEEPER_PRIVATE_KEY to auto-submit.`);
          continue;
        }

        try {
          if (statusCode === 0 || statusCode === 1) {
            console.log(`  -> Submitting markExpired(${i}) on-chain...`);
            const tx = await contract.markExpired(i);
            console.log(`  -> Tx Submitted: ${tx.hash}. Waiting for block confirmation...`);
            const receipt = await tx.wait(1);
            console.log(`  ✔ Confirmed in block ${receipt.blockNumber}! Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}\n`);
            settledCount++;
          } else if (statusCode === 2) {
            console.log(`  -> Submitting markDefault(${i}) on-chain...`);
            const tx = await contract.markDefault(i);
            console.log(`  -> Tx Submitted: ${tx.hash}. Waiting for block confirmation...`);
            const receipt = await tx.wait(1);
            console.log(`  ✔ Confirmed in block ${receipt.blockNumber}! Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}\n`);
            settledCount++;
          }
        } catch (txErr) {
          console.error(`  ✖ Failed to settle Loan #${i}:`, txErr?.reason || txErr?.message || txErr);
        }
      }
    }

    if (settledCount === 0) {
      process.stdout.write(`\r[${new Date().toLocaleTimeString()}] Checked ${count} loans. No loans require settlement right now.  `);
    }
  } catch (err) {
    console.error(`\n[${new Date().toLocaleTimeString()}] Error in keeper scan loop:`, err.message || err);
  } finally {
    isRunning = false;
  }
}

// Initial check immediately
checkAndSettleLoans();

// Recurring interval
setInterval(checkAndSettleLoans, INTERVAL_SEC * 1000);

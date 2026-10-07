import { isAddress } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";
export const SEPOLIA_DEFAULT_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
export const SEPOLIA_EXPLORER_URL = "https://sepolia.etherscan.io";

/**
 * Retrieves the MicroLoan contract address from environment variables.
 * Format must be a valid 42-character Ethereum address (0x...).
 */
export function getMicroLoanContractAddress(): string {
  const address = process.env.NEXT_PUBLIC_MICROLOAN_CONTRACT_ADDRESS?.trim();
  if (!address) {
    console.warn(
      "[MicroLoan Config] NEXT_PUBLIC_MICROLOAN_CONTRACT_ADDRESS is not set. Defaulting to zero address."
    );
    return "0x0000000000000000000000000000000000000000";
  }

  if (!isAddress(address)) {
    console.error(
      `[MicroLoan Config] NEXT_PUBLIC_MICROLOAN_CONTRACT_ADDRESS is not a valid Ethereum address: "${address}"`
    );
    return "0x0000000000000000000000000000000000000000";
  }

  return address;
}

/**
 * Checks if a real, non-zero contract address is configured.
 */
export function isContractConfigured(): boolean {
  const addr = getMicroLoanContractAddress();
  return isAddress(addr) && addr !== "0x0000000000000000000000000000000000000000";
}

export function getSepoliaRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim() || SEPOLIA_DEFAULT_RPC;
}

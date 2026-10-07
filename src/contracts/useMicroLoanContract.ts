"use client";

import { useMemo } from "react";
import { Contract } from "ethers";
import { useWallet } from "@/context/WalletContext";
import {
  getReadOnlyMicroLoanContract,
  getSignerMicroLoanContract,
} from "./microloan";
import {
  getMicroLoanContractAddress,
  isContractConfigured,
} from "./config";

export interface UseMicroLoanContractResult {
  /**
   * Contract instance bound to the active wallet signer.
   * Null if wallet is not connected or connected to wrong network.
   */
  contract: Contract | null;

  /**
   * Read-only contract instance connected to the Sepolia RPC provider.
   * Always available for static queries.
   */
  readOnlyContract: Contract;

  /**
   * True when the signer contract is ready for transaction calls on Sepolia.
   */
  isReady: boolean;

  /**
   * The resolved contract address from environment variable.
   */
  contractAddress: string;

  /**
   * True if a valid non-zero contract address is configured.
   */
  isConfigured: boolean;
}

export function useMicroLoanContract(): UseMicroLoanContractResult {
  const { signer, isSepolia } = useWallet();
  const contractAddress = getMicroLoanContractAddress();
  const isConfigured = isContractConfigured();

  const readOnlyContract = useMemo(() => {
    return getReadOnlyMicroLoanContract();
  }, []);

  const contract = useMemo(() => {
    if (!signer || !isSepolia) {
      return null;
    }
    return getSignerMicroLoanContract(signer);
  }, [signer, isSepolia]);

  return {
    contract,
    readOnlyContract,
    isReady: Boolean(contract && isSepolia),
    contractAddress,
    isConfigured,
  };
}

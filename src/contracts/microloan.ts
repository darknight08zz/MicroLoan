import {
  BrowserProvider,
  Contract,
  ContractRunner,
  JsonRpcProvider,
  JsonRpcSigner,
} from "ethers";
import MicroLoanABI from "./abi/MicroLoan.json";
import {
  getMicroLoanContractAddress,
  getSepoliaRpcUrl,
  SEPOLIA_CHAIN_ID,
} from "./config";

export { MicroLoanABI };

/**
 * 1. BrowserProvider Utility
 * Obtains an ethers v6 BrowserProvider wrapping the window.ethereum injected provider.
 */
export function getBrowserProvider(): BrowserProvider | null {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }
  return new BrowserProvider(window.ethereum);
}

/**
 * 2. Signer Utility
 * Obtains the active JsonRpcSigner from a BrowserProvider.
 * If no provider is passed, it attempts to use the injected browser provider.
 */
export async function getSigner(
  provider?: BrowserProvider
): Promise<JsonRpcSigner | null> {
  const browserProvider = provider || getBrowserProvider();
  if (!browserProvider) {
    return null;
  }
  try {
    return await browserProvider.getSigner();
  } catch (error) {
    console.warn("[MicroLoan Contracts] Could not acquire signer:", error);
    return null;
  }
}

/**
 * Read-Only Provider Utility
 * Returns a fallback JsonRpcProvider connected to the Sepolia RPC endpoint.
 */
export function getReadOnlyProvider(): JsonRpcProvider {
  return new JsonRpcProvider(getSepoliaRpcUrl(), SEPOLIA_CHAIN_ID);
}

/**
 * 3. Read-Only Contract Utility
 * Instantiates the MicroLoan contract with a read-only runner.
 * If no runner is provided, it connects via the Sepolia JsonRpcProvider.
 */
export function getReadOnlyMicroLoanContract(
  runner?: ContractRunner
): Contract {
  const contractAddress = getMicroLoanContractAddress();
  const effectiveRunner = runner || getReadOnlyProvider();
  return new Contract(contractAddress, MicroLoanABI, effectiveRunner);
}

/**
 * 4. Signer-Connected Contract Utility
 * Instantiates the MicroLoan contract bound to an active JsonRpcSigner.
 */
export function getSignerMicroLoanContract(
  signer: JsonRpcSigner
): Contract {
  const contractAddress = getMicroLoanContractAddress();
  return new Contract(contractAddress, MicroLoanABI, signer);
}

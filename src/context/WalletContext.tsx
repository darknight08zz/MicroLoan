"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  send?: (method: string, params?: unknown[]) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export interface WalletContextType {
  account: string | null;
  shortAddress: string | null;
  chainId: number | null;
  networkName: string;
  isSepolia: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  isSwitchingNetwork: boolean;
  isMetaMaskInstalled: boolean;
  error: string | null;
  accountChangeNotice: string | null;
  connectWallet: () => Promise<void>;
  switchToSepolia: () => Promise<boolean>;
  disconnectWallet: () => void;
  clearError: () => void;
  clearAccountChangeNotice: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";

// React 19 compliant browser store check for window.ethereum
const subscribeNoop = () => () => {};
const getEthereumSnapshot = () => Boolean(typeof window !== "undefined" && window.ethereum);
const getEthereumServerSnapshot = () => false;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountChangeNotice, setAccountChangeNotice] = useState<string | null>(null);

  const prevAccountRef = useRef<string | null>(null);

  const isMetaMaskInstalled = useSyncExternalStore(
    subscribeNoop,
    getEthereumSnapshot,
    getEthereumServerSnapshot
  );

  // Sync state from provider
  const syncAccountAndNetwork = useCallback(
    async (browserProvider: BrowserProvider) => {
      try {
        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);

        const accounts = (await browserProvider.send(
          "eth_accounts",
          []
        )) as string[];

        if (accounts && accounts.length > 0) {
          const normalizedAddress = accounts[0].toLowerCase();
          const currentSigner = await browserProvider.getSigner(normalizedAddress);
          const address = await currentSigner.getAddress();
          setAccount(address);
          setSigner(currentSigner);
          prevAccountRef.current = address;
        }
        setProvider(browserProvider);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to sync account/signer:", err);
      }
    },
    []
  );

  // Auto-connect check on page load / refresh if previously permitted
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      const isManuallyDisconnected =
        sessionStorage.getItem("microloan_wallet_disconnected") === "true";
      if (isManuallyDisconnected) return;

      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        const accounts = (await browserProvider.send(
          "eth_accounts",
          []
        )) as string[];
        if (accounts && accounts.length > 0) {
          await syncAccountAndNetwork(browserProvider);
        }
      } catch (err: unknown) {
        console.warn("Eager wallet reconnect check:", err);
      }
    };

    checkConnection();
  }, [syncAccountAndNetwork]);

  // Listen to accountsChanged and chainChanged events from MetaMask
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      const prev = prevAccountRef.current;

      if (!accounts || accounts.length === 0) {
        // User disconnected all accounts in MetaMask
        setAccount(null);
        setSigner(null);
        prevAccountRef.current = null;
        sessionStorage.setItem("microloan_wallet_disconnected", "true");
        if (prev) {
          setAccountChangeNotice("Wallet disconnected in MetaMask.");
        }
      } else {
        const newAccount = accounts[0];
        if (prev && prev.toLowerCase() !== newAccount.toLowerCase()) {
          setAccountChangeNotice(
            `Active wallet changed to ${shortenAddress(newAccount)}. Loan dashboard reloaded for this account.`
          );
        }
        sessionStorage.removeItem("microloan_wallet_disconnected");
        if (window.ethereum) {
          const browserProvider = new BrowserProvider(window.ethereum);
          await syncAccountAndNetwork(browserProvider);
        }
      }
    };

    const handleChainChanged = async (...args: unknown[]) => {
      const hexChainId = args[0] as string;
      const newChainId = parseInt(hexChainId, 16);
      setChainId(newChainId);
      if (window.ethereum) {
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        await syncAccountAndNetwork(browserProvider);
      }
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [syncAccountAndNetwork]);

  // Connect Wallet Action
  const connectWallet = useCallback(async () => {
    setError(null);

    if (typeof window === "undefined" || !window.ethereum) {
      setError(
        "MetaMask is not installed in your browser. Please install the MetaMask extension from metamask.io to connect to Sepolia."
      );
      return;
    }

    setIsConnecting(true);

    try {
      sessionStorage.removeItem("microloan_wallet_disconnected");
      const browserProvider = new BrowserProvider(window.ethereum);

      // Request account access via eth_requestAccounts
      const accounts = (await browserProvider.send(
        "eth_requestAccounts",
        []
      )) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in your wallet.");
      }

      await syncAccountAndNetwork(browserProvider);
    } catch (err: unknown) {
      console.error("Wallet connection error:", err);
      const errorObj = err as {
        code?: number | string;
        message?: string;
        info?: { error?: { code?: number | string; message?: string } };
      };
      const code = errorObj?.code || errorObj?.info?.error?.code;
      const message = errorObj?.message || errorObj?.info?.error?.message || "";

      // Code 4001: User rejected connection request
      if (
        code === 4001 ||
        code === "ACTION_REJECTED" ||
        message.toLowerCase().includes("rejected") ||
        message.toLowerCase().includes("user denied")
      ) {
        setError("Connection request was cancelled in MetaMask.");
      }
      // Code -32002: Request already pending
      else if (code === -32002 || message.toLowerCase().includes("already pending")) {
        setError(
          "A connection request is already pending in MetaMask. Please open your MetaMask extension to approve."
        );
      } else {
        setError(
          message || "Failed to connect wallet. Please open MetaMask and try again."
        );
      }
    } finally {
      setIsConnecting(false);
    }
  }, [syncAccountAndNetwork]);

  // Switch Network to Sepolia Action
  const switchToSepolia = useCallback(async (): Promise<boolean> => {
    setError(null);

    if (typeof window === "undefined" || !window.ethereum) {
      setError(
        "MetaMask is not installed. Please install MetaMask to switch networks."
      );
      return false;
    }

    setIsSwitchingNetwork(true);

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      try {
        // Attempt to switch to Sepolia testnet (0xaa36a7)
        await browserProvider.send("wallet_switchEthereumChain", [
          { chainId: SEPOLIA_HEX_CHAIN_ID },
        ]);
      } catch (switchError: unknown) {
        const err = switchError as {
          code?: number;
          message?: string;
          info?: { error?: { code?: number } };
        };
        const code = err?.code || err?.info?.error?.code;

        // Error code 4902 indicates that the chain has not been added to MetaMask yet
        if (code === 4902) {
          await browserProvider.send("wallet_addEthereumChain", [
            {
              chainId: SEPOLIA_HEX_CHAIN_ID,
              chainName: "Sepolia",
              nativeCurrency: {
                name: "Sepolia Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [
                "https://rpc.sepolia.org",
                "https://ethereum-sepolia-rpc.publicnode.com",
              ],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ]);
        } else {
          throw switchError;
        }
      }

      if (window.ethereum) {
        const updatedProvider = new BrowserProvider(window.ethereum);
        await syncAccountAndNetwork(updatedProvider);
      }
      return true;
    } catch (err: unknown) {
      console.error("Network switch error:", err);
      const errorObj = err as {
        code?: number;
        message?: string;
        info?: { error?: { code?: number } };
      };
      const code = errorObj?.code || errorObj?.info?.error?.code;
      const message = errorObj?.message || "";

      if (
        code === 4001 ||
        message.toLowerCase().includes("rejected") ||
        message.toLowerCase().includes("user denied")
      ) {
        setError("Network switch request was rejected in MetaMask.");
      } else {
        setError(message || "Failed to switch to Sepolia network.");
      }
      return false;
    } finally {
      setIsSwitchingNetwork(false);
    }
  }, [syncAccountAndNetwork]);

  // Disconnect Wallet Action
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    sessionStorage.setItem("microloan_wallet_disconnected", "true");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAccountChangeNotice = useCallback(() => {
    setAccountChangeNotice(null);
  }, []);

  const shortAddress = account ? shortenAddress(account) : null;
  const isSepolia = chainId === SEPOLIA_CHAIN_ID;
  const networkName =
    chainId === SEPOLIA_CHAIN_ID
      ? "Sepolia"
      : chainId === 1
      ? "Ethereum Mainnet"
      : chainId === 11155420
      ? "Optimism Sepolia"
      : chainId === 421614
      ? "Arbitrum Sepolia"
      : chainId === 84532
      ? "Base Sepolia"
      : chainId === 17000
      ? "Holesky"
      : chainId === 137
      ? "Polygon"
      : chainId === 80002
      ? "Polygon Amoy"
      : chainId === 31337 || chainId === 1337
      ? "Hardhat Local"
      : chainId
      ? `Chain ID ${chainId}`
      : "Unknown Network";

  return (
    <WalletContext.Provider
      value={{
        account,
        shortAddress,
        chainId,
        networkName,
        isSepolia,
        provider,
        signer,
        isConnecting,
        isSwitchingNetwork,
        isMetaMaskInstalled,
        error,
        accountChangeNotice,
        connectWallet,
        switchToSepolia,
        disconnectWallet,
        clearError,
        clearAccountChangeNotice,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

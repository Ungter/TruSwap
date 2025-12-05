"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { base } from "viem/chains";
import { http } from "wagmi";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

// Configure wagmi with Base as the primary chain
const config = createConfig({
    chains: [base],
    transports: {
        [base.id]: http(),
    },
});

export const PrivyProviderWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
            config={{
                loginMethods: ["email", "google", "twitter"],
                appearance: {
                    theme: "dark",
                    accentColor: "#676FFF",
                },
                // Set Base as the default chain
                defaultChain: base,
                supportedChains: [base],
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "all-users",
                    },
                    solana: {
                        createOnLogin: "all-users",
                    },
                    showWalletUIs: true,
                },
                // Configure Solana RPC
                solana: {
                    rpcs: {
                        "solana:mainnet": {
                            rpc: createSolanaRpc("https://api.mainnet-beta.solana.com"),
                            rpcSubscriptions: createSolanaRpcSubscriptions("wss://api.mainnet-beta.solana.com"),
                        },
                    },
                },
            }}
        >
            <WagmiProvider config={config}>{children}</WagmiProvider>
        </PrivyProvider>
    );
};

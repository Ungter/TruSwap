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
                            rpc: createSolanaRpc("https://solana-rpc.publicnode.com"),
                            rpcSubscriptions: createSolanaRpcSubscriptions("wss://rpc.ankr.com/solana/ws/ebb70000455a1d87d3a500791004b558fb0d10789cae7d920590f4226669ea17"),
                        },
                    },
                },
            }}
        >
            <WagmiProvider config={config}>{children}</WagmiProvider>
        </PrivyProvider>
    );
};

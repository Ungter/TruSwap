"use client";

import { useEffect, useState } from "react";

export const SwapSolana = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
        const loadJupiter = async () => {
            try {
                // Dynamically import Jupiter plugin to avoid SSR issues
                const { init } = await import("@jup-ag/plugin");

                init({
                    displayMode: "integrated",
                    integratedTargetId: "jupiter-terminal",
                    // endpoint: "https://api.mainnet-beta.solana.com", // Or a better RPC
                });
            } catch (error) {
                console.error("Error loading Jupiter plugin:", error);
            }
        };

        loadJupiter();
    }, []);

    if (!mounted) return null;

    return (
        <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">Swap on Solana</h2>
                <div id="jupiter-terminal" className="h-[400px] w-full" />
            </div>
        </div>
    );
};

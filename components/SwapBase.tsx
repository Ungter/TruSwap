"use client";

import { useState, useEffect } from "react";
import { erc20Abi, maxUint256, parseUnits } from "viem";
import { useAccount, useReadContract, useWalletClient, useWriteContract } from "wagmi";

const KYBERSWAP_API_URL = "https://aggregator-api.kyberswap.com/base/api/v1";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SwapBase = () => {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [tokenIn, setTokenIn] = useState(ETH_ADDRESS);
    const [sellAmount, setSellAmount] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [approving, setApproving] = useState(false);

    // Check allowance if tokenIn is not ETH and we have a quote (which gives us the router address)
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: tokenIn === ETH_ADDRESS ? undefined : (tokenIn as `0x${string}`),
        abi: erc20Abi,
        functionName: "allowance",
        args: address && quote?.data?.routerAddress ? [address, quote.data.routerAddress] : undefined,
        query: {
            enabled: !!address && !!quote?.data?.routerAddress && tokenIn !== ETH_ADDRESS,
        },
    });

    const fetchQuote = async () => {
        if (!sellAmount) return;
        setLoading(true);
        setQuote(null); // Reset quote on new fetch
        try {
            // Default to 18 decimals for now, ideally we fetch token decimals
            const amountIn = parseUnits(sellAmount, 18).toString();
            const params = new URLSearchParams({
                tokenIn: tokenIn,
                tokenOut: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
                amountIn: amountIn,
            });

            const response = await fetch(`${KYBERSWAP_API_URL}/routes?${params.toString()}`, {
                headers: {
                    "x-client-id": process.env.NEXT_PUBLIC_KYBERSWAP_CLIENT_ID || "scaffold-eth-2",
                },
            });

            const data = await response.json();
            if (data.code === 0 && data.data) {
                setQuote(data);
                // Refetch allowance after getting new quote (and thus new router address)
                setTimeout(refetchAllowance, 100);
            } else {
                console.error("Error fetching quote:", data);
                alert("Failed to fetch quote");
            }
        } catch (error) {
            console.error("Error fetching quote:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!quote?.data?.routerAddress || !tokenIn) return;
        setApproving(true);
        try {
            await writeContractAsync({
                address: tokenIn as `0x${string}`,
                abi: erc20Abi,
                functionName: "approve",
                args: [quote.data.routerAddress, maxUint256],
            });
            alert("Approved! You can now swap.");
            await refetchAllowance();
        } catch (error) {
            console.error("Error approving:", error);
            alert("Approval failed");
        } finally {
            setApproving(false);
        }
    };

    const executeSwap = async () => {
        if (!quote || !walletClient || !address) return;
        try {
            // Build the route
            const buildResponse = await fetch(`${KYBERSWAP_API_URL}/route/build`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": process.env.NEXT_PUBLIC_KYBERSWAP_CLIENT_ID || "scaffold-eth-2",
                },
                body: JSON.stringify({
                    routeSummary: quote.data.routeSummary,
                    sender: address,
                    recipient: address,
                }),
            });

            const buildData = await buildResponse.json();

            if (buildData.code === 0 && buildData.data) {
                const { data: txData, routerAddress, transactionValue } = buildData.data;

                await walletClient.sendTransaction({
                    to: routerAddress,
                    data: txData,
                    value: BigInt(transactionValue),
                    account: address,
                    chain: undefined,
                });
                alert("Swap submitted!");
            } else {
                console.error("Error building route:", buildData);
                alert("Failed to build swap transaction");
            }
        } catch (error) {
            console.error("Error executing swap:", error);
            alert("Swap failed");
        }
    };

    const needsApproval =
        tokenIn !== ETH_ADDRESS && quote && allowance !== undefined && allowance < BigInt(quote.data.routeSummary.amountIn);

    if (!mounted) return null;

    return (
        <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">Swap on Base (KyberSwap)</h2>

                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text">Token In Address</span>
                    </label>
                    <input
                        type="text"
                        placeholder={ETH_ADDRESS}
                        className="input input-bordered w-full max-w-xs text-xs"
                        value={tokenIn}
                        onChange={e => setTokenIn(e.target.value)}
                    />
                    <label className="label">
                        <span className="label-text-alt">Default is ETH</span>
                    </label>
                </div>

                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text">Sell Amount</span>
                    </label>
                    <input
                        type="text"
                        placeholder="0.01"
                        className="input input-bordered w-full max-w-xs"
                        value={sellAmount}
                        onChange={e => setSellAmount(e.target.value)}
                    />
                </div>

                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-primary" onClick={fetchQuote} disabled={loading}>
                        {loading ? "Fetching..." : "Get Quote"}
                    </button>

                    {quote && needsApproval && (
                        <button className="btn btn-warning" onClick={handleApprove} disabled={approving}>
                            {approving ? "Approving..." : "Approve Token"}
                        </button>
                    )}

                    {quote && !needsApproval && (
                        <button className="btn btn-secondary" onClick={executeSwap}>
                            Swap
                        </button>
                    )}
                </div>

                {quote && quote.data && (
                    <div className="mt-4">
                        <p>Buy Amount: {quote.data.routeSummary.amountOutUsd} USD</p>
                        <p>Estimated Gas: {quote.data.routeSummary.gas}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

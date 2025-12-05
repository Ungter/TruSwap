"use client";

import { useState, useEffect } from "react";
import { erc20Abi, maxUint256, parseUnits, encodeFunctionData } from "viem";
import { useAccount, useReadContract, useWalletClient, useWriteContract, usePublicClient } from "wagmi";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { base } from "viem/chains";
import { BaseLogo, SolanaLogo, USDCLogo, ArrowRight } from "./ChainLogos";

// --- Constants & ABIs ---

const KYBERSWAP_API_URL = "https://aggregator-api.kyberswap.com/base/api/v1";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_TOKEN_MESSENGER = "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962";
const SOLANA_DESTINATION_DOMAIN = 5;

const TOKEN_MESSENGER_ABI = [
    {
        inputs: [
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "uint32", name: "destinationDomain", type: "uint32" },
            { internalType: "bytes32", name: "mintRecipient", type: "bytes32" },
            { internalType: "address", name: "burnToken", type: "address" },
        ],
        name: "depositForBurn",
        outputs: [{ internalType: "uint64", name: "_nonce", type: "uint64" }],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;

// --- Component ---

export const CrossChainBridge = () => {
    const [mounted, setMounted] = useState(false);
    const [direction, setDirection] = useState<"base-to-sol" | "sol-to-base">("base-to-sol");

    // Get wallet info
    const { authenticated } = usePrivy();
    const { address: baseAddress } = useAccount();
    const { wallets: solanaWallets } = useSolanaWallets();
    const solanaWallet = solanaWallets.find((w: any) => w.walletClientType === "privy" || w.standardWallet?.name === "Privy") || solanaWallets[0];

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="w-full max-w-2xl">
            {/* Wallet Addresses Display */}
            {authenticated && (baseAddress || solanaWallet) && (
                <div className="glass-card rounded-2xl p-4 mb-6">
                    <h3 className="text-sm font-medium text-white/60 mb-3 text-center">Your Wallets</h3>
                    <div className="flex flex-col gap-3">
                        {baseAddress && (
                            <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3">
                                <BaseLogo className="w-6 h-6 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white/50 mb-1">Base (EVM)</div>
                                    <div className="font-mono text-sm text-white break-all">{baseAddress}</div>
                                </div>
                            </div>
                        )}
                        {solanaWallet && (
                            <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3">
                                <SolanaLogo className="w-6 h-6 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white/50 mb-1">Solana</div>
                                    <div className="font-mono text-sm text-white break-all">{solanaWallet.address}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header with chain visualization */}
            <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-2xl transition-all duration-300 ${direction === "base-to-sol" ? "bg-[#0052ff]/20 scale-110" : "bg-white/5"}`}>
                        <BaseLogo className="w-12 h-12" />
                    </div>
                    <span className={`text-sm font-medium transition-colors ${direction === "base-to-sol" ? "text-white" : "text-white/50"}`}>Base</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className={`h-[2px] w-8 transition-all duration-300 ${direction === "base-to-sol" ? "bg-gradient-to-r from-[#0052ff] to-[#9945ff]" : "bg-white/20"}`} />
                        <div className={`p-2 rounded-full transition-all duration-300 ${direction === "base-to-sol" ? "bg-gradient-to-r from-[#0052ff] to-[#9945ff]" : "bg-gradient-to-l from-[#0052ff] to-[#9945ff]"}`}>
                            <ArrowRight className={`w-4 h-4 text-white transition-transform duration-300 ${direction === "sol-to-base" ? "rotate-180" : ""}`} />
                        </div>
                        <div className={`h-[2px] w-8 transition-all duration-300 ${direction === "sol-to-base" ? "bg-gradient-to-r from-[#9945ff] to-[#14f195]" : "bg-white/20"}`} />
                    </div>
                    <div className="usdc-badge">
                        <USDCLogo className="w-4 h-4" />
                        USDC
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-2xl transition-all duration-300 ${direction === "sol-to-base" ? "bg-[#9945ff]/20 scale-110" : "bg-white/5"}`}>
                        <SolanaLogo className="w-12 h-12" />
                    </div>
                    <span className={`text-sm font-medium transition-colors ${direction === "sol-to-base" ? "text-white" : "text-white/50"}`}>Solana</span>
                </div>
            </div>

            {/* Main Card */}
            <div className="glass-card rounded-3xl p-8">
                <h2 className="text-center mb-8">
                    <span className="text-2xl font-bold gradient-text">Cross-Chain Bridge</span>
                </h2>

                {/* Slider Toggle */}
                <div className="slider-container mb-8">
                    <div className={`slider-indicator ${direction === "sol-to-base" ? "right" : ""}`} />
                    <div
                        className={`slider-option ${direction === "base-to-sol" ? "active" : ""}`}
                        onClick={() => setDirection("base-to-sol")}
                    >
                        <BaseLogo className="w-5 h-5" />
                        <span>Base</span>
                        <ArrowRight className="w-4 h-4 arrow-animate" />
                        <SolanaLogo className="w-5 h-5" />
                    </div>
                    <div
                        className={`slider-option ${direction === "sol-to-base" ? "active" : ""}`}
                        onClick={() => setDirection("sol-to-base")}
                    >
                        <SolanaLogo className="w-5 h-5" />
                        <span>Solana</span>
                        <ArrowRight className="w-4 h-4 arrow-animate" />
                        <BaseLogo className="w-5 h-5" />
                    </div>
                </div>

                {direction === "base-to-sol" ? <BaseToSolana /> : <SolanaToBase />}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const BaseToSolana = () => {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    // Native Privy gas sponsorship
    const { sendTransaction } = useSendTransaction();

    // Get user's Solana wallet for default recipient
    const { wallets: solanaWallets } = useSolanaWallets();
    const solanaWallet = solanaWallets.find((w: any) => w.walletClientType === "privy" || w.standardWallet?.name === "Privy") || solanaWallets[0];

    const [tokenIn, setTokenIn] = useState(ETH_ADDRESS);
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [useCustomRecipient, setUseCustomRecipient] = useState(false);
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    // Default recipient to user's Solana wallet address
    useEffect(() => {
        if (solanaWallet?.address && !useCustomRecipient) {
            setRecipient(solanaWallet.address);
        }
    }, [solanaWallet?.address, useCustomRecipient]);

    // Allowance check for Swap
    const { data: swapAllowance, refetch: refetchSwapAllowance } = useReadContract({
        address: tokenIn === ETH_ADDRESS ? undefined : (tokenIn as `0x${string}`),
        abi: erc20Abi,
        functionName: "allowance",
        args: address && quote?.data?.routerAddress ? [address, quote.data.routerAddress] : undefined,
        query: {
            enabled: !!address && !!quote?.data?.routerAddress && tokenIn !== ETH_ADDRESS,
        },
    });

    // Allowance check for Bridge (USDC)
    const { data: bridgeAllowance, refetch: refetchBridgeAllowance } = useReadContract({
        address: BASE_USDC,
        abi: erc20Abi,
        functionName: "allowance",
        args: address ? [address, BASE_TOKEN_MESSENGER] : undefined,
        query: {
            enabled: !!address,
        },
    });

    const fetchQuote = async () => {
        if (!amount) return;
        setLoading(true);
        setQuote(null);
        try {
            const amountIn = parseUnits(amount, 18).toString();
            const params = new URLSearchParams({
                tokenIn: tokenIn,
                tokenOut: BASE_USDC,
                amountIn: amountIn,
            });

            const response = await fetch(`${KYBERSWAP_API_URL}/routes?${params.toString()}`, {
                headers: {
                    "x-client-id": process.env.NEXT_PUBLIC_KYBERSWAP_CLIENT_ID || "cross-chain-app",
                },
            });

            const data = await response.json();
            if (data.code === 0 && data.data) {
                setQuote(data);
                setTimeout(() => {
                    refetchSwapAllowance();
                    refetchBridgeAllowance();
                }, 100);
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

    const handleSwapAndBridge = async () => {
        if (!quote || !address || !recipient || !publicClient) return;

        setLoading(true);
        setStatus("Starting process...");

        try {
            // Build the swap transaction
            setStatus("Preparing swap...");
            const buildResponse = await fetch(`${KYBERSWAP_API_URL}/route/build`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": process.env.NEXT_PUBLIC_KYBERSWAP_CLIENT_ID || "cross-chain-app",
                },
                body: JSON.stringify({
                    routeSummary: quote.data.routeSummary,
                    sender: address,
                    recipient: address,
                }),
            });
            const buildData = await buildResponse.json();
            if (buildData.code !== 0) throw new Error("Failed to build swap");

            const { data: txData, routerAddress, transactionValue } = buildData.data;
            const amountUSDC = BigInt(quote.data.routeSummary.amountOut);
            const recipientPubKey = new PublicKey(recipient);
            const recipientBytes32 = "0x" + Buffer.from(recipientPubKey.toBytes()).toString("hex");

            // 1. Approve Token for Swap (if needed, with gas sponsorship)
            if (tokenIn !== ETH_ADDRESS && swapAllowance !== undefined && swapAllowance < BigInt(quote.data.routeSummary.amountIn)) {
                setStatus("Approving token for swap (gas sponsored)...");
                const approveTxReceipt = await sendTransaction(
                    {
                        to: tokenIn as `0x${string}`,
                        data: encodeFunctionData({
                            abi: erc20Abi,
                            functionName: "approve",
                            args: [routerAddress as `0x${string}`, maxUint256],
                        }),
                    },
                    { sponsor: true }
                );
                await refetchSwapAllowance();
            }

            // 2. Execute Swap (with gas sponsorship)
            setStatus("Swapping to USDC (gas sponsored)...");
            const swapTxReceipt = await sendTransaction(
                {
                    to: routerAddress as `0x${string}`,
                    data: txData as `0x${string}`,
                    value: BigInt(transactionValue),
                },
                { sponsor: true }
            );

            // 3. Approve USDC for Bridge (if needed, with gas sponsorship)
            if (bridgeAllowance !== undefined && bridgeAllowance < amountUSDC) {
                setStatus("Approving USDC for bridge (gas sponsored)...");
                const bridgeApproveTxReceipt = await sendTransaction(
                    {
                        to: BASE_USDC,
                        data: encodeFunctionData({
                            abi: erc20Abi,
                            functionName: "approve",
                            args: [BASE_TOKEN_MESSENGER, maxUint256],
                        }),
                    },
                    { sponsor: true }
                );
                await refetchBridgeAllowance();
            }

            // 4. Bridge USDC (with gas sponsorship)
            setStatus("Bridging USDC to Solana (gas sponsored)...");
            const bridgeTxReceipt = await sendTransaction(
                {
                    to: BASE_TOKEN_MESSENGER,
                    data: encodeFunctionData({
                        abi: TOKEN_MESSENGER_ABI,
                        functionName: "depositForBurn",
                        args: [amountUSDC, SOLANA_DESTINATION_DOMAIN, recipientBytes32 as `0x${string}`, BASE_USDC],
                    }),
                },
                { sponsor: true }
            );

            setStatus("Success! Bridge transaction submitted (gas sponsored).");
            alert("Bridge transaction submitted with gas sponsorship! Please wait for attestation on the destination chain.");

        } catch (error) {
            console.error("Error in Swap & Bridge:", error);
            setStatus("Failed: " + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium text-white/80">Token In (Base Address)</span></label>
                <input
                    type="text"
                    placeholder={ETH_ADDRESS}
                    className="input input-bordered w-full text-sm font-mono input-premium rounded-xl"
                    value={tokenIn}
                    onChange={e => setTokenIn(e.target.value)}
                />
                <label className="label"><span className="label-text-alt text-white/40">Default: ETH</span></label>
            </div>

            <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium text-white/80">Amount</span></label>
                <input
                    type="text"
                    placeholder="0.01"
                    className="input input-bordered w-full font-mono input-premium rounded-xl text-lg"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
            </div>

            <div className="form-control w-full">
                <div className="flex items-center justify-between mb-2">
                    <label className="label py-0"><span className="label-text font-medium text-white/80">Recipient (Solana Address)</span></label>
                    <label className="label cursor-pointer gap-2 py-0">
                        <span className="label-text text-xs text-white/50">Custom</span>
                        <input
                            type="checkbox"
                            className="toggle toggle-sm toggle-primary"
                            checked={useCustomRecipient}
                            onChange={(e) => {
                                setUseCustomRecipient(e.target.checked);
                                if (!e.target.checked && solanaWallet?.address) {
                                    setRecipient(solanaWallet.address);
                                }
                            }}
                        />
                    </label>
                </div>
                <input
                    type="text"
                    placeholder="Solana Wallet Address"
                    className={`input input-bordered w-full font-mono input-premium rounded-xl text-sm ${!useCustomRecipient ? 'bg-black/30 text-white/70' : ''}`}
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    readOnly={!useCustomRecipient}
                />
                {!useCustomRecipient && solanaWallet && (
                    <label className="label"><span className="label-text-alt text-white/40">Using your Solana wallet</span></label>
                )}
            </div>

            <button className="btn btn-gradient w-full mt-2 rounded-xl h-12 text-base" onClick={fetchQuote} disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Get Quote"}
            </button>

            {quote && (
                <div className="quote-box p-5 mt-2">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-white/60">Estimated Output</span>
                        <span className="font-bold text-xl text-[#14f195]">{quote.data.routeSummary.amountOutUsd} USD</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-white/40 mb-4">
                        <span>Gas Estimate</span>
                        <span>{quote.data.routeSummary.gas}</span>
                    </div>

                    <button className="btn btn-gradient w-full rounded-xl h-12 text-base" onClick={handleSwapAndBridge} disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : "Swap & Bridge"}
                    </button>

                    {status && (
                        <div className="status-card mt-4 p-3 text-sm text-center text-white/80">
                            {status}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SolanaToBase = () => {
    const { authenticated, login } = usePrivy();
    const { wallets } = useSolanaWallets();
    const { signAndSendTransaction } = useSignAndSendTransaction();
    // Find the Privy embedded wallet (using first wallet as fallback)
    const solanaWallet = wallets.find((w: any) => w.walletClientType === "privy" || w.standardWallet?.name === "Privy") || wallets[0];

    // Get user's Base wallet for default recipient
    const { address: baseAddress } = useAccount();

    const [tokenIn, setTokenIn] = useState("So11111111111111111111111111111111111111112");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [useCustomRecipient, setUseCustomRecipient] = useState(false);
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    // Default recipient to user's Base wallet address
    useEffect(() => {
        if (baseAddress && !useCustomRecipient) {
            setRecipient(baseAddress);
        }
    }, [baseAddress, useCustomRecipient]);

    const fetchQuote = async () => {
        if (!amount || !solanaWallet) return;
        setLoading(true);
        setQuote(null);
        try {
            // Using Jupiter Ultra API - combines quote and order in one request
            const orderUrl = `https://api.jup.ag/ultra/v1/order?inputMint=${tokenIn}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${Math.floor(parseFloat(amount) * 1e9)}&taker=${solanaWallet.address}`;

            const headers: Record<string, string> = {};
            if (process.env.NEXT_PUBLIC_JUPITER_API_KEY) {
                headers["x-api-key"] = process.env.NEXT_PUBLIC_JUPITER_API_KEY;
            }

            const orderResponse = await fetch(orderUrl, { headers });
            const orderData = await orderResponse.json();

            if (orderData.outAmount || orderData.transaction) {
                setQuote(orderData);
            } else {
                console.error("Error fetching order:", orderData);
                setStatus(orderData.error || "Failed to fetch quote from Jupiter Ultra");
            }
        } catch (error: any) {
            console.error("Error fetching quote:", error);
            if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
                setStatus("Network error: Cannot reach Jupiter API. Please check your internet connection.");
            } else {
                setStatus("Error: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSwapAndBridge = async () => {
        if (!quote || !solanaWallet || !recipient) return;
        setLoading(true);
        setStatus("Starting process...");

        try {
            // Ultra API already provides the transaction in the order response
            if (!quote.transaction) {
                throw new Error("No transaction found in order response");
            }

            setStatus("Signing and sending transaction...");

            // Decode the base64 transaction to Uint8Array
            const transactionBytes = new Uint8Array(Buffer.from(quote.transaction, "base64"));

            // Use Privy's signAndSendTransaction hook for proper wallet handling
            const result = await signAndSendTransaction({
                transaction: transactionBytes,
                wallet: solanaWallet,
            });

            setStatus("Swap executed! Transaction signature: " + result.signature);
            alert("Swap successful! USDC is now in your wallet. \n\nTransaction: " + result.signature + "\n\nBridging from Solana is not fully implemented in this demo. Please use the official Circle bridge or wait for the next update.");
            setStatus("Swap successful. Bridging pending implementation.");

        } catch (error) {
            console.error("Error in Swap & Bridge:", error);
            setStatus("Failed: " + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    // If not authenticated, prompt login
    if (!authenticated) {
        return (
            <div className="flex flex-col gap-5">
                <div className="text-center text-white/60 mb-2">
                    Login to access your Solana wallet
                </div>
                <button className="btn btn-gradient w-full rounded-xl h-12 text-base" onClick={login}>
                    Login to Continue
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {solanaWallet && (
                <div className="status-card py-3 px-4 text-sm flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#14f195] animate-pulse" />
                    Wallet: {solanaWallet.address.slice(0, 4)}...{solanaWallet.address.slice(-4)}
                </div>
            )}

            <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium text-white/80">Token In (Solana Address)</span></label>
                <input
                    type="text"
                    placeholder="So11111111111111111111111111111111111111112"
                    className="input input-bordered w-full text-sm font-mono input-premium rounded-xl"
                    value={tokenIn}
                    onChange={e => setTokenIn(e.target.value)}
                />
                <label className="label"><span className="label-text-alt text-white/40">Default: SOL</span></label>
            </div>

            <div className="form-control w-full">
                <label className="label"><span className="label-text font-medium text-white/80">Amount</span></label>
                <input
                    type="text"
                    placeholder="0.1"
                    className="input input-bordered w-full font-mono input-premium rounded-xl text-lg"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
            </div>

            <div className="form-control w-full">
                <div className="flex items-center justify-between mb-2">
                    <label className="label py-0"><span className="label-text font-medium text-white/80">Recipient (Base Address)</span></label>
                    <label className="label cursor-pointer gap-2 py-0">
                        <span className="label-text text-xs text-white/50">Custom</span>
                        <input
                            type="checkbox"
                            className="toggle toggle-sm toggle-primary"
                            checked={useCustomRecipient}
                            onChange={(e) => {
                                setUseCustomRecipient(e.target.checked);
                                if (!e.target.checked && baseAddress) {
                                    setRecipient(baseAddress);
                                }
                            }}
                        />
                    </label>
                </div>
                <input
                    type="text"
                    placeholder="Base Wallet Address"
                    className={`input input-bordered w-full font-mono input-premium rounded-xl text-sm ${!useCustomRecipient ? 'bg-black/30 text-white/70' : ''}`}
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    readOnly={!useCustomRecipient}
                />
                {!useCustomRecipient && baseAddress && (
                    <label className="label"><span className="label-text-alt text-white/40">Using your Base wallet</span></label>
                )}
            </div>

            <button className="btn btn-gradient w-full mt-2 rounded-xl h-12 text-base" onClick={fetchQuote} disabled={loading || !solanaWallet}>
                {loading ? <span className="loading loading-spinner"></span> : "Get Quote"}
            </button>

            {quote && (
                <div className="quote-box p-5 mt-2">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-white/60">Estimated Output</span>
                        <span className="font-bold text-xl text-[#14f195]">{(parseInt(quote.outAmount) / 1e6).toFixed(2)} USDC</span>
                    </div>

                    <button className="btn btn-gradient w-full rounded-xl h-12 text-base" onClick={handleSwapAndBridge} disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : "Swap & Bridge"}
                    </button>

                    {status && (
                        <div className="status-card mt-4 p-3 text-sm text-center text-white/80">
                            {status}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

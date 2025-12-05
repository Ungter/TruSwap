"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { parseUnits } from "viem";
import { useWriteContract } from "wagmi";

// TokenMessenger ABI (minimal)
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

// USDC ABI (minimal)
const USDC_ABI = [
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;

const BASE_TOKEN_MESSENGER = "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962"; // Base TokenMessenger
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
const SOLANA_DESTINATION_DOMAIN = 5;

export const Bridge = () => {
    const { writeContractAsync } = useWriteContract();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const [amount, setAmount] = useState("");
    const [solanaRecipient, setSolanaRecipient] = useState("");
    const [loading, setLoading] = useState(false);

    const handleBridge = async () => {
        if (!amount || !solanaRecipient) return;
        setLoading(true);
        try {
            const amountBigInt = parseUnits(amount, 6); // USDC has 6 decimals

            // 1. Approve USDC
            await writeContractAsync({
                address: BASE_USDC,
                abi: USDC_ABI,
                functionName: "approve",
                args: [BASE_TOKEN_MESSENGER, amountBigInt],
            });

            // 2. Convert Solana address to bytes32
            const recipientPubKey = new PublicKey(solanaRecipient);
            const recipientBytes32 = "0x" + Buffer.from(recipientPubKey.toBytes()).toString("hex");

            // 3. Deposit for Burn
            await writeContractAsync({
                address: BASE_TOKEN_MESSENGER,
                abi: TOKEN_MESSENGER_ABI,
                functionName: "depositForBurn",
                args: [amountBigInt, SOLANA_DESTINATION_DOMAIN, recipientBytes32 as `0x${string}`, BASE_USDC],
            });

            alert("Bridge transaction submitted! Wait for attestation.");
        } catch (error) {
            console.error("Bridge error:", error);
            alert("Bridge failed");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="card w-96 bg-base-100 shadow-xl mt-4">
            <div className="card-body">
                <h2 className="card-title">Bridge USDC to Solana</h2>
                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text">Amount (USDC)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="10"
                        className="input input-bordered w-full max-w-xs"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>
                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text">Solana Recipient Address</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Solana Wallet Address"
                        className="input input-bordered w-full max-w-xs"
                        value={solanaRecipient}
                        onChange={e => setSolanaRecipient(e.target.value)}
                    />
                </div>
                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-primary" onClick={handleBridge} disabled={loading}>
                        {loading ? "Bridging..." : "Bridge to Solana"}
                    </button>
                </div>
            </div>
        </div>
    );
};

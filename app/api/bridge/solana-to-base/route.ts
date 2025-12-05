/**
 * API Route: Build CCTP Bridge Transaction (Solana → Base)
 * 
 * This endpoint builds a depositForBurn transaction and signs it with
 * the required messageSentEventAccount keypair. The client then adds
 * their signature and broadcasts the transaction.
 */

import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { buildDepositForBurnTransaction, DOMAIN_BASE } from "@/lib/cctpSolanaBridge";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, userPublicKey, mintRecipient } = body;

        // Validate inputs
        if (!amount || !userPublicKey || !mintRecipient) {
            return NextResponse.json(
                { error: "Missing required fields: amount, userPublicKey, mintRecipient" },
                { status: 400 }
            );
        }

        // Validate EVM address format
        if (!mintRecipient.match(/^0x[a-fA-F0-9]{40}$/)) {
            return NextResponse.json(
                { error: "Invalid EVM address format for mintRecipient" },
                { status: 400 }
            );
        }

        // Create Solana connection
        const connection = new Connection(
            process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
            "confirmed"
        );

        // Build the transaction
        const result = await buildDepositForBurnTransaction({
            amount: BigInt(amount),
            destinationDomain: DOMAIN_BASE,
            mintRecipient,
            userPublicKey: new PublicKey(userPublicKey),
            connection,
        });

        // Return the partially signed transaction
        // The client will add their signature and broadcast
        return NextResponse.json({
            success: true,
            transaction: result.serializedTransaction,
            messageSentEventAccount: result.messageSentEventAccountKeypair.publicKey.toBase58(),
        });

    } catch (error: any) {
        console.error("Error building bridge transaction:", error);
        return NextResponse.json(
            { error: error.message || "Failed to build bridge transaction" },
            { status: 500 }
        );
    }
}

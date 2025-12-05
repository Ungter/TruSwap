/**
 * CCTP Solana Bridge Utility
 * Server-side utilities for building Solana CCTP depositForBurn transactions
 */

import { Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction, Keypair, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";

// --- Program Addresses (Mainnet) ---
export const TOKEN_MESSENGER_MINTER_PROGRAM_ID = new PublicKey("CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe");
export const MESSAGE_TRANSMITTER_PROGRAM_ID = new PublicKey("CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC");

// USDC mint on Solana
export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Domain IDs for CCTP
export const DOMAIN_SOLANA = 5;
export const DOMAIN_BASE = 6;

// --- Address Conversion ---

/**
 * Convert an EVM address (0x...) to a 32-byte PublicKey for CCTP mintRecipient
 */
export function evmAddressToBytes32PublicKey(evmAddress: string): PublicKey {
    const cleanAddress = evmAddress.replace("0x", "").toLowerCase();
    const bytes32Hex = "000000000000000000000000" + cleanAddress;
    const buffer = Buffer.from(bytes32Hex, "hex");
    return new PublicKey(buffer);
}

// --- PDA Derivation ---

export function getTokenMessengerPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_messenger")],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

export function getTokenMinterPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_minter")],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

export function getLocalTokenPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("local_token"), USDC_MINT.toBuffer()],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

export function getCustodyTokenAccountPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), USDC_MINT.toBuffer()],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

export function getRemoteTokenMessengerPDA(remoteDomain: number): PublicKey {
    const domainBuffer = Buffer.alloc(4);
    domainBuffer.writeUInt32LE(remoteDomain);
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("remote_token_messenger"), domainBuffer],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

export function getMessageTransmitterConfigPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("message_transmitter")],
        MESSAGE_TRANSMITTER_PROGRAM_ID
    );
    return pda;
}

export function getTokenMessengerEventAuthorityPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("__event_authority")],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

export function getMessageTransmitterEventAuthorityPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("__event_authority")],
        MESSAGE_TRANSMITTER_PROGRAM_ID
    );
    return pda;
}

export function getSenderAuthorityPDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("sender_authority")],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

// --- Build depositForBurn Transaction ---

export interface DepositForBurnParams {
    amount: bigint;
    destinationDomain: number;
    mintRecipient: string; // EVM address (0x...)
    userPublicKey: PublicKey;
    connection: Connection;
}

export interface DepositForBurnResult {
    transaction: VersionedTransaction;
    messageSentEventAccountKeypair: Keypair;
    serializedTransaction: string;
    messageSentEventAccountSecret: string;
}

/**
 * Build a depositForBurn transaction for CCTP
 * Returns the transaction and the keypair that needs to sign it
 */
export async function buildDepositForBurnTransaction(params: DepositForBurnParams): Promise<DepositForBurnResult> {
    const { amount, destinationDomain, mintRecipient, userPublicKey, connection } = params;

    // Generate a new keypair for the message sent event account
    const messageSentEventAccountKeypair = Keypair.generate();

    // Get user's USDC token account
    const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, userPublicKey);

    // Convert EVM address to bytes32 PublicKey
    const mintRecipientPubkey = evmAddressToBytes32PublicKey(mintRecipient);

    // Destination caller - zeros = anyone can call receiveMessage
    const destinationCaller = new PublicKey(new Uint8Array(32));

    // Get PDAs
    const tokenMessenger = getTokenMessengerPDA();
    const tokenMinter = getTokenMinterPDA();
    const localToken = getLocalTokenPDA();
    const custodyTokenAccount = getCustodyTokenAccountPDA();
    const remoteTokenMessenger = getRemoteTokenMessengerPDA(destinationDomain);
    const messageTransmitterConfig = getMessageTransmitterConfigPDA();
    const tokenMessengerEventAuthority = getTokenMessengerEventAuthorityPDA();
    const messageTransmitterEventAuthority = getMessageTransmitterEventAuthorityPDA();
    const senderAuthority = getSenderAuthorityPDA();

    // depositForBurn instruction discriminator (from Anchor IDL)
    // This is the first 8 bytes of sha256("global:deposit_for_burn")
    const discriminator = Buffer.from([178, 4, 183, 66, 144, 56, 57, 174]);

    // Build instruction data
    const instructionData = Buffer.concat([
        discriminator,
        new anchor.BN(amount.toString()).toArrayLike(Buffer, "le", 8), // amount (u64)
        Buffer.from(new Uint32Array([destinationDomain]).buffer), // destinationDomain (u32)
        mintRecipientPubkey.toBuffer(), // mintRecipient (Pubkey - 32 bytes)
        destinationCaller.toBuffer(), // destinationCaller (Pubkey - 32 bytes)
        new anchor.BN(0).toArrayLike(Buffer, "le", 8), // maxFee (u64) - 0 for standard
        Buffer.from(new Uint32Array([2000]).buffer), // minFinalityThreshold (u32) - finalized
    ]);

    // Build instruction with all required accounts
    const instruction = new TransactionInstruction({
        programId: TOKEN_MESSENGER_MINTER_PROGRAM_ID,
        keys: [
            // owner/payer - user signs
            { pubkey: userPublicKey, isSigner: true, isWritable: true },
            // message_sent_event_account - new keypair signs
            { pubkey: messageSentEventAccountKeypair.publicKey, isSigner: true, isWritable: true },
            // token_messenger
            { pubkey: tokenMessenger, isSigner: false, isWritable: false },
            // remote_token_messenger
            { pubkey: remoteTokenMessenger, isSigner: false, isWritable: false },
            // token_minter
            { pubkey: tokenMinter, isSigner: false, isWritable: true },
            // local_token
            { pubkey: localToken, isSigner: false, isWritable: true },
            // burn_token_account (user's USDC ATA)
            { pubkey: userTokenAccount, isSigner: false, isWritable: true },
            // custody_token_account
            { pubkey: custodyTokenAccount, isSigner: false, isWritable: true },
            // burn_token_mint (USDC)
            { pubkey: USDC_MINT, isSigner: false, isWritable: true },
            // message_transmitter_config
            { pubkey: messageTransmitterConfig, isSigner: false, isWritable: true },
            // message_transmitter_program
            { pubkey: MESSAGE_TRANSMITTER_PROGRAM_ID, isSigner: false, isWritable: false },
            // sender_authority_pda
            { pubkey: senderAuthority, isSigner: false, isWritable: false },
            // token_program
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            // system_program
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            // event_authority (token_messenger)
            { pubkey: tokenMessengerEventAuthority, isSigner: false, isWritable: false },
            // program (self)
            { pubkey: TOKEN_MESSENGER_MINTER_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: instructionData,
    });

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // Create transaction message
    const message = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
    }).compileToV0Message();

    // Create versioned transaction
    const transaction = new VersionedTransaction(message);

    // Sign with the message sent event account keypair
    transaction.sign([messageSentEventAccountKeypair]);

    // Serialize the partially signed transaction
    const serializedTransaction = Buffer.from(transaction.serialize()).toString("base64");

    // Export the keypair secret for verification (if needed later)
    const messageSentEventAccountSecret = Buffer.from(messageSentEventAccountKeypair.secretKey).toString("base64");

    return {
        transaction,
        messageSentEventAccountKeypair,
        serializedTransaction,
        messageSentEventAccountSecret,
    };
}

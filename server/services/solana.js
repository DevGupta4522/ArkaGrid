import * as anchor from '@coral-xyz/anchor';
import {
    Connection,
    Keypair,
    PublicKey,
    clusterApiUrl,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ──────────────────────────────────

const PROGRAM_ID = process.env.SOLANA_PROGRAM_ID;
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
const TRADE_SEED = Buffer.from('arkagrid_trade');
const ESCROW_SEED = Buffer.from('arkagrid_escrow');
const CONFIG_SEED = Buffer.from('arkagrid_config');

let connection, program, meterAuthority, solanaEnabled = false;

// ── Initialize Connection ──────────────────────────
async function initSolana() {
    try {
        if (!PROGRAM_ID || !process.env.ARKAGRID_METER_AUTHORITY_KEYPAIR) {
            console.warn('[ArkaGrid Solana] Missing env vars — running in DB-only mode');
            return;
        }

        connection = new Connection(RPC_URL, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,
        });

        // Load meter authority keypair
        const keypairPath = path.resolve(
            process.env.ARKAGRID_METER_AUTHORITY_KEYPAIR
        );

        if (!fs.existsSync(keypairPath)) {
            console.warn(`[ArkaGrid Solana] Keypair not found at ${keypairPath} — running in DB-only mode`);
            return;
        }

        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
        meterAuthority = Keypair.fromSecretKey(new Uint8Array(keypairData));

        // Load IDL
        const idlPath = path.resolve(path.join(__dirname, '../../solana/target/idl/arkagrid_escrow.json'));

        if (!fs.existsSync(idlPath)) {
            console.warn(`[ArkaGrid Solana] IDL not found at ${idlPath} — running in DB-only mode`);
            return;
        }

        const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

        // Create wallet wrapper
        const wallet = {
            publicKey: meterAuthority.publicKey,
            signTransaction: async (tx) => {
                tx.sign(meterAuthority);
                return tx;
            },
            signAllTransactions: async (txs) => {
                txs.forEach((tx) => tx.sign(meterAuthority));
                return txs;
            },
        };

        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
        });

        program = new anchor.Program(idl, new PublicKey(PROGRAM_ID), provider);
        solanaEnabled = true;

        console.log('✅ [ArkaGrid Solana] Connected to', RPC_URL);
        console.log('✅ [ArkaGrid Solana] Program:', PROGRAM_ID);
        console.log(
            '✅ [ArkaGrid Solana] Meter Authority:',
            meterAuthority.publicKey.toString()
        );
    } catch (err) {
        console.error('[ArkaGrid Solana] Init failed:', err.message);
        console.warn(
            '[ArkaGrid Solana] Running in DB-only mode (graceful degradation)'
        );
        solanaEnabled = false;
    }
}

// ── PDA Helpers ────────────────────────────────────

function getTradePDA(tradeId) {
    return PublicKey.findProgramAddressSync(
        [TRADE_SEED, Buffer.from(tradeId)],
        new PublicKey(PROGRAM_ID)
    );
}

function getEscrowPDA(tradeId) {
    return PublicKey.findProgramAddressSync(
        [ESCROW_SEED, Buffer.from(tradeId)],
        new PublicKey(PROGRAM_ID)
    );
}

function getConfigPDA() {
    return PublicKey.findProgramAddressSync(
        [CONFIG_SEED],
        new PublicKey(PROGRAM_ID)
    );
}

// ── Core Functions ─────────────────────────────────

/**
 * Lock buyer's SOL in escrow when trade is created
 * Called by ArkaGrid backend after payment verified
 */
export async function lockEscrowOnSolana({
    tradeId,
    buyerWallet,
    sellerWallet,
    amountSol,
    kwhRequested,
    pricePerKwh,
    gridRegion = 'India',
}) {
    if (!solanaEnabled) {
        console.log('[ArkaGrid Solana] Simulated: lockEscrow for trade', tradeId);
        return { simulated: true, txHash: null, blockchain: 'solana' };
    }

    try {
        const [tradePDA] = getTradePDA(tradeId);
        const [escrowPDA] = getEscrowPDA(tradeId);
        const [configPDA] = getConfigPDA();

        const tx = await program.methods
            .initializeTrade(
                tradeId,
                new anchor.BN(Math.floor(kwhRequested * 1000)),
                new anchor.BN(Math.floor(pricePerKwh * 1000)),
                gridRegion,
                new anchor.BN(Math.floor(amountSol * LAMPORTS_PER_SOL))
            )
            .accounts({
                tradeAccount: tradePDA,
                escrowVault: escrowPDA,
                platformConfig: configPDA,
                buyer: new PublicKey(buyerWallet),
                seller: new PublicKey(sellerWallet),
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        await connection.confirmTransaction(tx, 'confirmed');

        console.log(`[ArkaGrid Solana] ✅ Escrow locked: ${tradeId} | Tx: ${tx}`);
        return {
            simulated: false,
            txHash: tx,
            blockchain: 'solana',
            network: process.env.SOLANA_NETWORK || 'devnet',
            explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
        };
    } catch (err) {
        console.error(
            `[ArkaGrid Solana] ❌ lockEscrow failed for ${tradeId}:`,
            err.message
        );
        throw new Error(`Solana escrow lock failed: ${err.message}`);
    }
}

/**
 * Confirm delivery from smart meter and trigger settlement
 * Called by ArkaGrid meter handler after MQTT confirmation
 */
export async function confirmDeliveryOnSolana({
    tradeId,
    kwhDelivered,
    buyerWallet,
    sellerWallet,
    treasuryWallet,
}) {
    if (!solanaEnabled) {
        return { simulated: true, settlementType: 'db_only' };
    }

    try {
        const [tradePDA] = getTradePDA(tradeId);
        const [escrowPDA] = getEscrowPDA(tradeId);
        const [configPDA] = getConfigPDA();

        const tx = await program.methods
            .settleTrade(new anchor.BN(Math.floor(kwhDelivered * 1000)))
            .accounts({
                tradeAccount: tradePDA,
                escrowVault: escrowPDA,
                platformConfig: configPDA,
                meterAuthority: meterAuthority.publicKey,
                seller: new PublicKey(sellerWallet),
                buyer: new PublicKey(buyerWallet),
                treasury: new PublicKey(treasuryWallet),
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([meterAuthority])
            .rpc();

        await connection.confirmTransaction(tx, 'confirmed');

        // Fetch updated trade to determine settlement type
        const trade = await program.account.tradeAccount.fetch(tradePDA);
        const escrowStatusKey = Object.keys(trade.escrowStatus)[0];

        const settlementMap = {
            released: 'full_release',
            partial: 'partial',
            refunded: 'full_refund',
        };

        const settlementType = settlementMap[escrowStatusKey] || 'unknown';

        console.log(
            `[ArkaGrid Solana] ✅ Settled: ${tradeId} | Type: ${settlementType} | Tx: ${tx}`
        );
        return {
            simulated: false,
            txHash: tx,
            settlementType,
            blockchain: 'solana',
            explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
        };
    } catch (err) {
        console.error(
            `[ArkaGrid Solana] ❌ Settlement failed for ${tradeId}:`,
            err.message
        );
        throw new Error(`Solana settlement failed: ${err.message}`);
    }
}

/**
 * Cancel trade after timeout — permissionless
 * Called by ArkaGrid timeout job
 */
export async function cancelExpiredTradeOnSolana({ tradeId, buyerWallet }) {
    if (!solanaEnabled) {
        return { simulated: true };
    }

    try {
        const [tradePDA] = getTradePDA(tradeId);
        const [escrowPDA] = getEscrowPDA(tradeId);

        const tx = await program.methods
            .cancelTrade()
            .accounts({
                tradeAccount: tradePDA,
                escrowVault: escrowPDA,
                buyer: new PublicKey(buyerWallet),
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([meterAuthority])
            .rpc();

        await connection.confirmTransaction(tx, 'confirmed');

        console.log(`[ArkaGrid Solana] ✅ Cancelled: ${tradeId} | Tx: ${tx}`);
        return { simulated: false, txHash: tx };
    } catch (err) {
        console.error(`[ArkaGrid Solana] ❌ Cancel failed:`, err.message);
        throw new Error(`Solana cancel failed: ${err.message}`);
    }
}

/**
 * Raise dispute on-chain — freezes escrow
 */
export async function raiseDisputeOnSolana({ tradeId, buyerWallet }) {
    if (!solanaEnabled) return { simulated: true };

    try {
        const [tradePDA] = getTradePDA(tradeId);
        const tx = await program.methods
            .raiseDispute()
            .accounts({
                tradeAccount: tradePDA,
                buyer: new PublicKey(buyerWallet),
            })
            .rpc();

        await connection.confirmTransaction(tx, 'confirmed');
        return { simulated: false, txHash: tx };
    } catch (err) {
        throw new Error(`Dispute raise failed: ${err.message}`);
    }
}

/**
 * Admin resolves dispute
 */
export async function resolveDisputeOnSolana({
    tradeId,
    resolution,
    kwhDelivered,
    sellerWallet,
    buyerWallet,
    treasuryWallet,
}) {
    if (!solanaEnabled) return { simulated: true };

    try {
        const [tradePDA] = getTradePDA(tradeId);
        const [escrowPDA] = getEscrowPDA(tradeId);
        const [configPDA] = getConfigPDA();

        let resolutionArg;
        if (resolution === 'release') {
            resolutionArg = { releaseToSeller: {} };
        } else if (resolution === 'refund') {
            resolutionArg = { refundToBuyer: {} };
        } else {
            resolutionArg = {
                partialSettlement: {
                    kwhDelivered: new anchor.BN(Math.floor(kwhDelivered * 1000)),
                },
            };
        }

        const tx = await program.methods
            .resolveDispute(resolutionArg)
            .accounts({
                tradeAccount: tradePDA,
                escrowVault: escrowPDA,
                platformConfig: configPDA,
                admin: meterAuthority.publicKey,
                seller: new PublicKey(sellerWallet),
                buyer: new PublicKey(buyerWallet),
                treasury: new PublicKey(treasuryWallet),
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([meterAuthority])
            .rpc();

        await connection.confirmTransaction(tx, 'confirmed');
        return { simulated: false, txHash: tx };
    } catch (err) {
        throw new Error(`Dispute resolve failed: ${err.message}`);
    }
}

/**
 * Get trade state directly from Solana
 */
export async function getTradeFromSolana(tradeId) {
    if (!solanaEnabled) return null;

    try {
        const [tradePDA] = getTradePDA(tradeId);
        const trade = await program.account.tradeAccount.fetch(tradePDA);
        return {
            tradeId: trade.tradeId,
            buyer: trade.buyer.toString(),
            seller: trade.seller.toString(),
            amountLamports: trade.amountLamports.toNumber(),
            kwhRequested: trade.kwhRequested.toNumber() / 1000,
            kwhDelivered: trade.kwhDelivered.toNumber() / 1000,
            deadline: new Date(trade.deadline.toNumber() * 1000).toISOString(),
            tradeStatus: Object.keys(trade.tradeStatus)[0],
            escrowStatus: Object.keys(trade.escrowStatus)[0],
            carbonIssued: trade.carbonIssued,
        };
    } catch (err) {
        console.error(
            '[ArkaGrid Solana] getTradeFromSolana failed:',
            err.message
        );
        return null;
    }
}

/**
 * Get blockchain health status
 */
export async function getSolanaStatus() {
    if (!solanaEnabled) {
        return { enabled: false, status: 'disabled', network: 'n/a' };
    }

    try {
        const slot = await connection.getSlot();
        const balance = await connection.getBalance(meterAuthority.publicKey);
        return {
            enabled: true,
            status: 'connected',
            network: process.env.SOLANA_NETWORK || 'devnet',
            currentSlot: slot,
            programId: PROGRAM_ID,
            meterAuthorityBalance: balance / LAMPORTS_PER_SOL,
        };
    } catch (err) {
        return { enabled: true, status: 'error', error: err.message };
    }
}

// Initialize on module load
initSolana();

export { solanaEnabled };

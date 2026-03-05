import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArkagridEscrow } from "../target/types/arkagrid_escrow";
import {
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║  ArkaGrid — Full Trade Lifecycle Simulation  ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace
        .ArkagridEscrow as Program<ArkagridEscrow>;

    // Load keypairs
    const loadKeypair = (name: string): Keypair => {
        const p = path.join(__dirname, `../keypairs/${name}.json`);
        const secret = JSON.parse(fs.readFileSync(p, "utf-8"));
        return Keypair.fromSecretKey(new Uint8Array(secret));
    };

    const meterAuthority = loadKeypair("meter_authority");
    const treasury = loadKeypair("treasury");

    // Generate test buyer and seller
    const buyer = Keypair.generate();
    const seller = Keypair.generate();

    console.log("🔑 Buyer:", buyer.publicKey.toString());
    console.log("🔑 Seller:", seller.publicKey.toString());

    // Airdrop SOL for testing
    console.log("\n💰 Airdropping SOL...");
    const airdropBuyer = await provider.connection.requestAirdrop(
        buyer.publicKey,
        2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropBuyer);

    const airdropSeller = await provider.connection.requestAirdrop(
        seller.publicKey,
        0.1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSeller);

    const tradeId = `sim-${Date.now()}`;
    const kwhRequested = 5000; // 5.0 kWh
    const amountLamports = 0.5 * LAMPORTS_PER_SOL;

    // Get PDAs
    const [tradePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("arkagrid_trade"), Buffer.from(tradeId)],
        program.programId
    );
    const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("arkagrid_escrow"), Buffer.from(tradeId)],
        program.programId
    );
    const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("arkagrid_config")],
        program.programId
    );

    // Step 1: Initialize Trade
    console.log("\n━━━ STEP 1: Initialize Trade ━━━");
    console.log(`Trade ID: ${tradeId}`);
    console.log(`Amount: ${amountLamports / LAMPORTS_PER_SOL} SOL`);
    console.log(`kWh Requested: ${kwhRequested / 1000}`);

    const initTx = await program.methods
        .initializeTrade(
            tradeId,
            new anchor.BN(kwhRequested),
            new anchor.BN(1000),
            "Karnataka",
            new anchor.BN(amountLamports)
        )
        .accounts({
            tradeAccount: tradePDA,
            escrowVault: escrowPDA,
            platformConfig: configPDA,
            buyer: buyer.publicKey,
            seller: seller.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

    console.log("✅ Trade initialized:", initTx);
    console.log(
        `🔗 https://explorer.solana.com/tx/${initTx}?cluster=devnet`
    );

    // Check escrow balance
    const escrowBalance = await provider.connection.getBalance(escrowPDA);
    console.log(
        `🔒 Escrow locked: ${escrowBalance / LAMPORTS_PER_SOL} SOL`
    );

    // Step 2: Settle Trade (Full delivery)
    console.log("\n━━━ STEP 2: Settle Trade (Full Delivery) ━━━");

    const sellerBefore = await provider.connection.getBalance(
        seller.publicKey
    );
    const treasuryBefore = await provider.connection.getBalance(
        treasury.publicKey
    );

    const settleTx = await program.methods
        .settleTrade(new anchor.BN(kwhRequested)) // 100% delivery
        .accounts({
            tradeAccount: tradePDA,
            escrowVault: escrowPDA,
            platformConfig: configPDA,
            meterAuthority: meterAuthority.publicKey,
            seller: seller.publicKey,
            buyer: buyer.publicKey,
            treasury: treasury.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([meterAuthority])
        .rpc();

    console.log("✅ Trade settled:", settleTx);
    console.log(
        `🔗 https://explorer.solana.com/tx/${settleTx}?cluster=devnet`
    );

    const sellerAfter = await provider.connection.getBalance(
        seller.publicKey
    );
    const treasuryAfter = await provider.connection.getBalance(
        treasury.publicKey
    );

    console.log(
        `💵 Seller received: ${(sellerAfter - sellerBefore) / LAMPORTS_PER_SOL} SOL`
    );
    console.log(
        `🏦 Platform fee: ${(treasuryAfter - treasuryBefore) / LAMPORTS_PER_SOL} SOL`
    );

    // Fetch final trade state
    const finalTrade = await program.account.tradeAccount.fetch(tradePDA);
    console.log("\n━━━ FINAL TRADE STATE ━━━");
    console.log("Trade ID:", finalTrade.tradeId);
    console.log("Status:", JSON.stringify(finalTrade.tradeStatus));
    console.log("Escrow:", JSON.stringify(finalTrade.escrowStatus));
    console.log(
        "kWh Delivered:",
        finalTrade.kwhDelivered.toNumber() / 1000
    );
    console.log(
        "Platform Fee:",
        finalTrade.platformFeeLamports.toNumber(),
        "lamports"
    );
    console.log(
        "\n✅ Full trade lifecycle completed successfully!"
    );
}

main().catch((err) => {
    console.error("Simulation failed:", err);
    process.exit(1);
});

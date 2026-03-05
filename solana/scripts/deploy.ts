import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArkagridEscrow } from "../target/types/arkagrid_escrow";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║   ArkaGrid Solana Deployment              ║");
    console.log("╚══════════════════════════════════════════╝");

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace
        .ArkagridEscrow as Program<ArkagridEscrow>;

    console.log("Program ID:", program.programId.toString());
    console.log("Deployer:", provider.wallet.publicKey.toString());

    const balance = await provider.connection.getBalance(
        provider.wallet.publicKey
    );
    console.log("Balance:", balance / 1e9, "SOL\n");

    // Load keypairs
    const loadKeypair = (name: string): Keypair => {
        const p = path.join(__dirname, `../keypairs/${name}.json`);
        const secret = JSON.parse(fs.readFileSync(p, "utf-8"));
        return Keypair.fromSecretKey(new Uint8Array(secret));
    };

    const treasury = loadKeypair("treasury");
    const meterAuthority = loadKeypair("meter_authority");

    // Get config PDA
    const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("arkagrid_config")],
        program.programId
    );

    // Initialize platform
    console.log("Initializing ArkaGrid platform config...");
    try {
        await program.methods
            .initializePlatform(new anchor.BN(250)) // 2.5% fee
            .accounts({
                platformConfig: configPDA,
                authority: provider.wallet.publicKey,
                treasury: treasury.publicKey,
                meterAuthority: meterAuthority.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        console.log("✅ Platform config initialized");
    } catch (err: any) {
        if (err.toString().includes("already in use")) {
            console.log("ℹ️  Platform already initialized");
        } else {
            throw err;
        }
    }

    // Verify config
    const config = await program.account.platformConfig.fetch(configPDA);

    const deployment = {
        network: process.env.SOLANA_NETWORK || "devnet",
        deployedAt: new Date().toISOString(),
        programId: program.programId.toString(),
        configPDA: configPDA.toString(),
        authority: config.authority.toString(),
        treasury: config.treasury.toString(),
        meterAuthority: config.meterAuthority.toString(),
        feeBps: config.feeBps.toNumber(),
    };

    fs.writeFileSync(
        path.join(__dirname, "../deployment.json"),
        JSON.stringify(deployment, null, 2)
    );

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║   Add These to Your Backend .env          ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log(`SOLANA_PROGRAM_ID=${deployment.programId}`);
    console.log(`SOLANA_CONFIG_PDA=${deployment.configPDA}`);
    console.log(`ARKAGRID_TREASURY=${deployment.treasury}`);
    console.log(`ARKAGRID_METER_AUTHORITY=${deployment.meterAuthority}`);
    console.log(
        "\n✅ ArkaGrid deployed successfully to",
        deployment.network
    );
}

main().catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
});

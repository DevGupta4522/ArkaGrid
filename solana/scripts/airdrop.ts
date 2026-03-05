import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    clusterApiUrl,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function airdropWithRetry(
    connection: Connection,
    pubkey: any,
    sol: number,
    maxRetries = 5
): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const sig = await connection.requestAirdrop(
                pubkey,
                sol * LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction(sig, "confirmed");
            return true;
        } catch (err: any) {
            const msg = err?.message || "";
            if (msg.includes("429") || msg.includes("Too Many")) {
                const delay = attempt * 5000; // 5s, 10s, 15s...
                console.log(
                    `   ⏳ Rate limited. Waiting ${delay / 1000}s before retry ${attempt}/${maxRetries}...`
                );
                await sleep(delay);
            } else if (msg.includes("airdrop limit")) {
                console.log(`   ℹ️  Daily airdrop limit reached for this wallet.`);
                return false;
            } else {
                console.log(`   ⚠️  Attempt ${attempt} failed: ${msg.slice(0, 80)}`);
                await sleep(3000);
            }
        }
    }
    return false;
}

async function main() {
    console.log("╔═══════════════════════════════════════════╗");
    console.log("║   ArkaGrid — Keypair Setup & Airdrop      ║");
    console.log("╚═══════════════════════════════════════════╝\n");

    const connection = new Connection(
        process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
        "confirmed"
    );

    // Generate keypairs if they don't exist
    const keypairsDir = path.join(__dirname, "../keypairs");
    if (!fs.existsSync(keypairsDir)) {
        fs.mkdirSync(keypairsDir, { recursive: true });
    }

    const walletNames = ["authority", "meter_authority", "treasury", "backend"];

    for (const name of walletNames) {
        const keypairPath = path.join(keypairsDir, `${name}.json`);

        let keypair: Keypair;
        if (fs.existsSync(keypairPath)) {
            const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
            keypair = Keypair.fromSecretKey(new Uint8Array(secret));
            console.log(
                `📂 Loaded existing ${name}: ${keypair.publicKey.toString()}`
            );
        } else {
            keypair = Keypair.generate();
            fs.writeFileSync(
                keypairPath,
                JSON.stringify(Array.from(keypair.secretKey))
            );
            console.log(
                `🆕 Generated ${name}: ${keypair.publicKey.toString()}`
            );
        }

        // Check existing balance first
        const existingBalance = await connection.getBalance(keypair.publicKey);
        const existingSol = existingBalance / LAMPORTS_PER_SOL;
        console.log(`   Current balance: ${existingSol.toFixed(4)} SOL`);

        if (existingSol >= 1.0) {
            console.log(`   ✅ Already funded — skipping airdrop\n`);
            continue;
        }

        // Airdrop 2 SOL with retry logic
        console.log(`   💰 Requesting 2 SOL airdrop...`);
        const success = await airdropWithRetry(connection, keypair.publicKey, 2);

        if (success) {
            const newBalance = await connection.getBalance(keypair.publicKey);
            console.log(
                `   ✅ Balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL\n`
            );
        } else {
            console.log(
                `   ⚠️  Airdrop failed — try manually:\n   solana airdrop 2 ${keypair.publicKey.toString()} --url devnet\n`
            );
        }

        // Add delay between wallets to avoid rate limiting
        await sleep(2000);
    }

    // Write public keys to .wallets.env file
    const envContent = walletNames
        .map((name) => {
            const keypairPath = path.join(keypairsDir, `${name}.json`);
            const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
            const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
            return `ARKAGRID_${name.toUpperCase()}_PUBKEY=${keypair.publicKey.toString()}`;
        })
        .join("\n");

    fs.writeFileSync(path.join(__dirname, "../.wallets.env"), envContent);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Public keys saved to .wallets.env");
    console.log("⚠️  NEVER commit keypairs/ folder to git\n");
    console.log("If airdrops failed due to rate limiting, try:");
    console.log("  1. Wait a few minutes and run again");
    console.log("  2. Use https://faucet.solana.com manually");
    console.log("  3. Use Solana CLI: solana airdrop 2 <PUBKEY> --url devnet");
}

main().catch(console.error);

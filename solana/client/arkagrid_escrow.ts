/**
 * ArkaGrid Escrow — TypeScript Client SDK
 * 
 * Use this client to interact with the ArkaGrid Solana program
 * from any TypeScript/JavaScript application.
 */
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// ── Constants ──────────────────────────────────────
const TRADE_SEED = Buffer.from('arkagrid_trade');
const ESCROW_SEED = Buffer.from('arkagrid_escrow');
const CONFIG_SEED = Buffer.from('arkagrid_config');

// ── Types ──────────────────────────────────────────
export interface TradeAccountData {
  tradeId: string;
  buyer: PublicKey;
  seller: PublicKey;
  meterAuthority: PublicKey;
  authority: PublicKey;
  amountLamports: anchor.BN;
  platformFeeLamports: anchor.BN;
  kwhRequested: anchor.BN;
  kwhDelivered: anchor.BN;
  pricePerKwh: anchor.BN;
  createdAt: anchor.BN;
  deadline: anchor.BN;
  settledAt: anchor.BN | null;
  tradeStatus: object;
  escrowStatus: object;
  carbonIssued: boolean;
  gridRegion: string;
  bump: number;
  escrowBump: number;
}

export interface PlatformConfigData {
  authority: PublicKey;
  treasury: PublicKey;
  meterAuthority: PublicKey;
  feeBps: anchor.BN;
  isPaused: boolean;
  totalTrades: anchor.BN;
  totalVolumeLamports: anchor.BN;
  totalKwhTraded: anchor.BN;
  bump: number;
}

// ── PDA Helpers ────────────────────────────────────
export function getTradePDA(programId: PublicKey, tradeId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [TRADE_SEED, Buffer.from(tradeId)],
    programId
  );
}

export function getEscrowPDA(programId: PublicKey, tradeId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [ESCROW_SEED, Buffer.from(tradeId)],
    programId
  );
}

export function getConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CONFIG_SEED],
    programId
  );
}

// ── Client Class ───────────────────────────────────
export class ArkaGridClient {
  program: anchor.Program;
  connection: Connection;
  programId: PublicKey;

  constructor(
    program: anchor.Program,
    connection: Connection,
  ) {
    this.program = program;
    this.connection = connection;
    this.programId = program.programId;
  }

  /**
   * Initialize the platform config (one-time setup)
   */
  async initializePlatform(
    authority: Keypair,
    treasury: PublicKey,
    meterAuthority: PublicKey,
    feeBps: number
  ): Promise<string> {
    const [configPDA] = getConfigPDA(this.programId);

    const tx = await this.program.methods
      .initializePlatform(new anchor.BN(feeBps))
      .accounts({
        platformConfig: configPDA,
        authority: authority.publicKey,
        treasury,
        meterAuthority,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    return tx;
  }

  /**
   * Create a new trade — lock buyer's SOL in escrow PDA
   */
  async initializeTrade(
    buyer: Keypair,
    seller: PublicKey,
    tradeId: string,
    kwhRequested: number,
    pricePerKwh: number,
    gridRegion: string,
    amountLamports: number
  ): Promise<string> {
    const [tradePDA] = getTradePDA(this.programId, tradeId);
    const [escrowPDA] = getEscrowPDA(this.programId, tradeId);
    const [configPDA] = getConfigPDA(this.programId);

    const tx = await this.program.methods
      .initializeTrade(
        tradeId,
        new anchor.BN(kwhRequested),
        new anchor.BN(pricePerKwh),
        gridRegion,
        new anchor.BN(amountLamports)
      )
      .accounts({
        tradeAccount: tradePDA,
        escrowVault: escrowPDA,
        platformConfig: configPDA,
        buyer: buyer.publicKey,
        seller,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    return tx;
  }

  /**
   * Settle a trade — called by meter authority after delivery verification
   */
  async settleTrade(
    meterAuthority: Keypair,
    tradeId: string,
    kwhDelivered: number,
    seller: PublicKey,
    buyer: PublicKey,
    treasury: PublicKey
  ): Promise<string> {
    const [tradePDA] = getTradePDA(this.programId, tradeId);
    const [escrowPDA] = getEscrowPDA(this.programId, tradeId);
    const [configPDA] = getConfigPDA(this.programId);

    const tx = await this.program.methods
      .settleTrade(new anchor.BN(kwhDelivered))
      .accounts({
        tradeAccount: tradePDA,
        escrowVault: escrowPDA,
        platformConfig: configPDA,
        meterAuthority: meterAuthority.publicKey,
        seller,
        buyer,
        treasury,
        systemProgram: SystemProgram.programId,
      })
      .signers([meterAuthority])
      .rpc();

    return tx;
  }

  /**
   * Cancel a trade after deadline — permissionless
   */
  async cancelTrade(tradeId: string, buyer: PublicKey): Promise<string> {
    const [tradePDA] = getTradePDA(this.programId, tradeId);
    const [escrowPDA] = getEscrowPDA(this.programId, tradeId);

    const tx = await this.program.methods
      .cancelTrade()
      .accounts({
        tradeAccount: tradePDA,
        escrowVault: escrowPDA,
        buyer,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Raise a dispute — buyer only
   */
  async raiseDispute(buyer: Keypair, tradeId: string): Promise<string> {
    const [tradePDA] = getTradePDA(this.programId, tradeId);

    const tx = await this.program.methods
      .raiseDispute()
      .accounts({
        tradeAccount: tradePDA,
        buyer: buyer.publicKey,
      })
      .signers([buyer])
      .rpc();

    return tx;
  }

  /**
   * Resolve a dispute — admin only
   */
  async resolveDispute(
    admin: Keypair,
    tradeId: string,
    resolution: { releaseToSeller: {} } | { refundToBuyer: {} } | { partialSettlement: { kwhDelivered: anchor.BN } },
    seller: PublicKey,
    buyer: PublicKey,
    treasury: PublicKey
  ): Promise<string> {
    const [tradePDA] = getTradePDA(this.programId, tradeId);
    const [escrowPDA] = getEscrowPDA(this.programId, tradeId);
    const [configPDA] = getConfigPDA(this.programId);

    const tx = await this.program.methods
      .resolveDispute(resolution)
      .accounts({
        tradeAccount: tradePDA,
        escrowVault: escrowPDA,
        platformConfig: configPDA,
        admin: admin.publicKey,
        seller,
        buyer,
        treasury,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    return tx;
  }

  /**
   * Fetch trade account data from chain
   */
  async getTradeAccount(tradeId: string): Promise<TradeAccountData | null> {
    try {
      const [tradePDA] = getTradePDA(this.programId, tradeId);
      const account = await this.program.account.tradeAccount.fetch(tradePDA);
      return account as unknown as TradeAccountData;
    } catch {
      return null;
    }
  }

  /**
   * Fetch platform config from chain
   */
  async getPlatformConfig(): Promise<PlatformConfigData | null> {
    try {
      const [configPDA] = getConfigPDA(this.programId);
      const account = await this.program.account.platformConfig.fetch(configPDA);
      return account as unknown as PlatformConfigData;
    } catch {
      return null;
    }
  }

  /**
   * Get escrow balance for a trade
   */
  async getEscrowBalance(tradeId: string): Promise<number> {
    const [escrowPDA] = getEscrowPDA(this.programId, tradeId);
    const balance = await this.connection.getBalance(escrowPDA);
    return balance;
  }
}

// ── Factory ────────────────────────────────────────
export function createArkaGridClient(
  connection: Connection,
  wallet: anchor.Wallet,
  programId: PublicKey,
  idlPath?: string
): ArkaGridClient {
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  const resolvedIdlPath = idlPath || path.join(__dirname, '..', 'target', 'idl', 'arkagrid_escrow.json');
  const idl = JSON.parse(fs.readFileSync(resolvedIdlPath, 'utf-8'));
  const program = new anchor.Program(idl, programId, provider);

  return new ArkaGridClient(program, connection);
}

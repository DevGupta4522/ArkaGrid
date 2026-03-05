#!/bin/bash
# ============================================
# ArkaGrid Solana — Linux/WSL Setup + Build
# Run inside WSL/Ubuntu after wsl --install
# ============================================

set -e

echo ""
echo "======================================"
echo "  ArkaGrid Solana Build (Linux/WSL)"
echo "======================================"
echo ""

# Step 1: Install Rust
echo "[1/5] Installing Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "  ✅ Rust already installed: $(rustc --version)"
fi

source "$HOME/.cargo/env"

# Step 2: Install Solana CLI
echo ""
echo "[2/5] Installing Solana CLI..."
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.21/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
else
    echo "  ✅ Solana already installed: $(solana --version)"
fi

# Step 3: Install Anchor
echo ""
echo "[3/5] Installing Anchor CLI..."
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --force
    avm install 0.30.1
    avm use 0.30.1
else
    echo "  ✅ Anchor already installed: $(anchor --version)"
fi

# Step 4: Configure Solana
echo ""
echo "[4/5] Configuring Solana for devnet..."
SOLANA_DIR="/mnt/d/ArkaGrid/solana"
solana config set --url devnet
solana config set --keypair "$SOLANA_DIR/keypairs/authority.json"

# Step 5: Build
echo ""
echo "[5/5] Building ArkaGrid escrow program..."
cd "$SOLANA_DIR"
anchor build

echo ""
echo "======================================"
echo "  ✅ BUILD SUCCESSFUL!"
echo "======================================"
echo ""
echo "Program ID: $(anchor keys list)"
echo ""
echo "Next: Deploy to devnet with:"
echo "  anchor deploy --provider.cluster devnet"
echo ""

# ============================================
# ArkaGrid Solana — WSL Setup + Build Script
# Run this as Administrator (Right-click > Run as Administrator)
# ============================================

Write-Host "`n======================================" -ForegroundColor Green
Write-Host "  ArkaGrid Solana Build Setup" -ForegroundColor Green  
Write-Host "======================================`n" -ForegroundColor Green

# Step 1: Enable WSL feature
Write-Host "[1/3] Enabling WSL..." -ForegroundColor Cyan
wsl --install --no-launch
if ($LASTEXITCODE -ne 0) {
    # Try enabling manually
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
}

Write-Host "`n[2/3] Installing Ubuntu..." -ForegroundColor Cyan
wsl --install -d Ubuntu --no-launch

Write-Host "`n[3/3] Done! Please RESTART your computer." -ForegroundColor Yellow
Write-Host ""
Write-Host "After restart, run this in PowerShell:" -ForegroundColor White
Write-Host '  wsl' -ForegroundColor Green
Write-Host "Then inside Ubuntu, run:" -ForegroundColor White
Write-Host '  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y' -ForegroundColor Green
Write-Host '  source ~/.cargo/env' -ForegroundColor Green
Write-Host '  sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"' -ForegroundColor Green
Write-Host '  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' -ForegroundColor Green
Write-Host '  cargo install --git https://github.com/coral-xyz/anchor avm --force' -ForegroundColor Green
Write-Host '  avm install 0.30.1 && avm use 0.30.1' -ForegroundColor Green
Write-Host '  cd /mnt/d/ArkaGrid/solana && anchor build' -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"

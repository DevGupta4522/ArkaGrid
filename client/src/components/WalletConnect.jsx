import React, { useState } from 'react'
import { useArkaWallet } from '../hooks/useArkaWallet'

export default function WalletConnect() {
    const {
        address,
        shortAddress,
        connected,
        connecting,
        balance,
        isSaved,
        error,
        connectWallet,
        disconnectWallet,
        hasProvider,
    } = useArkaWallet()

    const [showDropdown, setShowDropdown] = useState(false)

    if (connected && address) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-volt-dark/60 border border-volt-green/20 hover:border-volt-green/40 transition-all duration-200"
                >
                    <span className="w-2 h-2 rounded-full bg-volt-green animate-pulse"></span>
                    <span className="text-sm font-mono text-gray-300">{shortAddress}</span>
                    <span className="text-xs text-volt-green font-medium">{balance} SOL</span>
                </button>

                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-volt-card rounded-xl border border-gray-700/50 shadow-2xl z-50 p-4 animate-fade-in">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Connected Wallet</p>
                                <p className="text-sm font-mono text-white break-all">{address}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Balance</span>
                                <span className="text-sm font-bold text-volt-green">{balance} SOL</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Status</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isSaved ? 'bg-volt-green/10 text-volt-green' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {isSaved ? '✅ Linked' : '⏳ Saving...'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Network</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                                    Devnet
                                </span>
                            </div>
                            <a
                                href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-center text-blue-400 hover:text-blue-300 py-1"
                            >
                                View on Solana Explorer ↗
                            </a>
                            <button
                                onClick={() => {
                                    disconnectWallet()
                                    setShowDropdown(false)
                                }}
                                className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                Disconnect Wallet
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <button
            onClick={connectWallet}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-volt-green to-emerald-500 text-volt-dark font-semibold text-sm hover:shadow-lg hover:shadow-volt-green/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {connecting ? (
                <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" viewBox="0 0 128 128" fill="none">
                        <rect width="128" height="128" rx="64" fill="currentColor" fillOpacity="0.1" />
                        <path d="M110.6 57.1c-1-4.3-3.5-8.1-7-10.8L71.3 22.7c-6.8-5.2-16.3-5.2-23.1 0L15.8 46.3c-3.5 2.7-6 6.5-7 10.8-.9 4.3-.3 8.8 1.8 12.7v.1l23.9 43c2 3.6 5.8 5.8 9.9 5.8h39c4.1 0 7.9-2.2 9.9-5.8l23.9-43v-.1c2.3-3.9 2.8-8.4 1.9-12.7h-.6z" fill="currentColor" />
                    </svg>
                    {hasProvider ? 'Connect Wallet' : 'Install Phantom'}
                </>
            )}
            {error && (
                <span className="absolute -bottom-6 left-0 text-xs text-red-400">{error}</span>
            )}
        </button>
    )
}

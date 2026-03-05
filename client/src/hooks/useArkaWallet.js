import { useState, useEffect, useCallback } from 'react'
import { walletAPI } from '../api/wallet'

export function useArkaWallet() {
    const [address, setAddress] = useState(null)
    const [shortAddress, setShortAddress] = useState(null)
    const [connected, setConnected] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [balance, setBalance] = useState('0.0000')
    const [isSaved, setIsSaved] = useState(false)
    const [error, setError] = useState(null)

    const getProvider = () => {
        if ('phantom' in window) {
            const provider = window.phantom?.solana
            if (provider?.isPhantom) return provider
        }
        if ('solflare' in window) {
            return window.solflare
        }
        return null
    }

    const connectWallet = useCallback(async () => {
        try {
            setConnecting(true)
            setError(null)
            const provider = getProvider()

            if (!provider) {
                window.open('https://phantom.app/', '_blank')
                setError('Please install Phantom wallet')
                return
            }

            const response = await provider.connect()
            const pubkey = response.publicKey.toString()

            setAddress(pubkey)
            setShortAddress(`${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`)
            setConnected(true)

            // Get SOL balance
            try {
                const connection = window.solanaWeb3
                    ? new window.solanaWeb3.Connection(
                        import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
                        'confirmed'
                    )
                    : null;
                if (connection) {
                    const bal = await connection.getBalance(response.publicKey)
                    setBalance((bal / 1e9).toFixed(4))
                }
            } catch (balErr) {
                console.warn('Could not fetch SOL balance:', balErr.message)
            }

            // Save to backend
            try {
                await walletAPI.updateWalletAddress(pubkey, 'phantom')
                setIsSaved(true)
            } catch (saveErr) {
                console.warn('Could not save wallet to backend:', saveErr.message)
            }
        } catch (err) {
            console.error('Wallet connection failed:', err)
            setError(err.message)
        } finally {
            setConnecting(false)
        }
    }, [])

    const disconnectWallet = useCallback(async () => {
        try {
            const provider = getProvider()
            if (provider) await provider.disconnect()
        } catch (err) {
            console.warn('Disconnect error:', err)
        }
        setAddress(null)
        setShortAddress(null)
        setConnected(false)
        setBalance('0.0000')
        setIsSaved(false)
    }, [])

    // Auto-reconnect if previously connected
    useEffect(() => {
        const provider = getProvider()
        if (provider?.isConnected) {
            const pubkey = provider.publicKey?.toString()
            if (pubkey) {
                setAddress(pubkey)
                setShortAddress(`${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`)
                setConnected(true)
            }
        }
    }, [])

    return {
        address,
        shortAddress,
        connected,
        connecting,
        balance,
        isSaved,
        error,
        connectWallet,
        disconnectWallet,
        hasProvider: !!getProvider(),
    }
}

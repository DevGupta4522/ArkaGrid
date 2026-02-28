import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useContext'
import { Zap, Shield, TrendingDown, Sun, ArrowRight, ArrowUpRight, Copy, Code, CheckCircle, Activity, Box, Database, Fingerprint, DollarSign } from 'lucide-react'

export default function LandingPage() {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
        return null // Redirect handled in App.jsx
    }

    return (
        <div className="min-h-screen bg-volt-dark selection:bg-volt-green/30 selection:text-volt-green overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-volt-dark/50 backdrop-blur-md border-b border-volt-border/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-volt-green/10 border border-volt-green/30 flex items-center justify-center">
                            <Zap size={20} className="text-volt-green" />
                        </div>
                        <span className="text-2xl font-bold font-heading text-white">
                            Arka<span className="text-volt-green">Grid</span>
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                        <a href="#technology" className="hover:text-white transition-colors">Technology</a>
                        <a href="#security" className="hover:text-white transition-colors">Security</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Sign In</Link>
                        <Link to="/register" className="btn-primary py-2 px-5 text-sm">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                <div className="absolute inset-0 mesh-gradient opacity-30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-volt-green/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative max-w-5xl mx-auto text-center z-10 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-volt-green/10 border border-volt-green/20 text-volt-green text-xs font-bold mb-8 uppercase tracking-wider">
                        <span className="live-dot" /> Live in Jaipur & Delhi NCR
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white font-heading tracking-tight leading-[1.1] mb-8">
                        Power your neighbour. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-volt-green via-emerald-400 to-teal-500">
                            Power your wallet.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        ArkaGrid is India's first decentralized energy exchange. Sell your surplus solar power directly to your neighbours. Bypass the grid, earn 3x more, and pay 25% less.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto btn-primary py-4 px-8 text-lg flex items-center justify-center gap-2 group hover:shadow-glow-green">
                            Enter the Grid <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#demo" className="w-full sm:w-auto btn-secondary py-4 px-8 text-lg flex items-center justify-center gap-2">
                            <Activity size={20} className="text-gray-400" /> Watch Demo
                        </a>
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div className="relative max-w-6xl mx-auto mt-20 md:mt-32 rounded-3xl border border-volt-border bg-volt-surface/50 p-2 md:p-4 backdrop-blur-xl animate-fade-in shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-volt-green/5 to-transparent rounded-3xl pointer-events-none" />
                    <div className="rounded-2xl overflow-hidden border border-volt-border bg-volt-dark relative">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-volt-border bg-volt-surface">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-danger-400/80" />
                                <div className="w-3 h-3 rounded-full bg-accent-400/80" />
                                <div className="w-3 h-3 rounded-full bg-volt-green/80" />
                            </div>
                            <div className="mx-auto px-4 py-1 rounded-md bg-volt-dark border border-volt-border text-[10px] text-gray-500 font-mono">
                                app.arkagrid.energy/dashboard
                            </div>
                        </div>
                        <img src="https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=2670&auto=format&fit=crop" alt="ArkaGrid Dashboard" className="w-full h-auto opacity-20 filter grayscale contrast-125" />
                        {/* Overlay mock UI */}
                        <div className="absolute inset-0 flex items-center justify-center p-8 mt-12">
                            <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                                <div className="card-glass border-volt-green/30 shadow-glow-green transform -translate-y-4">
                                    <Zap size={24} className="text-volt-green mb-4" />
                                    <p className="text-3xl font-mono font-bold text-white">4.2<span className="text-sm text-gray-500">kW</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Live Output</p>
                                </div>
                                <div className="card-glass">
                                    <DollarSign size={24} className="text-accent-400 mb-4" />
                                    <p className="text-3xl font-mono font-bold text-white">₹850</p>
                                    <p className="text-xs text-gray-400 mt-1">Earned Today</p>
                                </div>
                                <div className="card-glass transform translate-y-4">
                                    <Activity size={24} className="text-vblue-400 mb-4" />
                                    <p className="text-3xl font-mono font-bold text-white">2.1<span className="text-sm text-gray-500">kW</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Selling to Grid</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Data Array */}
            <section id="how-it-works" className="py-24 px-6 border-t border-volt-border relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-vblue-400/10 rounded-full blur-[100px] -z-10" />
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16 md:w-2/3">
                        <h2 className="text-sm font-bold text-volt-green uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Box size={16} /> Protocol Architecture
                        </h2>
                        <h3 className="text-3xl md:text-5xl font-extrabold text-white font-heading">
                            How the marketplace operates
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card-glass group hover:border-volt-green/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-volt-surface border border-volt-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sun size={24} className="text-accent-400" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-3 tracking-tight">Generate & List</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Smart meters automatically detect surplus solar generation. Prosumers list this energy on the marketplace at their chosen price, undercutting grid rates.
                            </p>
                        </div>
                        <div className="card-glass group hover:border-volt-green/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-volt-surface border border-volt-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield size={24} className="text-vblue-400" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-3 tracking-tight">Smart Escrow</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Buyers lock funds in a smart-contract equivalent escrow. Funds are strictly held until the smart meter confirms cryptographic proof of energy delivery.
                            </p>
                        </div>
                        <div className="card-glass group hover:border-volt-green/30 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-volt-surface border border-volt-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Activity size={24} className="text-volt-green" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-3 tracking-tight">Instant Settlement</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Upon successful delivery verification, the protocol instantly routes the payment to the seller's wallet, deducting a microscopic 2.5% platform fee.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Economy Math */}
            <section className="py-24 px-6 border-t border-volt-border bg-volt-surface/30">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white font-heading mb-6">
                            Break the DISCOM monopoly.
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Currently, DISCOMs buy your solar for ₹2/kWh and sell it to your neighbour for ₹8/kWh. ArkaGrid eliminates the middleman.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-volt-dark border border-volt-border">
                                <div className="w-12 h-12 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0 border border-accent-500/20">
                                    <TrendingDown size={20} className="text-accent-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Sellers earn ₹6/kWh</p>
                                    <p className="text-xs text-gray-500">Instead of the ₹2 grid feed-in tariff</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-mono font-bold text-accent-400">300%</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Increase</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-volt-dark border border-volt-border">
                                <div className="w-12 h-12 rounded-full bg-volt-green/10 flex items-center justify-center flex-shrink-0 border border-volt-green/20">
                                    <Zap size={20} className="text-volt-green" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Buyers pay ₹6/kWh</p>
                                    <p className="text-xs text-gray-500">Instead of the ₹8 grid tier rate</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-mono font-bold text-volt-green">-25%</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Savings</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terminal UI */}
                    <div className="rounded-2xl border border-volt-border bg-volt-dark overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-volt-border bg-[#0A0A0A]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-gray-600" />
                                <div className="w-3 h-3 rounded-full bg-gray-600" />
                                <div className="w-3 h-3 rounded-full bg-gray-600" />
                            </div>
                            <div className="ml-2 text-xs text-gray-500 font-mono">protocol_simulator.sh</div>
                        </div>
                        <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                            <div className="flex items-center text-gray-500 mb-2">
                                <span className="text-volt-green mr-2">~</span> ./run_arbitrage_calc --units 500
                            </div>
                            <div className="text-gray-300">
                                <span className="text-blue-400">[info]</span> Initializing simulation for 500 kWh...<br />
                                <span className="text-blue-400">[info]</span> Fetching dynamic grid rates [Jaipur]...<br />
                                <span className="text-teal-400">  → Base rate: ₹8.00/kWh</span><br />
                                <span className="text-teal-400">  → Feed-in: ₹2.00/kWh</span><br />
                                <span className="text-blue-400">[info]</span> Calculating P2P matching at ₹6.00/kWh...<br /><br />
                                <span className="text-accent-400">Seller Revenue:</span><br />
                                Grid:  ₹ 1,000.00<br />
                                ArkaGrid: ₹ 3,000.00 <span className="text-volt-green">(+₹2,000)</span><br /><br />
                                <span className="text-vblue-400">Buyer Cost:</span><br />
                                Grid:  ₹ 4,000.00<br />
                                ArkaGrid: ₹ 3,000.00 <span className="text-volt-green">(-₹1,000)</span><br /><br />
                                <span className="text-volt-green font-bold">SUCCESS: Arbitrage successfully captured.</span><span className="animate-pulse">_</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-volt-green/5" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-volt-green/20 blur-[100px] pointer-events-none" />

                <div className="relative max-w-4xl mx-auto text-center z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white font-heading mb-6">
                        Ready to join the <span className="text-volt-green">energy revolution?</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Create your account in 30 seconds. No hardware required to start buying.
                    </p>
                    <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-volt-green text-volt-dark rounded-2xl font-black text-xl hover:bg-volt-green/90 transition-all shadow-glow-green hover:scale-105 active:scale-95">
                        <Zap fill="currentColor" /> Initialize Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-volt-border bg-volt-dark">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-volt-green" />
                        <span className="text-xl font-bold font-heading text-white">Arka<span className="text-volt-green">Grid</span></span>
                    </div>
                    <div className="text-gray-500 text-sm font-mono flex items-center gap-4">
                        <span>v1.0.0-beta</span>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-volt-green animate-pulse" /> Systems Operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useContext'
import { Zap, Shield, TrendingDown, Sun, ArrowRight, Users, DollarSign, Clock } from 'lucide-react'

export default function LandingPage() {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
        return null // Redirect handled in App.jsx
    }

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800" />
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />

                <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-36">
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full text-sm text-green-100 mb-6 backdrop-blur-sm">
                            <Zap size={16} /> India's First P2P Solar Energy Marketplace
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
                            Trade Solar Energy<br />
                            <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                                With Your Neighbours
                            </span>
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-green-100 max-w-2xl mx-auto leading-relaxed">
                            Sell surplus solar energy at better rates. Buy from neighbours and save up to
                            <span className="font-bold text-amber-300"> ₹2/kWh</span> compared to DISCOM grid rates.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register" className="px-8 py-4 bg-white text-green-700 rounded-2xl font-bold text-lg hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2">
                                Get Started Free <ArrowRight size={20} />
                            </Link>
                            <Link to="/login" className="px-8 py-4 bg-white/15 text-white rounded-2xl font-bold text-lg hover:bg-white/25 transition-all backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2">
                                Sign In
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
                        {[
                            { value: '₹2+', label: 'Savings/kWh', icon: DollarSign },
                            { value: '60min', label: 'Escrow Timeout', icon: Clock },
                            { value: '2.5%', label: 'Platform Fee', icon: TrendingDown },
                            { value: '100%', label: 'Secure Escrow', icon: Shield },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                <stat.icon size={24} className="mx-auto text-amber-300 mb-2" />
                                <p className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</p>
                                <p className="text-xs text-green-200 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">How ArkaGrid Works</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto">Three simple steps to start trading clean energy with your neighbourhood</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01', icon: Sun, color: 'amber',
                                title: 'List Your Surplus',
                                desc: 'Solar panel owners list their extra energy with price and availability window'
                            },
                            {
                                step: '02', icon: Shield, color: 'green',
                                title: 'Secure Escrow Trade',
                                desc: 'Buyer pays → funds locked in escrow → energy delivered → payment released'
                            },
                            {
                                step: '03', icon: TrendingDown, color: 'blue',
                                title: 'Everyone Saves',
                                desc: 'Prosumers earn ₹6/kWh instead of ₹2 from grid. Consumers pay ₹6 instead of ₹8'
                            },
                        ].map((item) => (
                            <div key={item.step} className="relative card-hover text-center group">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                                    {item.step}
                                </div>
                                <div className={`w-16 h-16 mx-auto rounded-2xl bg-${item.color}-100 flex items-center justify-center mb-4 mt-4 group-hover:scale-110 transition-transform`}>
                                    <item.icon size={28} className={`text-${item.color}-600`} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Props */}
            <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Why Choose ArkaGrid?</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card p-8 ring-2 ring-amber-200 bg-gradient-to-br from-amber-50 to-white">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <Sun size={28} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">For Prosumers (Sellers)</h3>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Earn ₹6/kWh instead of ₹2/kWh from the grid</li>
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Set your own price and availability</li>
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Payment guaranteed via escrow</li>
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Build reputation with ratings</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="card p-8 ring-2 ring-blue-200 bg-gradient-to-br from-blue-50 to-white">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Zap size={28} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">For Consumers (Buyers)</h3>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Save up to 25% on electricity bills</li>
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> 100% clean solar energy from neighbours</li>
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Protected by 60-min auto-refund escrow</li>
                                        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Transparent pricing, no hidden fees</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 bg-gradient-to-br from-green-600 to-emerald-700">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                        Ready to Trade Clean Energy?
                    </h2>
                    <p className="text-green-100 text-lg mb-8">
                        Join ArkaGrid and start saving on your electricity bills while supporting renewable energy.
                    </p>
                    <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-700 rounded-2xl font-bold text-lg hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                        Create Free Account <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 bg-gray-900 text-gray-400 text-center text-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap size={18} className="text-green-500" />
                    <span className="font-bold text-white">ArkaGrid</span>
                </div>
                <p>Built with ❤️ for a sustainable energy future</p>
                <p className="mt-1">© {new Date().getFullYear()} ArkaGrid. All rights reserved.</p>
            </footer>
        </div>
    )
}

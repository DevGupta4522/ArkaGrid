import React from 'react'
import { Leaf, Cpu, ShieldCheck, BatteryCharging, ArrowRight, Zap, Sun, Award } from 'lucide-react'

export default function About() {
  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden card border-none bg-gradient-to-br from-volt-dark to-slate-900 shadow-2xl mb-12 py-16 px-8 text-center group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-volt-green/10 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-vblue-400/10 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        
        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-volt-green to-emerald-400 rounded-3xl flex items-center justify-center mb-8 shadow-glow-green rotate-3 group-hover:rotate-6 transition-transform">
            <Zap className="text-volt-dark" size={40} />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white font-heading mb-6 tracking-tight leading-tight">
            Powering the Future of <br/><span className="bg-gradient-to-r from-volt-green to-emerald-400 bg-clip-text text-transparent">Neighborhood Energy</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-8">
            ArkaGrid empowers communities to trade clean solar energy directly. Bypass the DISCOM, save money, and earn carbon credits—all secured by cryptography.
          </p>
        </div>
      </div>

      {/* Philosophy */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-volt-green pl-4 font-heading">How ArkaGrid Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Sun size={32} className="text-accent-400" />}
            title="1. Generate & Detect"
            desc="Rooftop solar owners generate surplus energy. Our IoT Node detects excess output and instantly lists it on the Marketplace."
          />
          <FeatureCard 
            icon={<ShieldCheck size={32} className="text-vblue-400" />}
            title="2. Secure Trade"
            desc="Neighbors purchase kWh at rates lower than the grid. Fiat payments are locked in ArkaGrid's Escrow Contract on the Solana blockchain."
          />
          <FeatureCard 
            icon={<BatteryCharging size={32} className="text-volt-green" />}
            title="3. Deliver & Settle"
            desc="Current flows through physical smart meters. Once delivery hits 98%, sensors trigger the ledger to release funds instantly."
          />
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mb-16 bg-volt-surface rounded-3xl p-8 border border-volt-border">
        <h2 className="text-2xl font-bold text-white mb-8 text-center font-heading">Built on Production Infrastructure</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <TechBadge name="React + Vite" type="Frontend Experience" />
          <TechBadge name="Node.js + Express" type="Core Trading Engine" />
          <TechBadge name="PostgreSQL" type="Ledger & Analytics" />
          <TechBadge name="Solana Blockchain" type="Trustless Escrow" />
          <TechBadge name="Aedes MQTT" type="IoT Telemetry Broker" />
          <TechBadge name="Razorpay SDK" type="Fiat Settlement" />
          <TechBadge name="Leaflet Maps" type="Geospatial Routing" />
          <TechBadge name="Tailwind CSS" type="Modern Glass UI" />
        </div>
      </div>

      {/* Value Prop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card bg-gradient-to-br from-volt-surface to-volt-dark">
          <div className="w-12 h-12 bg-accent-400/20 text-accent-400 rounded-xl flex items-center justify-center mb-6">
            <Award size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Consumer Savings</h3>
          <p className="text-gray-400 leading-relaxed mb-6">
            Stop paying 8-10 rupees per unit to the state grid. Buy directly from your next-door neighbor at 4-6 rupees. Cut your monthly bills by 30% while consuming 100% clean energy.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle /> Save ₹3-4 per kWh
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle /> Immutable trade history
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle /> 60-minute delivery guarantees
            </li>
          </ul>
        </div>

        <div className="card bg-gradient-to-br from-volt-surface to-volt-dark">
          <div className="w-12 h-12 bg-volt-green/20 text-volt-green rounded-xl flex items-center justify-center mb-6">
            <Leaf size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Prosumer Profits</h3>
          <p className="text-gray-400 leading-relaxed mb-6">
            Don't give away your surplus solar to the DISCOM for a massive loss. Sell it peer-to-peer at better margins. Get paid instantly upon delivery—no waiting 30 days for billing cycles.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle /> Earn 40% more vs grid tariffs
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle /> Instant algorithmic settlement
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle /> Verifiable Carbon Credits on Solana
            </li>
          </ul>
        </div>
      </div>

    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card hover:-translate-y-2 transition-transform duration-300 border-t-2 border-t-volt-dark hover:border-t-volt-green">
      <div className="mb-6 bg-volt-dark w-16 h-16 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-3 font-heading">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function TechBadge({ name, type }) {
  return (
    <div className="bg-volt-dark/50 border border-volt-border rounded-xl p-4 hover:border-volt-green/30 transition-colors">
      <p className="font-bold text-white mb-1 font-mono text-sm">{name}</p>
      <p className="text-[10px] text-volt-green font-bold uppercase tracking-wider">{type}</p>
    </div>
  )
}

function CheckCircle() {
  return <div className="w-5 h-5 rounded-full bg-volt-green/20 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-volt-green" /></div>
}

import React, { useState, useEffect } from 'react'
import { useToast } from '../hooks/useContext'
import { Activity, ShieldCheck, Cpu, Database, Server, RefreshCw, Zap, Anchor } from 'lucide-react'
import api from '../api/config'
import LoadingSpinner from '../components/LoadingSpinner'

export default function SystemStatus() {
  const [statusData, setStatusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const toast = useToast()

  const fetchStatus = async () => {
    try {
      setRefreshing(true)
      const res = await api.get('/health')
      setStatusData(res.data)
    } catch (err) {
      toast.error('Failed to fetch system status')
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading && !statusData) return <LoadingSpinner message="Checking system services..." />

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
      case 'connected':
      case 'running':
      case 'ready':
      case 'initialized':
      case 'imported':
        return 'bg-volt-green text-volt-dark shadow-glow-green'
      case 'not_imported':
      case 'disabled':
        return 'bg-gray-500 text-white'
      case 'degraded':
        return 'bg-accent-400 text-white shadow-glow-amber'
      case 'error':
      case 'failed':
      case 'import_failed':
        return 'bg-danger-500 text-white shadow-glow-red'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const { services, version, app, timestamp } = statusData || {}

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Activity className="text-volt-green" size={28} />
            System Status
          </h1>
          <p className="text-gray-500 text-lg">Real-time health of ArkaGrid infrastructure</p>
        </div>
        <button onClick={fetchStatus} disabled={refreshing} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-volt-green' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Core API */}
        <StatusCard 
          icon={<Server size={24} />}
          title="Core API Server"
          status={statusData?.status || 'unknown'}
          colorClass={getStatusColor(statusData?.status)}
          details={[`Version: v${version || '2.0.0'}`, `App: ${app || 'ArkaGrid'}`]}
        />

        {/* Database */}
        <StatusCard 
          icon={<Database size={24} />}
          title="PostgreSQL Database"
          status={services?.database || 'unknown'}
          colorClass={getStatusColor(services?.database)}
          details={['Primary data store', 'Supabase backend']}
        />

        {/* Solana */}
        <StatusCard 
          icon={<Anchor size={24} />}
          title="Solana Blockchain"
          status={services?.solana?.status || 'unknown'}
          colorClass={getStatusColor(services?.solana?.status)}
          details={[
            `Enabled: ${services?.solana?.enabled ? 'Yes' : 'No'}`, 
            services?.solana?.error ? `Error: ${services?.solana?.error.substring(0,20)}...` : 'Escrow programs active'
          ]}
        />

        {/* MQTT */}
        <StatusCard 
          icon={<Cpu size={24} />}
          title="MQTT IoT Broker"
          status={services?.mqtt?.status || 'unknown'}
          colorClass={getStatusColor(services?.mqtt?.status)}
          details={[
            `Connected Meters: ${services?.mqtt?.connectedMeters ?? 0}`,
            'TCP/WebSocket active'
          ]}
        />
      </div>

      {/* Embedded Graceful Degradation Explanation */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4 border-b border-volt-border pb-4">
          <ShieldCheck className="text-volt-green" size={24} />
          <h2 className="text-xl font-bold font-heading text-white">Graceful Degradation Architecture</h2>
        </div>
        
        <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
          <p>
            ArkaGrid is designed with <strong className="text-white">Zero Downtime Fallbacks</strong>. If any peripheral system goes offline, the core trading engine continues to function.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-volt-dark/50 p-4 rounded-xl border border-volt-border hover:border-volt-green/30 transition-colors">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Anchor size={16} className="text-accent-400" /> Solana Unavailable
              </h3>
              <p>Trading continues using ArkaGrid's internal PostgreSQL database for escrow locking. Trades are marked as "Secured in DB" instead of "Verified on Solana".</p>
            </div>
            
            <div className="bg-volt-dark/50 p-4 rounded-xl border border-volt-border hover:border-volt-green/30 transition-colors">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Cpu size={16} className="text-vblue-400" /> IoT Network Offline
              </h3>
              <p>Meters store readings locally and batch-sync when reconnected. Consumers can also manually confirm delivery if the smart meter feed fails.</p>
            </div>
            
            <div className="bg-volt-dark/50 p-4 rounded-xl border border-volt-border hover:border-volt-green/30 transition-colors">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Zap size={16} className="text-danger-400" /> Razorpay Outage
              </h3>
              <p>Transactions transparently bypass fiat gateways and fall back to utilizing the internal ArkaGrid wallet balance for exact peer-to-peer settlement.</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-600 font-mono">
        Last updated: {timestamp ? new Date(timestamp).toLocaleString() : 'Never'}
      </p>
    </div>
  )
}

function StatusCard({ icon, title, status, colorClass, details }) {
  return (
    <div className="bg-volt-surface border border-volt-border rounded-2xl p-5 hover:border-volt-green/20 transition-all flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-volt-dark rounded-xl text-gray-400">
          {icon}
        </div>
        <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${colorClass}`}>
          {status.replace(/_/g, ' ')}
        </div>
      </div>
      
      <h3 className="text-white font-bold font-heading mb-3">{title}</h3>
      
      <div className="mt-auto space-y-1.5">
        {details.map((detail, idx) => (
          <p key={idx} className="text-xs text-gray-500 flex items-center gap-2">
             <span className="w-1 h-1 rounded-full bg-gray-600" />
             {detail}
          </p>
        ))}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useAuth, useToast } from '../hooks/useContext'
import { authAPI } from '../api/auth'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, Mail, Phone, Shield, Star, Calendar, Edit3, Save, X, Zap, Award } from 'lucide-react'

export default function Profile() {
    const { user } = useAuth()
    const toast = useToast()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ name: '', phone: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchProfile() }, [])

    const fetchProfile = async () => {
        try {
            const response = await authAPI.getMe()
            setProfile(response.data)
            setForm({ name: response.data.name, phone: response.data.phone })
        } catch (err) { toast.error('Failed to load profile') }
        finally { setLoading(false) }
    }

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return }
        if (!/^\d{10}$/.test(form.phone)) { toast.error('Phone must be 10 digits'); return }
        setSaving(true)
        try {
            toast.success('Profile updated!')
            setProfile({ ...profile, name: form.name, phone: form.phone })
            setEditing(false)
        } catch (err) { toast.error('Failed to update profile') }
        finally { setSaving(false) }
    }

    if (loading) return <LoadingSpinner message="Loading profile..." />

    const memberSince = new Date(profile?.created_at).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    })

    const roleConfig = {
        prosumer: { label: 'Prosumer', emoji: '☀️', desc: 'Solar Energy Seller', borderColor: 'border-accent-500/30', bgColor: 'bg-accent-500/10', textColor: 'text-accent-400' },
        consumer: { label: 'Consumer', emoji: '⚡', desc: 'Energy Buyer', borderColor: 'border-vblue-400/30', bgColor: 'bg-vblue-400/10', textColor: 'text-vblue-400' },
        admin: { label: 'Admin', emoji: '🛡️', desc: 'Platform Administrator', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400' },
    }

    const rc = roleConfig[profile?.role] || roleConfig.consumer

    return (
        <div className="page-container animate-fade-in pb-24 md:pb-8">
            <h1 className="page-title">👤 My Profile</h1>
            <p className="page-subtitle">Manage your account details and settings</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="card text-center p-8">
                        {/* Avatar */}
                        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-volt-green/30 to-volt-green/5 flex items-center justify-center text-volt-green text-4xl font-bold border border-volt-green/20 shadow-glow-green mb-4">
                            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{profile?.name}</h2>
                        <p className="text-gray-500 text-sm mb-4">{profile?.email}</p>

                        {/* Role Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${rc.bgColor} border ${rc.borderColor}`}>
                            <span className="text-lg">{rc.emoji}</span>
                            <div className="text-left">
                                <p className={`text-sm font-bold ${rc.textColor}`}>{rc.label}</p>
                                <p className="text-xs text-gray-500">{rc.desc}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-volt-dark/60 rounded-xl border border-volt-border">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                    <Star size={16} className="text-accent-400" /> Rating
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-white font-mono">{parseFloat(profile?.rating_avg || 5).toFixed(1)}</span>
                                    <span className="text-accent-400">★</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-volt-dark/60 rounded-xl border border-volt-border">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                    <Calendar size={16} className="text-vblue-400" /> Member since
                                </span>
                                <span className="font-medium text-sm text-gray-300">{memberSince}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-volt-dark/60 rounded-xl border border-volt-border">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                    <Shield size={16} className="text-volt-green" /> KYC
                                </span>
                                <span className={`text-sm font-bold ${profile?.kyc_verified ? 'text-volt-green' : 'text-accent-400'}`}>
                                    {profile?.kyc_verified ? '✓ Verified' : 'Pending'}
                                </span>
                            </div>
                            {profile?.role !== 'admin' && (
                                <div className="flex items-center justify-between p-3 bg-volt-dark/60 rounded-xl border border-volt-border">
                                    <span className="text-sm text-gray-500 flex items-center gap-2">
                                        <Zap size={16} className="text-volt-green" /> Wallet
                                    </span>
                                    <span className="font-bold text-volt-green font-mono">₹{parseFloat(profile?.wallet_balance || 0).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className="lg:col-span-2">
                    <div className="card p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white font-heading">Account Details</h3>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                                    <span className="flex items-center gap-1.5"><Edit3 size={14} /> Edit</span>
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditing(false); setForm({ name: profile.name, phone: profile.phone }) }}
                                        className="btn-secondary text-sm">
                                        <span className="flex items-center gap-1.5"><X size={14} /> Cancel</span>
                                    </button>
                                    <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                                        <span className="flex items-center gap-1.5"><Save size={14} /> {saving ? 'Saving...' : 'Save'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="form-label flex items-center gap-2"><User size={14} /> Full Name</label>
                                {editing ? (
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="form-input" />
                                ) : (
                                    <p className="text-white font-medium py-2.5 px-4 bg-volt-dark/60 rounded-xl border border-volt-border">{profile?.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label flex items-center gap-2"><Mail size={14} /> Email Address</label>
                                <p className="text-white font-medium py-2.5 px-4 bg-volt-dark/60 rounded-xl border border-volt-border flex items-center justify-between">
                                    {profile?.email}
                                    <span className="text-xs text-gray-600">Cannot change</span>
                                </p>
                            </div>

                            <div>
                                <label className="form-label flex items-center gap-2"><Phone size={14} /> Phone Number</label>
                                {editing ? (
                                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        maxLength={10} className="form-input" />
                                ) : (
                                    <p className="text-white font-medium py-2.5 px-4 bg-volt-dark/60 rounded-xl border border-volt-border">{profile?.phone}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label flex items-center gap-2"><Award size={14} /> Role</label>
                                <p className="text-white font-medium py-2.5 px-4 bg-volt-dark/60 rounded-xl border border-volt-border capitalize flex items-center gap-2">
                                    <span>{rc.emoji}</span> {profile?.role}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* How ArkaGrid Works */}
                    <div className="card p-8 mt-6 border-volt-green/20 bg-volt-green/[0.03]">
                        <h3 className="text-lg font-bold text-white mb-4 font-heading">⚡ How ArkaGrid Works</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center p-4">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-accent-500/10 flex items-center justify-center mb-3 border border-accent-500/20">
                                    <span className="text-xl">☀️</span>
                                </div>
                                <p className="font-semibold text-sm text-white">Generate</p>
                                <p className="text-xs text-gray-500 mt-1">Solar panels produce surplus energy</p>
                            </div>
                            <div className="text-center p-4">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-vblue-400/10 flex items-center justify-center mb-3 border border-vblue-400/20">
                                    <span className="text-xl">🔄</span>
                                </div>
                                <p className="font-semibold text-sm text-white">Trade</p>
                                <p className="text-xs text-gray-500 mt-1">List energy on marketplace with escrow</p>
                            </div>
                            <div className="text-center p-4">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-volt-green/10 flex items-center justify-center mb-3 border border-volt-green/20">
                                    <span className="text-xl">💰</span>
                                </div>
                                <p className="font-semibold text-sm text-white">Save</p>
                                <p className="text-xs text-gray-500 mt-1">Consumers save vs grid, prosumers earn more</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

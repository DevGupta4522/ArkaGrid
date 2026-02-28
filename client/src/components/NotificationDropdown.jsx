import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Zap, MapPin, X, Info, CreditCard } from 'lucide-react';
import { notificationsAPI } from '../api/notifications';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await notificationsAPI.getAll();
            setNotifications(data.data || []);
            setUnreadCount(data.data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const markAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'trade_created': return <Zap className="text-vblue-400" size={16} />;
            case 'trade_delivering': return <MapPin className="text-yellow-400" size={16} />;
            case 'trade_completed': return <Check className="text-volt-green" size={16} />;
            case 'trade_failed': return <X className="text-red-400" size={16} />;
            case 'wallet': return <CreditCard className="text-volt-green" size={16} />;
            default: return <Info className="text-gray-400" size={16} />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isOpen
                        ? 'bg-volt-border text-white'
                        : 'bg-volt-border/50 text-gray-400 hover:text-white hover:bg-volt-border'
                    }`}
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-volt-green rounded-full flex items-center justify-center text-[10px] font-bold text-volt-dark border-2 border-volt-surface">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-volt-surface border border-volt-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-volt-border bg-volt-dark/50">
                        <h3 className="font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-volt-green hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400">
                                <Bell className="mx-auto mb-2 opacity-50" size={24} />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-volt-border/50">
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${notif.is_read ? 'opacity-70' : 'bg-volt-green/[0.02]'}`}
                                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.is_read ? 'bg-volt-border' : 'bg-volt-border/80 border border-volt-green/30'}`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-sm font-semibold truncate ${notif.is_read ? 'text-gray-300' : 'text-volt-green'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                                                        {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

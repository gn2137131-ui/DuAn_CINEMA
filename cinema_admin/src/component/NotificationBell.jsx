import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Ticket, ShoppingCart, Clock } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosClient from '../api/axiosClient';

const BACKEND_WS_URL = 'https://duancinema-production.up.railway.app/ws-cinema';

const formatCurrency = (amount) => {
  if (!amount) return '0đ';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const stompClientRef = useRef(null);
  const audioRef = useRef(null);

  // Load recent bookings from API as initial notifications
  const loadRecentBookings = useCallback(async () => {
    try {
      const res = await axiosClient.get('/bookings/recent?limit=10');
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      const notifs = data.map(b => ({
        id: `booking-${b.id}`,
        bookingId: b.id,
        type: 'NEW_BOOKING',
        title: 'Đơn đặt vé mới',
        message: `${b.user?.fullName || 'Khách hàng'} vừa thanh toán thành công`,
        amount: b.totalPrice,
        orderCode: b.orderCode,
        time: b.paymentTime || b.bookingTime,
        read: true,
      }));
      setNotifications(notifs);
    } catch (e) {
      // API might not exist yet, ignore
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    loadRecentBookings();

    const client = new Client({
      webSocketFactory: () => new SockJS(BACKEND_WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe('/topic/admin/dashboard', (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.type === 'NEW_BOOKING') {
              const newNotif = {
                id: `booking-${data.bookingId}-${Date.now()}`,
                bookingId: data.bookingId,
                type: 'NEW_BOOKING',
                title: '🎫 Đơn đặt vé mới!',
                message: `Đơn #${data.bookingId} vừa thanh toán thành công`,
                amount: data.amount,
                time: new Date().toISOString(),
                read: false,
              };
              setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
              setUnreadCount(prev => prev + 1);
              // Play sound
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
              // Show browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification('🎫 Đơn đặt vé mới!', {
                  body: `Đơn #${data.bookingId} - ${formatCurrency(data.amount)}`,
                  icon: '/favicon.ico',
                });
              }
            }
          } catch (e) {
            console.error('Lỗi xử lý WebSocket message:', e);
          }
        });
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setIsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [loadRecentBookings]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      // Mark all as read when opening
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Hidden audio for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2Y3NWOf0tqnYzY3XaPP1aJfNjdbpNDVoV43OFyiz9Whezs6W6bO1J+AQDxXqcvToH9BPFapytOffkE8Vapv3aJ+Qj1VqcnTnn1DO1WoyNKde0Q6VKrI0ZZ6RTlTqsXSmHhGOFOqw9KXd0c3Uqm/0ZV1SDZRqL7Rk3NJNFCnvNCRcUoyT6a7z45vSzFOp7jNjWxMM02muMuKaU00TKW1yYdnTjRMpLPHhWVQM0ujssWDYlEzS6GwwoFfUjNLoK7Bf15TM0qfq7x/XFQyS52pun1aVTJKm6a4e1hWMkqZo7d5VlcySpijtnZUWDJKl6C0dFNZMkqVnbFxUVsySpOar25QXTNKkZesaU9eM0qPl6llTl8zSo6Vp2JNYTNJK5Gk" type="audio/wav" />
      </audio>

      {/* Bell Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'relative',
          padding: '10px',
          background: isOpen ? '#fff7ed' : 'transparent',
          border: isOpen ? '1px solid #fed7aa' : '1px solid transparent',
          borderRadius: '12px',
          cursor: 'pointer',
          color: isOpen ? '#ea580c' : '#6b7280',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={isConnected ? 'Đã kết nối real-time' : 'Đang kết nối...'}
      >
        <Bell size={20} style={{ animation: unreadCount > 0 ? 'bellRing 0.5s ease infinite alternate' : 'none' }} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            minWidth: '18px', height: '18px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white', borderRadius: '999px',
            fontSize: '10px', fontWeight: '800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white', padding: '0 3px',
            boxShadow: '0 0 0 2px rgba(239,68,68,0.3)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection indicator */}
        <span style={{
          position: 'absolute', bottom: '5px', right: '5px',
          width: '7px', height: '7px',
          background: isConnected ? '#22c55e' : '#f97316',
          borderRadius: '50%', border: '1px solid white',
        }} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '380px', maxHeight: '520px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #f1f5f9',
          zIndex: 9999,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          animation: 'dropdownSlide 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} color="white" />
              <span style={{ fontWeight: '800', color: 'white', fontSize: '15px' }}>Thông Báo</span>
              {notifications.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: '700' }}>
                  {notifications.length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isConnected ? '#4ade80' : '#fb923c', display: 'inline-block' }} />
                <span style={{ color: isConnected ? '#4ade80' : '#fb923c', fontSize: '11px', fontWeight: '600' }}>
                  {isConnected ? 'Real-time' : 'Đang kết nối'}
                </span>
              </div>
              {notifications.length > 0 && (
                <button onClick={handleClearAll} title="Xóa tất cả" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCheck size={13} /> Xóa tất cả
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontWeight: '600', marginBottom: '4px' }}>Chưa có thông báo mới</p>
                <p style={{ fontSize: '13px' }}>Thông báo đơn hàng sẽ xuất hiện ở đây theo thời gian thực</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f8fafc',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    background: notif.read ? 'white' : 'linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%)',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #f97316, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ticket size={20} color="white" />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{notif.title}</span>
                      {!notif.read && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', lineHeight: 1.4 }}>{notif.message}</p>
                    {notif.amount && (
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        +{formatCurrency(notif.amount)}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#94a3b8', fontSize: '11px' }}>
                      <Clock size={11} />
                      {formatTimeAgo(notif.time)}
                    </div>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={(e) => handleDismiss(notif.id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px', borderRadius: '6px', flexShrink: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#fafafa', textAlign: 'center' }}>
            <a href="/admin/bookings" style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1', textDecoration: 'none' }}>
              Xem tất cả đơn hàng →
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellRing {
          0% { transform: rotate(-15deg); }
          100% { transform: rotate(15deg); }
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

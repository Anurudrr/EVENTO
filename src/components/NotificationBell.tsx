import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';
import { formatRelativeDate, getErrorMessage } from '../utils';

interface NotificationBellProps {
  buttonClassName?: string;
  panelClassName?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  buttonClassName = '',
  panelClassName = '',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const payload = await notificationService.getNotifications();
      setNotifications(payload.notifications);
      setUnreadCount(payload.unreadCount);
    } catch (error) {
      console.error('[notification-bell:load]', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [user?._id]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.readAt) {
        await notificationService.markRead(notification._id);
      }

      setNotifications((current) => current.map((item) => (
        item._id === notification._id
          ? { ...item, readAt: item.readAt || new Date().toISOString() }
          : item
      )));
      setUnreadCount((current) => Math.max(0, current - (notification.readAt ? 0 : 1)));

      if (notification.link) {
        navigate(notification.link);
        setOpen(false);
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to open notification'), 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update notifications'), 'error');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((current) => !current);
          if (!open) {
            void loadNotifications();
          }
        }}
        className={buttonClassName}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 min-w-5 h-5 px-1 bg-noir-accent text-noir-bg text-[10px] font-mono font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-3 w-[22rem] border border-noir-border bg-white shadow-2xl ${panelClassName}`}>
          <div className="flex items-center justify-between border-b border-noir-border px-4 py-4">
            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Notifications</p>
              <p className="text-xs uppercase tracking-wide text-noir-muted">{unreadCount} unread</p>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent"
            >
              <CheckCheck className="w-4 h-4" />
              Read all
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full border-b border-noir-border px-4 py-4 text-left transition-colors hover:bg-noir-accent/5 ${
                  notification.readAt ? 'bg-white' : 'bg-noir-accent/5'
                }`}
              >
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">
                  {notification.type}
                </p>
                <p className="mt-2 text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">
                  {notification.title}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">
                  {notification.message}
                </p>
                <p className="mt-3 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                  {formatRelativeDate(notification.createdAt)}
                </p>
              </button>
            )) : (
              <div className="px-4 py-10 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

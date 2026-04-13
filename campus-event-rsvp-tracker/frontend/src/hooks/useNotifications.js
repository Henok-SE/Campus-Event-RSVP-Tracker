import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteNotification,
  getApiError,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../services/api';
import { toNotificationVm } from '../utils/notificationAdapter';

export const DEFAULT_NOTIFICATIONS_POLL_MS = 45_000;

export function useNotifications({
  pollMs = DEFAULT_NOTIFICATIONS_POLL_MS,
  enablePolling = true,
  autoLoad = true
} = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingNotificationId, setDeletingNotificationId] = useState('');
  const requestInFlightRef = useRef(false);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;

    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await getNotifications();
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setNotifications(rows.map((item) => toNotificationVm(item)));
    } catch (fetchError) {
      const apiError = getApiError(fetchError, 'Failed to load notifications');
      setError(apiError.message);

      if (!silent) {
        setNotifications([]);
      }
    } finally {
      requestInFlightRef.current = false;

      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    fetchNotifications();
  }, [autoLoad, fetchNotifications]);

  useEffect(() => {
    if (!enablePolling) {
      return;
    }

    const timerId = window.setInterval(() => {
      if (!document.hidden) {
        fetchNotifications({ silent: true });
      }
    }, pollMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [enablePolling, fetchNotifications, pollMs]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) {
      return true;
    }

    const snapshot = notifications;
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

    try {
      await markAllNotificationsRead();
      return true;
    } catch (markError) {
      const apiError = getApiError(markError, 'Failed to update notifications');
      setNotifications(snapshot);
      setError(apiError.message);
      return false;
    }
  }, [notifications, unreadCount]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) {
      return true;
    }

    const target = notifications.find((notification) => notification.id === notificationId);
    if (!target || target.read) {
      return true;
    }

    const snapshot = notifications;
    setNotifications((prev) => prev.map((notification) => (
      notification.id === notificationId ? { ...notification, read: true } : notification
    )));

    try {
      await markNotificationRead(notificationId);
      return true;
    } catch {
      setNotifications(snapshot);
      return false;
    }
  }, [notifications]);

  const removeNotification = useCallback(async (notificationId) => {
    if (!notificationId || deletingNotificationId) {
      return false;
    }

    const snapshot = notifications;
    setDeletingNotificationId(notificationId);
    setError('');
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));

    try {
      await deleteNotification(notificationId);
      return true;
    } catch (deleteError) {
      const apiError = getApiError(deleteError, 'Failed to delete notification');
      setNotifications(snapshot);
      setError(apiError.message);
      return false;
    } finally {
      setDeletingNotificationId('');
    }
  }, [deletingNotificationId, notifications]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    deletingNotificationId,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    removeNotification,
    clearError
  };
}

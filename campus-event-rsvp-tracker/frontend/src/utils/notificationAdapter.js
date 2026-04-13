export const formatNotificationTime = (value) => {
  if (!value) {
    return 'Just now';
  }

  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return 'Just now';
  }

  const diffMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return createdAt.toLocaleDateString();
};

export const toNotificationVm = (item) => ({
  id: item?.id,
  type: item?.type || 'info',
  title: item?.title || 'Notification',
  message: item?.message || '',
  read: Boolean(item?.read),
  created_at: item?.created_at,
  eventId: item?.event_id || null
});

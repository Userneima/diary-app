import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (timestamp: number): string => {
  return format(timestamp, 'MMM dd, yyyy');
};

export const formatDateTime = (timestamp: number): string => {
  return format(timestamp, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (timestamp: number): string => {
  return formatDistanceToNow(timestamp, { addSuffix: true });
};

export const formatTime = (timestamp: number): string => {
  return format(timestamp, 'HH:mm');
};

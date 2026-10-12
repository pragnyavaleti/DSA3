/**
 * Helper utility functions
 */

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDuration(days) {
  const num = Number(days) || 0;
  return `${num} ${num === 1 ? 'day' : 'days'}`;
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return {
        bg: '#ecfdf5',
        text: '#065f46',
        border: '#a7f3d0'
      };
    case 'in progress':
      return {
        bg: '#eff6ff',
        text: '#1e40af',
        border: '#bfdbfe'
      };
    case 'pending':
    default:
      return {
        bg: '#f8fafc',
        text: '#475569',
        border: '#e2e8f0'
      };
  }
}

export function truncateText(text, maxLen = 60) {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

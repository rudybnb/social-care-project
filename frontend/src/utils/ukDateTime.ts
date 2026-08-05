const UK_TIME_ZONE = 'Europe/London';

export const formatUkTime = (timestamp: string | Date) =>
  new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UK_TIME_ZONE
  });

export const getUkDate = (date: Date = new Date()) =>
  date.toLocaleDateString('en-CA', { timeZone: UK_TIME_ZONE });

import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date: Date | string, formatString: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatString) : '';
};

export const formatTime = (date: Date | string): string => {
  return formatDate(date, 'HH:mm');
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'PPP HH:mm');
};

export const isDateInPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) && dateObj < new Date();
};

export const getDaysBetween = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return 0;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
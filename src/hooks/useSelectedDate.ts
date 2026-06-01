import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDays, format, parseISO, isValid } from 'date-fns';
import { todayDateString } from '@/utils/time';

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return isValid(parseISO(value));
}

export function useSelectedDate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayDateString();

  const selectedDate = useMemo(() => {
    const param = searchParams.get('date');
    if (param && isValidDateString(param)) return param;
    return today;
  }, [searchParams, today]);

  const isToday = selectedDate === today;

  const setSelectedDate = useCallback(
    (date: string) => {
      if (!isValidDateString(date)) return;
      const next = new URLSearchParams(searchParams);
      if (date === today) {
        next.delete('date');
      } else {
        next.set('date', date);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, today],
  );

  const goToPreviousDay = useCallback(() => {
    const d = parseISO(selectedDate);
    setSelectedDate(format(addDays(d, -1), 'yyyy-MM-dd'));
  }, [selectedDate, setSelectedDate]);

  const goToNextDay = useCallback(() => {
    const d = parseISO(selectedDate);
    setSelectedDate(format(addDays(d, 1), 'yyyy-MM-dd'));
  }, [selectedDate, setSelectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(today);
  }, [setSelectedDate, today]);

  const entryPath = useMemo(() => {
    const query = selectedDate === today ? '' : `?date=${selectedDate}`;
    return `/entry${query}`;
  }, [selectedDate, today]);

  return {
    selectedDate,
    isToday,
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    entryPath,
  };
}

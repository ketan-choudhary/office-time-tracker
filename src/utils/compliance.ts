import { addDays, eachDayOfInterval, endOfMonth, isWeekend, startOfDay } from 'date-fns';

export interface SkipOfficeVerdict {
  canSkip: boolean;
  headline: 'YES' | 'NO';
  explanation: string;
}

/** Weekdays from tomorrow through end of current month (inclusive). */
export function countWeekdaysFromTomorrow(ref: Date = new Date()): number {
  const tomorrow = startOfDay(addDays(ref, 1));
  const lastDay = endOfMonth(ref);
  if (tomorrow > lastDay) return 0;
  return eachDayOfInterval({ start: tomorrow, end: lastDay }).filter((d) => !isWeekend(d))
    .length;
}

/**
 * Whether the user can skip the office tomorrow while still meeting the monthly office-day target.
 * Assumes each remaining weekday (after tomorrow) can count as an office day if needed.
 */
export function evaluateSkipOfficeTomorrow(
  officeDaysCompleted: number,
  officeDaysRequired: number,
  ref: Date = new Date(),
): SkipOfficeVerdict {
  const remainingNeeded = Math.max(0, officeDaysRequired - officeDaysCompleted);
  const workingDaysFromTomorrow = countWeekdaysFromTomorrow(ref);

  if (remainingNeeded === 0) {
    return {
      canSkip: true,
      headline: 'YES',
      explanation: 'You are ahead of target.',
    };
  }

  if (workingDaysFromTomorrow === 0) {
    return {
      canSkip: false,
      headline: 'NO',
      explanation: `You still need ${remainingNeeded} office visit${remainingNeeded === 1 ? '' : 's'} this month.`,
    };
  }

  if (remainingNeeded < workingDaysFromTomorrow) {
    return {
      canSkip: true,
      headline: 'YES',
      explanation: 'You can skip tomorrow and still meet your monthly target.',
    };
  }

  if (remainingNeeded === workingDaysFromTomorrow) {
    return {
      canSkip: false,
      headline: 'NO',
      explanation: `You need every remaining working day (${remainingNeeded}) in the office this month.`,
    };
  }

  return {
    canSkip: false,
    headline: 'NO',
    explanation: `You still need ${remainingNeeded} office visits this month with only ${workingDaysFromTomorrow} working day${workingDaysFromTomorrow === 1 ? '' : 's'} left after tomorrow.`,
  };
}

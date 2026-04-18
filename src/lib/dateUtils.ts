const MONTH_BASED_FREQUENCIES = new Set([
  'monthly',
  'quarterly',
  'semi_annually',
  'yearly',
  'five_yearly',
]);

function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  // Anchor to day 1 before changing month to avoid JS date overflow.
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return result;
}

function shiftFromFriday(nextDue: Date, frequency: string): Date {
  if (nextDue.getDay() !== 5) return nextDue;

  if (!MONTH_BASED_FREQUENCIES.has(frequency)) {
    nextDue.setDate(nextDue.getDate() + 1);
    return nextDue;
  }

  const originalMonth = nextDue.getMonth();
  const forward = new Date(nextDue);
  forward.setDate(forward.getDate() + 1);

  // Keep month-based schedules inside the same calendar month.
  if (forward.getMonth() === originalMonth) {
    return forward;
  }

  nextDue.setDate(nextDue.getDate() - 1);
  return nextDue;
}

export function calculateNextDueDate(lastCompletedDate: Date | string, frequency: string): Date {
  const completedDate = new Date(lastCompletedDate);
  let nextDue = new Date(completedDate);

  switch (frequency) {
    case 'hourly':
      nextDue.setHours(nextDue.getHours() + 1);
      break;
    case 'daily':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'fifteen_days':
      nextDue.setDate(nextDue.getDate() + 15);
      break;
    case 'monthly':
      nextDue = addMonthsClamped(nextDue, 1);
      break;
    case 'quarterly':
      nextDue = addMonthsClamped(nextDue, 3);
      break;
    case 'semi_annually':
      nextDue = addMonthsClamped(nextDue, 6);
      break;
    case 'yearly':
      nextDue = addMonthsClamped(nextDue, 12);
      break;
    case 'five_yearly':
      nextDue = addMonthsClamped(nextDue, 60);
      break;
    default:
      // Default to weekly if unknown, or maybe no change?
      // For safety, let's just return the original date or handle error.
      // But preserving existing behavior:
      nextDue.setDate(nextDue.getDate() + 7); 
      break;
  }
  
  // Skip Fridays (Day 5) as no logs are taken on those days.
  nextDue = shiftFromFriday(nextDue, frequency);
  
  return nextDue;
}

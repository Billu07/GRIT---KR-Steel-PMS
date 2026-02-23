export function calculateNextDueDate(lastCompletedDate: Date | string, frequency: string): Date {
  const completedDate = new Date(lastCompletedDate);
  const nextDue = new Date(completedDate);

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
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case 'quarterly':
      nextDue.setMonth(nextDue.getMonth() + 3);
      break;
    case 'semi_annually':
      nextDue.setMonth(nextDue.getMonth() + 6);
      break;
    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
    default:
      // Default to weekly if unknown, or maybe no change?
      // For safety, let's just return the original date or handle error.
      // But preserving existing behavior:
      nextDue.setDate(nextDue.getDate() + 7); 
      break;
  }
  return nextDue;
}

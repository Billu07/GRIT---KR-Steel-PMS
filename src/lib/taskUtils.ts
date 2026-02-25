export function getTaskStatus(task: { nextDueDate?: string | Date | null }): 'OVERDUE' | 'DUE' | 'UP-TO-DATE' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueSoonDate = new Date();
  dueSoonDate.setDate(today.getDate() + 7);

  const nextDueDate = task.nextDueDate ? new Date(task.nextDueDate) : null;
  if (nextDueDate) nextDueDate.setHours(0, 0, 0, 0);

  const isOverdue = nextDueDate && nextDueDate < today;
                    
  const isDueSoon = nextDueDate && nextDueDate >= today && nextDueDate <= dueSoonDate;

  if (isOverdue) return 'OVERDUE';
  if (isDueSoon) return 'DUE';
  return 'UP-TO-DATE';
}

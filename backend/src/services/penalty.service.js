const calculatePenalty = (
  dueDate,
  returnDate = new Date(),
  penaltyPerDay = Number(process.env.PENALTY_PER_DAY || 10),
  penaltyPerHour = Number(process.env.PENALTY_PER_HOUR || 2)
) => {
  if (!dueDate) {
    return 0;
  }

  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  if (returned <= due) {
    return 0;
  }

  const diffMs = returned.getTime() - due.getTime();

  // If the due date and return date are the same calendar day, charge by hours.
  const sameDay = (
    due.getFullYear() === returned.getFullYear() &&
    due.getMonth() === returned.getMonth() &&
    due.getDate() === returned.getDate()
  );

  if (sameDay) {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return diffHours * penaltyPerHour;
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays * penaltyPerDay;
};

module.exports = { calculatePenalty };

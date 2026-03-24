const calculatePenalty = (dueDate, returnDate = new Date(), penaltyPerDay = Number(process.env.PENALTY_PER_DAY || 10)) => {
  if (!dueDate) {
    return 0;
  }

  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  if (returned <= due) {
    return 0;
  }

  const diffMs = returned.getTime() - due.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays * penaltyPerDay;
};

module.exports = { calculatePenalty };

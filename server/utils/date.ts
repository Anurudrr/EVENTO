export const toDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  return date.toISOString().split('T')[0];
};

export const startOfDayUtc = (value: string | Date) => {
  const key = toDateKey(value);
  return new Date(`${key}T00:00:00.000Z`);
};

export const isPastDateKey = (value: string | Date) => {
  const target = toDateKey(value);
  const today = toDateKey(new Date());
  return target < today;
};

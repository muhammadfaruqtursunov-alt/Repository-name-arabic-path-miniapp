/** Format seconds into a human-readable string (Russian) */
export function formatAppTime(seconds: number): string {
  if (!seconds || seconds < 60) return '< 1 мин';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) {
    return remMins > 0 ? `${hours} ч ${remMins} мин` : `${hours} ч`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} д ${remHours} ч` : `${days} д`;
}

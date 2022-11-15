export default function parseDate(datetime: string): string {
  const date = new Date(datetime);
  const today = new Date();
  const daysAgo = Math.abs(today.getDate() - date.getDate());
  const monthsAgo = Math.abs(today.getMonth() - date.getMonth());
  if (daysAgo === 0  && monthsAgo === 0) {
    const hoursAgo = Math.abs(today.getHours() - date.getHours());
    if (hoursAgo > 0) {
      return `${hoursAgo} hours ago`;
    } else {
      const minutesAgo = Math.abs(today.getMinutes() - date.getMinutes());
      return `${minutesAgo} minutes ago`;
    }
  } else if (daysAgo === 1 && monthsAgo === 0) {
    return `${daysAgo} day ago`;
  } else {
    return date.toLocaleDateString();
  }
}

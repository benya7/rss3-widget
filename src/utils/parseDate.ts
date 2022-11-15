export default function parseDate(datetime: string): string {
  const date = new Date(datetime);
  const today = new Date();
  const daysAgo = Math.abs(today.getDate() - date.getDate());
  const monthsAgo = Math.abs(today.getMonth() - date.getMonth());
  if (daysAgo === 0  && monthsAgo === 0) {
    const hoursAgo = today.getHours() - date.getHours();
    return `${hoursAgo} hours ago`;
  } else if (daysAgo === 1 && monthsAgo === 0) {
    return `${daysAgo} day ago`;
  } else {
    return date.toLocaleDateString();
  }
}

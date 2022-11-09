export default function parseDate(datetime: string): string {
  const date = new Date(datetime)
  const today = new Date()
  const daysAgo = Math.abs(today.getDate() - date.getDate());

  if (daysAgo == 0) {
    const hoursAgo = today.getHours() - date.getHours()
    return `${hoursAgo} hours ago`
  }
  else if (daysAgo == 1) {
    return `${daysAgo} day ago`
  }
  else {
    return date.toLocaleDateString()
  }
}

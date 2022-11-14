export default function formatValue(value: string) {
  if (value.includes('.')) {
    const split = value.split('.');
    if (split[1].startsWith('0')) {
      return `${split[0]}.${split[1].substring(0, 3)}`;
    } else if (split[1].startsWith('00')) {
      return `${split[0]}.${split[1].substring(0, 4)}`;
    } else {
      return `${split[0]}.${split[1].substring(0, 2)}`;
    }
  } else {
    if (value.length > 4 && value.length <= 6) {
      return `${value.substring(0, value.length - 3)}K`;
    } else if (value.length > 6) {
      return `${value.substring(0, value.length - 6)}M`;
    } else {
      return value;
    }
  }
}

export default function formatValue(value: string) {
  const split = value.split('.');
  if (split[1] && split[0].length < 5) {
    if (split[1].startsWith('0')) {
      return `${split[0]}.${split[1].substring(0, 3)}`;
    } else if (split[1].startsWith('00')) {
      return `${split[0]}.${split[1].substring(0, 4)}`;
    } else {
      return `${split[0]}.${split[1].substring(0, 2)}`;
    }
  } else {
    if (split[0].length > 4 && split[0].length <= 6) {
      return `${split[0].substring(0, split[0].length - 3)}K`;
    } else if (split[0].length > 6) {
      return `${split[0].substring(0, split[0].length - 6)}M`;
    } else {
      return split[0];
    }
  }
}

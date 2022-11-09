export default function formatAccount(
  address: string,
  ensList: { [key: string]: string }
): string {
  const length = address.length;
  if (ensList[address] && ensList[address] !== address) {
    return ensList[address];
  } else {
    return `${address.substring(0, 6)}...${address.substring(length - 4)}`;
  }
}

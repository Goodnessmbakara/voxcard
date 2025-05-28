export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


export function getAddressString(addr: unknown): string {
  if (typeof addr === "string") return addr;
  if (typeof addr === "object" && addr !== null && "current" in addr) {
    return (addr as { current: unknown }).current as string || "";
  }
  return "";
}
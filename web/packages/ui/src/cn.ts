export type ClassValue = string | number | false | null | undefined;

/** Filtered space-join of class fragments. */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}

export default cn;

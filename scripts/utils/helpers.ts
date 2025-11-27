/**
 * Adds a delay between operations to avoid overwhelming the API
 * @param ms - Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

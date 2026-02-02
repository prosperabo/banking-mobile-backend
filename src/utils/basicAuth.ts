export function buildBasicAuthToken(apiKey: string, secretKey: string): string {
  const token = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

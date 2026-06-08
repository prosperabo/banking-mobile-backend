const missingEnvVars: string[] = [];

export function required(key: string): string {
  const value = process.env[key];

  if (!value || !value.trim()) {
    if (!missingEnvVars.includes(key)) {
      missingEnvVars.push(key);
    }
  }

  return value ?? '';
}

export function validateEnvVars(): void {
  if (missingEnvVars.length === 0) return;

  const message = [
    'Missing required environment variables:',
    ...missingEnvVars.map(v => `  - ${v}`),
    '',
    'Please set them in your .env file or environment.',
  ].join('\n');

  throw new Error(message);
}

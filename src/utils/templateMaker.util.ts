import * as fs from 'fs';
import { config } from '@/config';

const { timeZone } = config;

export function renderTemplate<T>(data: T, templatePath: string): string {
  let html: string;
  try {
    html = fs.readFileSync(templatePath, 'utf-8');
  } catch {
    const errorMessage =
      `[sender.helpers] Could not read template at: ${templatePath}. ` +
      'Make sure the template HTML is present in public/';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const values: Record<string, string> = {
    ...Object.values(data as object).reduce((acc, value, index) => {
      const key = Object.keys(data as object)[index];
      acc[key] = String(value);
      return acc;
    }, {}),
    timeZone,
  };

  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in values) return values[key];
    console.warn(`[sender.helpers] Unknown template placeholder: {{${key}}}`);
    return '';
  });
}

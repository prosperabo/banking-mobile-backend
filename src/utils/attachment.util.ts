import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import {
  AttachmentFormat,
  AttachmentOption,
  ResolvedAttachment,
} from '../schemas/sender.schemas';
import { renderTemplate } from './templateMaker.util';

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.html': 'text/html',
};

function getMimeType(
  filePath: string,
  overrideFormat?: AttachmentFormat
): string {
  if (overrideFormat === 'pdf') return 'application/pdf';
  if (overrideFormat === 'image') return 'image/png';
  return (
    MIME_MAP[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
  );
}

function inferFilename(
  filePath: string,
  overrideFormat?: AttachmentFormat
): string {
  const base = path.basename(filePath, path.extname(filePath));
  if (overrideFormat === 'pdf') return `${base}.pdf`;
  if (overrideFormat === 'image') return `${base}.png`;
  return path.basename(filePath);
}

export async function htmlToBuffer(
  html: string,
  format: AttachmentFormat
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    if (format === 'pdf') {
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      });
      return Buffer.from(pdf);
    } else {
      const screenshot = await page.screenshot({ type: 'png', fullPage: true });
      return Buffer.from(screenshot);
    }
  } finally {
    await browser.close();
  }
}

export async function resolveAttachment<T>(
  attachment: AttachmentOption,
  emailHtml: string,
  templateData: T
): Promise<ResolvedAttachment> {
  if (attachment.type === 'from-email') {
    const buffer = await htmlToBuffer(emailHtml, attachment.format);
    const isPdf = attachment.format === 'pdf';
    return {
      filename:
        attachment.filename ?? (isPdf ? 'document.pdf' : 'document.png'),
      content: buffer,
      contentType: isPdf ? 'application/pdf' : 'image/png',
    };
  }

  const { filePath, filename, htmlConvertTo } = attachment;
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.html') {
    if (!htmlConvertTo) {
      const errorMessage =
        `[sender.attachments] HTML attachments must specify htmlConvertTo format. ` +
        `Missing for file: ${filePath}`;
      throw new Error(errorMessage);
    }
    const rawHtml = renderTemplate<T>(templateData, filePath);
    const buffer = await htmlToBuffer(rawHtml, htmlConvertTo);
    return {
      filename: filename ?? inferFilename(filePath, htmlConvertTo),
      content: buffer,
      contentType: getMimeType(filePath, htmlConvertTo),
    };
  }
  let fileBuffer: Buffer;
  try {
    fileBuffer = fs.readFileSync(filePath);
  } catch {
    throw new Error(`[sender.attachments] Could not read file at: ${filePath}`);
  }

  return {
    filename: filename ?? inferFilename(filePath),
    content: fileBuffer,
    contentType: getMimeType(filePath),
  };
}

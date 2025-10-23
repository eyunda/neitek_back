import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.replace(/[/\\][^/\\]*$/, '');

export async function renderTemplate(templateName, vars = {}) {
  const tplPath = join(__dirname, '..', 'templates', templateName);
  let html = await readFile(tplPath, 'utf8');

  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`{{\\s*${escapeRegExp(k)}\\s*}}`, 'g');
    html = html.replace(re, v ?? '');
  }
  html = html.replace(/{{\s*[\w.-]+\s*}}/g, '');
  return html;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

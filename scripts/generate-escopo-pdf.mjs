/**
 * Gera docs/Escopo-politicos.pdf a partir do Markdown (Chrome headless).
 * Uso: node scripts/generate-escopo-pdf.mjs
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const mdPath = join(root, 'docs', 'Escopo-politicos.md')
const htmlPath = join(root, 'docs', '.escopo-pdf-temp.html')
const pdfPath = join(root, 'docs', 'Escopo-politicos.pdf')

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]

const chrome = chromePaths.find((p) => existsSync(p))
if (!chrome) {
  console.error('Chrome ou Edge não encontrado.')
  process.exit(1)
}

const md = readFileSync(mdPath, 'utf8')
marked.setOptions({ gfm: true, breaks: false })
const body = marked.parse(md)

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Strategos CRM — Escopo do Produto</title>
  <style>
    @page { margin: 18mm 16mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a1a;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }
    h1 { font-size: 1.65rem; border-bottom: 2px solid #2563eb; padding-bottom: 0.35em; margin-top: 0; }
    h2 { font-size: 1.25rem; color: #1e40af; margin-top: 1.6em; page-break-after: avoid; }
    h3 { font-size: 1.05rem; margin-top: 1.2em; page-break-after: avoid; }
    h4 { font-size: 0.95rem; page-break-after: avoid; }
    p, li { orphans: 3; widows: 3; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75em 0 1.25em;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #eff6ff; font-weight: 600; }
    tr:nth-child(even) td { background: #f8fafc; }
    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.88em;
      background: #f1f5f9;
      padding: 0.1em 0.35em;
      border-radius: 3px;
    }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    pre code { background: transparent; color: inherit; padding: 0; }
    blockquote {
      border-left: 4px solid #2563eb;
      margin: 1em 0;
      padding: 0.25em 0 0.25em 1em;
      color: #334155;
      background: #f8fafc;
    }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
    a { color: #2563eb; text-decoration: none; }
    ul, ol { padding-left: 1.4em; }
  </style>
</head>
<body>
${body}
</body>
</html>`

writeFileSync(htmlPath, html, 'utf8')

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/').replace(/ /g, '%20')

execFileSync(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    fileUrl,
  ],
  { stdio: 'inherit', timeout: 120_000 },
)

try {
  unlinkSync(htmlPath)
} catch {
  /* ignore */
}

console.log(`PDF gerado: ${pdfPath}`)

import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

const baseUrl = process.env.SIMULATOR_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1440, height:1000 } });

try {
  await page.goto(`${baseUrl}/modern.html`);
  await page.locator('#loading.hidden').waitFor({ timeout:45000 });
  const srcdoc = await page.locator('#simulatorFrame').getAttribute('srcdoc');
  if (!srcdoc) throw new Error('O iframe não contém srcdoc transformado.');

  const styleMatch = srcdoc.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) throw new Error('Não foi encontrado o CSS do simulador.');

  const scripts = [...srcdoc.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const runtimeMatch = scripts.at(-1);
  if (!runtimeMatch || !runtimeMatch[1].includes('new THREE.WebGLRenderer')) {
    throw new Error('Não foi encontrado o runtime principal do simulador.');
  }

  await mkdir('src/generated', { recursive:true });
  await writeFile('src/generated/simulator.css', styleMatch[1].trim() + '\n');
  await writeFile('src/generated/simulator-runtime.js', runtimeMatch[1].trim() + '\n');

  let html = srcdoc.replace(styleMatch[0], '<link rel="stylesheet" href="src/generated/simulator.css">');
  html = html.replace(runtimeMatch[0], '<script src="src/generated/simulator-runtime.js"><\/script>');
  html = html.replace('<title>Problemas do Dia a Dia em Rotogravura</title>', '<title>Rotogravure Lab · Simulador V2</title>');
  await writeFile('simulator-v2.html', html);

  console.log('V2 exportada para simulator-v2.html e src/generated/.');
} finally {
  await browser.close();
}

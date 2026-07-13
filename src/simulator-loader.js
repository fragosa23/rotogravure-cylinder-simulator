export async function loadSimulator(frame) {
  const response = await fetch('index.html', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Não foi possível carregar index.html (${response.status})`);

  let html = await response.text();
  html = html.replace(
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js'
  );
  html = html.replace('<head>', '<head><base href="./">');
  frame.srcdoc = html;
}

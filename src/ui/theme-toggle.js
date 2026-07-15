const STORAGE_KEY = 'rotosim-theme';

export function installThemeToggle() {
  const root = document.documentElement;
  const button = document.getElementById('themeToggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!button) return;

  function applyTheme(theme) {
    const dark = theme !== 'light';
    root.dataset.theme = dark ? 'dark' : 'light';
    button.textContent = dark ? '☀' : '☾';
    button.setAttribute('aria-pressed', String(!dark));
    button.setAttribute('aria-label', dark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
    button.title = dark ? 'Mudar para modo claro' : 'Mudar para modo escuro';
    if (themeMeta) themeMeta.content = dark ? '#0b111c' : '#f5f6f8';
  }

  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
  applyTheme(saved === 'light' ? 'light' : 'dark');

  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  });
}

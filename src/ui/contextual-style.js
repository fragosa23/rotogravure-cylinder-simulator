export function installContextualStyle() {
  if (document.getElementById('contextualEnhancementStyle')) return;
  const style = document.createElement('style');
  style.id = 'contextualEnhancementStyle';
  style.textContent = `
    .lock-accordion{border:1px solid var(--line);border-radius:14px;background:var(--surface-soft);overflow:hidden}
    .lock-accordion>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:58px;padding:12px 14px;cursor:pointer}
    .lock-accordion>summary::-webkit-details-marker{display:none}
    .lock-accordion>summary span,.lock-accordion>summary strong,.lock-accordion>summary small{display:block}
    .lock-accordion>summary strong{font-size:12px}
    .lock-accordion>summary small{margin-top:4px;color:var(--accent);font-size:10px;font-weight:700}
    .lock-accordion>summary i{font-style:normal;transition:transform .2s ease}
    .lock-accordion[open]>summary i{transform:rotate(180deg)}
    .lock-accordion .dock-lock-options{padding:0 10px 10px}
    .print-sample{display:grid;gap:10px;padding:13px;border:1px solid var(--line);border-radius:14px;background:var(--surface-soft)}
    .print-sample canvas{display:block;width:100%;height:auto;max-height:220px;object-fit:contain;border-radius:10px;background:#ece7db;border:1px solid var(--line)}
    @media(max-width:820px){.print-sample canvas{max-height:180px}.lock-accordion .dock-lock-options{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

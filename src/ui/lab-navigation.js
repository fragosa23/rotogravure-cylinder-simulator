export function installLabNavigation() {
  const body = document.body;
  const catalog = document.getElementById('catalogScreen');
  const lessons = document.getElementById('homeScreen');
  const workspace = document.querySelector('.workspace');
  const backTop = document.getElementById('backToCatalog');
  const backLesson = document.getElementById('lessonBack');
  const rotogravureButton = document.querySelector('[data-technology="rotogravure"]');

  if (!catalog || !lessons || !workspace || !rotogravureButton) return;

  function clearPhaseSelection() {
    document.querySelectorAll('[data-phase]').forEach((button) => {
      button.classList.remove('active');
      button.setAttribute('aria-current', 'false');
    });
  }

  function showCatalog() {
    body.classList.add('catalog-active');
    body.classList.remove('lessons-active', 'simulation-active');
    catalog.hidden = false;
    lessons.hidden = true;
    workspace.setAttribute('aria-hidden', 'true');
    backTop.hidden = true;
    clearPhaseSelection();
  }

  function showLessons() {
    body.classList.remove('catalog-active', 'simulation-active');
    body.classList.add('lessons-active');
    catalog.hidden = true;
    lessons.hidden = false;
    workspace.setAttribute('aria-hidden', 'true');
    backTop.hidden = false;
    clearPhaseSelection();
  }

  function showSimulation() {
    body.classList.remove('catalog-active', 'lessons-active');
    body.classList.add('simulation-active');
    catalog.hidden = true;
    lessons.hidden = true;
    workspace.setAttribute('aria-hidden', 'false');
    backTop.hidden = false;
  }

  rotogravureButton.addEventListener('click', showLessons);
  backTop?.addEventListener('click', showCatalog);
  backLesson?.addEventListener('click', showCatalog);
  document.querySelectorAll('[data-phase]').forEach((button) => {
    button.addEventListener('click', showSimulation);
  });

  window.__OBANIA_LAB_NAVIGATION__ = { showCatalog, showLessons, showSimulation };
  showCatalog();
}

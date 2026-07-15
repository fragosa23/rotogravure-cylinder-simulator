export function installLabNavigation() {
  const body = document.body;
  const catalog = document.getElementById('catalogScreen');
  const lessons = document.getElementById('homeScreen');
  const workspace = document.querySelector('.workspace');
  const brandHome = document.getElementById('brandHome');
  const rotogravureButton = document.querySelector('[data-technology="rotogravure"]');
  const lessonTopNavigation = document.getElementById('lessonTopNavigation');
  const backToLessons = document.getElementById('backToLessons');
  const nextLesson = document.getElementById('nextLesson');
  const lessonProgress = document.getElementById('lessonProgress');
  const sequence = ['assembly', 'machine', 'clog'];
  let currentPhase = null;

  if (!catalog || !lessons || !workspace || !rotogravureButton) return;

  function clearPhaseSelection() {
    document.querySelectorAll('[data-phase]').forEach((button) => {
      button.classList.remove('active');
      button.setAttribute('aria-current', 'false');
    });
  }

  function updateLessonNavigation(phase) {
    currentPhase = phase;
    const index = sequence.indexOf(phase);
    if (index < 0 || !lessonTopNavigation) return;
    lessonTopNavigation.hidden = false;
    if (lessonProgress) lessonProgress.textContent = `Lição ${index + 1} de ${sequence.length}`;
    if (nextLesson) nextLesson.textContent = index === sequence.length - 1 ? 'Concluir' : 'Próxima →';
  }

  function showCatalog() {
    currentPhase = null;
    body.classList.add('catalog-active');
    body.classList.remove('lessons-active', 'simulation-active');
    catalog.hidden = false;
    lessons.hidden = true;
    workspace.setAttribute('aria-hidden', 'true');
    if (lessonTopNavigation) lessonTopNavigation.hidden = true;
    clearPhaseSelection();
  }

  function showLessons() {
    currentPhase = null;
    body.classList.remove('catalog-active', 'simulation-active');
    body.classList.add('lessons-active');
    catalog.hidden = true;
    lessons.hidden = false;
    workspace.setAttribute('aria-hidden', 'true');
    if (lessonTopNavigation) lessonTopNavigation.hidden = true;
    clearPhaseSelection();
  }

  function showSimulation(phase) {
    body.classList.remove('catalog-active', 'lessons-active');
    body.classList.add('simulation-active');
    catalog.hidden = true;
    lessons.hidden = true;
    workspace.setAttribute('aria-hidden', 'false');
    updateLessonNavigation(phase);
  }

  function openPhase(phase) {
    const button = document.querySelector(`.phase-nav [data-phase="${phase}"]`);
    button?.click();
  }

  brandHome?.addEventListener('click', (event) => {
    event.preventDefault();
    showCatalog();
  });
  rotogravureButton.addEventListener('click', showLessons);
  backToLessons?.addEventListener('click', showLessons);
  nextLesson?.addEventListener('click', () => {
    const index = sequence.indexOf(currentPhase);
    if (index < 0 || index === sequence.length - 1) showLessons();
    else openPhase(sequence[index + 1]);
  });

  document.querySelectorAll('[data-phase]').forEach((button) => {
    button.addEventListener('click', () => showSimulation(button.dataset.phase));
  });

  window.__OBANIA_LAB_NAVIGATION__ = { showCatalog, showLessons, showSimulation, openPhase };
  showCatalog();
}
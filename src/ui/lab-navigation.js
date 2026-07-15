export function installLabNavigation() {
  const body = document.body;
  const catalog = document.getElementById('catalogScreen');
  const lessons = document.getElementById('homeScreen');
  const workspace = document.querySelector('.workspace');
  const backTop = document.getElementById('backToCatalog');
  const backLesson = document.getElementById('lessonBack');
  const rotogravureButton = document.querySelector('[data-technology="rotogravure"]');
  const lessonNavigation = document.getElementById('lessonNavigation');
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
    if (index < 0 || !lessonNavigation) return;
    lessonNavigation.hidden = false;
    if (lessonProgress) lessonProgress.textContent = `Lição ${index + 1} de ${sequence.length}`;
    if (nextLesson) nextLesson.textContent = index === sequence.length - 1 ? 'Concluir e voltar às lições' : 'Próxima lição →';
  }

  function showCatalog() {
    currentPhase = null;
    body.classList.add('catalog-active');
    body.classList.remove('lessons-active', 'simulation-active');
    catalog.hidden = false;
    lessons.hidden = true;
    workspace.setAttribute('aria-hidden', 'true');
    if (lessonNavigation) lessonNavigation.hidden = true;
    backTop.hidden = true;
    clearPhaseSelection();
  }

  function showLessons() {
    currentPhase = null;
    body.classList.remove('catalog-active', 'simulation-active');
    body.classList.add('lessons-active');
    catalog.hidden = true;
    lessons.hidden = false;
    workspace.setAttribute('aria-hidden', 'true');
    if (lessonNavigation) lessonNavigation.hidden = true;
    backTop.hidden = false;
    clearPhaseSelection();
  }

  function showSimulation(phase) {
    body.classList.remove('catalog-active', 'lessons-active');
    body.classList.add('simulation-active');
    catalog.hidden = true;
    lessons.hidden = true;
    workspace.setAttribute('aria-hidden', 'false');
    backTop.hidden = false;
    updateLessonNavigation(phase);
  }

  function openPhase(phase) {
    const button = document.querySelector(`.phase-nav [data-phase="${phase}"]`);
    button?.click();
  }

  rotogravureButton.addEventListener('click', showLessons);
  backTop?.addEventListener('click', showCatalog);
  backLesson?.addEventListener('click', showCatalog);
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
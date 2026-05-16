export const browserScript = `
(() => {
  const SETTINGS_KEY = 'differ:v1:settings';
  const FILE_PREFIX = 'differ:v1:file:';
  const root = document.documentElement;
  const cards = Array.from(document.querySelectorAll('.file-card'));

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // file:// storage can be unavailable; UI still works for current page.
    }
  }

  function setCollapsed(card, collapsed, persist = true) {
    card.classList.toggle('is-collapsed', collapsed);
    if (!persist) return;

    const checkbox = card.querySelector('.viewed-checkbox');
    if (checkbox.checked) return;

    const state = read(FILE_PREFIX + card.dataset.fileKey, {});
    write(FILE_PREFIX + card.dataset.fileKey, { ...state, viewed: false, collapsed });
  }

  function applyView(mode) {
    const next = mode === 'split' ? 'split' : 'unified';
    root.classList.toggle('view-unified', next === 'unified');
    root.classList.toggle('view-split', next === 'split');
    document.querySelectorAll('[data-view-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.viewMode === next);
    });
    write(SETTINGS_KEY, { viewMode: next });
  }

  cards.forEach((card) => {
    const state = read(FILE_PREFIX + card.dataset.fileKey, {});
    const checkbox = card.querySelector('.viewed-checkbox');
    checkbox.checked = state.viewed === true;
    card.classList.toggle('is-viewed', checkbox.checked);
    setCollapsed(card, checkbox.checked ? true : state.collapsed === true, false);

    card.querySelector('.file-header').addEventListener('click', () => {
      setCollapsed(card, !card.classList.contains('is-collapsed'));
    });

    card.querySelector('.viewed-control').addEventListener('click', (event) => {
      event.stopPropagation();
    });

    checkbox.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    checkbox.addEventListener('change', () => {
      const viewed = checkbox.checked;
      card.classList.toggle('is-viewed', viewed);
      write(FILE_PREFIX + card.dataset.fileKey, viewed ? { viewed: true } : { viewed: false, collapsed: false });
      setCollapsed(card, viewed, false);
    });
  });

  document.querySelector('[data-action="collapse-all"]').addEventListener('click', () => {
    cards.forEach((card) => setCollapsed(card, true));
  });

  document.querySelector('[data-action="expand-all"]').addEventListener('click', () => {
    cards.forEach((card) => setCollapsed(card, false));
  });

  document.querySelectorAll('[data-view-mode]').forEach((button) => {
    button.addEventListener('click', () => applyView(button.dataset.viewMode));
  });

  applyView(read(SETTINGS_KEY, {}).viewMode);
})();
`;

/**
 *
 * @param {['dark', 'light']} theme
 */
export function applyTheme(theme) {
  const element = document.documentElement;
  updateStyleHelper(theme, 'font-color', element);
  updateStyleHelper(theme, 'bg-color', element);
  updateStyleHelper(theme, 'bg-stronger-color', element);
}

function updateStyleHelper(theme, style, element) {
  element.style.setProperty(`--${style}`, `var(--${theme}-${style})`);
}

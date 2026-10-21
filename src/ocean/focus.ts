/** Keep screen-change focus for assistive technology without pointer-triggered rings. */
export function createScreenFocus() {
  // Without a known pointer interaction, leave the browser's keyboard heuristics intact.
  let keyboard = true;
  let automaticTarget: HTMLElement | undefined;
  const clear = () => {
    automaticTarget?.removeAttribute('data-pointer-focus');
    automaticTarget = undefined;
  };
  document.addEventListener('pointerdown', () => { keyboard = false; }, true);
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const control = event.target instanceof Element && event.target.matches('button, a, input, select, summary');
    // Steering keys also trigger native :focus-visible, but are not menu navigation.
    if (event.key !== 'Tab' && !(control && ['Enter', ' '].includes(event.key))) return;
    keyboard = true;
    clear();
  }, true);
  document.addEventListener('focusout', event => {
    if (event.target === automaticTarget) clear();
  });
  return (target: HTMLElement) => {
    clear();
    if (!keyboard) {
      automaticTarget = target;
      target.setAttribute('data-pointer-focus', '');
    }
    target.focus({ preventScroll: true });
  };
}

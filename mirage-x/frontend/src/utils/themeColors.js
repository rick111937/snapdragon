/**
 * Theme color helpers for HTML5 Canvas 2D contexts and WebGL shaders
 * where CSS variable syntax (e.g. 'var(--accent-cyan)' or 'rgba(var(--accent-rgb), 0.5)')
 * is not natively parseable by CanvasGradient.addColorStop or ctx.strokeStyle.
 */

export function getCanvasColor(alpha = 1) {
  if (typeof document === 'undefined') return `rgba(245, 158, 11, ${alpha})`;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '245, 158, 11';
    return `rgba(${raw}, ${alpha})`;
  } catch {
    return `rgba(245, 158, 11, ${alpha})`;
  }
}

export function getCanvasHex() {
  if (typeof document === 'undefined') return '#f59e0b';
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '245, 158, 11';
    return `rgb(${raw})`;
  } catch {
    return '#f59e0b';
  }
}

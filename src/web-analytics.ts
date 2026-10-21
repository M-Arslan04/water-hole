import type { BeforeSendEvent } from '@vercel/analytics';

const website = 'https://water-hole.vercel.app';
let started = false;

function safeReferrer() {
  // beforeSend can redact the page URL, but the SDK handles document.referrer separately.
  // Skip collection if that referrer could carry private query/fragment values.
  if (!document.referrer) return true;
  try {
    const url = new URL(document.referrer);
    return !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}

function pageViewOnly(event: BeforeSendEvent): BeforeSendEvent | null {
  if (event.type !== 'pageview' || !safeReferrer()) return null;
  try {
    const url = new URL(event.url);
    if (url.origin !== website || !['/', '/index.html'].includes(url.pathname)) return null;
    // The site is one page. Never forward query strings, fragments or custom payloads.
    return { type: 'pageview', url: `${website}/` };
  } catch { return null; }
}

export async function initWebAnalytics() {
  if (started || location.origin !== website || !['/', '/index.html'].includes(location.pathname) ||
      navigator.webdriver || /Headless/i.test(navigator.userAgent) || !safeReferrer()) return;
  started = true;
  try {
    const { inject } = await import('@vercel/analytics');
    inject({ mode: 'production', debug: false, beforeSend: pageViewOnly });
  } catch { /* Offline, blocked or failed analytics never affects gameplay. */ }
}

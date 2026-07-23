/*
  Lightweight conversion tracking for secondary public pages.
  The homepage has its richer interaction script; this file keeps
  crawlable content pages measurable without loading homepage behavior.
*/
const analyticsSite = window.SMABBLEZ_SITE || {};
const analyticsEndpoint = analyticsSite.analytics?.endpoint?.trim();
const socialHosts = {
  twitch: 'twitch.tv',
  tiktok: 'tiktok.com',
  discord: 'discord.gg',
  spotify: 'open.spotify.com',
  youtube: 'youtube.com'
};

const getAttribution = () => {
  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries(['source', 'medium', 'campaign', 'content', 'term']
    .map((key) => [`utm_${key}`, params.get(`utm_${key}`)?.slice(0, 160) || ''])
    .filter(([, value]) => value));
  let referrerOrigin = '';
  try {
    referrerOrigin = document.referrer ? new URL(document.referrer).origin : '';
  } catch {
    referrerOrigin = '';
  }
  return {
    source: utm.utm_source ? 'utm' : (referrerOrigin ? 'referral' : 'direct'),
    ...utm,
    referrerOrigin
  };
};
const sendAnalyticsEvent = (body) => {
  if (!analyticsEndpoint) return;
  try {
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(analyticsEndpoint, new Blob([body], { type: 'application/json' }))) return;
  } catch {}
  fetch(analyticsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
};

const trackConversion = (detail) => {
  const enriched = {
    ...detail,
    page: detail.page || window.location.pathname,
    timestamp: detail.timestamp || new Date().toISOString(),
    attribution: detail.attribution || getAttribution()
  };
  const payload = JSON.stringify(enriched);
  window.dispatchEvent(new CustomEvent('smabblez:conversion', { detail: enriched }));
  sendAnalyticsEvent(payload);
};

window.SMABBLEZ_ANALYTICS = { track: trackConversion };

const getLabel = (link, destination) => {
  const explicit = link.dataset.track || link.dataset.social || link.dataset.content;
  if (explicit) return explicit;
  return Object.entries(socialHosts).find(([, host]) => destination.hostname === host || destination.hostname.endsWith(`.${host}`))?.[0] || '';
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const destination = new URL(link.href, window.location.href);
  const label = getLabel(link, destination);
  if (!label) return;
  const detail = {
    event: 'outbound_click',
    label,
    destination: `${destination.origin}${destination.pathname}`,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
    attribution: getAttribution()
  };
  trackConversion(detail);
});

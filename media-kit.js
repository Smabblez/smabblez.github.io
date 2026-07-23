const printKitButton = document.querySelector('[data-print-kit]');
const copyKitButton = document.querySelector('[data-copy-kit]');
const copyKitStatus = document.querySelector('[data-copy-kit-status], #kit-copy-status');

const kitShareUrl = () => {
  const configuredSiteUrl = window.SMABBLEZ_SITE?.siteUrl;
  try {
    return new URL('media-kit.html', configuredSiteUrl ? `${configuredSiteUrl.replace(/\/$/, '')}/` : window.location.href).href;
  } catch {
    return window.location.href.split('#')[0];
  }
};

const fallbackCopy = (value) => {
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch {}
  field.remove();
  return copied;
};

copyKitButton?.addEventListener('click', async () => {
  const value = kitShareUrl();
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      copied = true;
    }
  } catch {}
  if (!copied) copied = fallbackCopy(value);
  if (copied) window.SMABBLEZ_ANALYTICS?.track({ event: 'media_kit_copy_link', label: 'media-kit-copy', destination: value });
  if (copyKitStatus) copyKitStatus.textContent = copied ? 'Kit link copied.' : 'Copy unavailable — copy the page URL from your browser.';
  if (copied) window.setTimeout(() => { if (copyKitStatus) copyKitStatus.textContent = ''; }, 3000);
});

printKitButton?.addEventListener('click', () => window.print());

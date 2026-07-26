document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menuLabel = document.querySelector('[data-menu-label]');
const menuCurrent = document.querySelector('[data-menu-current]');
const nav = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
const siteConfig = window.SMABBLEZ_SITE || {};
const root = document.documentElement;
const body = document.body;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentSectionName = 'Home';

Object.entries(siteConfig.socials || {}).forEach(([name, url]) => {
  if (!url) return;
  document.querySelectorAll(`[data-social="${name}"]`).forEach((link) => { link.href = url; });
});

Object.entries(siteConfig.content || {}).forEach(([name, url]) => {
  if (!url) return;
  document.querySelectorAll(`[data-content="${name}"]`).forEach((link) => { link.href = url; });
});

const twitchPlayer = document.querySelector('[data-twitch-player]');
if (twitchPlayer) {
  const twitchChannel = siteConfig.brand?.twitchChannel || 'smabblez';
  const twitchParent = window.location.hostname || 'localhost';
  const loadTwitchPlayer = () => {
    if (twitchPlayer.src) return;
    twitchPlayer.src = `https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&parent=${encodeURIComponent(twitchParent)}&autoplay=false&muted=true`;
  };
  if ('IntersectionObserver' in window) {
    const twitchObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadTwitchPlayer();
      twitchObserver.disconnect();
    }, { rootMargin: '80px 0px' });
    twitchObserver.observe(twitchPlayer);
  } else {
    loadTwitchPlayer();
  }
}

const scheduleRoot = document.querySelector('[data-twitch-schedule]');
const scheduleList = document.querySelector('[data-schedule-list]');
const scheduleStatus = document.querySelector('[data-schedule-status]');
const scheduleDayOrder = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const scheduleDayLabels = { SU: 'SUN', MO: 'MON', TU: 'TUE', WE: 'WED', TH: 'THU', FR: 'FRI', SA: 'SAT' };

const scheduleClock = (value) => {
  const [hours = 0, minutes = 0] = String(value || '').split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${hour}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''} ${suffix}`;
};

const timeZoneParts = (date, timeZone) => Object.fromEntries(
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
);

const scheduleDayCode = (shortDay) => Object.entries(scheduleDayLabels)
  .find(([, label]) => label.startsWith(String(shortDay || '').toUpperCase().slice(0, 2)))?.[0];

const renderSchedule = (payload) => {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  if (!scheduleList || !events.length) throw new Error('No scheduled streams are available.');
  const timeZone = payload.timezone || siteConfig.schedule?.timezone || 'America/Chicago';
  const now = new Date();
  const nowParts = timeZoneParts(now, timeZone);
  const todayCode = scheduleDayCode(nowParts.weekday);
  const todayIndex = scheduleDayOrder.indexOf(todayCode);
  const nowMinutes = Number(nowParts.hour) * 60 + Number(nowParts.minute);
  const upcoming = events.map((event) => {
    const eventIndex = scheduleDayOrder.indexOf(event.day);
    const [endHour = 0, endMinute = 0] = String(event.end || '').split(':').map(Number);
    let daysAway = (eventIndex - todayIndex + 7) % 7;
    if (daysAway === 0 && endHour * 60 + endMinute <= nowMinutes) daysAway = 7;
    return { ...event, daysAway };
  }).sort((left, right) => left.daysAway - right.daysAway || left.start.localeCompare(right.start)).slice(0, 5);

  const fragment = document.createDocumentFragment();
  upcoming.forEach((event, index) => {
    const streamDate = new Date(now.getTime() + event.daysAway * 86400000);
    const dateLabel = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric'
    }).format(streamDate).toUpperCase();
    const card = document.createElement('li');
    card.className = 'schedule-card';
    if (index === 0) card.setAttribute('aria-label', 'Next scheduled stream');

    const date = document.createElement('span');
    date.className = 'schedule-date';
    const day = document.createElement('strong');
    day.textContent = scheduleDayLabels[event.day] || event.day;
    const calendarDate = document.createElement('small');
    calendarDate.textContent = dateLabel;
    date.append(day, calendarDate);

    const show = document.createElement('span');
    show.className = 'schedule-show';
    const title = document.createElement('strong');
    title.textContent = event.title || event.category || 'Live on Twitch';
    const source = document.createElement('small');
    source.className = index === 0 ? 'schedule-next' : '';
    source.textContent = index === 0 ? 'Next show' : 'Twitch schedule';
    show.append(title, source);

    const time = document.createElement('span');
    time.className = 'schedule-time';
    time.textContent = `${scheduleClock(event.start)} – ${scheduleClock(event.end)}`;
    card.append(date, show, time);
    fragment.append(card);
  });
  scheduleList.replaceChildren(fragment);
  const refreshHours = payload.refreshHours || siteConfig.schedule?.refreshHours || 6;
  scheduleStatus.textContent = `This board follows the schedule I keep on Twitch and refreshes every ${refreshHours} hours.`;
  scheduleRoot.dataset.scheduleState = 'ready';
};

const loadSchedule = async () => {
  if (!scheduleRoot || scheduleRoot.dataset.scheduleState === 'loading' || scheduleRoot.dataset.scheduleState === 'ready') return;
  scheduleRoot.dataset.scheduleState = 'loading';
  try {
    const response = await fetch(siteConfig.schedule?.feed || 'schedule.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
    renderSchedule(await response.json());
  } catch {
    scheduleRoot.dataset.scheduleState = 'fallback';
    scheduleStatus.textContent = 'The board missed its cue. My official Twitch schedule is still available below.';
  }
};

if (scheduleRoot) {
  if ('IntersectionObserver' in window) {
    const scheduleObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadSchedule();
      scheduleObserver.disconnect();
    }, { rootMargin: '240px 0px' });
    scheduleObserver.observe(scheduleRoot);
  } else {
    loadSchedule();
  }
}

const soundPrompt = document.querySelector('[data-sound-prompt]');
const soundToggle = document.querySelector('[data-sound-toggle]');
const soundSkip = document.querySelector('[data-sound-skip]');
const soundPrevious = document.querySelector('[data-sound-previous]');
const soundVolume = document.querySelector('[data-sound-volume]');
const soundDismiss = document.querySelector('[data-sound-dismiss]');
const soundRestore = document.querySelector('[data-sound-restore]');
const soundStatus = document.querySelector('[data-sound-status]');
const soundTrack = document.querySelector('[data-sound-track]');
const soundArt = document.querySelector('[data-sound-art]');
const soundProgress = document.querySelector('[data-sound-progress]');
const soundAudio = document.querySelector('[data-sound-audio]');
const soundVolumeIcon = document.querySelector('[data-sound-volume-icon]');
const soundVolumeValue = document.querySelector('[data-sound-volume-value]');
const spotifyTracks = (siteConfig.music?.spotifyTracks || []).filter((track) => track.preview);
let currentTrackIndex = 0;
let loadedTrackIndex = -1;

const setSoundState = (playing, message = playing ? 'Preview playing' : 'Preview ready') => {
  soundStatus.textContent = message;
  const action = playing ? 'Pause soundtrack' : 'Play soundtrack';
  soundToggle.textContent = playing ? '\u2161' : '\u25B6';
  soundToggle.setAttribute('aria-label', action);
  soundToggle.title = action;
  soundToggle.setAttribute('aria-pressed', String(playing));
};

const updateVolumeUI = () => {
  const percent = Math.round(soundAudio.volume * 100);
  soundAudio.dataset.volume = String(percent);
  soundVolume.value = String(percent);
  soundVolume.style.setProperty('--volume-level', `${percent}%`);
  soundVolumeValue.textContent = `${percent}%`;
  soundVolumeIcon.textContent = percent === 0 ? '\u{1F507}' : percent < 50 ? '\u{1F509}' : '\u{1F50A}';
};

const updateTrackInfo = () => {
  const track = spotifyTracks[currentTrackIndex];
  if (!track) return;
  soundTrack.textContent = track.title;
  soundArt.href = track.url || siteConfig.socials?.spotify || soundArt.href;
  if (track.art) {
    soundArt.style.backgroundImage = `url("${track.art}")`;
    soundArt.classList.add('has-cover');
  }
};

const loadCurrentTrack = (reset = true) => {
  const track = spotifyTracks[currentTrackIndex];
  if (!track) return false;
  updateTrackInfo();
  if (loadedTrackIndex !== currentTrackIndex) {
    soundAudio.src = track.preview;
    loadedTrackIndex = currentTrackIndex;
  } else if (reset) {
    soundAudio.currentTime = 0;
  }
  soundProgress.style.width = '0%';
  return true;
};

const playCurrentTrack = async () => {
  if (loadedTrackIndex !== currentTrackIndex && !loadCurrentTrack(false)) return;
  try {
    await soundAudio.play();
    delete soundAudio.dataset.playError;
  } catch (error) {
    soundAudio.dataset.playError = error?.name || 'PlaybackError';
    setSoundState(false, 'Tap play to listen');
  }
};

const changeTrack = (direction, keepPlaying = !soundAudio.paused) => {
  if (!spotifyTracks.length) return;
  currentTrackIndex = (currentTrackIndex + direction + spotifyTracks.length) % spotifyTracks.length;
  loadCurrentTrack();
  if (keepPlaying) playCurrentTrack();
  else setSoundState(false, direction > 0 ? 'Next preview ready' : 'Previous preview ready');
};

soundToggle.addEventListener('click', () => {
  if (!soundAudio.paused) soundAudio.pause();
  else playCurrentTrack();
});

soundSkip.addEventListener('click', () => changeTrack(1));
soundPrevious.addEventListener('click', () => {
  if (loadedTrackIndex === currentTrackIndex && soundAudio.currentTime > 3) {
    soundAudio.currentTime = 0;
    soundProgress.style.width = '0%';
    setSoundState(!soundAudio.paused, 'Preview restarted');
    return;
  }
  changeTrack(-1);
});
soundVolume.addEventListener('input', () => {
  soundAudio.volume = Math.min(1, Math.max(0, Number(soundVolume.value) / 100));
  updateVolumeUI();
  try { window.localStorage.setItem('smabblez-player-volume', soundVolume.value); } catch {}
});

soundAudio.addEventListener('play', () => setSoundState(true));
soundAudio.addEventListener('pause', () => {
  if (!soundAudio.ended) setSoundState(false, 'Paused');
});
soundAudio.addEventListener('timeupdate', () => {
  const progress = soundAudio.duration > 0 ? (soundAudio.currentTime / soundAudio.duration) * 100 : 0;
  soundProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
});
soundAudio.addEventListener('ended', () => changeTrack(1, true));
soundAudio.addEventListener('error', () => {
  setSoundState(false, 'Preview unavailable — open Spotify');
});

const setSoundCollapsed = (collapsed) => {
  soundPrompt.classList.toggle('collapsed', collapsed);
  soundPrompt.setAttribute('aria-label', collapsed ? 'Smabblez soundtrack player, minimized' : 'Smabblez soundtrack preview controls');
  try { window.localStorage.setItem('smabblez-player-collapsed', String(collapsed)); } catch {}
};

soundDismiss.addEventListener('click', () => setSoundCollapsed(true));
soundRestore.addEventListener('click', () => {
  setSoundCollapsed(false);
  updateTrackInfo();
});

let playerStartsCollapsed = true;
try {
  const savedPlayerState = window.localStorage.getItem('smabblez-player-collapsed');
  playerStartsCollapsed = savedPlayerState !== 'false';
  setSoundCollapsed(playerStartsCollapsed);
} catch {
  setSoundCollapsed(true);
}

try {
  const savedVolume = window.localStorage.getItem('smabblez-player-volume');
  const savedVolumeNumber = Number(savedVolume);
  soundAudio.volume = savedVolume !== null && Number.isFinite(savedVolumeNumber)
    ? Math.min(1, Math.max(0, savedVolumeNumber / 100))
    : .72;
} catch {
  soundAudio.volume = .72;
}

updateVolumeUI();
if (!playerStartsCollapsed) updateTrackInfo();
const hasPlayableTracks = spotifyTracks.length > 0;
soundToggle.disabled = !hasPlayableTracks;
soundSkip.disabled = !hasPlayableTracks;
soundPrevious.disabled = !hasPlayableTracks;
soundVolume.disabled = !hasPlayableTracks;
setSoundState(false, hasPlayableTracks ? 'Press play for preview' : 'Previews unavailable');

const discordPreview = document.querySelector('[data-discord-preview]');
const discordOnline = document.querySelector('[data-discord-online]');
const discordMembers = document.querySelector('[data-discord-members]');
const discordInviteCode = siteConfig.community?.discordInviteCode;

const loadDiscordPreview = () => {
  if (!discordPreview || !discordInviteCode || discordPreview.dataset.loaded === 'true') return;
  discordPreview.dataset.loaded = 'true';
  fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(discordInviteCode)}?with_counts=true`)
    .then((response) => {
      if (!response.ok) throw new Error('Discord preview unavailable');
      return response.json();
    })
    .then((invite) => {
      const online = Number(invite.approximate_presence_count ?? invite.profile?.online_count);
      const members = Number(invite.approximate_member_count ?? invite.profile?.member_count);
      if (Number.isFinite(online)) discordOnline.textContent = online.toLocaleString();
      if (Number.isFinite(members)) discordMembers.textContent = members.toLocaleString();
      discordPreview.title = `${invite.guild?.name || 'The Clown Tent'} community snapshot`;
    })
    .catch(() => {
      discordOnline.textContent = 'See who is';
      discordMembers.textContent = 'Meet the';
    });
};

if (discordPreview && discordInviteCode) {
  const followSection = document.querySelector('#follow');
  if ('IntersectionObserver' in window && followSection) {
    const discordObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadDiscordPreview();
      discordObserver.disconnect();
    }, { rootMargin: '220px 0px' });
    discordObserver.observe(followSection);
  } else {
    loadDiscordPreview();
  }
}

const analyticsEndpoint = siteConfig.analytics?.endpoint?.trim();
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
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const label = link.dataset.track || link.dataset.social || link.dataset.content;
  if (!label) return;
  const destination = new URL(link.href, window.location.href);
  const detail = {
    event: 'outbound_click',
    label,
    destination: `${destination.origin}${destination.pathname}`,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
    attribution: getAttribution()
  };
  window.dispatchEvent(new CustomEvent('smabblez:conversion', { detail }));
  sendAnalyticsEvent(JSON.stringify(detail));
});

const syncScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 18);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  root.style.setProperty('--scroll-progress', progress.toFixed(4));
};

let scrollFrame = 0;
const requestScrollSync = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    syncScroll();
    scrollFrame = 0;
  });
};
syncScroll();
window.addEventListener('scroll', requestScrollSync, { passive: true });
window.addEventListener('resize', requestScrollSync, { passive: true });

const setMenuOpen = (open, { returnFocus = false } = {}) => {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close sections menu' : 'Open sections menu');
  menuLabel.textContent = open ? 'Close sections menu' : 'Open sections menu';
  menuCurrent.textContent = open ? 'Close' : currentSectionName;
  nav.classList.toggle('open', open);
  if (returnFocus) menuButton.focus();
};

menuButton.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
navLinks.forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

document.addEventListener('pointerdown', (event) => {
  if (menuButton.getAttribute('aria-expanded') !== 'true') return;
  if (nav.contains(event.target) || menuButton.contains(event.target)) return;
  setMenuOpen(false);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false, { returnFocus: true });
  }
});

const chaosFlash = document.querySelector('.chaos-flash');
const modeStatus = document.querySelector('[data-mode-status]');
const chaosCharacter = document.querySelector('[data-chaos-character]');
const chaosSupportArt = [...document.querySelectorAll('[data-chaos-support]')];
const heroCharacter = document.querySelector('.hero-character');
const honkButton = document.querySelector('[data-honk]');
const chaosKicker = document.querySelector('[data-chaos-kicker]');
const chaosTitle = document.querySelector('[data-chaos-title]');
const chaosHint = document.querySelector('[data-chaos-hint]');
const cueDeck = document.querySelector('[data-cue-deck]');
const cueButtons = [...document.querySelectorAll('[data-show-cue]')];
const cueMonitor = document.querySelector('[data-cue-monitor]');
const cueStatus = document.querySelector('[data-cue-status]');
const sparkColors = ['#ff2638', '#ffd42f', '#f6f1e7'];
const chaosWords = ['HONK!', 'BONK!', 'NO BRAKES', 'CHAT DID IT', 'GTA MOMENT', 'WHOOPS'];
const chaosHints = ['CLICK SOMETHING DUMB', 'THE PLAN IS GONE', 'CHAT HAS THE WHEEL', 'THIS SEEMED FUNNY', 'NO REFUNDS'];
const cueResponses = {
  jumpscare: { monitor: 'Lights out', sticker: 'BOO!', status: 'Jumpscare armed. I immediately regret giving you that one.' },
  redeem: { monitor: 'Redeemed', sticker: 'REDEEMED!', status: 'Redeem accepted. The plan has been made noticeably worse.' },
  wildcard: { monitor: 'Plot twist', sticker: 'PLOT TWIST!', status: 'RP wild card played. Whatever was supposed to happen is gone.' },
  honk: { monitor: 'Honk confirmed', sticker: 'HONK!', status: 'Honk confirmed. A timeless and responsible use of technology.' }
};
let chaosClicks = 0;
let cueResetTimer = 0;

const makeSparks = (x, y, amount = 24) => {
  if (reduceMotion) return;
  for (let index = 0; index < amount; index += 1) {
    const spark = document.createElement('i');
    const angle = (Math.PI * 2 * index) / amount;
    const distance = 60 + Math.random() * 140;
    spark.className = 'spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--spark-color', sparkColors[index % sparkColors.length]);
    body.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove());
  }
};

const dropChaosSticker = (x, y, word = chaosWords[Math.floor(Math.random() * chaosWords.length)]) => {
  if (reduceMotion) return;
  const sticker = document.createElement('span');
  sticker.className = 'chaos-sticker';
  sticker.textContent = word;
  sticker.style.left = `${x}px`;
  sticker.style.top = `${y}px`;
  sticker.style.setProperty('--sticker-color', sparkColors[Math.floor(Math.random() * (sparkColors.length - 1))]);
  sticker.style.setProperty('--sticker-rotate', `${-14 + Math.random() * 28}deg`);
  body.appendChild(sticker);
  sticker.addEventListener('animationend', () => sticker.remove());
};

const broadcastChaos = () => {
  const word = chaosWords[Math.floor(Math.random() * chaosWords.length)];
  if (chaosKicker) chaosKicker.textContent = 'THE TENT IS TILTING';
  if (chaosTitle) chaosTitle.textContent = word;
  if (chaosHint) chaosHint.textContent = chaosHints[Math.floor(Math.random() * chaosHints.length)];
  chaosFlash.classList.remove('play');
  void chaosFlash.offsetWidth;
  chaosFlash.classList.add('play');
  window.setTimeout(() => chaosFlash.classList.remove('play'), 700);
  [[.2,.24],[.8,.22],[.24,.74],[.76,.7]].forEach(([x, y], index) => {
    window.setTimeout(() => {
      makeSparks(window.innerWidth * x, window.innerHeight * y, 8);
      dropChaosSticker(window.innerWidth * x, window.innerHeight * y, chaosWords[index]);
    }, index * 65);
  });
};

const honkNose = () => {
  if (!honkButton) return;
  const rect = honkButton.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  makeSparks(x, y, 18);
  dropChaosSticker(x, y, 'HONK!');
  heroCharacter?.classList.remove('honked');
  void heroCharacter?.offsetWidth;
  heroCharacter?.classList.add('honked');
  window.setTimeout(() => heroCharacter?.classList.remove('honked'), 460);
  modeStatus.textContent = 'Honk! You found Smabblez\'s nose.';
};

cueButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const cue = button.dataset.showCue;
    const response = cueResponses[cue];
    if (!cueDeck || !response) return;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    window.clearTimeout(cueResetTimer);
    cueButtons.forEach((item) => item.classList.remove('fired'));
    cueDeck.classList.remove('fired');
    cueDeck.dataset.activeCue = cue;
    button.classList.add('fired');
    void cueDeck.offsetWidth;
    cueDeck.classList.add('fired');
    cueMonitor.textContent = response.monitor;
    cueStatus.textContent = response.status;
    makeSparks(x, y, cue === 'jumpscare' ? 18 : 12);
    dropChaosSticker(x, y, response.sticker);

    heroCharacter?.classList.remove('honked');
    void heroCharacter?.offsetWidth;
    heroCharacter?.classList.add('honked');
    window.setTimeout(() => heroCharacter?.classList.remove('honked'), 460);

    cueResetTimer = window.setTimeout(() => {
      cueDeck.classList.remove('fired');
      button.classList.remove('fired');
      cueMonitor.textContent = 'Standby';
    }, 1500);
  });
});

honkButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  const active = !body.classList.contains('chaos-on');
  honkNose();
  setChaos(active);
});

const setChaos = (active) => {
  body.classList.toggle('chaos-on', active);
  honkButton?.setAttribute('aria-pressed', String(active));
  honkButton?.setAttribute('aria-label', active ? "Honk Smabblez's nose to turn off Chaos Mode" : "Honk Smabblez's nose to turn on Chaos Mode");
  modeStatus.textContent = active ? 'Chaos mode enabled. Click the page to drop chaos.' : 'Chaos mode disabled.';
  chaosCharacter.src = active ? chaosCharacter.dataset.chaosSrc : chaosCharacter.dataset.normalSrc;
  chaosSupportArt.forEach((image) => {
    image.src = active ? image.dataset.chaosSrc : image.dataset.normalSrc;
  });
  chaosClicks = 0;
  if (active) broadcastChaos();
  else {
    if (chaosKicker) chaosKicker.textContent = 'THE TENT IS QUIET';
    if (chaosTitle) chaosTitle.textContent = 'CHAOS MODE';
    if (chaosHint) chaosHint.textContent = 'HONK TO BRING IT BACK';
  }
};

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('chaos-on')) setChaos(false);
});

document.addEventListener('click', (event) => {
  if (!body.classList.contains('chaos-on') || event.target.closest('a,button,input,label')) return;
  chaosClicks += 1;
  const word = chaosWords[chaosClicks % chaosWords.length];
  makeSparks(event.clientX, event.clientY, 12);
  dropChaosSticker(event.clientX, event.clientY, word);
  heroCharacter?.classList.remove('honked');
  void heroCharacter?.offsetWidth;
  heroCharacter?.classList.add('honked');
  window.setTimeout(() => heroCharacter?.classList.remove('honked'), 460);
  modeStatus.textContent = `Chaos click ${chaosClicks}: ${word}`;
});

if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
  const cursorNose = document.querySelector('.cursor-nose');
  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--cursor-x', `${event.clientX}px`);
    root.style.setProperty('--cursor-y', `${event.clientY}px`);
    cursorNose.classList.add('visible');
  }, { passive: true });
  document.addEventListener('pointerover', (event) => {
    cursorNose.classList.toggle('hot', Boolean(event.target.closest('a,button,input,label')));
  }, { passive: true });
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) cursorNose.classList.remove('visible');
    if (!event.relatedTarget?.closest?.('a,button,input,label')) cursorNose.classList.remove('hot');
  }, { passive: true });

  document.querySelectorAll('.social-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--glare-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--glare-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      card.style.setProperty('--glare-opacity', '.72');
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--glare-opacity', '0');
    }, { passive: true });
  });
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
  document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const matches = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', matches);
        if (matches) {
          link.setAttribute('aria-current', 'page');
          currentSectionName = link.dataset.sectionName || 'Sections';
          if (menuButton.getAttribute('aria-expanded') !== 'true') menuCurrent.textContent = currentSectionName;
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-35% 0px -55%', threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));
} else {
  document.querySelectorAll('.reveal').forEach((item) => item.classList.add('in-view'));
}

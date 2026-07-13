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
  twitchPlayer.src = `https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&parent=${encodeURIComponent(twitchParent)}&autoplay=false&muted=true`;
}

const soundPrompt = document.querySelector('[data-sound-prompt]');
const soundToggle = document.querySelector('[data-sound-toggle]');
const soundSkip = document.querySelector('[data-sound-skip]');
const soundPrevious = document.querySelector('[data-sound-previous]');
const soundDismiss = document.querySelector('[data-sound-dismiss]');
const soundRestore = document.querySelector('[data-sound-restore]');
const soundStatus = document.querySelector('[data-sound-status]');
const soundTrack = document.querySelector('[data-sound-track]');
const soundArt = document.querySelector('[data-sound-art]');
const soundProgress = document.querySelector('[data-sound-progress]');
const spotifyEmbed = document.querySelector('[data-spotify-embed]');
const spotifyArtistUri = 'spotify:artist:1JiqQUYL0EA1h3jVQIRQtg';
const spotifyTracks = siteConfig.music?.spotifyTracks || [];
let spotifyController = null;
let spotifyPlaying = false;
let spotifyPlayRequested = false;
let spotifyAwaitingStart = false;
let spotifyHasStarted = false;
let spotifyCurrentUri = spotifyArtistUri;
let spotifyCurrentPosition = 0;
let spotifyInfoUri = '';
let spotifyPlaybackTimer = 0;

const syncSpotifyTrackInfo = async (uri) => {
  if (!uri?.startsWith('spotify:track:') || uri === spotifyInfoUri) return;
  spotifyInfoUri = uri;
  const trackId = uri.split(':').pop();
  const trackUrl = `https://open.spotify.com/track/${trackId}`;

  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`);
    if (!response.ok) return;
    const metadata = await response.json();
    soundTrack.textContent = metadata.title || 'Smabblez soundtrack';
    soundArt.href = trackUrl;
    if (metadata.thumbnail_url) {
      soundArt.style.backgroundImage = `url("${metadata.thumbnail_url}")`;
      soundArt.classList.add('has-cover');
    }
  } catch {
    soundTrack.textContent = 'Smabblez soundtrack';
  }
};

const setSoundState = (playing, message = playing ? 'Soundtrack playing' : 'Soundtrack ready') => {
  spotifyPlaying = playing;
  soundStatus.textContent = message;
  const action = playing ? 'Pause soundtrack' : 'Play soundtrack';
  soundToggle.textContent = playing ? 'Ⅱ' : '▶';
  soundToggle.setAttribute('aria-label', action);
  soundToggle.title = action;
  soundToggle.setAttribute('aria-pressed', String(playing));
};

const requestSpotifyPlayback = () => {
  if (!spotifyController) return;
  spotifyPlayRequested = true;
  spotifyAwaitingStart = true;
  window.clearTimeout(spotifyPlaybackTimer);
  setSoundState(true, 'Connecting…');
  if (spotifyHasStarted && spotifyCurrentUri !== spotifyArtistUri) {
    spotifyController.loadEntity(spotifyCurrentUri, false, Math.floor(spotifyCurrentPosition / 1000));
    spotifyController.play();
  } else {
    spotifyController.play();
  }
  spotifyPlaybackTimer = window.setTimeout(() => {
    if (!spotifyAwaitingStart) return;
    spotifyPlayRequested = false;
    spotifyAwaitingStart = false;
    setSoundState(false, 'Tap to start the soundtrack');
  }, 1800);
};

const changeSpotifyTrack = (direction) => {
  if (!spotifyController || !spotifyTracks.length) return;
  const currentIndex = spotifyTracks.findIndex((track) => track.uri === spotifyCurrentUri);
  const nextIndex = currentIndex < 0
    ? (direction > 0 ? 0 : spotifyTracks.length - 1)
    : (currentIndex + direction + spotifyTracks.length) % spotifyTracks.length;
  const nextTrack = spotifyTracks[nextIndex];
  spotifyCurrentUri = nextTrack.uri;
  spotifyCurrentPosition = 0;
  spotifyHasStarted = true;
  spotifyPlayRequested = true;
  spotifyAwaitingStart = true;
  spotifyInfoUri = '';
  soundTrack.textContent = nextTrack.title;
  soundProgress.style.width = '0%';
  soundSkip.disabled = true;
  soundPrevious.disabled = true;
  setSoundState(true, direction > 0 ? 'Skipping…' : 'Going back…');
  syncSpotifyTrackInfo(nextTrack.uri);
  spotifyController.loadEntity(nextTrack.uri, false, 0);
  spotifyController.play();
};

soundToggle.addEventListener('click', () => {
  if (!spotifyController) return;
  if (spotifyPlaying) {
    spotifyPlayRequested = false;
    spotifyAwaitingStart = false;
    setSoundState(false, 'Paused');
    spotifyController.pause();
  } else {
    requestSpotifyPlayback();
  }
});

soundSkip.addEventListener('click', () => changeSpotifyTrack(1));
soundPrevious.addEventListener('click', () => changeSpotifyTrack(-1));

const setSoundCollapsed = (collapsed) => {
  soundPrompt.classList.toggle('collapsed', collapsed);
  soundPrompt.setAttribute('aria-label', collapsed ? 'Smabblez soundtrack player, minimized' : 'Spotify soundtrack controls');
  try { window.localStorage.setItem('smabblez-player-collapsed', String(collapsed)); } catch {}
};

soundDismiss.addEventListener('click', () => setSoundCollapsed(true));
soundRestore.addEventListener('click', () => setSoundCollapsed(false));

try {
  const savedPlayerState = window.localStorage.getItem('smabblez-player-collapsed');
  setSoundCollapsed(savedPlayerState !== 'false');
} catch {
  setSoundCollapsed(true);
}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  if (!spotifyEmbed) return;
  IFrameAPI.createController(spotifyEmbed, { width: 1, height: 1, uri: spotifyArtistUri }, (EmbedController) => {
    spotifyController = EmbedController;
    soundToggle.disabled = false;
    soundSkip.disabled = false;
    soundPrevious.disabled = false;
    setSoundState(false, 'Press play to listen');

    EmbedController.addListener('playback_started', (event) => {
      if (!spotifyPlayRequested) {
        EmbedController.pause();
        setSoundState(false, spotifyHasStarted ? 'Paused' : 'Press play to listen');
        return;
      }
      window.clearTimeout(spotifyPlaybackTimer);
      spotifyAwaitingStart = false;
      spotifyHasStarted = true;
      if (event?.data?.playingURI) {
        spotifyCurrentUri = event.data.playingURI;
        syncSpotifyTrackInfo(event.data.playingURI);
      }
      setSoundState(true);
    });

    EmbedController.addListener('playback_update', (event) => {
      if (!event?.data) return;
      const duration = Number(event.data.duration) || 0;
      const position = Number(event.data.position) || 0;
      if (event.data.playingURI) {
        spotifyCurrentUri = event.data.playingURI;
        syncSpotifyTrackInfo(event.data.playingURI);
      }
      spotifyCurrentPosition = position;
      soundProgress.style.width = `${duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0}%`;
      if (!spotifyPlayRequested) {
        if (!event.data.isPaused) EmbedController.pause();
        setSoundState(false, spotifyHasStarted ? 'Paused' : 'Press play to listen');
        return;
      }
      if (!event.data.isPaused) spotifyAwaitingStart = false;
      setSoundState(!event.data.isPaused);
    });
  });
};

const discordPreview = document.querySelector('[data-discord-preview]');
const discordOnline = document.querySelector('[data-discord-online]');
const discordMembers = document.querySelector('[data-discord-members]');
const discordInviteCode = siteConfig.community?.discordInviteCode;

if (discordPreview && discordInviteCode) {
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
}

const analyticsEndpoint = siteConfig.analytics?.endpoint?.trim();
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
    timestamp: new Date().toISOString()
  };
  window.dispatchEvent(new CustomEvent('smabblez:conversion', { detail }));
  if (!analyticsEndpoint) return;
  const body = JSON.stringify(detail);
  if (navigator.sendBeacon) navigator.sendBeacon(analyticsEndpoint, new Blob([body], { type: 'application/json' }));
  else fetch(analyticsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
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

const chaosButton = document.querySelector('[data-chaos-toggle]');
const chaosLabel = document.querySelector('[data-chaos-label]');
const chaosFlash = document.querySelector('.chaos-flash');
const modeStatus = document.querySelector('[data-mode-status]');
const chaosCharacter = document.querySelector('[data-chaos-character]');
const sparkColors = ['#ff2638', '#70ef29', '#8f46e8', '#ffd42f', '#f6f1e7'];
const chaosWords = ['HONK!', 'BONK!', 'CHAOS!', 'LIVE!', '???', 'BIG TOP'];

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
  chaosFlash.classList.remove('play');
  void chaosFlash.offsetWidth;
  chaosFlash.classList.add('play');
  window.setTimeout(() => chaosFlash.classList.remove('play'), 900);
  [[.18,.22],[.82,.2],[.22,.76],[.78,.72],[.5,.48]].forEach(([x, y], index) => {
    window.setTimeout(() => {
      makeSparks(window.innerWidth * x, window.innerHeight * y, 12);
      dropChaosSticker(window.innerWidth * x, window.innerHeight * y, chaosWords[index]);
    }, index * 70);
  });
};

const setChaos = (active) => {
  body.classList.toggle('chaos-on', active);
  chaosButton.setAttribute('aria-pressed', String(active));
  chaosLabel.textContent = active ? 'Calm it down' : 'Chaos mode';
  modeStatus.textContent = active ? 'Chaos mode enabled. Click the page to drop chaos.' : 'Chaos mode disabled.';
  chaosCharacter.src = active ? chaosCharacter.dataset.chaosSrc : chaosCharacter.dataset.normalSrc;
  if (active) broadcastChaos();
};

chaosButton.addEventListener('click', () => {
  const active = !body.classList.contains('chaos-on');
  setChaos(active);
  const rect = chaosButton.getBoundingClientRect();
  makeSparks(rect.left + rect.width / 2, rect.top + rect.height / 2);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('chaos-on')) setChaos(false);
});

document.addEventListener('pointerdown', (event) => {
  if (!body.classList.contains('chaos-on') || event.target.closest('a,button')) return;
  dropChaosSticker(event.clientX, event.clientY);
});

if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
  const cursorNose = document.querySelector('.cursor-nose');
  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--cursor-x', `${event.clientX}px`);
    root.style.setProperty('--cursor-y', `${event.clientY}px`);
    cursorNose.classList.add('visible');
  }, { passive: true });
  document.addEventListener('pointerover', (event) => {
    cursorNose.classList.toggle('hot', Boolean(event.target.closest('a,button')));
  }, { passive: true });
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) cursorNose.classList.remove('visible');
    if (!event.relatedTarget?.closest?.('a,button')) cursorNose.classList.remove('hot');
  }, { passive: true });
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

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'schedule.json');
const broadcasterId = '46623904';
const source = `https://api.twitch.tv/helix/schedule/icalendar?broadcaster_id=${broadcasterId}`;
const allowStale = process.argv.includes('--allow-stale');
const dayOrder = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const unescapeCalendarText = (value = '') => value
  .replaceAll('\\n', ' ')
  .replaceAll('\\N', ' ')
  .replaceAll('\\,', ',')
  .replaceAll('\\;', ';')
  .replaceAll('\\\\', '\\')
  .trim();

const calendarValue = (block, name) => {
  const match = block.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'm'));
  return unescapeCalendarText(match?.[1]);
};

const calendarTime = (value) => {
  const match = String(value || '').match(/T(\d{2})(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '';
};

const parseSchedule = (calendar) => {
  const unfolded = calendar.replace(/\r?\n[ \t]/g, '');
  const blocks = [...unfolded.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g)].map((match) => match[1]);
  const timezone = unfolded.match(/^DTSTART;TZID=\/?([^:;\r\n]+):/m)?.[1] || 'America/Chicago';
  const events = blocks.map((block) => {
    const start = calendarValue(block, 'DTSTART');
    const end = calendarValue(block, 'DTEND');
    const recurrence = calendarValue(block, 'RRULE');
    const day = recurrence.match(/(?:^|;)BYDAY=([A-Z]{2})/)?.[1];
    const title = calendarValue(block, 'SUMMARY');
    const description = calendarValue(block, 'DESCRIPTION');
    const category = calendarValue(block, 'CATEGORIES');
    return {
      id: calendarValue(block, 'UID'),
      day,
      start: calendarTime(start),
      end: calendarTime(end),
      title: title || '',
      category: category || description || 'Live on Twitch',
      recurring: recurrence.includes('FREQ=WEEKLY')
    };
  }).filter((event) => dayOrder.includes(event.day) && event.start && event.end)
    .sort((left, right) => dayOrder.indexOf(left.day) - dayOrder.indexOf(right.day) || left.start.localeCompare(right.start));

  if (!events.length) throw new Error('Twitch returned a calendar with no usable stream events.');
  return {
    version: 1,
    channel: 'Smabblez',
    broadcasterId,
    source,
    timezone,
    refreshHours: 6,
    fetchedAt: new Date().toISOString(),
    events
  };
};

try {
  const response = await fetch(source, {
    headers: { 'User-Agent': 'Smabblez-GitHub-Pages-Schedule/1.0' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Twitch schedule request failed with ${response.status}.`);
  const payload = parseSchedule(await response.text());
  writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Twitch schedule refreshed: ${payload.events.length} weekly events.`);
} catch (error) {
  if (allowStale && existsSync(output)) {
    const stale = JSON.parse(readFileSync(output, 'utf8'));
    console.warn(`Twitch schedule refresh failed; keeping ${stale.events?.length || 0} checked-in events. ${error.message}`);
  } else {
    throw error;
  }
}

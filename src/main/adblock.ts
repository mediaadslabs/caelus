import { Session } from 'electron';

const FILTER_LISTS = [
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt',
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt',
];

let enabled = true;

function isAdUrl(url: string): boolean {
  const lower = url.toLowerCase();
  const patterns = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'adsystem.com', 'adservice.com', 'adnxs.com', 'adsrvr.org',
    'rubiconproject.com', 'criteo.com', 'criteo.net',
    'scorecardresearch.com', 'moatads.com', 'outbrain.com',
    'taboola.com', 'sharethrough.com', 'revjet.com',
    'adzerk.net', 'exponential.com', 'eyereturn.com',
    'adroll.com', 'amazon-adsystem.com', 'casalemedia.com',
    'contextweb.com', 'openx.net', 'pubmatic.com',
    'smartadserver.com', 'sovrn.com', 'adsafeprotected.com',
    'bluekai.com', 'exelator.com', 'demdex.net',
    'ads.linkedin.com', 'ads.facebook.com', 'ad.doubleclick.net',
    'analytics.twitter.com', 'pixel.quantserve.com', 'b.monetate.net',
    'bat.bing.com', 'bat.bing.net',
  ];
  return patterns.some((p) => lower.includes(p));
}

function isTrackerUrl(url: string): boolean {
  const lower = url.toLowerCase();
  const trackers = [
    'facebook.com/tr/', 'connect.facebook.net',
    'analytics.google.com', 'www.google-analytics.com',
    'stats.g.doubleclick.net',
  ];
  return trackers.some((t) => lower.includes(t));
}

export function setupAdBlocking(session: Session): void {
  session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    if (!enabled) {
      callback({ cancel: false });
      return;
    }
    const url = details.url;
    if (isAdUrl(url) || isTrackerUrl(url)) {
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });
}

export function disableAdBlocking(): void {
  enabled = false;
}

export function enableAdBlocking(): void {
  enabled = true;
}

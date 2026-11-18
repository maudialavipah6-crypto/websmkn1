import { sanitizeLessonHtml } from './lessonContent';

export function youtubeId(value) {
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const path = url.pathname.split('/').filter(Boolean);
    let id;
    if (url.hostname === 'youtu.be' && path.length === 1) id = path[0];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      if (['shorts', 'embed', 'live'].includes(path[0]) && path.length === 2) id = path[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch {
    return null;
  }
}

export function lessonVideoId(lesson) {
  const explicit = youtubeId(lesson.video_url || '');
  if (explicit) return explicit;
  const doc = new DOMParser().parseFromString(sanitizeLessonHtml(lesson.content || ''), 'text/html');
  for (const link of doc.querySelectorAll('a[href]')) {
    const id = youtubeId(link.getAttribute('href'));
    if (id) return id;
  }
  const links = doc.body.textContent.match(/https?:\/\/[^\s<>"']+/g) || [];
  return links.map(link => youtubeId(link.replace(/[.,;!?\])]+$/, ''))).find(Boolean) || null;
}


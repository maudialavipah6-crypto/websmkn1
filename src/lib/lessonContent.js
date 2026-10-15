import DOMPurify from 'dompurify';

const allowedTags = [
  'a', 'blockquote', 'br', 'code', 'em', 'h2', 'h3', 'img', 'li',
  'ol', 'p', 'pre', 's', 'strong', 'u', 'ul',
];
const allowedAttributes = [
  'alt', 'data-asset-id', 'data-asset-path', 'decoding', 'href', 'loading',
  'rel', 'src', 'target', 'title',
];

export function sanitizeLessonHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ADD_ATTR: ['data-asset-id', 'data-asset-path'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

export function prepareLessonHtml(html, uploadedPaths, allowedExistingPaths) {
  const safeHtml = sanitizeLessonHtml(html);
  const documentFragment = new DOMParser().parseFromString(safeHtml, 'text/html');
  const allowedPaths = new Set([...allowedExistingPaths, ...uploadedPaths.values()]);

  documentFragment.querySelectorAll('img[data-asset-id]').forEach((image) => {
    const path = uploadedPaths.get(image.dataset.assetId);
    if (!path) {
      image.remove();
      return;
    }
    image.dataset.assetPath = path;
    image.removeAttribute('data-asset-id');
    image.removeAttribute('src');
  });

  documentFragment.querySelectorAll('img').forEach((image) => {
    if (!image.dataset.assetPath || !allowedPaths.has(image.dataset.assetPath)) {
      image.remove();
      return;
    }
    image.removeAttribute('src');
  });

  return sanitizeLessonHtml(documentFragment.body.innerHTML);
}

export function renderLessonHtml(html, signedUrls) {
  const safeHtml = sanitizeLessonHtml(html);
  const documentFragment = new DOMParser().parseFromString(safeHtml, 'text/html');

  documentFragment.querySelectorAll('img[data-asset-path]').forEach((image) => {
    const signedUrl = signedUrls.get(image.dataset.assetPath);
    if (!signedUrl) {
      image.remove();
      return;
    }
    image.setAttribute('src', signedUrl);
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');
  });

  return sanitizeLessonHtml(documentFragment.body.innerHTML);
}

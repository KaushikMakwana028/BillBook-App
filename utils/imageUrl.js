/**
 * BillBook Image URL Resolver
 * Resolves both product images and user profile images cleanly:
 * - Full URLs (https://, http://, data:image/): preserves or fixes localhost to production
 * - Relative paths (uploads/..., /uploads/...): attaches base URL
 * - Bare filenames: maps to uploads/products/ or uploads/profile/
 */

export const API_BASE_URL = 'https://billbook.visiontechnolabs.com';

export const resolveImageUrl = (imageUrl, type = 'product') => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  const base = API_BASE_URL.replace(/\/+$/, '');

  // If already pointing to localhost, replace with live production server
  if (trimmed.includes('localhost/kaushik/billbook')) {
    return trimmed.replace(/https?:\/\/localhost\/kaushik\/billbook\/?/i, `${base}/`);
  }

  // If full HTTP/HTTPS URL or data URI
  if (/^(https?:|\/\/|data:image)/i.test(trimmed)) {
    return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
  }

  // If relative path starting with uploads/ or assets/
  if (trimmed.startsWith('uploads/') || trimmed.startsWith('assets/')) {
    return `${base}/${trimmed}`;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/assets/')) {
    return `${base}${trimmed}`;
  }

  // Bare filename without folder path
  let folder = 'uploads/products';
  if (type === 'profile') folder = 'uploads/profile';
  if (type === 'signature') folder = 'uploads/signatures';

  return `${base}/${folder}/${trimmed.replace(/^\/+/, '')}`;
};

export const resolveProfileImageUrl = (imageUrl) => resolveImageUrl(imageUrl, 'profile');
export const resolveProductImageUrl = (imageUrl) => resolveImageUrl(imageUrl, 'product');
export const resolveSignatureUrl = (imageUrl) => resolveImageUrl(imageUrl, 'signature');

export default resolveImageUrl;

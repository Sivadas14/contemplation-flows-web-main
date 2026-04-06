const SUPABASE_STORAGE_URL = 'https://jmmqzddkwsmwdczwtrwq.supabase.co/storage/v1/object/public/generations';

export const getFullStorageUrl = (path: string): string => {
  if (!path) return '';

  // If it's already a full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${SUPABASE_STORAGE_URL}/${cleanPath}`;
};

export const getStorageUrl = (bucket: string, path: string): string => {
  const cleanBucket = bucket.startsWith('/') ? bucket.slice(1) : bucket;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_STORAGE_URL}/${cleanBucket}/${cleanPath}`;
};
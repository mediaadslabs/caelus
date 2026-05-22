import { useEffect } from 'react';

export function useQuickLinkCopy(url: string) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (url && url !== 'about:blank') {
          navigator.clipboard.writeText(url).catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [url]);
}

import { Readability } from '@mozilla/readability';
import JSDOMParser from '@mozilla/readability/JSDOMParser';

export interface ArticleResult {
  title: string | null | undefined;
  content: string | null | undefined;
  textContent: string | null | undefined;
  excerpt: string | null | undefined;
  byline: string | null | undefined;
  siteName: string | null | undefined;
  dir: string | null | undefined;
  lang: string | null | undefined;
  publishedTime: string | null | undefined;
  length: number | null | undefined;
}

export async function extractArticle(html: string): Promise<ArticleResult | null> {
  try {
    const doc = new JSDOMParser().parse(html);
    if (!doc || !doc.documentElement) return null;
    const reader = new Readability(doc);
    const article = reader.parse();
    return article;
  } catch {
    return null;
  }
}

export const EXTRACT_HTML_SCRIPT = `document.documentElement.outerHTML`;

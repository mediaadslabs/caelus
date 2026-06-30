import React from 'react';
import type { ArticleResult } from '../agents/reader';

interface ReaderViewProps {
  article: ArticleResult;
  onClose: () => void;
}

export default function ReaderView({ article, onClose }: ReaderViewProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 20,
      background: 'var(--reader-bg, #faf8f5)',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '8px 16px',
        background: 'inherit',
        borderBottom: '1px solid var(--reader-border, #e0dcd5)',
        zIndex: 1,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--reader-surface, #f0ece6)',
            color: 'var(--reader-text-secondary, #666)',
            border: '1px solid var(--reader-border, #e0dcd5)',
            cursor: 'pointer',
            fontSize: 16,
          }}
          title="Close reader view"
        >
          ✕
        </button>
      </div>
      <article style={{
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px 64px',
      }}>
        {article.title && (
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.3,
            color: 'var(--reader-text-primary, #1a1a1a)',
            marginBottom: 8,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            {article.title}
          </h1>
        )}
        {(article.byline || article.siteName) && (
          <div style={{
            fontSize: 14,
            color: 'var(--reader-text-secondary, #666)',
            marginBottom: 24,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            {article.byline && <span>{article.byline}</span>}
            {article.byline && article.siteName && <span> &middot; </span>}
            {article.siteName && <span>{article.siteName}</span>}
            {article.publishedTime && (
              <span> &middot; {new Date(article.publishedTime).toLocaleDateString()}</span>
            )}
          </div>
        )}
        {article.excerpt && (
          <p style={{
            fontSize: 16,
            color: 'var(--reader-text-secondary, #666)',
            fontStyle: 'italic',
            marginBottom: 24,
            lineHeight: 1.5,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            {article.excerpt}
          </p>
        )}
        {article.content && (
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.8,
              color: 'var(--reader-text-primary, #1a1a1a)',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}
      </article>
    </div>
  );
}

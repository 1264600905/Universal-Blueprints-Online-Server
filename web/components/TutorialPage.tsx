import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, ExternalLink, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Language } from '../types';
import { APP_VERSION, resolvePublicAssetUrl } from '../constants';

interface TutorialPageProps {
  lang: Language;
  toggleLanguage: () => void;
  onBack: () => void;
}

const TUTORIAL_DOCUMENTS = {
  cn: 'tutorials/ExportGuide_zh-CN.md',
  en: 'tutorials/ExportGuide_en.md',
};

const resolveTutorialImage = (source: string, lang: Language): string => {
  const cleanSource = decodeURIComponent(source).split(/[?#]/)[0].trim();
  const baseName = cleanSource.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  if (!baseName) return '';

  const filename = lang === 'cn'
    ? `${baseName}_zh-CN.png`
    : baseName === 'ExportExample' ? 'ExportExample_en.png' : `${baseName}.png`;

  return resolvePublicAssetUrl(`tutorials/images/${filename}`);
};

const TutorialPage: React.FC<TutorialPageProps> = ({ lang, toggleLanguage, onBack }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isChinese = lang === 'cn';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(resolvePublicAssetUrl(TUTORIAL_DOCUMENTS[lang]), {
      signal: controller.signal,
      cache: 'no-cache',
    })
      .then(response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.text();
      })
      .then(setContent)
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [lang]);

  return (
    <div className="min-h-screen bg-rim-dark text-rim-text">
      <header className="sticky top-0 z-40 border-b border-rim-border bg-rim-panel/95 backdrop-blur-xl shadow-lg">
        <div className="max-w-5xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-rim-muted hover:border-rim-green/40 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            {isChinese ? '返回蓝图库' : 'Back to Library'}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-white">
            <BookOpen size={18} className="text-rim-green" />
            {isChinese ? '使用教程' : 'Tutorial'}
            <span className="text-[10px] font-mono text-rim-green/80 bg-rim-green/10 px-2 py-0.5 rounded border border-rim-green/20">v{APP_VERSION}</span>
          </div>
          <button
            onClick={toggleLanguage}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-rim-muted hover:text-white transition-colors"
          >
            {isChinese ? 'English' : '中文'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rim-green">Universal Blueprints</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
              {isChinese ? '蓝图导出详细指南' : 'Blueprint Export Detailed Guide'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-rim-muted">
            <FileText size={15} className="text-rim-green" />
            {isChinese ? '中文教程 / English Tutorial' : 'Chinese / English'}
          </div>
        </div>

        <article className="agreement-content tutorial-content rounded-2xl border border-white/10 bg-rim-panel shadow-2xl px-5 py-6 sm:px-10 sm:py-10">
          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-rim-muted">
              <Loader2 size={28} className="animate-spin text-rim-green mb-3" />
              {isChinese ? '正在加载教程…' : 'Loading tutorial…'}
            </div>
          ) : error ? (
            <div className="min-h-[30vh] flex items-center justify-center text-center text-red-300">
              {isChinese ? `教程加载失败：${error}` : `Failed to load tutorial: ${error}`}
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                img: ({ src, alt }) => {
                  const imageUrl = typeof src === 'string' ? resolveTutorialImage(src, lang) : '';
                  if (!imageUrl) return null;
                  return (
                    <figure className="my-6 overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2 shadow-lg">
                      <img src={imageUrl} alt={alt || ''} loading="lazy" decoding="async" className="mx-auto h-auto max-w-full rounded-lg object-contain" />
                      {alt && <figcaption className="px-2 pb-1 pt-2 text-center text-xs text-rim-muted">{alt}</figcaption>}
                    </figure>
                  );
                },
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}<ExternalLink size={12} className="ml-1 inline-block" />
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </article>
      </main>
    </div>
  );
};

export default TutorialPage;

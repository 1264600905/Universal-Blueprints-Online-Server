import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Language } from '../types';
import { APP_VERSION } from '../constants';

interface UserAgreementPageProps {
  lang: Language;
  toggleLanguage: () => void;
  onBack: () => void;
}

const AGREEMENT_SOURCE = {
  cn: 'https://github.com/1264600905/Universal-Blueprints-Online-Server/blob/main/USER_AGREEMENT_CN.md',
  en: 'https://github.com/1264600905/Universal-Blueprints-Online-Server/blob/main/USER_AGREEMENT.md',
};

const AGREEMENT_CONTENT_URL = {
  cn: 'https://raw.githubusercontent.com/1264600905/Universal-Blueprints-Online-Server/main/USER_AGREEMENT_CN.md',
  en: 'https://raw.githubusercontent.com/1264600905/Universal-Blueprints-Online-Server/main/USER_AGREEMENT.md',
};

const UserAgreementPage: React.FC<UserAgreementPageProps> = ({ lang, toggleLanguage, onBack }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(AGREEMENT_CONTENT_URL[lang], {
      signal: controller.signal,
      cache: 'no-store',
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
            {lang === 'cn' ? '返回蓝图库' : 'Back to Library'}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-white">
            <FileText size={18} className="text-rim-green" />
            {lang === 'cn' ? '用户协议' : 'User Agreement'}
            <span className="text-[10px] font-mono text-rim-green/80 bg-rim-green/10 px-2 py-0.5 rounded border border-rim-green/20">v{APP_VERSION}</span>
          </div>
          <button
            onClick={toggleLanguage}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-rim-muted hover:text-white transition-colors"
          >
            {lang === 'cn' ? 'English' : '中文'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rim-green">Universal Blueprints Online</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{lang === 'cn' ? '远程蓝图服务用户协议' : 'Remote Blueprint Service Agreement'}</h1>
          </div>
          <a
            href={AGREEMENT_SOURCE[lang]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-rim-orange/30 bg-rim-orange/10 px-3 py-2 text-sm font-semibold text-rim-orange hover:bg-rim-orange/20 transition-colors"
          >
            <ExternalLink size={15} />
            {lang === 'cn' ? '查看 GitHub 原文' : 'View on GitHub'}
          </a>
        </div>

        <article className="agreement-content rounded-2xl border border-white/10 bg-rim-panel shadow-2xl px-5 py-6 sm:px-10 sm:py-10">
          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-rim-muted">
              <Loader2 size={28} className="animate-spin text-rim-green mb-3" />
              {lang === 'cn' ? '正在加载协议…' : 'Loading agreement…'}
            </div>
          ) : error ? (
            <div className="min-h-[30vh] flex items-center justify-center text-center text-red-300">
              {lang === 'cn' ? `协议加载失败：${error}` : `Failed to load agreement: ${error}`}
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
          )}
        </article>
      </main>
    </div>
  );
};

export default UserAgreementPage;

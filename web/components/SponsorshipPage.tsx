import React from 'react';
import { ArrowLeft, Heart, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { APP_VERSION, resolvePublicAssetUrl } from '../constants';

interface SponsorshipPageProps {
  lang: Language;
  toggleLanguage: () => void;
  onBack: () => void;
}

const SponsorshipPage: React.FC<SponsorshipPageProps> = ({ lang, toggleLanguage, onBack }) => {
  const isChinese = lang === 'cn';

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
            <Heart size={18} className="text-rim-orange" />
            {isChinese ? '赞助支持' : 'Support the Project'}
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
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rim-orange">Universal Blueprints Online</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
            {isChinese ? '赞助支持' : 'Support the Project'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-rim-muted">
            {isChinese
              ? '如果这个项目对你有帮助，欢迎通过下方方式支持服务器运行和后续开发。赞助完全自愿，不会解锁额外功能。'
              : 'If this project is useful to you, you are welcome to support the server and future development below. Sponsorship is completely voluntary and does not unlock additional features.'}
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-rim-panel shadow-2xl">
          <div className="bg-black/25 p-3 sm:p-5">
            <img
              src={resolvePublicAssetUrl('sponsorship/Sponsorship.png')}
              alt={isChinese ? '赞助方式' : 'Sponsorship options'}
              className="mx-auto h-auto max-h-[75vh] w-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Heart size={20} className="mt-0.5 shrink-0 text-rim-orange" />
              <p className="text-sm leading-relaxed text-rim-muted">
                {isChinese ? '感谢每一位支持项目运行的玩家。' : 'Thank you to everyone who supports this project.'}
              </p>
            </div>
            <a
              href="https://github.com/1264600905/Universal-Blueprints-Online-Server"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-rim-orange/30 bg-rim-orange/10 px-3 py-2 text-sm font-semibold text-rim-orange hover:bg-rim-orange/20 transition-colors"
            >
              <ExternalLink size={15} />
              {isChinese ? '查看项目仓库' : 'View Repository'}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SponsorshipPage;

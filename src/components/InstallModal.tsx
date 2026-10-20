import React from 'react';
import { X, Smartphone, Download, Share2, Globe, CheckCircle2 } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canInstallPrompt: boolean;
  onTriggerInstallPrompt: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  canInstallPrompt,
  onTriggerInstallPrompt
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background in dark mode */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Install AGSoft Acoustics</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Add to your device for instant offline access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1">
          {/* Direct 1-Click prompt if browser ready */}
          {canInstallPrompt && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex flex-col items-center text-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black flex items-center justify-center shadow-md">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Browser Ready to Install</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Add AGSoft Acoustics directly to your home screen with a standalone app icon.
                </p>
              </div>
              <button
                onClick={() => {
                  onTriggerInstallPrompt();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-extrabold text-xs font-mono tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                INSTALL TO HOME SCREEN
              </button>
            </div>
          )}

          {/* Android Chrome Instructions */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Android (Google Chrome)</span>
            </div>
            <ol className="text-xs text-slate-700 dark:text-slate-200 space-y-2.5 font-sans pl-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-white/[0.06] border border-emerald-200 dark:border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">1</span>
                <span>In Chrome, tap the <strong className="text-slate-900 dark:text-white font-semibold">menu (three dots ⋮)</strong> in the top-right corner.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-white/[0.06] border border-emerald-200 dark:border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">2</span>
                <span>Select <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">"Install app"</strong> or <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">"Add to Home screen"</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-white/[0.06] border border-emerald-200 dark:border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">3</span>
                <span>Tap <strong className="text-slate-900 dark:text-white font-semibold">Install</strong> to launch instantly with full offline features.</span>
              </li>
            </ol>
          </div>

          {/* iPhone / iPad Safari Instructions */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <ol className="text-xs text-slate-700 dark:text-slate-200 space-y-2.5 font-sans pl-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-white/[0.06] border border-cyan-200 dark:border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-cyan-700 dark:text-cyan-400">1</span>
                <span>Tap the <strong className="text-slate-900 dark:text-white font-semibold">Share button</strong> (<Share2 className="w-3.5 h-3.5 inline text-cyan-600 dark:text-cyan-400" />) at the bottom of Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-white/[0.06] border border-cyan-200 dark:border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-cyan-700 dark:text-cyan-400">2</span>
                <span>Scroll down and tap <strong className="text-cyan-700 dark:text-cyan-400 font-semibold">"Add to Home Screen"</strong>.</span>
              </li>
            </ol>
          </div>

          {/* Direct Native Android APK Option */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Direct Android APK</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Download standalone APK for Android
              </p>
            </div>
            <a
              href="https://github.com/aman078/AG-Acoustics/releases/latest/download/AGSoft-Acoustics.apk"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black font-mono font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-medium text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

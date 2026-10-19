import React from 'react';
import { X, Smartphone, Download, Share2, CheckCircle2, Globe, ExternalLink } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#0D111A] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Install AGSoft Acoustics</h3>
              <p className="text-[11px] font-mono text-slate-400">Get the full native mobile experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1">
          {/* Direct 1-Click prompt if browser ready */}
          {canInstallPrompt ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Browser Ready to Install</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Tap below to add AGSoft Acoustics directly to your home screen with its own standalone icon.
                </p>
              </div>
              <button
                onClick={() => {
                  onTriggerInstallPrompt();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm font-mono tracking-wider transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                INSTALL TO HOME SCREEN
              </button>
            </div>
          ) : null}

          {/* Android Chrome Instructions */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Android (Google Chrome)</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2.5 font-sans pl-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-emerald-400">1</span>
                <span>Tap the <strong className="text-white">three dots menu (⋮)</strong> in the top-right corner of Chrome.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-emerald-400">2</span>
                <span>Select <strong className="text-emerald-400">"Install app"</strong> or <strong className="text-emerald-400">"Add to Home screen"</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-emerald-400">3</span>
                <span>Tap <strong className="text-white">Install</strong> when prompted. It will appear on your home screen like any normal Android app!</span>
              </li>
            </ol>
          </div>

          {/* iPhone / iPad Safari Instructions */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2.5 font-sans pl-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-cyan-400">1</span>
                <span>Tap the <strong className="text-white">Share button</strong> (<Share2 className="w-3.5 h-3.5 inline text-cyan-400" />) in Safari's bottom toolbar.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 text-cyan-400">2</span>
                <span>Scroll down and tap <strong className="text-cyan-400">"Add to Home Screen"</strong>.</span>
              </li>
            </ol>
          </div>

          {/* Native APK Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Want direct Android .APK?</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Download the standalone debug APK from GitHub Actions
              </p>
            </div>
            <a
              href="https://github.com/aman078/AG-Acoustics/actions"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1 transition shrink-0"
            >
              <span>Get APK</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-mono text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

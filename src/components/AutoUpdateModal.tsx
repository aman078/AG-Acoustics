import React, { useState } from 'react';
import { Download, Sparkles, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AppUpdateInfo, CURRENT_APP_VERSION, triggerApkDownload } from '../services/updateService';

interface AutoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
  isChecking?: boolean;
  isManualCheck?: boolean;
}

export const AutoUpdateModal: React.FC<AutoUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  isChecking = false,
  isManualCheck = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = () => {
    if (!updateInfo?.downloadUrl) return;
    setIsDownloading(true);
    triggerApkDownload(updateInfo.downloadUrl);

    // Keep active state for 4 seconds so user sees download started
    setTimeout(() => {
      setIsDownloading(false);
    }, 4000);
  };

  const hasUpdate = updateInfo && updateInfo.updateAvailable;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col select-none"
      >
        {/* Close Button */}
        {!updateInfo?.forceUpdate && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isChecking ? (
          /* Checking State */
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Checking for AGSoft Acoustics updates...
            </h3>
            <p className="text-xs text-slate-500">Connecting to cloud release servers...</p>
          </div>
        ) : hasUpdate ? (
          /* Update Available View */
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center text-black font-extrabold shadow-lg shadow-emerald-500/20 shrink-0">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Update Available!</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30">
                    v{updateInfo.latestVersionName}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Current: v{CURRENT_APP_VERSION.versionName} • Build #{updateInfo.latestVersionCode}
                </p>
              </div>
            </div>

            {/* Release Notes */}
            <div className="my-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                WHAT'S NEW:
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                {updateInfo.releaseNotes || 'Includes latest chord dictionary additions, search optimizations, and audio engine enhancements.'}
              </p>
            </div>

            {/* Download Status Notice */}
            {isDownloading && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Downloading APK... Tap "Install" when prompted by Android!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              <button
                onClick={handleUpdate}
                disabled={isDownloading}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DOWNLOADING...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>UPDATE & INSTALL APK</span>
                  </>
                )}
              </button>

              {!updateInfo.forceUpdate && (
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Later
                </button>
              )}
            </div>
          </div>
        ) : isManualCheck ? (
          /* Up to date view */
          <div className="py-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                You're Up to Date!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                AGSoft Acoustics v{CURRENT_APP_VERSION.versionName} is the latest release.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { TUNINGS, INSTRUMENTS, TuningPreset } from '../data/tunings';

interface TuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTuning: TuningPreset;
  onSelectTuning: (tuning: TuningPreset) => void;
  referenceA4: number;
  onSetReferenceA4: (a4: number) => void;
  onCheckForUpdates?: () => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  isOpen,
  onClose,
  currentTuning,
  onSelectTuning,
  referenceA4,
  onSetReferenceA4,
  onCheckForUpdates,
}) => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>(currentTuning.instrument);

  if (!isOpen) return null;

  const filteredTunings = TUNINGS.filter((t) => t.instrument === selectedInstrument);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">INSTRUMENTS & TUNINGS</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose your instrument & custom tuning preset</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Instrument Selector Tabs (Placed at the very top with clear spacing) */}
        <div className="pt-3 pb-2.5 shrink-0 border-b border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            SELECT INSTRUMENT:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setSelectedInstrument(inst.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  selectedInstrument === inst.id
                    ? 'bg-[#f15a24] text-white font-extrabold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'
                }`}
              >
                <span>{inst.icon}</span>
                <span>{inst.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tuning Presets List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
          {filteredTunings.map((tuning) => {
            const isCurrent = currentTuning.id === tuning.id;
            return (
              <button
                key={tuning.id}
                onClick={() => {
                  onSelectTuning(tuning);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                  isCurrent
                    ? 'bg-[#f15a24]/10 dark:bg-[#f15a24]/15 border-[#f15a24]/80 shadow-[0_0_15px_rgba(241,90,36,0.25)]'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{tuning.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {tuning.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tuning.description}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {tuning.strings.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {isCurrent && (
                  <div className="w-6 h-6 rounded-full bg-[#f15a24] text-white flex items-center justify-center shrink-0 ml-3">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Reference Pitch Calibration (A4 = 440 Hz) - Clean Footer Bar */}
        <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between text-xs">
          <div>
            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-300">CONCERT REFERENCE PITCH</div>
            <div className="text-[10px] text-slate-500">Standard A4 = 440 Hz • Healing/Solfege = 432 Hz</div>
          </div>
          <div className="flex items-center gap-1.5">
            {[432, 440, 442].map((freq) => (
              <button
                key={freq}
                onClick={() => onSetReferenceA4(freq)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  referenceA4 === freq
                    ? 'bg-[#f15a24] text-white font-extrabold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'
                }`}
              >
                {freq}Hz
              </button>
            ))}
          </div>
        </div>

        {/* 4. App Version & In-App Auto-Update Action */}
        <div className="pt-2.5 mt-2 border-t border-slate-200 dark:border-slate-800/80 shrink-0 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <span>AGSoft Acoustics</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              v1.0.61
            </span>
          </div>
          {onCheckForUpdates && (
            <button
              onClick={() => {
                onClose();
                onCheckForUpdates();
              }}
              className="text-[11px] font-mono text-[#f15a24] dark:text-[#ff7a45] hover:underline font-bold cursor-pointer"
            >
              Check for Updates
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';

interface StrobeTunerProps {
  frequency: number | null;
  targetFreq: number | null;
  noteName: string;
  octave: number | null;
  cents: number;
  clarity: number;
}

export const StrobeTuner: React.FC<StrobeTunerProps> = ({
  frequency,
  targetFreq,
  noteName,
  octave,
  cents,
  clarity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // In-tune threshold (within 1 cent is considered virtually locked, 0.5 is laser locked)
  const isLocked = Math.abs(cents) <= 0.8 && clarity > 0.8;
  const isClose = Math.abs(cents) <= 3.0;

  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Strobe velocity proportional to cents error
      // 1 cent error rotates at gentle rate, 20 cents error rotates fast
      let spinSpeed = 0;
      if (frequency && targetFreq && clarity > 0.6) {
        // Frequency difference scaled for visual strobe rotation
        const freqDiff = frequency - targetFreq;
        spinSpeed = freqDiff * 1.5;
        // Clamp speed to prevent strobe aliasing visually
        spinSpeed = Math.max(-12, Math.min(12, spinSpeed));
      }

      phaseRef.current += spinSpeed * dt;

      // Clear with dark metallic background
      ctx.clearRect(0, 0, width, height);

      // Strobe disc outer casing
      const radius = Math.min(centerX, centerY) - 10;
      
      // Outer brushed metal ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f131a';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = isLocked ? '#10b981' : isClose ? '#06b6d4' : '#272f3d';
      ctx.stroke();

      // Render 4 concentric strobe rings (Peterson 4-band strobe disk)
      const ringConfigs = [
        { rInner: radius * 0.78, rOuter: radius * 0.95, segments: 48, speedMult: 1.0 },
        { rInner: radius * 0.62, rOuter: radius * 0.76, segments: 36, speedMult: 0.75 },
        { rInner: radius * 0.46, rOuter: radius * 0.60, segments: 24, speedMult: 0.5 },
        { rInner: radius * 0.30, rOuter: radius * 0.44, segments: 16, speedMult: 0.25 },
      ];

      ringConfigs.forEach((ring) => {
        const segAngle = (Math.PI * 2) / ring.segments;
        const currentPhase = phaseRef.current * ring.speedMult;

        for (let i = 0; i < ring.segments; i++) {
          if (i % 2 === 0) {
            const startAngle = i * segAngle + currentPhase;
            const endAngle = startAngle + segAngle;

            ctx.beginPath();
            ctx.arc(centerX, centerY, ring.rOuter, startAngle, endAngle);
            ctx.arc(centerX, centerY, ring.rInner, endAngle, startAngle, true);
            ctx.closePath();

            // Active glowing color when locked, dim when no signal
            if (frequency && clarity > 0.6) {
              if (isLocked) {
                ctx.fillStyle = '#10b981'; // Phosphor green
              } else if (Math.abs(cents) < 5) {
                ctx.fillStyle = '#06b6d4'; // Cyan
              } else if (cents < 0) {
                ctx.fillStyle = '#38bdf8'; // Blue for flat
              } else {
                ctx.fillStyle = '#f59e0b'; // Amber for sharp
              }
            } else {
              ctx.fillStyle = '#1e2633'; // Idle dim bands
            }
            ctx.fill();
          }
        }
      });

      // Center Core Hub (Hub cap)
      const centerRadius = radius * 0.28;
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#07090e';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isLocked ? '#10b981' : '#334155';
      ctx.stroke();

      // Top and Bottom Zero Reference Indices (The physical optical notch)
      ctx.fillStyle = isLocked ? '#10b981' : '#f43f5e';
      // Top Notch
      ctx.beginPath();
      ctx.moveTo(centerX - 6, centerY - radius + 2);
      ctx.lineTo(centerX + 6, centerY - radius + 2);
      ctx.lineTo(centerX, centerY - radius + 14);
      ctx.closePath();
      ctx.fill();

      // Bottom Notch
      ctx.beginPath();
      ctx.moveTo(centerX - 6, centerY + radius - 2);
      ctx.lineTo(centerX + 6, centerY + radius - 2);
      ctx.lineTo(centerX, centerY + radius - 14);
      ctx.closePath();
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [frequency, targetFreq, cents, clarity, isLocked, isClose]);

  return (
    <div className="flex flex-col items-center justify-center relative w-full select-none py-2">
      {/* Precision Strobe Wheel */}
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="rounded-full shadow-2xl transition-all duration-300"
          style={{
            filter: isLocked
              ? 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.35))'
              : 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.7))',
          }}
        />

        {/* Center Digital Readout inside Strobe Wheel */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-extrabold tracking-tight flex items-baseline">
            <span className={isLocked ? 'text-emerald-400' : 'text-slate-100'}>
              {noteName || '--'}
            </span>
            {octave !== null && (
              <span className="text-sm font-semibold text-slate-400 ml-0.5">
                {octave}
              </span>
            )}
          </div>
          <div
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full mt-1 ${
              isLocked
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : Math.abs(cents) < 5
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400'
            }`}
          >
            {frequency && clarity > 0.6
              ? `${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢`
              : 'WAITING'}
          </div>
        </div>
      </div>

      {/* Scientific Laboratory Stats Bar */}
      <div className="flex items-center justify-between w-full max-w-xs mt-4 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
        <div>
          <span className="text-slate-500 block uppercase tracking-wider text-[10px]">DETECTED</span>
          <span className="font-mono font-medium text-slate-100">
            {frequency ? `${frequency.toFixed(2)} Hz` : '--.-- Hz'}
          </span>
        </div>

        <div className="text-center">
          <span className="text-slate-500 block uppercase tracking-wider text-[10px]">STATUS</span>
          <span
            className={`font-mono font-bold ${
              isLocked
                ? 'text-emerald-400 animate-pulse'
                : isClose
                ? 'text-cyan-400'
                : 'text-slate-400'
            }`}
          >
            {isLocked ? 'PHASE LOCKED' : isClose ? 'IN RANGE' : 'DRIFTING'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-slate-500 block uppercase tracking-wider text-[10px]">TARGET</span>
          <span className="font-mono font-medium text-slate-100">
            {targetFreq ? `${targetFreq.toFixed(2)} Hz` : '--.-- Hz'}
          </span>
        </div>
      </div>
    </div>
  );
};

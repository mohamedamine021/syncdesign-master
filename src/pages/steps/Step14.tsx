import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES GLOBALES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 14;

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : EFFICIENCY DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
interface EfficiencyDashboardProps {
  rendement:      number;
  puissanceUtile: number;
  pertesTotales:  number;
  pertesfer?:     number;
  pertesMeca?:    number;
  pertesJoule?:   number;
  pertesExcit?:   number;
  pertesSupp?:    number;
}

function fmtDash(v: number | undefined, d = 1): string {
  if (v == null || isNaN(v) || !isFinite(v)) return '—';
  return v.toFixed(d);
}

const EfficiencyDashboard: React.FC<EfficiencyDashboardProps> = ({
  rendement,
  puissanceUtile,
  pertesTotales,
  pertesfer,
  pertesMeca,
  pertesJoule,
  pertesExcit,
  pertesSupp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isGood = rendement >= 90;
  const isWarn = rendement >= 75 && rendement < 90;
  const accentColor  = isGood ? '#1D9E75' : isWarn ? '#BA7517' : '#E24B4A';
  const accentBg     = isGood ? '#E1F5EE' : isWarn ? '#FAEEDA' : '#FCEBEB';
  const accentBorder = isGood ? 'border-emerald-500/40' : isWarn ? 'border-amber-500/40' : 'border-red-500/40';
  const accentText   = isGood
    ? 'text-emerald-700 dark:text-emerald-400'
    : isWarn
    ? 'text-amber-700 dark:text-amber-400'
    : 'text-red-700 dark:text-red-400';
  const badgeTxt = isGood ? '✓ EXCELLENT' : isWarn ? '⚠ ACCEPTABLE' : '✗ À OPTIMISER';

  const puissanceAbsorbee = puissanceUtile + pertesTotales;
  const pnPct = puissanceAbsorbee > 0 ? (puissanceUtile / puissanceAbsorbee) * 100 : 0;
  const spPct = puissanceAbsorbee > 0 ? (pertesTotales  / puissanceAbsorbee) * 100 : 0;

  const detailBars = [
    { label: 'Fer + surface',   val: pertesfer   ?? 0, color: '#534AB7' },
    { label: 'Mécaniques',      val: pertesMeca  ?? 0, color: '#BA7517' },
    { label: 'Joule stator',    val: pertesJoule ?? 0, color: '#E24B4A' },
    { label: 'Excitation',      val: pertesExcit ?? 0, color: '#D4537E' },
    { label: 'Supplémentaires', val: pertesSupp  ?? 0, color: '#7F77DD' },
  ].filter(b => b.val > 0.001);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const R  = Math.min(W, H) / 2 - 14;
    const SW = 13;
    const START_ANGLE = (225 * Math.PI) / 180;
    const TOTAL_ARC   = (270 * Math.PI) / 180;
    const clampedPct  = Math.min(Math.max(rendement, 0), 100) / 100;
    const FRAMES = 60;
    let frame = 0;

    function drawTicks() {
      for (let i = 0; i <= 10; i++) {
        const frac  = i / 10;
        const angle = Math.PI + START_ANGLE + frac * TOTAL_ARC;
        const isMaj = i % 2 === 0;
        const r1 = R - SW / 2 - (isMaj ? 12 : 7);
        const r2 = R - SW / 2 - 1;
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(angle), CY + r1 * Math.sin(angle));
        ctx.lineTo(CX + r2 * Math.cos(angle), CY + r2 * Math.sin(angle));
        ctx.strokeStyle = isMaj ? '#64748b' : '#94a3b8';
        ctx.lineWidth   = isMaj ? 1.5 : 0.8;
        ctx.stroke();
        if (isMaj) {
          const rT = R - SW / 2 - 23;
          ctx.fillStyle    = '#94a3b8';
          ctx.font         = '8px "Courier New", monospace';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${i * 10}`, CX + rT * Math.cos(angle), CY + rT * Math.sin(angle));
        }
      }
    }

    function draw(progress: number) {
      ctx.clearRect(0, 0, W, H);
      const currentPct = clampedPct * progress;

      ctx.beginPath();
      ctx.arc(CX, CY, R, Math.PI + START_ANGLE, Math.PI + START_ANGLE + TOTAL_ARC);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth   = SW;
      ctx.lineCap     = 'round';
      ctx.stroke();

      if (currentPct > 0) {
        ctx.beginPath();
        ctx.arc(CX, CY, R, Math.PI + START_ANGLE, Math.PI + START_ANGLE + TOTAL_ARC * currentPct);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth   = SW;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      drawTicks();

      const needleAngle = Math.PI + START_ANGLE + TOTAL_ARC * currentPct;
      const nLen = R - SW - 8;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + nLen * Math.cos(needleAngle), CY + nLen * Math.sin(needleAngle));
      ctx.strokeStyle = '#475569';
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(CX, CY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CX, CY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = accentColor;
      ctx.fill();
    }

    function animate() {
      frame++;
      const t     = frame / FRAMES;
      const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      draw(eased);
      if (frame < FRAMES) requestAnimationFrame(animate);
    }

    animate();
  }, [rendement, accentColor]);

  return (
    <div className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden font-mono">
      {/* En-tête */}
      <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex justify-between items-center">
        <span className="text-[9px] text-slate-400 tracking-widest">PWR-EFF-014</span>
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tracking-[0.1em]">
          TABLEAU DE BORD — PERFORMANCES &amp; RENDEMENT
        </span>
        <span className="text-[9px] text-slate-400 tracking-widest">REV.A</span>
      </div>

      {/* Corps 3 colonnes */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* COL 1 : Jauge */}
        <div className={`flex flex-col items-center rounded-xl border ${accentBorder} p-4`} style={{ background: accentBg + '33' }}>
          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.12em] uppercase mb-1">
            Rendement Global
          </p>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="block"
              aria-label={`Jauge rendement : ${fmtDash(rendement, 2)} %`}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-5">
              <span className={`text-4xl font-black tabular-nums ${accentText}`}>
                {fmtDash(rendement, 2)}
              </span>
              <span className={`text-lg font-bold ${accentText} -mt-1`}>%</span>
              <span className="text-[9px] text-slate-400 mt-1 tracking-[0.08em]">RENDEMENT GLOBAL</span>
            </div>
          </div>
          <div
            className="mt-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border"
            style={{ color: accentColor, borderColor: accentColor, background: accentBg }}
          >
            {badgeTxt}
          </div>
          <div className="mt-3 w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">
              Puissance absorbée P<sub>abs</sub>
            </p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {fmtDash(puissanceAbsorbee, 1)}
              <span className="text-xs font-normal text-slate-400 ml-1">kW</span>
            </p>
          </div>
        </div>

        {/* COL 2 : Cartes */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.12em]">
                Puissance Utile
              </p>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black tabular-nums text-emerald-800 dark:text-emerald-200">
                {fmtDash(puissanceUtile, 0)}
              </span>
              <span className="text-xl text-emerald-600 mb-1 font-bold">kW</span>
            </div>
            <div className="w-full h-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pnPct.toFixed(1)}%` }} />
            </div>
            <p className="text-[8px] text-emerald-600 mt-1 text-right">{fmtDash(pnPct, 1)} % de P_abs</p>
          </div>

          <div className="flex-1 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <p className="text-[9px] font-bold text-red-700 dark:text-red-400 uppercase tracking-[0.12em]">
                Pertes Totales ΣP
              </p>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black tabular-nums text-red-800 dark:text-red-200">
                {fmtDash(pertesTotales, 1)}
              </span>
              <span className="text-xl text-red-600 mb-1 font-bold">kW</span>
            </div>
            <div className="w-full h-2 bg-red-100 dark:bg-red-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${spPct.toFixed(1)}%` }} />
            </div>
            <p className="text-[8px] text-red-600 mt-1 text-right">{fmtDash(spPct, 1)} % de P_abs</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-center">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">Bilan Énergétique</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              P<sub>abs</sub> = P<sub>n</sub> + ΣP
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              {fmtDash(puissanceAbsorbee, 1)} = {fmtDash(puissanceUtile, 1)} + {fmtDash(pertesTotales, 1)} kW
            </p>
          </div>
        </div>

        {/* COL 3 : Flux + Répartition + Formule */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 text-center">Flux d'Énergie</p>
            <svg viewBox="0 0 280 130" className="w-full" aria-label="Diagramme flux énergie">
              <defs>
                <marker id="arG" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#1D9E75" />
                </marker>
                <marker id="arR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#E24B4A" />
                </marker>
                <marker id="arN" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
                </marker>
              </defs>
              <rect x="4" y="38" width="52" height="36" rx="5" fill="none" stroke="#64748b" strokeWidth="1.2" />
              <text x="30" y="52" textAnchor="middle" fill="#64748b" fontSize="7.5" fontFamily="Courier New">P_abs</text>
              <text x="30" y="66" textAnchor="middle" fill="#334155" fontSize="9" fontFamily="Courier New" fontWeight="700">{fmtDash(puissanceAbsorbee, 0)}</text>
              <line x1="56" y1="56" x2="86" y2="56" stroke="#64748b" strokeWidth="2.5" markerEnd="url(#arN)" />
              <rect x="86" y="43" width="48" height="26" rx="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
              <text x="110" y="54" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="Courier New">Machine</text>
              <text x="110" y="63" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="Courier New">η={fmtDash(rendement, 1)}%</text>
              <line x1="134" y1="56" x2="162" y2="56" stroke="#1D9E75" strokeWidth="2.5" markerEnd="url(#arG)" />
              <rect x="162" y="38" width="52" height="36" rx="5" fill="#E1F5EE" stroke="#1D9E75" strokeWidth="1.5" />
              <text x="188" y="52" textAnchor="middle" fill="#0F6E56" fontSize="7.5" fontFamily="Courier New">P_n</text>
              <text x="188" y="66" textAnchor="middle" fill="#0F6E56" fontSize="9" fontFamily="Courier New" fontWeight="700">{fmtDash(puissanceUtile, 0)}</text>
              <line x1="110" y1="69" x2="110" y2="96" stroke="#E24B4A" strokeWidth="2.2" markerEnd="url(#arR)" />
              <rect x="66" y="96" width="88" height="22" rx="4" fill="#FCEBEB" stroke="#E24B4A" strokeWidth="1.2" />
              <text x="110" y="107" textAnchor="middle" fill="#A32D2D" fontSize="7" fontFamily="Courier New">ΣP = {fmtDash(pertesTotales, 1)} kW</text>
              <text x="110" y="115" textAnchor="middle" fill="#E24B4A" fontSize="6" fontFamily="Courier New">({fmtDash(spPct, 1)}% dissipé)</text>
            </svg>
          </div>

          {detailBars.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-3 text-center">Répartition des Pertes</p>
              <div className="space-y-2">
                {detailBars.map(({ label, val, color }) => {
                  const pct = pertesTotales > 0 ? (val / pertesTotales) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px]" style={{ color }}>{label}</span>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                          {fmtDash(val, 2)} kW <span className="text-slate-400 ml-1">({fmtDash(pct, 1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-center">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-2">Formule</p>
            <div className="text-sm text-slate-600 dark:text-slate-300 font-mono flex items-center justify-center gap-2">
              <span className="text-xl italic font-bold" style={{ color: accentColor }}>η</span>
              <span>=</span>
              <span className="inline-flex flex-col items-center mx-1 align-middle">
                <span className="border-b border-slate-400 px-2 pb-0.5 text-emerald-700 dark:text-emerald-400">P<sub>n</sub></span>
                <span className="pt-0.5 text-slate-400">P<sub>n</sub> + ΣP</span>
              </span>
              <span>=</span>
              <span className="font-bold text-base" style={{ color: accentColor }}>{fmtDash(rendement, 2)} %</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS HTML POUR RENDU MATHÉMATIQUE SÉCURISÉ (ZÉRO LATEX)
// ─────────────────────────────────────────────────────────────────────────────
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-4 overflow-hidden">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex justify-center items-center py-2 overflow-x-auto text-slate-800 dark:text-slate-200 text-sm font-serif">
        {children}
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1 align-middle">
      <span className="border-b border-current px-1 leading-tight text-sm pb-0.5">{num}</span>
      <span className="px-1 leading-tight text-sm pt-0.5">{den}</span>
    </span>
  );
}

const sym = {
  dot:   <span className="mx-0.5">·</span>,
  sigma: <span className="mx-0.5 italic">Σ</span>,
  eta:   <span className="mx-0.5 italic text-lg font-serif">η</span>,
  phi:   <span className="mx-0.5 italic">φ</span>,
  alpha: <span className="mx-0.5 italic">α</span>,
  tau:   <span className="mx-0.5 italic">τ</span>,
  rho:   <span className="mx-0.5 italic">ρ</span>,
  sqrt:  (content: React.ReactNode) => (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">{content}</span>
    </span>
  ),
  cos: <span className="mr-1">cos</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPE : Ligne d'export unifiée
// ─────────────────────────────────────────────────────────────────────────────
interface ExportRow {
  category: string;
  label:    string;
  symbol:   string;
  value:    string;
  unit:     string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BANDEAU TITRE DE L'ÉTAPE
// ─────────────────────────────────────────────────────────────────────────────
function StepBanner() {
  const progressPercent = (CURRENT_STEP / TOTAL_STEPS) * 100;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-8">
      {/* Fond dégradé */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">

          {/* Badge numéro */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-2xl tracking-tight">{CURRENT_STEP}</span>
          </div>

          {/* Textes */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight truncate">
              Pertes et Rendement Final
            </h1>
            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Bilan énergétique complet, évaluation des pertes et rendement global de la machine
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">⚡</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              EFF
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-5">
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
            <span>Progression globale</span>
            <span>{CURRENT_STEP} / {TOTAL_STEPS} — {Math.round(progressPercent)} %</span>
          </div>

          {/* Barre principale */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Marqueurs des 14 étapes */}
          <div className="relative w-full mt-1.5">
            <div className="flex justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const step = i + 1;
                const isDone    = step < CURRENT_STEP;
                const isCurrent = step === CURRENT_STEP;

                return (
                  <div
                    key={step}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / TOTAL_STEPS}%` }}
                  >
                    {/* Pastille */}
                    <div
                      className={`
                        w-3 h-3 rounded-full border-2 transition-all duration-300
                        ${isCurrent
                          ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] scale-125'
                          : isDone
                            ? 'bg-sky-400 border-sky-300'
                            : 'bg-white/15 border-white/25'
                        }
                      `}
                    />
                    {/* Numéro sous la pastille — étapes clés seulement */}
                    {(step === 1 ||
                      step === CURRENT_STEP ||
                      step === TOTAL_STEPS ||
                      step % 7 === 0) && (
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
                          isCurrent
                            ? 'text-emerald-300'
                            : isDone
                              ? 'text-sky-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {step}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tags thématiques */}
      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Pertes fer',          color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'         },
          { label: 'Pertes mécaniques',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Pertes Joule',        color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Bilan énergétique',   color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'   },
          { label: 'Rendement global',    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'      },
        ].map(tag => (
          <span
            key={tag.label}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tag.color}`}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SÉPARATEUR DE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SectionSeparator({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-3 text-center">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 14
// ─────────────────────────────────────────────────────────────────────────────
export default function Step14() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, excitation, setCurrentStep } =
    useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  // =========================================================================
  // CALCUL PRINCIPAL
  // =========================================================================
  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) return null;

    try {
      const rotorData    = CalculationEngine.calcRotor(mainDimensions, stator, airGap);
      const noLoadData   = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      const safe_F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;
      const safe_Phi_0   = stator.Phi0;

      const reactancesData = CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);
      const safeReactances = {
        ...reactancesData,
        xSigma: reactancesData.x_sigma_pu || 0.1,
        xq:     (reactances as any)?.xq ?? 1.0,
        r_a:    stator.Ra75 || 0.05,
        r_a75:  stator.Ra75 || 0.05,
      };

      const patchedNoLoadData = {
        ...noLoadData,
        F_deltadc_A: safe_F_deltadc_A,
        Phi_0:       safe_Phi_0,
      };

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, patchedNoLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );

      const excitationData = excitation || CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn || 4500, inputs.f
      );

      const safeReaction = {
        coefficients: ('coefficients' in blondelData) ? (blondelData as any).coefficients : (blondelData as any).coeffs,
        F_a: blondelData.F_a || 0,
      };

      const dynParams = CalculationEngine.calcMachineParameters(
        nominal, airGap, patchedNoLoadData, safeReactances, safeReaction,
        excitationData, mainDimensions, 1.095, inputs.f
      );

      const shortCircuitData = CalculationEngine.calcShortCircuitCurrents(
        nominal, dynParams, blondelData, 1.08
      );

      const overloadData = CalculationEngine.calcStaticOverload(
        inputs.cosPhi || 0.8, dynParams, blondelData, shortCircuitData
      );

      const engineLosses = CalculationEngine.calcLossesAndEfficiency(
        inputs, nominal, mainDimensions, stator, airGap, excitationData, safeReactances
      );

      const Kf_local     = 0.93;
      const gamma_c      = 7.65;
      const hc_cm        = stator.hc || ((mainDimensions.DaNorm - mainDimensions.D) / 20 - 5);
      const he_cm_local  = (stator.he || 68) / 10;
      const D_moy_culasse = mainDimensions.D + 2 * he_cm_local + hc_cm;
      const V_c_dm3      = Math.PI * D_moy_culasse * hc_cm * mainDimensions.l1 * Kf_local * 1e-3;
      const G_c          = V_c_dm3 * gamma_c;
      const bd1_cm_local = stator.bd1 || 1.2;
      const G_d          = stator.Z1 * bd1_cm_local * he_cm_local * mainDimensions.l1 * Kf_local * gamma_c * 1e-3;

      const I_B          = excitationData?.electricalSpecs?.I_B_Nominal_A || 0;
      const R_B75        = excitationData?.electricalSpecs?.R_B_75_Ohm    || 0;
      const P_B_Joule_W  = Math.pow(I_B, 2) * R_B75;
      const P_B_Balais_W = (2 * 1.0 * I_B) / 0.89;
      const P_B_Joule_kW  = Math.round(P_B_Joule_W  * 1e-3 * 100) / 100;
      const P_B_Balais_kW = Math.round(P_B_Balais_W * 1e-3 * 100) / 100;
      const P_sup_kW_display = Math.round(0.005 * inputs.Pn * 100) / 100;

      return {
        losses_kW:  engineLosses.losses_kW,
        efficiency: engineLosses.efficiency,
        masses: {
          D_moy_culasse: Math.round(D_moy_culasse * 100) / 100,
          V_c_dm3:       Math.round(V_c_dm3       * 100) / 100,
          G_c:           Math.round(G_c            * 100) / 100,
          G_d:           Math.round(G_d            * 100) / 100,
        },
        details: {
          P_B_Joule_kW,
          P_B_Balais_kW,
          P_sup_kW_display,
        },
        allData: {
          rotorData, noLoadData: patchedNoLoadData,
          reactancesData: safeReactances, reactancesRaw: reactancesData,
          blondelData, excitationData, dynParams, shortCircuitData, overloadData,
        },
      };
    } catch (error) {
      console.error('Erreur lors du calcul des pertes et rendement :', error);
      return null;
    }
  }, [inputs, nominal, mainDimensions, airGap, stator, reactances, excitation]);

  // =========================================================================
  // FORMATAGE
  // =========================================================================
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // =========================================================================
  // MATRICE DE DONNÉES GLOBALE
  // =========================================================================
  const getExportData = (): ExportRow[] => {
    if (!results || !inputs || !nominal || !mainDimensions || !stator || !airGap) return [];

    const {
      losses_kW, efficiency,
      allData: { rotorData, noLoadData, reactancesData, reactancesRaw, blondelData, excitationData, dynParams, shortCircuitData, overloadData },
    } = results;

    const Uph = inputs.Un / Math.sqrt(3);
    const p   = (60 * inputs.f) / inputs.nn;

    const blondel_psi    = (blondelData as any)?.blondel?.psi_deg    ?? 0;
    const blondel_Erd    = (blondelData as any)?.blondel?.E_rd_star   ?? 0;
    const blondel_sinPsi = (blondelData as any)?.blondel?.sin_psi     ?? 0;
    const blondel_cosPsi = (blondelData as any)?.blondel?.cos_psi     ?? 0;
    const raw8 = reactancesRaw as any;

    return [
      { category: '1. Entrées',             label: 'Puissance nominale',              symbol: 'Pn',         value: fmt(inputs.Pn, 0),                          unit: 'kW'     },
      { category: '1. Entrées',             label: 'Tension nominale (ligne)',         symbol: 'Un',         value: fmt(inputs.Un, 0),                          unit: 'V'      },
      { category: '1. Entrées',             label: 'Facteur de puissance',             symbol: 'cos(phi)',   value: fmt(inputs.cosPhi, 2),                      unit: ''       },
      { category: '1. Entrées',             label: 'Fréquence',                        symbol: 'f',          value: fmt(inputs.f, 0),                           unit: 'Hz'     },
      { category: '1. Entrées',             label: 'Vitesse nominale',                 symbol: 'nn',         value: fmt(inputs.nn, 0),                          unit: 'tr/min' },
      { category: '1. Entrées',             label: 'Nombre de phases',                 symbol: 'm',          value: fmt(inputs.m, 0),                           unit: ''       },
      { category: '2. Grandeurs Nominales', label: 'Tension de phase',                 symbol: 'Uph',        value: fmt(Uph, 2),                                unit: 'V'      },
      { category: '2. Grandeurs Nominales', label: 'Puissance apparente',              symbol: 'Sn',         value: fmt(nominal.Sn, 1),                         unit: 'kVA'    },
      { category: '2. Grandeurs Nominales', label: 'Courant nominal stator',           symbol: 'In',         value: fmt(nominal.In, 2),                         unit: 'A'      },
      { category: '2. Grandeurs Nominales', label: 'Paires de pôles',                  symbol: 'p',          value: fmt(p, 0),                                  unit: ''       },
      { category: '3. Dimensions',          label: "Coefficient d'utilisation KE",     symbol: 'KE',         value: fmt(mainDimensions.KE, 3),                  unit: ''       },
      { category: '3. Dimensions',          label: "Puissance de calcul S'",           symbol: "S'",         value: fmt(mainDimensions.Sprime, 1),               unit: 'kVA'    },
      { category: '3. Dimensions',          label: 'Diamètre intérieur stator',        symbol: 'D',          value: fmt(mainDimensions.D, 1),                   unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Diamètre extérieur initial Da',    symbol: 'Da_init',    value: fmt(mainDimensions.Da, 1),                  unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Diamètre extérieur normé',         symbol: 'Da',         value: fmt(mainDimensions.DaNorm, 1),               unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Pas polaire',                      symbol: 'tau',        value: fmt(mainDimensions.tau, 3),                 unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Charge linéique A',                symbol: 'A',          value: fmt(mainDimensions.A, 0),                   unit: 'A/cm'   },
      { category: '3. Dimensions',          label: 'Induction entrefer de calcul',     symbol: 'Bdn',        value: fmt(mainDimensions.Bdn, 0),                 unit: 'G'      },
      { category: '3. Dimensions',          label: 'Arc polaire relatif (alpha_p)',    symbol: 'alphap',     value: fmt(mainDimensions.alphap, 2),               unit: ''       },
      { category: '3. Dimensions',          label: 'Coeff. arc de flux (alphaDelta)',  symbol: 'alphaDelta', value: fmt(mainDimensions.alphaDelta, 2),           unit: ''       },
      { category: '3. Dimensions',          label: "Coeff. forme d'induction KB",      symbol: 'KB',         value: fmt(mainDimensions.KB, 3),                  unit: ''       },
      { category: '3. Dimensions',          label: 'Coeff. de bobinage K01 (init.)',   symbol: 'K01_init',   value: fmt(mainDimensions.K01, 3),                 unit: ''       },
      { category: '3. Dimensions',          label: 'Longueur électromagnétique calc',  symbol: "l'_delta",   value: fmt(mainDimensions.lPrimeDelta, 2),          unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Longueur estimée avec duites',     symbol: 'l_delta_est',value: fmt(mainDimensions.lDelta, 2),               unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Nombre de canaux de ventilation',  symbol: 'nv',         value: fmt(mainDimensions.nv, 0),                  unit: ''       },
      { category: '3. Dimensions',          label: 'Largeur canal de ventilation',     symbol: 'bv',         value: fmt(mainDimensions.bv, 1),                  unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Longueur paquet de tôles',         symbol: 'lpaq',       value: fmt(mainDimensions.lpaq, 1),                unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Longueur fer actif',               symbol: 'l',          value: fmt(mainDimensions.l, 2),                   unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Longueur totale (l1)',             symbol: 'l1',         value: fmt(mainDimensions.l1, 2),                  unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Longueur magnétique finale',       symbol: 'l_delta',    value: fmt(mainDimensions.lDeltaFinal, 2),          unit: 'cm'     },
      { category: '3. Dimensions',          label: 'Rapport proportionnel lambda',     symbol: 'lambda',     value: fmt(mainDimensions.lambda, 3),               unit: ''       },
      { category: '4. Stator',              label: 'Encoches par pôle et par phase',   symbol: 'q1',         value: fmt(stator.q1, 0),                          unit: ''       },
      { category: '4. Stator',              label: "Nombre total d'encoches",          symbol: 'Z1',         value: fmt(stator.Z1, 0),                          unit: ''       },
      { category: '4. Stator',              label: "Pas d'encoche",                    symbol: 't1',         value: fmt(stator.t1, 3),                          unit: 'cm'     },
      { category: '4. Stator',              label: 'Conducteurs par encoche',          symbol: 'up1',        value: fmt(stator.up1, 0),                         unit: ''       },
      { category: '4. Stator',              label: 'Nombre de spires par phase',       symbol: 'w1',         value: fmt(stator.w1, 0),                          unit: ''       },
      { category: '4. Stator',              label: 'Pas du bobinage (encoches)',       symbol: 'Y',          value: fmt(stator.Y, 0),                           unit: ''       },
      { category: '4. Stator',              label: 'Raccourcissement relatif beta',    symbol: 'beta',       value: fmt(stator.beta, 3),                        unit: ''       },
      { category: '4. Stator',              label: 'Facteur de bobinage',              symbol: 'Kw1',        value: fmt(stator.Kw1, 4),                         unit: ''       },
      { category: '4. Stator',              label: 'Flux nominal Phi0',                symbol: 'Phi0',       value: fmt(stator.Phi0, 2),                        unit: 'Wb·1e-8'},
      { category: '4. Stator',              label: 'Flux à charge nominale PhiCh',     symbol: 'PhiCh',      value: fmt(stator.PhiCh, 2),                       unit: 'Wb·1e-8'},
      { category: '4. Stator',              label: 'Induction entrefer nominale Bd0',  symbol: 'Bd0',        value: fmt(stator.Bd0, 0),                         unit: 'G'      },
      { category: '4. Stator',              label: 'Induction entrefer à charge BdN',  symbol: 'BdN',        value: fmt(stator.BdN, 0),                         unit: 'G'      },
      { category: '4. Stator',              label: "Ouverture d'encoche",              symbol: 'be',         value: fmt(stator.be, 2),                          unit: 'mm'     },
      { category: '4. Stator',              label: 'Largeur de bobine le',             symbol: 'le',         value: fmt(stator.le, 2),                          unit: 'mm'     },
      { category: '4. Stator',              label: "Hauteur d'encoche totale",         symbol: 'he',         value: fmt(stator.he, 2),                          unit: 'mm'     },
      { category: '4. Stator',              label: 'Largeur dent stator',              symbol: 'bd1',        value: fmt(stator.bd1, 3),                         unit: 'cm'     },
      { category: '4. Stator',              label: 'Induction dans les dents',         symbol: 'Bd1',        value: fmt(stator.Bd1, 0),                         unit: 'G'      },
      { category: '4. Stator',              label: 'Hauteur culasse stator',           symbol: 'hc',         value: fmt(stator.hc, 3),                          unit: 'cm'     },
      { category: '4. Stator',              label: 'Induction culasse stator',         symbol: 'Bc',         value: fmt(stator.Bc, 0),                          unit: 'G'      },
      { category: '4. Stator',              label: 'Section conducteur',               symbol: 'Sc',         value: fmt(stator.Sc, 2),                          unit: 'mm²'    },
      { category: '4. Stator',              label: 'Hauteur conducteur (a)',           symbol: 'a_cond',     value: fmt(stator.a_cond, 2),                      unit: 'mm'     },
      { category: '4. Stator',              label: 'Largeur conducteur (b)',           symbol: 'b_cond',     value: fmt(stator.b_cond, 2),                      unit: 'mm'     },
      { category: '4. Stator',              label: 'Densité de courant stator',        symbol: 'DeltaC',     value: fmt(stator.DeltaC, 2),                      unit: 'A/mm²'  },
      { category: '4. Stator',              label: 'Résistance bobinage (75°C)',        symbol: 'Ra75',       value: fmt(stator.Ra75, 4),                        unit: 'Ω'      },
      { category: '4. Stator',              label: 'Résistance stator (p.u.)',         symbol: 'Ra75*',      value: fmt(stator.Ra75pu, 4),                      unit: 'p.u.'   },
      { category: '4. Stator',              label: 'Longueur moyenne spire',           symbol: 'Lc',         value: fmt(stator.Lc, 2),                          unit: 'm'      },
      { category: '4. Stator',              label: 'Poids cuivre stator',              symbol: 'Gm',         value: fmt(stator.Gm, 2),                          unit: 'kg'     },
      { category: '5. Entrefer',            label: "Épaisseur de l'entrefer",          symbol: 'delta',      value: fmt(airGap.delta, 3),                       unit: 'cm'     },
      { category: '5. Entrefer',            label: 'Coefficient de Carter',            symbol: 'K_delta',    value: fmt(airGap.Kdelta, 3),                      unit: ''       },
      { category: '6. Rotor',               label: 'Arc polaire bp',                   symbol: 'bp',         value: fmt(rotorData?.bp, 3),                      unit: 'cm'     },
      { category: '6. Rotor',               label: 'Rayon épanouissement Rp',          symbol: 'Rp',         value: fmt(rotorData?.Rp, 3),                      unit: 'cm'     },
      { category: '6. Rotor',               label: 'Hauteur épanouissement hp',        symbol: 'hp',         value: fmt(rotorData?.hp, 3),                      unit: 'cm'     },
      { category: '6. Rotor',               label: 'Coeff. de dispersion sigmaN',      symbol: 'sigmaN',     value: fmt(rotorData?.sigmaN, 4),                  unit: ''       },
      { category: '6. Rotor',               label: 'Flux polaire PhiM',                symbol: 'PhiM',       value: fmt(rotorData?.PhiM, 2),                    unit: 'Mx'     },
      { category: '6. Rotor',               label: 'Largeur noyau polaire bM',         symbol: 'bM',         value: fmt(rotorData?.bM, 3),                      unit: 'cm'     },
      { category: '6. Rotor',               label: 'Hauteur noyau polaire hM',         symbol: 'hM',         value: fmt(rotorData?.hM, 2),                      unit: 'cm'     },
      { category: '6. Rotor',               label: 'Hauteur culasse rotor Ha',         symbol: 'Ha',         value: fmt(rotorData?.Ha, 3),                      unit: 'cm'     },
      { category: '6. Rotor',               label: 'Induction culasse rotor Ba',       symbol: 'Ba',         value: fmt(rotorData?.Ba, 0),                      unit: 'G'      },
      { category: '7. Caract. à vide',      label: 'Coeff. de Carter (vide)',          symbol: 'K_delta_0',  value: fmt(noLoadData.Kdelta, 3),                  unit: ''       },
      { category: '7. Caract. à vide',      label: 'FMM entrefer',                     symbol: 'F_delta',    value: fmt(noLoadData.F_delta, 0),                 unit: 'A'      },
      { category: '7. Caract. à vide',      label: 'Pas dent au 1/3 hauteur (t_d13)', symbol: 't_d13',      value: fmt(noLoadData.t_d13, 3),                   unit: 'cm'     },
      { category: '7. Caract. à vide',      label: 'Largeur dent au 1/3 (b_d13)',     symbol: 'b_d13',      value: fmt(noLoadData.b_d13, 3),                   unit: 'cm'     },
      { category: '7. Caract. à vide',      label: 'Induction dents 1/3 (Bd13)',      symbol: 'Bd13',       value: fmt(noLoadData.Bd13, 0),                    unit: 'G'      },
      { category: '7. Caract. à vide',      label: 'Champ magnétique Hd13 (dents)',   symbol: 'Hd13',       value: fmt(noLoadData.Hd13, 1),                    unit: 'A/cm'   },
      { category: '7. Caract. à vide',      label: 'FMM dents stator',                symbol: 'F_d1',       value: fmt(noLoadData.F_d1, 0),                    unit: 'A'      },
      { category: '7. Caract. à vide',      label: 'Chemin moyen culasse stator lc',  symbol: 'lc',         value: fmt(noLoadData.lc, 2),                      unit: 'cm'     },
      { category: '7. Caract. à vide',      label: 'Induction culasse stator Bc',     symbol: 'Bc_vide',    value: fmt(noLoadData.Bc, 0),                      unit: 'G'      },
      { category: '7. Caract. à vide',      label: 'Coeff. de saturation xi',         symbol: 'xi',         value: fmt(noLoadData.xi, 3),                      unit: ''       },
      { category: '7. Caract. à vide',      label: 'Champ magnétique Hc (culasse)',   symbol: 'Hc',         value: fmt(noLoadData.Hc, 1),                      unit: 'A/cm'   },
      { category: '7. Caract. à vide',      label: 'FMM culasse stator',              symbol: 'F_c',        value: fmt(noLoadData.F_c, 0),                     unit: 'A'      },
      { category: '7. Caract. à vide',      label: 'Induction noyau polaire BM',      symbol: 'B_M',        value: fmt(noLoadData.B_M, 0),                     unit: 'G'      },
      { category: '7. Caract. à vide',      label: 'Champ magnétique HM (noyau)',     symbol: 'H_M',        value: fmt(noLoadData.H_M, 1),                     unit: 'A/cm'   },
      { category: '7. Caract. à vide',      label: 'FMM noyau polaire',               symbol: 'F_M0',       value: fmt(noLoadData.F_M0, 0),                    unit: 'A'      },
      { category: '7. Caract. à vide',      label: 'Induction culasse rotor Ba',      symbol: 'B_a',        value: fmt(noLoadData.B_a, 0),                     unit: 'G'      },
      { category: '7. Caract. à vide',      label: 'Champ magnétique Ha (culasse rot)',symbol: 'H_a',       value: fmt(noLoadData.H_a, 1),                     unit: 'A/cm'   },
      { category: '7. Caract. à vide',      label: 'FMM culasse rotor',               symbol: 'F_a',        value: fmt(noLoadData.F_a, 0),                     unit: 'A'      },
      { category: '7. Caract. à vide',      label: 'FMM jonction pôle-culasse',       symbol: 'F_delta_M',  value: fmt(noLoadData.F_delta_M, 0),               unit: 'A'      },
      { category: '7. Caract. à vide',      label: 'Flux de fuite polaire Phi_sigma', symbol: 'Phi_sigma',  value: fmt(noLoadData.Phi_sigma, 2),               unit: 'Mx'     },
      { category: '7. Caract. à vide',      label: 'Flux total dans le pôle Phi_M',  symbol: 'Phi_M_vide', value: fmt(noLoadData.Phi_M, 2),                   unit: 'Mx'     },
      { category: '7. Caract. à vide',      label: 'FMM totale à vide F0',           symbol: 'F0',         value: fmt(noLoadData.F_deltadc_A, 0),             unit: 'A'      },
      { category: '8. Réactances',          label: 'Perméance fuite encoche lambda_e1',symbol: 'lambda_e1',value: fmt(raw8?.lambda_e1, 4),                    unit: ''       },
      { category: '8. Réactances',          label: 'Perméance fuite diff. lambda_di1',symbol: 'lambda_di1',value: fmt(raw8?.lambda_di1, 4),                   unit: ''       },
      { category: '8. Réactances',          label: 'Perméance fuite têtes lambda_l1', symbol: 'lambda_l1', value: fmt(raw8?.lambda_l1, 4),                    unit: ''       },
      { category: '8. Réactances',          label: 'Somme des perméances de fuite',   symbol: 'sum_lambda',value: fmt(raw8?.sum_lambda, 4),                   unit: ''       },
      { category: '8. Réactances',          label: 'Réactance de dispersion (Ohms)',  symbol: 'X_sigma_Oh',value: fmt(raw8?.x_sigma_ohm, 4),                  unit: 'Ω'      },
      { category: '8. Réactances',          label: 'Réactance de dispersion (p.u.)',  symbol: 'X_sigma*',  value: fmt(reactancesData.xSigma, 4),               unit: 'p.u.'   },
      { category: '8. Réactances',          label: "Résistance d'armature (p.u.)",    symbol: 'r_a',       value: fmt(reactancesData.r_a75, 5),                unit: 'p.u.'   },
      { category: '9. Blondel',             label: "FMM d'induit nominale Fa",        symbol: 'F_a',        value: fmt(blondelData.F_a, 0),                    unit: 'A'      },
      { category: '9. Blondel',             label: "FMM d'induit (p.u.)",             symbol: 'F_a*',       value: fmt(blondelData.F_a_star, 3),               unit: 'p.u.'   },
      { category: '9. Blondel',             label: 'Taux de saturation',              symbol: 'k_sat',      value: fmt(blondelData.saturationRatio, 3),        unit: ''       },
      { category: '9. Blondel',             label: "Coeff. k_ad (réaction d'armature)",symbol: 'k_ad',     value: fmt((blondelData as any)?.coefficients?.k_ad, 3), unit: ''},
      { category: '9. Blondel',             label: "Coeff. k_aq (réaction d'armature)",symbol: 'k_aq',     value: fmt((blondelData as any)?.coefficients?.k_aq, 3), unit: ''},
      { category: '9. Blondel',             label: 'Angle interne psi',               symbol: 'psi',        value: fmt(blondel_psi, 2),                        unit: '°'      },
      { category: '9. Blondel',             label: 'sin(psi)',                         symbol: 'sin_psi',    value: fmt(blondel_sinPsi, 4),                     unit: ''       },
      { category: '9. Blondel',             label: 'cos(psi)',                         symbol: 'cos_psi',    value: fmt(blondel_cosPsi, 4),                     unit: ''       },
      { category: '9. Blondel',             label: 'Tension résultante Erd*',          symbol: 'Erd*',       value: fmt(blondel_Erd, 4),                        unit: 'p.u.'   },
      { category: '9. Blondel',             label: "FMM de réaction d'induit Fad*",   symbol: 'F_ad*',      value: fmt(blondelData.F_ad_star, 4),              unit: 'p.u.'   },
      { category: '9. Blondel',             label: "FMM d'excitation en charge F_Bn*",symbol: 'F_Bn*',      value: fmt(blondelData.F_Bn_star, 3),              unit: 'p.u.'   },
      { category: '9. Blondel',             label: "FMM d'excitation en charge F_Bn", symbol: 'F_Bn',       value: fmt(blondelData.F_Bn, 0),                   unit: 'A'      },
      { category: '10. Excitation',         label: 'Largeur max. disponible b_max',   symbol: 'b_max',      value: fmt(excitationData?.commercialWire?.b_max_limit_mm, 2),  unit: 'mm'   },
      { category: '10. Excitation',         label: 'Largeur fil commercial b',        symbol: 'b_fil',      value: fmt(excitationData?.commercialWire?.b_standard_mm, 2),   unit: 'mm'   },
      { category: '10. Excitation',         label: 'Hauteur fil commercial a',        symbol: 'a_fil',      value: fmt(excitationData?.commercialWire?.a_standard_mm, 2),   unit: 'mm'   },
      { category: '10. Excitation',         label: 'Section fil commercial',          symbol: 'S_fil',      value: fmt(excitationData?.commercialWire?.section_mm2, 2),     unit: 'mm²'  },
      { category: '10. Excitation',         label: 'Vitesse périphérique v_p',        symbol: 'v_p',        value: fmt(excitationData?.thermal?.v_p_ms, 2),                 unit: 'm/s'  },
      { category: '10. Excitation',         label: 'Coeff. de refroidissement alpha', symbol: 'alpha_th',   value: fmt(excitationData?.thermal?.alpha_coeff, 5),            unit: ''     },
      { category: '10. Excitation',         label: 'Coeff. de forme k',               symbol: 'k_coeff',    value: fmt(excitationData?.thermal?.k_coeff, 4),               unit: ''     },
      { category: '10. Excitation',         label: 'Densité courant admissible Delta_B',symbol: 'Delta_B', value: fmt(excitationData?.thermal?.delta_B_A_mm2, 2),          unit: 'A/mm²'},
      { category: '10. Excitation',         label: 'Nombre de spires rotor omega_B',  symbol: 'omega_B',    value: fmt(excitationData?.coilSizing?.omega_B_turns, 0),       unit: ''     },
      { category: '10. Excitation',         label: 'Longueur moyenne spire rotor',    symbol: 'L_Bmoy',     value: fmt(excitationData?.coilSizing?.L_Bmoy_cm, 2),           unit: 'cm'   },
      { category: '10. Excitation',         label: 'Hauteur bobine rotor',            symbol: 'h_bobine',   value: fmt(excitationData?.coilSizing?.h_bobine_cm, 2),         unit: 'cm'   },
      { category: '10. Excitation',         label: 'Hauteur noyau polaire calculé hM',symbol: 'hM_calc',    value: fmt(excitationData?.coilSizing?.h_M_pole_cm, 2),         unit: 'cm'   },
      { category: '10. Excitation',         label: 'Poids cuivre rotor',              symbol: 'G_B',        value: fmt(excitationData?.coilSizing?.weight_copper_kg, 2),    unit: 'kg'   },
      { category: '10. Excitation',         label: 'Poids cuivre / kVA',              symbol: 'G_B/kVA',    value: fmt(excitationData?.coilSizing?.weight_per_kVA, 3),      unit: 'kg/kVA'},
      { category: '10. Excitation',         label: "Courant d'excitation nominal I_B",symbol: 'I_B',        value: fmt(excitationData?.electricalSpecs?.I_B_Nominal_A, 1), unit: 'A'    },
      { category: '10. Excitation',         label: "Courant d'excitation max I_Bmax", symbol: 'I_Bmax',     value: fmt(excitationData?.electricalSpecs?.I_B_Max_A, 1),      unit: 'A'    },
      { category: '10. Excitation',         label: 'Résistance rotor à 120°C',        symbol: 'R_B120',     value: fmt(excitationData?.electricalSpecs?.R_B_120_Ohm, 4),   unit: 'Ω'    },
      { category: '10. Excitation',         label: 'Résistance rotor à 75°C',         symbol: 'R_B75',      value: fmt(excitationData?.electricalSpecs?.R_B_75_Ohm, 5),    unit: 'Ω'    },
      { category: '10. Excitation',         label: 'Coeff. de disponibilité k_dispo', symbol: 'k_dispo',    value: fmt(excitationData?.electricalSpecs?.k_dispo, 3),        unit: ''     },
      { category: '10. Excitation',         label: "Puissance d'excitation max",      symbol: 'P_Bn',       value: fmt(excitationData?.electricalSpecs?.P_Excitation_kW, 2),unit: 'kW'  },
      { category: '11. Paramètres dyn.',    label: "Réactance d'armature axe d (x_ad)",symbol: 'x_ad',     value: fmt(dynParams?.reactances_pu?.x_ad, 4),     unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: "Réactance d'armature axe q (x_aq)",symbol: 'x_aq',     value: fmt(dynParams?.reactances_pu?.x_aq, 4),     unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: 'Réactance synchrone directe x_d', symbol: 'x_d',        value: fmt(dynParams?.reactances_pu?.x_d, 4),      unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: 'Réactance synchrone transversale x_q',symbol: 'x_q',   value: fmt(dynParams?.reactances_pu?.x_q, 4),      unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: 'Réactance excitation x_B',        symbol: 'x_B',        value: fmt(dynParams?.reactances_pu?.x_B, 4),      unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: 'Réactance dispersion excitation',  symbol: 'x_Bsigma',  value: fmt(dynParams?.reactances_pu?.x_Bsigma, 4), unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: "Réactance transitoire directe x'd",symbol: "x'd",       value: fmt(dynParams?.reactances_pu?.x_d_prime, 4),unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: "Réactance d'ordre inverse x2",    symbol: 'x2',         value: fmt(dynParams?.reactances_pu?.x_2, 4),      unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: 'Résistance excitation r_B',        symbol: 'r_B',        value: fmt(dynParams?.resistances_pu?.r_B, 6),     unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: 'Résistance stator r_a',            symbol: 'r_a',        value: fmt(dynParams?.resistances_pu?.r_a, 5),     unit: 'p.u.' },
      { category: '11. Paramètres dyn.',    label: 'Pulsation nominale omega',         symbol: 'omega',      value: fmt(dynParams?.timeConstants_s?.omega_rad_s, 0), unit: 'rad/s'},
      { category: '11. Paramètres dyn.',    label: "Constante de temps à vide T_d0",   symbol: 'T_d0',       value: fmt(dynParams?.timeConstants_s?.T_d0, 3),   unit: 's'    },
      { category: '11. Paramètres dyn.',    label: "Constante de temps transitoire T'd",symbol: "T'd",       value: fmt(dynParams?.timeConstants_s?.T_d_prime, 4),unit: 's'  },
      { category: '11. Paramètres dyn.',    label: "Constante de temps d'induit T_a",  symbol: 'T_a',        value: fmt(dynParams?.timeConstants_s?.T_a, 4),    unit: 's'    },
      { category: '12. Court-circuit',      label: "Tension induite interne E0'*",     symbol: "E0'*",       value: fmt(shortCircuitData?.inputs?.E0_prime_star, 3),  unit: 'p.u.' },
      { category: '12. Court-circuit',      label: 'Courant de CC à vide I_cc0 (p.u.)',symbol: 'I_cc0*',    value: fmt(shortCircuitData?.results_pu?.I_cc0, 4), unit: 'p.u.' },
      { category: '12. Court-circuit',      label: 'Courant de CC nominal I_ccn (p.u.)',symbol: 'I_ccn*',   value: fmt(shortCircuitData?.results_pu?.I_ccn, 4), unit: 'p.u.' },
      { category: '12. Court-circuit',      label: 'Courant de CC nominal (Ampères)',  symbol: 'I_ccn_A',    value: fmt(shortCircuitData?.results_real?.I_ccn_A, 0), unit: 'A' },
      { category: '13. Surcharge statique', label: "Tension interne fictive E00'*",    symbol: "E00'*",      value: fmt(overloadData?.E00_prime_star, 3),        unit: 'p.u.' },
      { category: '13. Surcharge statique', label: 'Coefficient de saillance epsilon', symbol: 'epsilon',    value: fmt(overloadData?.epsilon, 4),               unit: ''     },
      { category: '13. Surcharge statique', label: 'Coefficient de correction k',      symbol: 'k_corr',     value: fmt(overloadData?.k_factor, 4),              unit: ''     },
      { category: '13. Surcharge statique', label: 'Capacité de surcharge statique S', symbol: 'S',          value: fmt(overloadData?.static_overload_S, 3),     unit: 'p.u.' },
      { category: '14. Bilan des pertes',   label: 'Pertes fer culasse P_c',           symbol: 'P_c',        value: fmt(losses_kW.iron_yoke_Pc, 2),              unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'Pertes fer dents P_cd',            symbol: 'P_cd',       value: fmt(losses_kW.iron_teeth_Pcd, 2),            unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'Pertes surface pôles P_sur',       symbol: 'P_sur',      value: fmt(losses_kW.pole_surface_Psur, 2),         unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'Pertes mécaniques P_mec',          symbol: 'P_mec',      value: fmt(losses_kW.mechanical_Pmec, 2),           unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'Pertes électriques stator P_elec', symbol: 'P_elec',     value: fmt(losses_kW.stator_copper_Pelec, 2),       unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'Pertes supplémentaires P_sup',     symbol: 'P_sup',      value: fmt(losses_kW.supplementary_Psup, 2),        unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'Pertes excitation P_B',            symbol: 'P_B',        value: fmt(losses_kW.excitation_PB, 2),             unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'SOMME TOTALE DES PERTES',          symbol: 'SigmaP',     value: fmt(losses_kW.total_SigmaP, 1),              unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'Puissance active utile P_n',       symbol: 'P_n',        value: fmt(efficiency.P_active_nominal_kW, 1),      unit: 'kW'   },
      { category: '14. Bilan des pertes',   label: 'RENDEMENT GLOBAL',                 symbol: 'eta',        value: fmt(efficiency.eta_percentage, 2),           unit: '%'    },
    ];
  };

  // =========================================================================
  // EXPORT EXCEL (.xlsx)
  // =========================================================================
  const exportToExcel = async () => {
    if (!results) return;
    const rows = getExportData();
    const sorted = [...rows].sort((a, b) => {
      const numA = parseInt(a.category.match(/^(\d+)/)?.[1] ?? '0', 10);
      const numB = parseInt(b.category.match(/^(\d+)/)?.[1] ?? '0', 10);
      return numA - numB;
    });
    const toNumeric = (s: string): number | string => {
      if (!s || s === '—') return s === '—' ? '—' : '';
      if (/^-?\d+(\.\d+)?$/.test(s.trim())) return parseFloat(s);
      return s;
    };
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    const workbook  = new ExcelJS.Workbook();
    workbook.creator  = 'Outil de Dimensionnement — Machine Synchrone';
    workbook.created  = new Date();
    workbook.modified = new Date();
    const sheet = workbook.addWorksheet('Dimensionnement', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });
    sheet.columns = [
      { header: 'Catégorie', key: 'category', width: 22 },
      { header: 'Paramètre', key: 'label',    width: 35 },
      { header: 'Symbole',   key: 'symbol',   width: 20 },
      { header: 'Valeur',    key: 'value',    width: 20 },
      { header: 'Unité',     key: 'unit',     width: 20 },
    ];
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FF000000' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 20;
    const CATEGORY_COLORS: Record<string, string> = {
      '1': 'FFFFF3CD', '2': 'FFD1ECF1', '3': 'FFD4EDDA', '4': 'FFE2D9F3',
      '5': 'FFFDE2E2', '6': 'FFFFECD1', '7': 'FFE8F4FD', '8': 'FFF0F4C2',
      '9': 'FFE8D5F5', '10': 'FFFCE4EC', '11': 'FFE3F2FD', '12': 'FFF1F8E9',
      '13': 'FFFDF6E3', '14': 'FFFFE0E0',
    };
    const HIGHLIGHT_GREEN = 'FFC6EFCE';
    const HIGHLIGHT_RED   = 'FFFFC7CE';
    const borderStyle = {
      top: { style: 'thin' as const }, left: { style: 'thin' as const },
      bottom: { style: 'thin' as const }, right: { style: 'thin' as const },
    };
    sorted.forEach((r) => {
      const numericValue = toNumeric(r.value);
      const stepKey = r.category.match(/^(\d+)/)?.[1] ?? '';
      let bgColor = CATEGORY_COLORS[stepKey] ?? 'FFFFFFFF';
      const isHighlightGreen = r.symbol === 'eta';
      const isHighlightRed   = r.symbol === 'SigmaP';
      if (isHighlightGreen) bgColor = HIGHLIGHT_GREEN;
      if (isHighlightRed)   bgColor = HIGHLIGHT_RED;
      const isBoldRow = isHighlightGreen || isHighlightRed;
      const row = sheet.addRow({ category: r.category, label: r.label, symbol: r.symbol, value: numericValue, unit: r.unit });
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = borderStyle;
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        if (isBoldRow) cell.font = { bold: true };
        if (colNumber === 1 || colNumber === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        }
        if (colNumber === 4 && typeof numericValue === 'number') cell.numFmt = '#,##0.####';
      });
      row.height = 16;
    });
    sheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Rapport_Dimensionnement_Alternateur.xlsx');
  };

  const exportToPDF = () => { window.print(); };

  // =========================================================================
  // STATE & GÉNÉRATION DU CODE LATEX
  // =========================================================================
  const [latexCode, setLatexCode] = useState<string | null>(null);
  const [latexCopied, setLatexCopied] = useState(false);

  const escapeLatex = (str: string): string =>
    str
      .replace(/\\/g, '\\textbackslash{}').replace(/&/g, '\\&').replace(/%/g, '\\%')
      .replace(/\$/g, '\\$').replace(/#/g, '\\#').replace(/_/g, '\\_')
      .replace(/\^/g, '\\textasciicircum{}').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/é/g, "\\'e").replace(/è/g, '\\`e').replace(/ê/g, '\\^e').replace(/ë/g, '\\"e')
      .replace(/à/g, '\\`a').replace(/â/g, '\\^a').replace(/ä/g, '\\"a')
      .replace(/ù/g, '\\`u').replace(/û/g, '\\^u').replace(/ü/g, '\\"u')
      .replace(/î/g, '\\^i').replace(/ï/g, '\\"i').replace(/ô/g, '\\^o').replace(/ö/g, '\\"o').replace(/ç/g, '\\c{c}')
      .replace(/É/g, "\\'E").replace(/È/g, '\\`E').replace(/Ê/g, '\\^E')
      .replace(/À/g, '\\`A').replace(/Â/g, '\\^A').replace(/Î/g, '\\^I').replace(/Ô/g, '\\^O').replace(/Ç/g, '\\c{C}')
      .replace(/Σ/g, '$\\Sigma$').replace(/η/g, '$\\eta$').replace(/φ/g, '$\\varphi$')
      .replace(/τ/g, '$\\tau$').replace(/α/g, '$\\alpha$').replace(/δ/g, '$\\delta$')
      .replace(/σ/g, '$\\sigma$').replace(/λ/g, '$\\lambda$').replace(/ε/g, '$\\varepsilon$')
      .replace(/Ω/g, '$\\Omega$').replace(/π/g, '$\\pi$')
      .replace(/—/g, '---').replace(/–/g, '--');

  const handleGenerateLatex = () => {
    if (!results) return;
    const rows = getExportData();
    const categories: string[] = [];
    const byCategory: Record<string, ExportRow[]> = {};
    rows.forEach(r => {
      if (!byCategory[r.category]) { byCategory[r.category] = []; categories.push(r.category); }
      byCategory[r.category].push(r);
    });
    const lines: string[] = [];
    lines.push('% ================================================================');
    lines.push('% RAPPORT DE DIMENSIONNEMENT — MACHINE SYNCHRONE (ALTERNATEUR)');
    lines.push(`% Pn = ${inputs?.Pn ?? '?'} kW  |  Un = ${inputs?.Un ?? '?'} V  |  cos(phi) = ${inputs?.cosPhi ?? '?'}  |  f = ${inputs?.f ?? '?'} Hz  |  n = ${inputs?.nn ?? '?'} tr/min`);
    lines.push('% ================================================================');
    lines.push('%');
    lines.push('% \\documentclass[a4paper,11pt]{article}');
    lines.push('% \\usepackage[T1]{fontenc}');
    lines.push('% \\usepackage[utf8]{inputenc}');
    lines.push('% \\usepackage[french]{babel}');
    lines.push('% \\usepackage[a4paper, margin=2cm]{geometry}');
    lines.push('% \\usepackage{booktabs}');
    lines.push('% \\usepackage{longtable}');
    lines.push('% \\usepackage[table]{xcolor}');
    lines.push('% \\usepackage{array}');
    lines.push('% \\usepackage{microtype}');
    lines.push('% \\usepackage{lmodern}');
    lines.push('');
    lines.push('\\begin{center}');
    lines.push('  {\\LARGE\\bfseries Rapport de Dimensionnement}\\\\[4pt]');
    lines.push('  {\\large Machine Synchrone --- Alternateur}\\\\[6pt]');
    lines.push('  \\rule{\\linewidth}{0.4pt}\\\\[4pt]');
    lines.push(`  $P_n = ${inputs?.Pn ?? '?'}$~kW \\quad $U_n = ${inputs?.Un ?? '?'}$~V \\quad $\\cos\\varphi = ${inputs?.cosPhi ?? '?'}$ \\quad $f = ${inputs?.f ?? '?'}$~Hz \\quad $n = ${inputs?.nn ?? '?'}$~tr/min`);
    lines.push('  \\\\[4pt]\\rule{\\linewidth}{0.4pt}');
    lines.push('\\end{center}');
    lines.push('\\vspace{8pt}');
    lines.push('');
    lines.push('\\rowcolors{2}{gray!5}{white}');
    lines.push('\\begin{longtable}{>{\\bfseries\\small}p{3.8cm} >{\\ttfamily\\small}l >{\\small}r >{\\small\\itshape}l}');
    lines.push('  \\toprule');
    lines.push("  \\multicolumn{1}{l}{\\textbf{Param\\`etre}} & \\textbf{Symbole} & \\textbf{Valeur} & \\textbf{Unit\\'e} \\\\");
    lines.push('  \\midrule');
    lines.push('  \\endfirsthead');
    lines.push('  \\toprule');
    lines.push("  \\multicolumn{4}{l}{\\small\\itshape Suite} \\\\");
    lines.push('  \\midrule');
    lines.push("  \\multicolumn{1}{l}{\\textbf{Param\\`etre}} & \\textbf{Symbole} & \\textbf{Valeur} & \\textbf{Unit\\'e} \\\\");
    lines.push('  \\midrule');
    lines.push('  \\endhead');
    lines.push('  \\midrule');
    lines.push("  \\multicolumn{4}{r}{\\small\\itshape Suite page suivante\\ldots} \\\\");
    lines.push('  \\endfoot');
    lines.push('  \\bottomrule');
    lines.push('  \\endlastfoot');
    lines.push('');
    categories.forEach((category) => {
      const catRows = byCategory[category];
      const catEsc  = escapeLatex(category);
      lines.push(`  \\rowcolor{gray!25}`);
      lines.push(`  \\multicolumn{4}{l}{\\textbf{\\small ${catEsc}}} \\\\`);
      lines.push('  \\midrule');
      catRows.forEach((row) => {
        const labelEsc  = escapeLatex(row.label);
        const symbolEsc = escapeLatex(row.symbol);
        const valueEsc  = escapeLatex(row.value);
        const unitEsc   = escapeLatex(row.unit);
        const isGreen   = row.symbol === 'eta';
        const isRed     = row.symbol === 'SigmaP';
        if (isGreen) lines.push('  \\rowcolor{green!12}');
        else if (isRed) lines.push('  \\rowcolor{red!10}');
        lines.push(`  ${labelEsc} & \\texttt{${symbolEsc}} & ${isGreen || isRed ? `\\textbf{${valueEsc}}` : valueEsc} & ${unitEsc} \\\\`);
      });
      lines.push('');
    });
    lines.push("  \\\\caption{R\\'ecapitulatif complet du dimensionnement}");
    lines.push('  \\label{tab:dimensionnement-complet}');
    lines.push('\\end{longtable}');
    lines.push('\\rowcolors{0}{}{}');
    setLatexCode(lines.join('\n'));
    setLatexCopied(false);
  };

  const handleCopyLatex = () => {
    if (!latexCode) return;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(latexCode)
        .then(() => { setLatexCopied(true); setTimeout(() => setLatexCopied(false), 2500); })
        .catch(() => fallbackCopyLatex());
    } else {
      fallbackCopyLatex();
    }
  };

  const fallbackCopyLatex = () => {
    if (!latexCode) return;
    const textarea = document.createElement('textarea');
    textarea.value = latexCode;
    textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    try {
      if (document.execCommand('copy')) { setLatexCopied(true); setTimeout(() => setLatexCopied(false), 2500); }
    } catch {}
    finally { document.body.removeChild(textarea); }
  };

  // =========================================================================
  // GUARD
  // =========================================================================
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Pertes et Rendement Final">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Impossible de calculer le bilan énergétique.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Assurez-vous que toutes les étapes de conception géométrique et électrique sont complètes.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { losses_kW, efficiency, masses, details } = results;
  const pertesFerMeca  = losses_kW.iron_yoke_Pc + losses_kW.iron_teeth_Pcd + losses_kW.pole_surface_Psur + losses_kW.mechanical_Pmec;
  const pertesJoule    = losses_kW.stator_copper_Pelec + losses_kW.excitation_PB;
  const exportData     = getExportData();

  const exportByCategory: Record<string, ExportRow[]> = {};
  exportData.forEach(row => {
    if (!exportByCategory[row.category]) exportByCategory[row.category] = [];
    exportByCategory[row.category].push(row);
  });

  // =========================================================================
  // RENDU PRINCIPAL
  // =========================================================================
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Pertes et Rendement Final"
      description="Bilan énergétique complet, évaluation des pertes et rendement global"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. BANDEAU TITRE                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <StepBanner />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. TABLEAU DE BORD EFFICIENCY                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SectionSeparator>Tableau de bord — Performances globales</SectionSeparator>

      <div className="mb-8 print:hidden">
        <EfficiencyDashboard
          rendement={efficiency.eta_percentage}
          puissanceUtile={efficiency.P_active_nominal_kW}
          pertesTotales={losses_kW.total_SigmaP}
          pertesfer={losses_kW.iron_yoke_Pc + losses_kW.iron_teeth_Pcd + losses_kW.pole_surface_Psur}
          pertesMeca={losses_kW.mechanical_Pmec}
          pertesJoule={losses_kW.stator_copper_Pelec}
          pertesExcit={losses_kW.excitation_PB}
          pertesSupp={losses_kW.supplementary_Psup}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. SÉPARATEUR RÉSULTATS & FORMULES                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SectionSeparator>Résultats numériques &amp; formules</SectionSeparator>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. GRILLE PRINCIPALE                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 print:hidden">

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE GAUCHE : CARTES KPI ET TABLEAUX                         */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Rendement Global (η)</p>
              <p className="text-3xl font-bold font-mono text-green-600 dark:text-green-400">
                {fmt(efficiency.eta_percentage, 2)}{' '}
                <span className="text-lg font-normal">%</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Pertes Totales (ΣP)</p>
              <p className="text-3xl font-bold font-mono text-destructive">
                {fmt(losses_kW.total_SigmaP, 1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">kW</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Pertes Fer &amp; Méca (Fixes)</p>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {fmt(pertesFerMeca, 1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">kW</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Pertes Joules (Variables)</p>
              <p className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400">
                {fmt(pertesJoule, 1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">kW</span>
              </p>
            </div>
          </div>

          <ResultTable
            title="Masses d'Acier — Stator"
            rows={[
              { label: 'Diamètre moyen culasse (tore)',  symbol: 'D_moy', value: fmt(masses.D_moy_culasse, 2), unit: 'cm'  },
              { label: 'Volume torique culasse',         symbol: 'V_c',   value: fmt(masses.V_c_dm3, 3),       unit: 'dm³' },
              { label: 'Masse acier culasse stator',     symbol: 'G_c',   value: fmt(masses.G_c, 2),           unit: 'kg'  },
              { label: 'Masse acier dents stator',       symbol: 'G_d',   value: fmt(masses.G_d, 2),           unit: 'kg'  },
            ]}
          />

          <ResultTable
            title="Détail des Pertes Constantes (Fer et Mécaniques)"
            rows={[
              { label: 'Pertes fer - Culasse stator',    symbol: 'P_c',     value: fmt(losses_kW.iron_yoke_Pc, 2),       unit: 'kW' },
              { label: 'Pertes fer - Dents stator',      symbol: 'P_{cd}',  value: fmt(losses_kW.iron_teeth_Pcd, 2),     unit: 'kW' },
              { label: 'Pertes surface - Pôles rotor',   symbol: 'P_{sur}', value: fmt(losses_kW.pole_surface_Psur, 2),  unit: 'kW' },
              { label: 'Pertes mécaniques (Frottement)', symbol: 'P_{mec}', value: fmt(losses_kW.mechanical_Pmec, 2),    unit: 'kW' },
            ]}
          />

          <ResultTable
            title="Détail des Pertes Variables (Joules)"
            rows={[
              { label: 'Pertes électriques stator',           symbol: 'P_{elec}',    value: fmt(losses_kW.stator_copper_Pelec, 2), unit: 'kW' },
              { label: "Excitation — Joule (I²·R_{B75})",     symbol: 'P_{B,Joule}', value: fmt(details.P_B_Joule_kW, 2),          unit: 'kW' },
              { label: "Excitation — Balais (2·ΔU·I_B/η_B)", symbol: 'P_{B,bal}',   value: fmt(details.P_B_Balais_kW, 2),         unit: 'kW' },
              { label: "Pertes d'excitation totales",          symbol: 'P_B',         value: fmt(losses_kW.excitation_PB, 2),       unit: 'kW' },
              { label: 'Pertes supplémentaires (0.5 % Pn)',   symbol: 'P_{sup}',     value: fmt(details.P_sup_kW_display, 2),      unit: 'kW' },
            ]}
          />

          <ResultTable
            title="Bilan Énergétique Global"
            rows={[
              { label: 'Puissance apparente',     symbol: 'S_n',    value: fmt(nominal?.Sn, 1),                    unit: 'kVA' },
              { label: 'Facteur de puissance',    symbol: 'cos(φ)', value: fmt(inputs?.cosPhi, 2),                 unit: ''    },
              { label: 'Puissance active utile',  symbol: 'P_n',    value: fmt(efficiency.P_active_nominal_kW, 1), unit: 'kW'  },
              { label: 'Somme totale des pertes', symbol: 'ΣP',     value: fmt(losses_kW.total_SigmaP, 1),         unit: 'kW'  },
            ]}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE DROITE : FORMULES                                       */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Bilan des puissances et rendement global</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="1. Pertes Fer Culasse">
              <div className="flex flex-col items-center w-full gap-2">
                <div className="flex items-center whitespace-nowrap">
                  <span className="italic font-semibold mr-2">P<sub>c</sub></span>
                  <span className="mr-2">=</span>
                  <span>k<sub>dc</sub> {sym.dot} {sym.rho}<sub>c</sub> {sym.dot} G<sub>c</sub> {sym.dot} 10<sup>-3</sup></span>
                </div>
                <div className="text-xs opacity-60">(G<sub>c</sub> = Poids de l'acier en kg)</div>
              </div>
            </Formula>

            <Formula label="2. Pertes Fer Dents">
              <div className="flex items-center whitespace-nowrap">
                <span className="italic font-semibold mr-2">P<sub>cd</sub></span>
                <span className="mr-2">=</span>
                <span>k<sub>d</sub> {sym.dot} {sym.rho}<sub>cd</sub> {sym.dot} G<sub>d</sub> {sym.dot} 10<sup>-3</sup></span>
              </div>
            </Formula>

            <Formula label="3. Pertes de Surface (Rotor)">
              <div className="flex items-center whitespace-nowrap">
                <span className="italic font-semibold mr-2">P<sub>sur</sub></span>
                <span className="mr-2">=</span>
                <span>0.6 {sym.dot} (2p) {sym.dot} {sym.alpha}<sub>0</sub> {sym.dot} {sym.tau} {sym.dot} l<sub>M</sub> {sym.dot} p<sub>sur</sub></span>
              </div>
            </Formula>

            <Formula label="4. Pertes Mécaniques">
              <div className="flex items-center whitespace-nowrap">
                <span className="italic font-semibold mr-2">P<sub>mec</sub></span>
                <span className="mr-2">=</span>
                <span>0.8 {sym.dot} (2p) {sym.dot} (</span>
                <Frac num={<span>v<sub>p</sub></span>} den="40" />
                <span>)³ {sym.dot} {sym.sqrt(<Frac num={<span>l<sub>M</sub></span>} den="19" />)}</span>
              </div>
            </Formula>

            <Formula label="5. Pertes Électriques Stator (Joule)">
              <div className="flex items-center whitespace-nowrap">
                <span className="italic font-semibold mr-2">P<sub>elec</sub></span>
                <span className="mr-2">=</span>
                <span>m {sym.dot} I<sub>n</sub>² {sym.dot} R<sub>a75</sub> {sym.dot} 10<sup>-3</sup></span>
              </div>
            </Formula>

            <Formula label="6. Pertes d'Excitation (Joule + Balais)">
              <div className="flex flex-col items-center w-full gap-1">
                <div className="flex items-center whitespace-nowrap text-sm">
                  <span className="italic font-semibold mr-2">P<sub>B,Joule</sub></span>
                  <span className="mr-2">=</span>
                  <span>I<sub>B</sub>² {sym.dot} R<sub>B75</sub></span>
                </div>
                <div className="flex items-center whitespace-nowrap text-sm">
                  <span className="italic font-semibold mr-2">P<sub>B,bal</sub></span>
                  <span className="mr-2">=</span>
                  <Frac
                    num={<span>2 {sym.dot} ΔU {sym.dot} I<sub>B</sub></span>}
                    den={<span>η<sub>B</sub></span>}
                  />
                </div>
              </div>
            </Formula>

            <Formula label="6b. Pertes Supplémentaires">
              <div className="flex items-center whitespace-nowrap">
                <span className="italic font-semibold mr-2">P<sub>sup</sub></span>
                <span className="mr-2">=</span>
                <span>0.005 {sym.dot} P<sub>n</sub></span>
                <span className="ml-2 text-xs opacity-60">(0.5 % de P<sub>n</sub>)</span>
              </div>
            </Formula>

            <div className="h-px bg-border my-4" />

            <Formula label="7. Puissance Active Utile">
              <div className="flex flex-col items-center w-full gap-2">
                <div className="flex items-center text-green-600 dark:text-green-400 whitespace-nowrap">
                  <span className="italic font-semibold mr-2 text-lg">P<sub>n</sub></span>
                  <span className="mr-2 text-lg">=</span>
                  <span className="text-lg">S<sub>n</sub> {sym.dot} {sym.cos}({sym.phi})</span>
                </div>
              </div>
            </Formula>

            <Formula label="8. Rendement Global">
              <div className="flex items-center whitespace-nowrap">
                <span className="italic font-semibold mr-2 text-2xl text-primary">{sym.eta}</span>
                <span className="mr-2 text-2xl text-primary">=</span>
                <span className="text-xl">1 - </span>
                <Frac
                  num={<span className="text-destructive font-bold text-lg">{sym.sigma}P</span>}
                  den={
                    <span>
                      <span className="text-green-600 dark:text-green-400 font-bold text-lg">P<sub>n</sub></span>
                      {' + '}
                      <span className="text-destructive font-bold text-lg">{sym.sigma}P</span>
                    </span>
                  }
                />
              </div>
            </Formula>

          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. SECTION EXPORTATION                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SectionSeparator>Exportation des résultats</SectionSeparator>

      <div className="pt-2 pb-8 print:hidden">
        <div className="flex flex-col items-center justify-center text-center space-y-6">

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Exportation des Résultats
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Téléchargez l'ensemble des paramètres calculés (de l'étape 1 à 14) au format Excel,
              générez le code LaTeX ou imprimez un rapport PDF de cette page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-wrap justify-center">
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger Excel (.xlsx)
            </button>

            <button
              onClick={exportToPDF}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer / Sauvegarder en PDF
            </button>

            <button
              onClick={handleGenerateLatex}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Générer Code LaTeX
            </button>
          </div>

          {latexCode && (
            <div className="w-full max-w-4xl print:hidden">
              <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-slate-900 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-3 text-xs font-mono text-slate-400">rapport_alternateur.tex</span>
                  </div>
                  <button
                    onClick={handleCopyLatex}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-200 ${
                      latexCopied
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white'
                    }`}
                  >
                    {latexCopied ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Copié !
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copier dans le presse-papier
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={latexCode}
                  rows={20}
                  className="w-full bg-slate-900 text-green-300 font-mono text-xs p-4 resize-y focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 text-center">
                Collez ce code dans votre éditeur LaTeX (Overleaf, TeXstudio, etc.). Ajoutez{' '}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-blue-600 dark:text-blue-400">
                  \usepackage{'{'}booktabs,longtable,xcolor{'}'}
                </code>{' '}
                dans votre préambule.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. RAPPORT COMPLET — IMPRESSION / PDF UNIQUEMENT                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block">
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#111', padding: '20px' }}>
          <div style={{ textAlign: 'center', borderBottom: '3px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' }}>
              Rapport de Dimensionnement — Machine Synchrone (Alternateur)
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Pn = {fmt(inputs?.Pn, 0)} kW &nbsp;|&nbsp; Un = {fmt(inputs?.Un, 0)} V &nbsp;|&nbsp;
              cos φ = {fmt(inputs?.cosPhi, 2)} &nbsp;|&nbsp; f = {fmt(inputs?.f, 0)} Hz &nbsp;|&nbsp;
              nn = {fmt(inputs?.nn, 0)} tr/min
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, border: '2px solid #16a34a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rendement Global</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{fmt(efficiency.eta_percentage, 2)} %</p>
            </div>
            <div style={{ flex: 1, border: '2px solid #dc2626', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pertes Totales</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>{fmt(losses_kW.total_SigmaP, 1)} kW</p>
            </div>
            <div style={{ flex: 1, border: '2px solid #2563eb', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Puissance Utile</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>{fmt(efficiency.P_active_nominal_kW, 1)} kW</p>
            </div>
          </div>

          {Object.entries(exportByCategory).map(([category, rows]) => (
            <div key={category} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
              <h2 style={{
                fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase',
                letterSpacing: '1px', color: '#fff', backgroundColor: '#334155',
                padding: '6px 12px', margin: '0 0 0', borderRadius: '4px 4px 0 0',
              }}>{category}</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px 10px', textAlign: 'left',   fontWeight: 600, width: '40%' }}>Paramètre</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px 10px', textAlign: 'center', fontWeight: 600, width: '20%' }}>Symbole</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px 10px', textAlign: 'right',  fontWeight: 600, width: '20%' }}>Valeur</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px 10px', textAlign: 'left',   fontWeight: 600, width: '20%' }}>Unité</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc',
                        fontWeight: row.symbol === 'SigmaP' || row.symbol === 'eta' ? 'bold' : 'normal',
                        color: row.symbol === 'eta' ? '#16a34a' : row.symbol === 'SigmaP' ? '#dc2626' : '#111',
                      }}
                    >
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 10px' }}>{row.label}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 10px', textAlign: 'center', fontFamily: 'monospace' }}>{row.symbol}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 10px', textAlign: 'right',  fontFamily: 'monospace' }}>{row.value}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 10px', color: '#64748b' }}>{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
            Rapport généré automatiquement par le moteur de dimensionnement — Étapes 1 à 14 complétées
          </div>
        </div>
      </div>

    </StepLayout>
  );
}
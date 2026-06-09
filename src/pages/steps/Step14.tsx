import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 14;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES TYPOGRAPHIQUES CENTRALISÉS (identiques à Step13)
// ─────────────────────────────────────────────────────────────────────────────
const typo = {
  label:
    'font-[Inter,sans-serif] text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400',
  unit:
    'font-[Inter,sans-serif] text-xs font-normal text-muted-foreground',
  sectionTitle:
    'font-[Inter,sans-serif] text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400',
  cardTitle:
    'font-[Inter,sans-serif] text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100',
  cardDesc:
    'font-[Inter,sans-serif] text-sm text-slate-500 dark:text-slate-400 leading-relaxed',
  mathBody:
    'font-mono text-sm font-normal text-slate-800 dark:text-slate-200',
  formulaLabel:
    'font-[Inter,sans-serif] text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500',
  bannerLabel:
    'font-[Inter,sans-serif] text-[10px] font-semibold text-slate-300 uppercase tracking-[0.2em]',
  bannerTitle:
    'font-[Inter,sans-serif] text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight truncate',
  bannerDesc:
    'font-[Inter,sans-serif] text-slate-300 text-sm mt-1 leading-relaxed font-light',
  progressLabel:
    'font-[Inter,sans-serif] text-[9px] text-slate-400 font-semibold uppercase tracking-widest',
  progressValue:
    'font-mono text-[9px] text-slate-400 font-medium tabular-nums',
  stepDot:
    'font-mono text-[8px] font-bold mt-0.5 tabular-nums',
  tagLabel:
    'font-[Inter,sans-serif] text-[10px] font-semibold uppercase tracking-wider',
  subFormula:
    'font-mono text-sm font-medium text-slate-600 dark:text-slate-400',
  errorTitle:
    'font-[Inter,sans-serif] font-bold text-destructive',
  errorBody:
    'font-[Inter,sans-serif] text-sm text-destructive/80 mt-2 leading-relaxed',
  code:
    'font-mono text-xs',
  criteriaTitle:
    'font-[Inter,sans-serif] text-sm font-semibold text-slate-700 dark:text-slate-300',
  criteriaNote:
    'font-[Inter,sans-serif] text-xs text-slate-500 dark:text-slate-400 mt-4 italic leading-relaxed',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS MATHÉMATIQUES
// ─────────────────────────────────────────────────────────────────────────────
function Formula({
  label,
  children,
  accent = 'sky',
}: {
  label: string;
  children: React.ReactNode;
  accent?: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'slate';
}) {
  const accents: Record<string, string> = {
    sky:     'border-l-sky-400     bg-sky-50/60     dark:bg-sky-950/20',
    emerald: 'border-l-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20',
    violet:  'border-l-violet-400  bg-violet-50/60  dark:bg-violet-950/20',
    amber:   'border-l-amber-400   bg-amber-50/60   dark:bg-amber-950/20',
    rose:    'border-l-rose-400    bg-rose-50/60    dark:bg-rose-950/20',
    cyan:    'border-l-cyan-400    bg-cyan-50/60    dark:bg-cyan-950/20',
    slate:   'border-l-slate-400   bg-slate-50/60   dark:bg-slate-950/20',
  };
  const dots: Record<string, string> = {
    sky: 'bg-sky-400', emerald: 'bg-emerald-400', violet: 'bg-violet-400',
    amber: 'bg-amber-400', rose: 'bg-rose-400', cyan: 'bg-cyan-400', slate: 'bg-slate-400',
  };

  return (
    <div
      className={`
        relative border-l-[3px] rounded-r-xl px-5 py-4 mb-3
        border border-slate-100 dark:border-slate-800/60
        shadow-sm transition-all duration-200
        hover:shadow-md hover:scale-[1.01]
        ${accents[accent]}
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[accent]}`} />
        <p className={typo.formulaLabel}>{label}</p>
      </div>
      <div className={`flex flex-wrap justify-center items-center gap-1 py-2 overflow-x-auto ${typo.mathBody}`}>
        {children}
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1.5 align-middle">
      <span className={`border-b border-current px-2 pb-0.5 leading-snug ${typo.mathBody}`}>{num}</span>
      <span className={`px-2 pt-0.5 leading-snug ${typo.mathBody}`}>{den}</span>
    </span>
  );
}

function Var({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono italic font-semibold text-slate-800 dark:text-slate-200 ${className}`}>
      {children}
    </span>
  );
}

function Op({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono font-light text-slate-500 dark:text-slate-400 mx-1.5 ${className}`}>
      {children}
    </span>
  );
}

function Num({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono font-normal tabular-nums text-slate-700 dark:text-slate-300 ${className}`}>
      {children}
    </span>
  );
}

const sym = {
  dot:    <Op>·</Op>,
  eq:     <Op>=</Op>,
  plus:   <Op>+</Op>,
  minus:  <Op>−</Op>,
  times:  <Op>×</Op>,
  sigma:  <Var>Σ</Var>,
  eta:    <Var>η</Var>,
  phi:    <Var>φ</Var>,
  cos:    <span className="font-mono text-slate-700 dark:text-slate-300 mr-0.5">cos</span>,
  sqrt:   (content: React.ReactNode) => (
    <span className="inline-flex items-center mx-1">
      <span className="font-mono text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">{content}</span>
    </span>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  unit,
  accent = 'slate',
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'slate' | 'green' | 'red';
  children?: React.ReactNode;
}) {
  const borders: Record<string, string> = {
    sky: 'border-t-sky-400', emerald: 'border-t-emerald-400', violet: 'border-t-violet-500',
    amber: 'border-t-amber-400', rose: 'border-t-rose-400', cyan: 'border-t-cyan-400',
    slate: 'border-t-slate-400', green: 'border-t-green-400', red: 'border-t-red-400',
  };
  const colors: Record<string, string> = {
    sky: 'text-sky-600 dark:text-sky-400', emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400', amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400', cyan: 'text-cyan-600 dark:text-cyan-400',
    slate: 'text-primary', green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={`rounded-xl border border-border border-t-2 p-4 bg-white dark:bg-slate-900/60
      shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center gap-1
      ${borders[accent]}`}
    >
      <p className={typo.label}>{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${colors[accent]}`}>
          {value}
        </span>
        {unit && <span className={typo.unit}>{unit}</span>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JAUGE CANVAS (conservée, embarquée dans un sous-composant propre)
// ─────────────────────────────────────────────────────────────────────────────
function EfficiencyGauge({ rendement }: { rendement: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isGood = rendement >= 90;
  const isWarn = rendement >= 75 && rendement < 90;
  const accentColor = isGood ? '#1D9E75' : isWarn ? '#BA7517' : '#E24B4A';
  const accentText  = isGood
    ? 'text-emerald-700 dark:text-emerald-400'
    : isWarn
    ? 'text-amber-700 dark:text-amber-400'
    : 'text-red-700 dark:text-red-400';
  const badgeTxt = isGood ? '✓ EXCELLENT' : isWarn ? '⚠ ACCEPTABLE' : '✗ À OPTIMISER';
  const accentBg     = isGood ? '#E1F5EE' : isWarn ? '#FAEEDA' : '#FCEBEB';
  const accentBorder = isGood ? 'border-emerald-500/40' : isWarn ? 'border-amber-500/40' : 'border-red-500/40';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const CX = W / 2, CY = H / 2;
    const R = Math.min(W, H) / 2 - 14;
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
        ctx!.beginPath();
        ctx!.moveTo(CX + r1 * Math.cos(angle), CY + r1 * Math.sin(angle));
        ctx!.lineTo(CX + r2 * Math.cos(angle), CY + r2 * Math.sin(angle));
        ctx!.strokeStyle = isMaj ? '#64748b' : '#94a3b8';
        ctx!.lineWidth   = isMaj ? 1.5 : 0.8;
        ctx!.stroke();
        if (isMaj) {
          const rT = R - SW / 2 - 23;
          ctx!.fillStyle    = '#94a3b8';
          ctx!.font         = '8px "Courier New", monospace';
          ctx!.textAlign    = 'center';
          ctx!.textBaseline = 'middle';
          ctx!.fillText(`${i * 10}`, CX + rT * Math.cos(angle), CY + rT * Math.sin(angle));
        }
      }
    }

    function draw(progress: number) {
      ctx!.clearRect(0, 0, W, H);
      const cur = clampedPct * progress;

      ctx!.beginPath();
      ctx!.arc(CX, CY, R, Math.PI + START_ANGLE, Math.PI + START_ANGLE + TOTAL_ARC);
      ctx!.strokeStyle = '#e2e8f0'; ctx!.lineWidth = SW; ctx!.lineCap = 'round'; ctx!.stroke();

      if (cur > 0) {
        ctx!.beginPath();
        ctx!.arc(CX, CY, R, Math.PI + START_ANGLE, Math.PI + START_ANGLE + TOTAL_ARC * cur);
        ctx!.strokeStyle = accentColor; ctx!.lineWidth = SW; ctx!.lineCap = 'round'; ctx!.stroke();
      }

      drawTicks();

      const needleAngle = Math.PI + START_ANGLE + TOTAL_ARC * cur;
      const nLen = R - SW - 8;
      ctx!.beginPath();
      ctx!.moveTo(CX, CY);
      ctx!.lineTo(CX + nLen * Math.cos(needleAngle), CY + nLen * Math.sin(needleAngle));
      ctx!.strokeStyle = '#475569'; ctx!.lineWidth = 1.5; ctx!.lineCap = 'round'; ctx!.stroke();

      ctx!.beginPath(); ctx!.arc(CX, CY, 5, 0, 2 * Math.PI);
      ctx!.fillStyle = '#475569'; ctx!.fill();
      ctx!.beginPath(); ctx!.arc(CX, CY, 2.5, 0, 2 * Math.PI);
      ctx!.fillStyle = accentColor; ctx!.fill();
    }

    function animate() {
      frame++;
      const t = frame / FRAMES;
      const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      draw(eased);
      if (frame < FRAMES) requestAnimationFrame(animate);
    }
    animate();
  }, [rendement, accentColor]);

  return (
    <div className={`flex flex-col items-center rounded-xl border ${accentBorder} p-4`}
      style={{ background: accentBg + '33' }}>
      <p className={`${typo.label} mb-1`}>Rendement Global</p>
      <div className="relative">
        <canvas ref={canvasRef} width={200} height={200} className="block"
          aria-label={`Jauge rendement : ${rendement.toFixed(2)} %`} />
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-5">
          <span className={`font-mono text-4xl font-black tabular-nums ${accentText}`}>
            {rendement.toFixed(2)}
          </span>
          <span className={`font-mono text-lg font-bold ${accentText} -mt-1`}>%</span>
          <span className="font-[Inter,sans-serif] text-[9px] text-slate-400 mt-1 tracking-[0.08em]">
            RENDEMENT GLOBAL
          </span>
        </div>
      </div>
      <div
        className="mt-1 px-3 py-1 rounded-full font-[Inter,sans-serif] text-[10px] font-bold tracking-wider border"
        style={{ color: accentColor, borderColor: accentColor, background: accentBg }}
      >
        {badgeTxt}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE : Ligne d'export unifiée (symbol = string pour Excel/LaTeX)
// ─────────────────────────────────────────────────────────────────────────────
interface ExportRow {
  category: string;
  label: string;
  symbol: string;
  value: string;
  unit: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE : Ligne de rendu UI (symbol = ReactNode pour JSX mathématique)
// ─────────────────────────────────────────────────────────────────────────────
interface RenderRow {
  label: string;
  symbol: React.ReactNode;
  value: string;
  unit: string;
}

// Tableau de résultats avec symboles JSX
function MathResultTable({ title, rows }: { title: string; rows: RenderRow[] }) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-border">
        <p className="font-[Inter,sans-serif] text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide">
          {title}
        </p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/60 dark:bg-slate-800/30'}>
              <td className="px-4 py-2 font-[Inter,sans-serif] text-slate-600 dark:text-slate-400 text-xs w-1/2">
                {row.label}
              </td>
              <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 text-center w-1/4">
                {row.symbol}
              </td>
              <td className="px-3 py-2 font-mono font-semibold text-slate-800 dark:text-slate-100 text-right tabular-nums w-1/6">
                {row.value}
              </td>
              <td className="px-4 py-2 font-[Inter,sans-serif] text-xs text-slate-400 w-1/12">
                {row.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BANDEAU TITRE
// ─────────────────────────────────────────────────────────────────────────────
function StepBanner() {
  const progressPercent = (CURRENT_STEP / TOTAL_STEPS) * 100;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-8">
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">

          {/* Badge numéro */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <span className="font-mono text-white font-black text-2xl tracking-tight">
              {CURRENT_STEP}
            </span>
          </div>

          {/* Textes */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className={`${typo.bannerLabel} mb-0.5`}>
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>
            <h1 className={typo.bannerTitle}>Pertes et Rendement Final</h1>
            <p className={typo.bannerDesc}>
              Bilan énergétique complet, évaluation des pertes et rendement global de la machine
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl font-bold">⚡</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              EFF
            </span>
          </div>
        </div>

        {/* Progression */}
        <div className="mt-5">
          <div className="flex justify-between mb-1.5">
            <span className={typo.progressLabel}>Progression globale</span>
            <span className={typo.progressValue}>
              {CURRENT_STEP} / {TOTAL_STEPS} — {Math.round(progressPercent)} %
            </span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Marqueurs */}
          <div className="relative w-full mt-1.5">
            <div className="flex justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const step = i + 1;
                const isDone    = step < CURRENT_STEP;
                const isCurrent = step === CURRENT_STEP;
                return (
                  <div key={step} className="flex flex-col items-center" style={{ width: `${100 / TOTAL_STEPS}%` }}>
                    <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300
                      ${isCurrent
                        ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] scale-125'
                        : isDone ? 'bg-sky-400 border-sky-300' : 'bg-white/15 border-white/25'}`}
                    />
                    {(step === 1 || step === CURRENT_STEP || step === TOTAL_STEPS || step % 7 === 0) && (
                      <span className={`${typo.stepDot} ${isCurrent ? 'text-emerald-300' : isDone ? 'text-sky-400' : 'text-slate-500'}`}>
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
          { label: 'Pertes fer',        color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Pertes mécaniques', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Pertes Joule',      color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Bilan énergétique', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Rendement global',  color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
        ].map(tag => (
          <span key={tag.label} className={`${typo.tagLabel} px-2.5 py-0.5 rounded-full border ${tag.color}`}>
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SÉPARATEUR
// ─────────────────────────────────────────────────────────────────────────────
function SectionSeparator({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
      <span className={`${typo.sectionTitle} px-3 text-center`}>{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 14
// ─────────────────────────────────────────────────────────────────────────────
export default function Step14() {
  // Seules les données de base (étapes 1-5) sont nécessaires — 
  // les résultats intermédiaires (reactances, excitation) sont recalculés localement
  const { inputs, nominal, mainDimensions, airGap, stator, setCurrentStep } =
    useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  // =========================================================================
  // CALCUL PRINCIPAL — TOTALEMENT AUTONOME
  // Step14 recalcule toute la chaîne (étapes 6→14) depuis les données brutes
  // du store (inputs, nominal, mainDimensions, stator, airGap) sans utiliser
  // les résultats intermédiaires mis en cache (reactances, excitation) qui
  // peuvent être obsolètes après une évolution du schéma de données Zustand.
  // =========================================================================
  const [calcError, setCalcError] = useState<string | null>(null);

  const results = useMemo(() => {
    setCalcError(null);

    // Garde minimale : seules les données saisies aux étapes 1-5 sont requises
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) return null;

    try {
      // ── Étape 6 : Rotor ──────────────────────────────────────────────────
      const rotorData = CalculationEngine.calcRotor(mainDimensions, stator, airGap);

      // ── Étape 7 : Caractéristique à vide ─────────────────────────────────
      // Phi_0 et F_deltadc_A sont dans le retour natif depuis le dernier patch
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);

      if (!noLoadData.F_0 || !isFinite(noLoadData.F_0) || noLoadData.F_0 <= 0) {
        throw new Error(
          `F_0 invalide (${noLoadData.F_0}). ` +
          `Vérifiez stator.Bd0=${stator.Bd0}, airGap.delta=${airGap.delta}`
        );
      }
      if (!noLoadData.Phi_0 || !isFinite(noLoadData.Phi_0) || noLoadData.Phi_0 <= 0) {
        throw new Error(
          `Phi_0 invalide (${noLoadData.Phi_0}). Vérifiez stator.PhiCh=${stator.PhiCh}`
        );
      }

      // ── Étape 8 : Réactances — toujours recalculées (pas de cache store) ─
      const reactancesData = CalculationEngine.calcLeakageReactance(
        inputs, nominal, stator, airGap, mainDimensions
      );

      const safeReactances = {
        xSigma:     reactancesData.x_sigma_pu || 0.1,
        xq:         1.0,
        r_a:        stator.Ra75pu || 0.02,
        x_sigma_pu: reactancesData.x_sigma_pu || 0.1,
        r_a75:      stator.Ra75pu || 0.02,
      };

      // ── Étape 9 : Diagramme de Blondel ────────────────────────────────────
      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8,
      );

      if (!blondelData.F_Bn || !isFinite(blondelData.F_Bn) || blondelData.F_Bn <= 0) {
        throw new Error(
          `F_Bn invalide (${blondelData.F_Bn}). ` +
          `F_Bn_star=${blondelData.F_Bn_star}, F_0=${noLoadData.F_0}`
        );
      }

      const safeReaction = {
        coefficients: (blondelData.coefficients ?? {}) as Record<string, number>,
        F_a: blondelData.F_a || 0,
      };

      if (typeof safeReaction.coefficients['k_ad'] !== 'number' || !isFinite(safeReaction.coefficients['k_ad'])) {
        throw new Error(
          `k_ad manquant dans les coefficients de réaction : ${JSON.stringify(safeReaction.coefficients)}`
        );
      }

      // ── Étape 10 : Système d'excitation — toujours recalculé ─────────────
      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f,
      );

      if (!excitationData?.coilSizing?.L_Bmoy_cm || !excitationData?.commercialWire?.section_mm2) {
        throw new Error(
          `Structure excitationData incomplète : ${JSON.stringify(excitationData?.coilSizing)}`
        );
      }

      // ── Étape 11 : Paramètres dynamiques ──────────────────────────────────
      const dynParams = CalculationEngine.calcMachineParameters(
        nominal, airGap, noLoadData, safeReactances, safeReaction,
        excitationData, mainDimensions, 1.095, inputs.f,
      );

      // ── Étape 12 : Courts-circuits ─────────────────────────────────────────
      const shortCircuitData = CalculationEngine.calcShortCircuitCurrents(
        nominal, dynParams, blondelData, 1.08,
      );

      // ── Étape 13 : Surcharge statique ──────────────────────────────────────
      const overloadData = CalculationEngine.calcStaticOverload(
        inputs.cosPhi || 0.8, dynParams, blondelData, shortCircuitData,
      );

      // ── Étape 14 : Pertes et rendement ─────────────────────────────────────
      const engineLosses = CalculationEngine.calcLossesAndEfficiency(
        inputs, nominal, mainDimensions, stator, airGap, excitationData, safeReactances,
      );

      // ── Masses d'acier (calcul local) ──────────────────────────────────────
      const Kf_local      = 0.93;
      const gamma_c       = 7.65;
      const hc_cm         = stator.hc || ((mainDimensions.DaNorm - mainDimensions.D) / 20 - 5);
      const he_cm_local   = (stator.he || 68) / 10;
      const D_moy_culasse = mainDimensions.D + 2 * he_cm_local + hc_cm;
      const V_c_dm3       = Math.PI * D_moy_culasse * hc_cm * mainDimensions.l1 * Kf_local * 1e-3;
      const G_c           = V_c_dm3 * gamma_c;
      const bd1_cm_local  = stator.bd1 || 1.2;
      const G_d           = stator.Z1 * bd1_cm_local * he_cm_local * mainDimensions.l1 * Kf_local * gamma_c * 1e-3;

      // ── Détail excitation pour l'affichage ─────────────────────────────────
      const I_B            = excitationData.electricalSpecs.I_B_Nominal_A || 0;
      const R_B75          = excitationData.electricalSpecs.R_B_75_Ohm    || 0;
      const P_B_Joule_kW   = Math.round(Math.pow(I_B, 2) * R_B75 * 1e-3 * 100) / 100;
      const P_B_Balais_kW  = Math.round(((2 * 1.0 * I_B) / 0.89) * 1e-3 * 100) / 100;
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
        details: { P_B_Joule_kW, P_B_Balais_kW, P_sup_kW_display },
        allData: {
          rotorData, noLoadData,
          reactancesData: safeReactances, reactancesRaw: reactancesData,
          blondelData, excitationData, dynParams, shortCircuitData, overloadData,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Step14] Erreur de calcul :', msg);
      setCalcError(msg);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, nominal, mainDimensions, airGap, stator]);

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
      allData: { rotorData, reactancesData, excitationData, dynParams, shortCircuitData, overloadData },
    } = results;

    // ── Grandeurs de base ──────────────────────────────────────────────────────
    const Sn_kVA   = nominal.Sn;
    const Unl      = inputs.Un;
    const cosPhi   = inputs.cosPhi;
    const nn       = inputs.nn;
    const twop     = 2 * ((60 * inputs.f) / inputs.nn);

    // ── Dimensions — noms exacts de MainDimensions ────────────────────────────
    const D        = mainDimensions.D;
    const Da       = mainDimensions.DaNorm;
    const tau      = mainDimensions.tau;
    const l        = mainDimensions.l;       // longueur du fer actif (key "l" dans calcMainDimensions)
    const delta    = airGap.delta;

    // ── Stator — noms exacts de StatorDesign ──────────────────────────────────
    const Z1       = stator.Z1;
    const q1       = stator.q1;
    const w1       = stator.w1;
    const K01      = stator.Kw1;             // calcStator retourne Kw1 (pas K01)
    const Ra75     = stator.Ra75;
    const Gm       = stator.Gm;

    // ── Rotor — noms exacts de RotorDesign (calcRotor retourne bp, bM, hM) ────
    const rotor    = rotorData as any;
    const bp       = rotor?.bp;
    const bM       = rotor?.bM;
    const hM       = rotor?.hM;

    // ── Excitation — electricalSpecs + coilSizing (calcExcitationSystem) ──────
    const I_Bn     = excitationData?.electricalSpecs?.I_B_Nominal_A;
    const G_B      = excitationData?.coilSizing?.weight_copper_kg; // clé exacte du return

    // ── Réactances — reactances_pu (calcMachineParameters) ───────────────────
    const pu       = (dynParams as any)?.reactances_pu;
    const xSigma   = reactancesData?.xSigma;              // dans safeReactances
    const xd       = pu?.x_d;
    const xq       = pu?.x_q;
    const xd_prime = pu?.x_d_prime;
    const x2       = pu?.x_2;

    // ── Constantes de temps — timeConstants_s (calcMachineParameters) ─────────
    const tc       = (dynParams as any)?.timeConstants_s;
    const Td0      = tc?.T_d0;
    const Td_prime = tc?.T_d_prime;
    const Ta       = tc?.T_a;

    // ── Performances ──────────────────────────────────────────────────────────
    const Icc0     = (shortCircuitData as any)?.results_pu?.I_cc0;   // calcShortCircuitCurrents
    const Iccn     = (shortCircuitData as any)?.results_pu?.I_ccn;
    const Mmax     = (overloadData as any)?.static_overload_S;        // calcStaticOverload
    const SigmaP   = losses_kW.total_SigmaP;
    const eta      = efficiency.eta_percentage;

    return [
      // ─── 1. Cahier des charges ───────────────────────────────────────────────
      { category: '1. Cahier des charges', label: 'Puissance apparente nominale',  symbol: 'Sn',       value: fmt(Sn_kVA, 0),    unit: 'kVA'    },
      { category: '1. Cahier des charges', label: 'Tension nominale (entre phases)', symbol: 'Unl',    value: fmt(Unl, 0),       unit: 'V'      },
      { category: '1. Cahier des charges', label: 'Facteur de puissance',           symbol: 'cos(phi)', value: fmt(cosPhi, 2),   unit: ''       },
      { category: '1. Cahier des charges', label: 'Vitesse nominale',               symbol: 'nn',       value: fmt(nn, 0),        unit: 'tr/min' },
      { category: '1. Cahier des charges', label: 'Nombre de pôles',                symbol: '2p',       value: fmt(twop, 0),      unit: ''       },

      // ─── 2. Dimensions ───────────────────────────────────────────────────────
      { category: '2. Dimensions', label: 'Diamètre intérieur stator', symbol: 'D',   value: fmt(D, 1),    unit: 'cm' },
      { category: '2. Dimensions', label: 'Diamètre extérieur stator', symbol: 'Da',  value: fmt(Da, 1),   unit: 'cm' },
      { category: '2. Dimensions', label: 'Pas polaire',               symbol: 'tau', value: fmt(tau, 2),  unit: 'cm' },
      { category: '2. Dimensions', label: 'Longueur du fer actif',     symbol: 'l',   value: fmt(l, 1),    unit: 'cm' },
      { category: '2. Dimensions', label: 'Entrefer',                  symbol: 'delta', value: fmt(delta, 2), unit: 'cm' },

      // ─── 3. Stator ───────────────────────────────────────────────────────────
      { category: '3. Stator', label: "Nombre d'encoches",            symbol: 'Z1',   value: fmt(Z1, 0),   unit: ''   },
      { category: '3. Stator', label: 'Encoches par pôle et par phase', symbol: 'q1', value: fmt(q1, 0),   unit: ''   },
      { category: '3. Stator', label: 'Spires par phase',             symbol: 'w1',   value: fmt(w1, 0),   unit: ''   },
      { category: '3. Stator', label: "Facteur d'enroulement",        symbol: 'K01',  value: fmt(K01, 3),  unit: ''   },
      { category: '3. Stator', label: 'Résistance de bobinage (75°C)', symbol: 'Ra75', value: fmt(Ra75, 3), unit: 'Ω'     },
      { category: '3. Stator', label: 'Poids cuivre stator',          symbol: 'Gm',   value: fmt(Gm, 2),   unit: 'kg' },

      // ─── 4. Rotor ────────────────────────────────────────────────────────────
      { category: '4. Rotor', label: "Largeur de l'épanouissement polaire", symbol: 'bp',  value: fmt(bp, 3),  unit: 'cm' },
      { category: '4. Rotor', label: 'Largeur du noyau polaire',             symbol: 'bM',  value: fmt(bM, 3),  unit: 'cm' },
      { category: '4. Rotor', label: 'Hauteur du noyau polaire',             symbol: 'hM',  value: fmt(hM, 2),  unit: 'cm' },
      { category: '4. Rotor', label: "Courant d'excitation nominal",         symbol: 'IBn', value: fmt(I_Bn, 1), unit: 'A'  },
      { category: '4. Rotor', label: "Poids cuivre d'excitation",            symbol: 'GB',  value: fmt(G_B, 2),  unit: 'kg' },

      // ─── 5. Réactances ───────────────────────────────────────────────────────
      { category: '5. Reactances', label: 'Réactance de dispersion statorique', symbol: "x_sigma", value: fmt(xSigma, 3), unit: 'p.u.' },
      { category: '5. Reactances', label: 'Réactance synchrone longitudinale',  symbol: 'xd',      value: fmt(xd, 3),     unit: 'p.u.' },
      { category: '5. Reactances', label: 'Réactance synchrone transversale',   symbol: 'xq',      value: fmt(xq, 3),     unit: 'p.u.' },
      { category: '5. Reactances', label: "Réactance transitoire longitudinale", symbol: "x'd",    value: fmt(xd_prime, 3), unit: 'p.u.' },
      { category: '5. Reactances', label: "Réactance d'ordre inverse",          symbol: 'x2',      value: fmt(x2, 3),     unit: 'p.u.' },

      // ─── 6. Constantes de temps ──────────────────────────────────────────────
      { category: '6. Constantes de temps', label: "Constante de temps à vide",       symbol: 'Td0',  value: fmt(Td0, 3),     unit: 's' },
      { category: '6. Constantes de temps', label: "Constante de temps transitoire",  symbol: "T'd",  value: fmt(Td_prime, 3), unit: 's' },
      { category: '6. Constantes de temps', label: "Constante de temps d'induit",     symbol: 'Ta',   value: fmt(Ta, 3),      unit: 's' },

      // ─── 7. Performances ─────────────────────────────────────────────────────
      { category: '7. Performances', label: 'Courant de court-circuit à vide',   symbol: 'Icc0',  value: fmt(Icc0, 3),   unit: 'p.u.' },
      { category: '7. Performances', label: 'Courant de court-circuit nominal',  symbol: 'Iccn',  value: fmt(Iccn, 3),   unit: 'p.u.' },
      { category: '7. Performances', label: 'Surcharge statique',                symbol: 'Mmax*', value: fmt(Mmax, 2),   unit: 'p.u.' },
      { category: '7. Performances', label: 'Pertes totales',                    symbol: 'SigmaP', value: fmt(SigmaP, 1), unit: 'kW'  },
      { category: '7. Performances', label: 'Rendement nominal',                 symbol: 'eta',   value: fmt(eta, 2),    unit: '%'   },
    ];
  };

  // =========================================================================
  // EXPORT EXCEL
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
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Outil de Dimensionnement — Machine Synchrone';
    workbook.created = new Date();
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
      '1': 'FFFFF3CD', '2': 'FFD1ECF1', '3': 'FFD4EDDA',  '4': 'FFE2D9F3',
      '5': 'FFFDE2E2', '6': 'FFFFECD1', '7': 'FFE8F4FD',  '8': 'FFF0F4C2',
      '9': 'FFE8D5F5','10': 'FFFCE4EC','11': 'FFE3F2FD', '12': 'FFF1F8E9',
     '13': 'FFFDF6E3','14': 'FFFFE0E0',
    };
    sorted.forEach((r) => {
      const numericValue = toNumeric(r.value);
      const stepKey = r.category.match(/^(\d+)/)?.[1] ?? '';
      let bgColor = CATEGORY_COLORS[stepKey] ?? 'FFFFFFFF';
      const isGreen = r.symbol === 'eta';
      const isRed   = r.symbol === 'SigmaP';
      if (isGreen) bgColor = 'FFC6EFCE';
      if (isRed)   bgColor = 'FFFFC7CE';
      const isBold = isGreen || isRed;
      const row = sheet.addRow({ category: r.category, label: r.label, symbol: r.symbol, value: numericValue, unit: r.unit });
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        if (isBold) cell.font = { bold: true };
        cell.alignment = colNumber <= 2
          ? { vertical: 'middle', horizontal: 'left', wrapText: true }
          : { vertical: 'middle', horizontal: 'center', wrapText: false };
        if (colNumber === 4 && typeof numericValue === 'number') cell.numFmt = '#,##0.####';
      });
      row.height = 16;
    });
    sheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } };
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'Rapport_Dimensionnement_Alternateur.xlsx',
    );
  };

  const exportToPDF = () => window.print();

  // =========================================================================
  // LATEX
  // =========================================================================
  const [latexCode, setLatexCode] = useState<string | null>(null);
  const [latexCopied, setLatexCopied] = useState(false);

  const escapeLatex = (str: string): string =>
    str
      .replace(/\\/g, '\\textbackslash{}').replace(/&/g, '\\&').replace(/%/g, '\\%')
      .replace(/\$/g, '\\$').replace(/Σ/g, '\\Sigma').replace(/η/g, '\\eta')
      .replace(/φ/g, '\\varphi').replace(/τ/g, '\\tau').replace(/α/g, '\\alpha')
      .replace(/δ/g, '\\delta').replace(/σ/g, '\\sigma').replace(/λ/g, '\\lambda')
      .replace(/ε/g, '\\varepsilon').replace(/Ω/g, '\\Omega').replace(/π/g, '\\pi')
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
    const lines: string[] = [
      '% ================================================================',
      '% RAPPORT DE DIMENSIONNEMENT — MACHINE SYNCHRONE',
      `% Pn = ${inputs?.Pn ?? '?'} kW | Un = ${inputs?.Un ?? '?'} V | cos(phi) = ${inputs?.cosPhi ?? '?'}`,
      '% ================================================================',
      '',
      '\\begin{center}',
      '  {\\LARGE\\bfseries Rapport de Dimensionnement}\\\\[4pt]',
      '  {\\large Machine Synchrone --- Alternateur}\\\\[6pt]',
      `  $P_n = ${inputs?.Pn ?? '?'}$~kW \\quad $U_n = ${inputs?.Un ?? '?'}$~V`,
      '\\end{center}',
      '',
      '\\rowcolors{2}{gray!5}{white}',
      '\\begin{longtable}{>{\\bfseries\\small}p{3.8cm} >{\\ttfamily\\small}l >{\\small}r >{\\small\\itshape}l}',
      '  \\toprule',
      "  \\multicolumn{1}{l}{\\textbf{Param\\`etre}} & \\textbf{Symbole} & \\textbf{Valeur} & \\textbf{Unit\\'e} \\\\",
      '  \\midrule',
      '  \\endfirsthead',
      '  \\bottomrule',
      '  \\endlastfoot',
      '',
    ];
    categories.forEach((category) => {
      lines.push(`  \\rowcolor{gray!25}`);
      lines.push(`  \\multicolumn{4}{l}{\\textbf{\\small ${escapeLatex(category)}}} \\\\`);
      lines.push('  \\midrule');
      byCategory[category].forEach((row) => {
        const isGreen = row.symbol === 'eta';
        const isRed   = row.symbol === 'SigmaP';
        if (isGreen) lines.push('  \\rowcolor{green!12}');
        else if (isRed) lines.push('  \\rowcolor{red!10}');
        const val = isGreen || isRed ? `\\textbf{${escapeLatex(row.value)}}` : escapeLatex(row.value);
        lines.push(`  ${escapeLatex(row.label)} & \\texttt{${escapeLatex(row.symbol)}} & ${val} & ${escapeLatex(row.unit)} \\\\`);
      });
      lines.push('');
    });
    lines.push("  \\caption{R\\'ecapitulatif complet du dimensionnement}");
    lines.push("  \\label{tab:dimensionnement-complet}");
    lines.push("\\end{longtable}");
    setLatexCode(lines.join('\n'));
    setLatexCopied(false);
  };

  const handleCopyLatex = () => {
    if (!latexCode) return;
    const copy = () => {
      const ta = document.createElement('textarea');
      ta.value = latexCode;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try { document.execCommand('copy'); setLatexCopied(true); setTimeout(() => setLatexCopied(false), 2500); }
      finally { document.body.removeChild(ta); }
    };
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(latexCode)
        .then(() => { setLatexCopied(true); setTimeout(() => setLatexCopied(false), 2500); })
        .catch(copy);
    else copy();
  };

  // =========================================================================
  // GUARD
  // =========================================================================
  if (!results) {
    const missingInputs = !inputs || !nominal || !mainDimensions || !stator || !airGap;
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Pertes et Rendement Final">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10 space-y-3">
          <p className={typo.errorTitle}>
            Erreur : Impossible de calculer le bilan énergétique.
          </p>
          {missingInputs ? (
            <p className={typo.errorBody}>
              Données de base manquantes. Vérifiez que les étapes 1 à 5 sont complètes
              (Entrées, Nominales, Dimensions, Stator, Entrefer).
            </p>
          ) : (
            <p className={typo.errorBody}>
              Un calcul intermédiaire a échoué. Videz le cache du navigateur
              (localStorage) et rechargez la page, puis re-saisissez vos données.
            </p>
          )}
          {calcError && (
            <details className="mt-2">
              <summary className="font-mono text-xs text-destructive/70 cursor-pointer select-none">
                Détail technique (cliquez pour afficher)
              </summary>
              <pre className="mt-2 p-3 rounded bg-black/10 font-mono text-xs text-destructive/80 whitespace-pre-wrap break-all">
                {calcError}
              </pre>
            </details>
          )}
        </div>
      </StepLayout>
    );
  }

  const { losses_kW, efficiency, masses, details } = results;
  const pertesFerMeca = losses_kW.iron_yoke_Pc + losses_kW.iron_teeth_Pcd + losses_kW.pole_surface_Psur + losses_kW.mechanical_Pmec;
  const pertesJoule   = losses_kW.stator_copper_Pelec + losses_kW.excitation_PB;
  const puissanceAbsorbee = efficiency.P_active_nominal_kW + losses_kW.total_SigmaP;
  const isGoodEff = efficiency.eta_percentage >= 90;

  const exportData = getExportData();
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
      description="Bilan énergétique complet, évaluation des pertes et rendement global de la machine"
    >
      {/* ═══ 1. BANDEAU ═══════════════════════════════════════════════════════ */}
      <StepBanner />

      {/* ═══ 2. TABLEAU DE BORD JAUGE ════════════════════════════════════════ */}
      <SectionSeparator>Tableau de bord — Performances globales</SectionSeparator>

      <div className="mb-8 print:hidden">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden font-mono shadow-sm">
          {/* En-tête */}
          <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex justify-between items-center">
            <span className="font-[Inter,sans-serif] text-[9px] text-slate-400 tracking-widest">PWR-EFF-014</span>
            <span className="font-[Inter,sans-serif] text-[11px] font-semibold text-slate-600 dark:text-slate-300 tracking-[0.1em]">
              TABLEAU DE BORD — PERFORMANCES &amp; RENDEMENT
            </span>
            <span className="font-[Inter,sans-serif] text-[9px] text-slate-400 tracking-widest">REV.A</span>
          </div>

          {/* Corps 3 colonnes */}
          <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Col 1 : Jauge */}
            <EfficiencyGauge rendement={efficiency.eta_percentage} />

            {/* Col 2 : Cartes Pn / ΣP */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <p className={`${typo.label} text-emerald-700 dark:text-emerald-400`}>Puissance Utile</p>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="font-mono text-5xl font-black tabular-nums text-emerald-800 dark:text-emerald-200">
                    {fmt(efficiency.P_active_nominal_kW, 0)}
                  </span>
                  <span className="font-mono text-xl text-emerald-600 mb-1 font-bold">kW</span>
                </div>
                <div className="w-full h-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${puissanceAbsorbee > 0 ? (efficiency.P_active_nominal_kW / puissanceAbsorbee * 100).toFixed(1) : 0}%` }} />
                </div>
                <p className="font-[Inter,sans-serif] text-[8px] text-emerald-600 mt-1 text-right">
                  {puissanceAbsorbee > 0 ? (efficiency.P_active_nominal_kW / puissanceAbsorbee * 100).toFixed(1) : '—'} % de P_abs
                </p>
              </div>

              <div className="flex-1 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <p className={`${typo.label} text-red-700 dark:text-red-400`}>Pertes Totales ΣP</p>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="font-mono text-5xl font-black tabular-nums text-red-800 dark:text-red-200">
                    {fmt(losses_kW.total_SigmaP, 1)}
                  </span>
                  <span className="font-mono text-xl text-red-600 mb-1 font-bold">kW</span>
                </div>
                <div className="w-full h-2 bg-red-100 dark:bg-red-900/50 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-1000"
                    style={{ width: `${puissanceAbsorbee > 0 ? (losses_kW.total_SigmaP / puissanceAbsorbee * 100).toFixed(1) : 0}%` }} />
                </div>
                <p className="font-[Inter,sans-serif] text-[8px] text-red-600 mt-1 text-right">
                  {puissanceAbsorbee > 0 ? (losses_kW.total_SigmaP / puissanceAbsorbee * 100).toFixed(1) : '—'} % de P_abs
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className={`${typo.label} mb-1`}>Bilan Énergétique</p>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-300">
                  P<sub>abs</sub> = P<sub>n</sub> + ΣP
                </p>
                <p className="font-mono text-[10px] text-slate-400 mt-1">
                  {fmt(puissanceAbsorbee, 1)} = {fmt(efficiency.P_active_nominal_kW, 1)} + {fmt(losses_kW.total_SigmaP, 1)} kW
                </p>
              </div>
            </div>

            {/* Col 3 : Répartition des pertes */}
            <div className="flex flex-col gap-4">
              {[
                { label: 'Fer culasse',    val: losses_kW.iron_yoke_Pc,       color: '#534AB7' },
                { label: 'Fer dents',      val: losses_kW.iron_teeth_Pcd,     color: '#BA7517' },
                { label: 'Surface pôles',  val: losses_kW.pole_surface_Psur,  color: '#7F77DD' },
                { label: 'Mécaniques',     val: losses_kW.mechanical_Pmec,    color: '#BA7517' },
                { label: 'Joule stator',   val: losses_kW.stator_copper_Pelec,color: '#E24B4A' },
                { label: 'Excitation',     val: losses_kW.excitation_PB,      color: '#D4537E' },
                { label: 'Supplémentaires',val: losses_kW.supplementary_Psup, color: '#1D9E75' },
              ].filter(b => b.val > 0.001).length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                  <p className={`${typo.label} mb-3 text-center`}>Répartition des Pertes</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Fer culasse',    val: losses_kW.iron_yoke_Pc,       color: '#534AB7' },
                      { label: 'Fer dents',      val: losses_kW.iron_teeth_Pcd,     color: '#BA7517' },
                      { label: 'Surface pôles',  val: losses_kW.pole_surface_Psur,  color: '#7F77DD' },
                      { label: 'Mécaniques',     val: losses_kW.mechanical_Pmec,    color: '#BA7517' },
                      { label: 'Joule stator',   val: losses_kW.stator_copper_Pelec,color: '#E24B4A' },
                      { label: 'Excitation',     val: losses_kW.excitation_PB,      color: '#D4537E' },
                      { label: 'Supplémentaires',val: losses_kW.supplementary_Psup, color: '#1D9E75' },
                    ].filter(b => b.val > 0.001).map(({ label, val, color }) => {
                      const pct = losses_kW.total_SigmaP > 0 ? (val / losses_kW.total_SigmaP) * 100 : 0;
                      return (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-[Inter,sans-serif] text-[10px]" style={{ color }}>{label}</span>
                            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                              {fmt(val, 2)} kW <span className="text-slate-400 ml-1">({pct.toFixed(1)}%)</span>
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

              {/* Formule résumé */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className={`${typo.label} mb-2`}>Formule</p>
                <div className="font-mono text-sm text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
                  <span className={`text-xl italic font-bold ${isGoodEff ? 'text-emerald-600' : 'text-amber-600'}`}>η</span>
                  <span>=</span>
                  <span className="inline-flex flex-col items-center mx-1 align-middle">
                    <span className="border-b border-slate-400 px-2 pb-0.5 text-emerald-700 dark:text-emerald-400">
                      P<sub>n</sub>
                    </span>
                    <span className="pt-0.5 text-slate-400">
                      P<sub>n</sub> + ΣP
                    </span>
                  </span>
                  <span>=</span>
                  <span className={`font-bold text-base ${isGoodEff ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {fmt(efficiency.eta_percentage, 2)} %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 3. RÉSULTATS & FORMULES ════════════════════════════════════════ */}
      <SectionSeparator>Résultats numériques &amp; formules</SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 print:hidden">

        {/* ══ COLONNE GAUCHE : KPI + TABLEAUX ══════════════════════════════ */}
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Rendement Global (η)" value={fmt(efficiency.eta_percentage, 2)} unit="%" accent="green" />
            <KpiCard label="Pertes Totales (ΣP)"  value={fmt(losses_kW.total_SigmaP, 1)}   unit="kW" accent="red" />
            <KpiCard label="Pertes Fer & Méca"    value={fmt(pertesFerMeca, 1)}             unit="kW" accent="amber" />
            <KpiCard label="Pertes Joules"         value={fmt(pertesJoule, 1)}               unit="kW" accent="violet" />
          </div>

          <MathResultTable
            title="Masses d'Acier — Stator"
            rows={[
              { label: 'Diamètre moyen culasse (tore)', symbol: <><Var>D<sub>moy</sub></Var></>, value: fmt(masses.D_moy_culasse, 2), unit: 'cm'  },
              { label: 'Volume torique culasse',        symbol: <><Var>V<sub>c</sub></Var></>,   value: fmt(masses.V_c_dm3, 3),       unit: 'dm³' },
              { label: 'Masse acier culasse stator',    symbol: <><Var>G<sub>c</sub></Var></>,   value: fmt(masses.G_c, 2),           unit: 'kg'  },
              { label: 'Masse acier dents stator',      symbol: <><Var>G<sub>d</sub></Var></>,   value: fmt(masses.G_d, 2),           unit: 'kg'  },
            ]}
          />

          <MathResultTable
            title="Détail des Pertes Constantes (Fer et Mécaniques)"
            rows={[
              { label: 'Pertes fer - Culasse stator',  symbol: <><Var>P<sub>c</sub></Var></>,   value: fmt(losses_kW.iron_yoke_Pc, 2),      unit: 'kW' },
              { label: 'Pertes fer - Dents stator',    symbol: <><Var>P<sub>cd</sub></Var></>,  value: fmt(losses_kW.iron_teeth_Pcd, 2),    unit: 'kW' },
              { label: 'Pertes surface - Pôles rotor', symbol: <><Var>P<sub>sur</sub></Var></>, value: fmt(losses_kW.pole_surface_Psur, 2), unit: 'kW' },
              { label: 'Pertes mécaniques',            symbol: <><Var>P<sub>mec</sub></Var></>, value: fmt(losses_kW.mechanical_Pmec, 2),   unit: 'kW' },
            ]}
          />

          <MathResultTable
            title="Détail des Pertes Variables (Joules)"
            rows={[
              { label: 'Pertes électriques stator',            symbol: <><Var>P<sub>elec</sub></Var></>,    value: fmt(losses_kW.stator_copper_Pelec, 2), unit: 'kW' },
              { label: 'Excitation — Joule (I²·R_{B75})',      symbol: <><Var>P<sub>B,Joule</sub></Var></>, value: fmt(details.P_B_Joule_kW, 2),          unit: 'kW' },
              { label: 'Excitation — Balais (2·ΔU·I_B/η_B)',  symbol: <><Var>P<sub>B,bal</sub></Var></>,   value: fmt(details.P_B_Balais_kW, 2),         unit: 'kW' },
              { label: "Pertes d'excitation totales",          symbol: <><Var>P<sub>B</sub></Var></>,       value: fmt(losses_kW.excitation_PB, 2),       unit: 'kW' },
              { label: 'Pertes supplémentaires (0.5 % Pn)',   symbol: <><Var>P<sub>sup</sub></Var></>,     value: fmt(details.P_sup_kW_display, 2),      unit: 'kW' },
            ]}
          />

          <MathResultTable
            title="Bilan Énergétique Global"
            rows={[
              { label: 'Puissance apparente',     symbol: <><Var>S<sub>n</sub></Var></>,        value: fmt(nominal?.Sn, 1),                    unit: 'kVA' },
              { label: 'Facteur de puissance',    symbol: <><Op>cos</Op>(<Var>φ</Var>)</>,       value: fmt(inputs?.cosPhi, 2),                 unit: ''    },
              { label: 'Puissance active utile',  symbol: <><Var>P<sub>n</sub></Var></>,         value: fmt(efficiency.P_active_nominal_kW, 1), unit: 'kW'  },
              { label: 'Somme totale des pertes', symbol: <><Var>ΣP</Var></>,                    value: fmt(losses_kW.total_SigmaP, 1),         unit: 'kW'  },
            ]}
          />

          {/* Indicateur de qualité */}
          <div className="rounded-xl border border-border bg-white dark:bg-slate-900/60 shadow-sm p-5">
            <h3 className={`${typo.criteriaTitle} mb-4`}>Évaluation du Rendement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Alternateur standard',  value: 'η ≥ 90 %', accent: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20' },
                { label: 'Niveau acceptable',     value: '75 % ≤ η < 90 %', accent: 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20' },
              ].map(c => (
                <div key={c.label} className={`p-3 rounded-lg border ${c.accent} flex flex-col gap-1`}>
                  <p className={typo.label}>{c.label}</p>
                  <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{c.value}</p>
                </div>
              ))}
            </div>
            <p className={typo.criteriaNote}>
              * La machine présente un rendement de η = {fmt(efficiency.eta_percentage, 2)} %,
              ce qui signifie que {fmt(losses_kW.total_SigmaP / puissanceAbsorbee * 100, 1)} % de la
              puissance absorbée est dissipée sous forme de chaleur.
            </p>
          </div>
        </div>

        {/* ══ COLONNE DROITE : FORMULES ════════════════════════════════════ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 h-fit backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className={typo.cardTitle}>Formules Mathématiques</CardTitle>
            <CardDescription className={typo.cardDesc}>
              Bilan des puissances et rendement global — valeurs en kW
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* 1. Pertes fer culasse */}
            <Formula label="1 — Pertes Fer Culasse" accent="sky">
              <Var>P<sub>c</sub></Var>{sym.eq}
              <Var>k<sub>dc</sub></Var>{sym.dot}<Var>ρ<sub>c</sub></Var>{sym.dot}
              <Var>G<sub>c</sub></Var>{sym.dot}<Num>10⁻³</Num>
            </Formula>

            {/* 2. Pertes fer dents */}
            <Formula label="2 — Pertes Fer Dents" accent="emerald">
              <Var>P<sub>cd</sub></Var>{sym.eq}
              <Var>k<sub>d</sub></Var>{sym.dot}<Var>ρ<sub>cd</sub></Var>{sym.dot}
              <Var>G<sub>d</sub></Var>{sym.dot}<Num>10⁻³</Num>
            </Formula>

            {/* 3. Pertes de surface */}
            <Formula label="3 — Pertes de Surface (Rotor)" accent="violet">
              <Var>P<sub>sur</sub></Var>{sym.eq}
              <Num>0.6</Num>{sym.dot}<Num>(2p)</Num>{sym.dot}
              <Var>α<sub>0</sub></Var>{sym.dot}<Var>τ</Var>{sym.dot}
              <Var>l<sub>M</sub></Var>{sym.dot}<Var>p<sub>sur</sub></Var>
            </Formula>

            {/* 4. Pertes mécaniques */}
            <Formula label="4 — Pertes Mécaniques" accent="amber">
              <Var>P<sub>mec</sub></Var>{sym.eq}
              <Num>0.8</Num>{sym.dot}<Num>(2p)</Num>{sym.dot}
              <span className="mx-1">(</span>
              <Frac num={<Var>v<sub>p</sub></Var>} den={<Num>40</Num>} />
              <span className="mx-0.5">)³</span>{sym.dot}
              {sym.sqrt(<Frac num={<Var>l<sub>M</sub></Var>} den={<Num>19</Num>} />)}
            </Formula>

            {/* 5. Pertes Joule stator */}
            <Formula label="5 — Pertes Électriques Stator (Joule)" accent="rose">
              <Var>P<sub>elec</sub></Var>{sym.eq}
              <Var>m</Var>{sym.dot}<Var>I<sub>n</sub></Var><sup>2</sup>{sym.dot}
              <Var>R<sub>a75</sub></Var>{sym.dot}<Num>10⁻³</Num>
            </Formula>

            {/* 6. Pertes excitation */}
            <Formula label="6 — Pertes d'Excitation (Joule + Balais)" accent="cyan">
              <div className="flex flex-col items-center w-full gap-2">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>P<sub>B,Joule</sub></Var>{sym.eq}
                  <Var>I<sub>B</sub></Var><sup>2</sup>{sym.dot}<Var>R<sub>B75</sub></Var>
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>P<sub>B,bal</sub></Var>{sym.eq}
                  <Frac
                    num={<><Num>2</Num>{sym.dot}<Var>ΔU</Var>{sym.dot}<Var>I<sub>B</sub></Var></>}
                    den={<Var>η<sub>B</sub></Var>}
                  />
                </div>
              </div>
            </Formula>

            {/* 6b. Pertes supplémentaires */}
            <Formula label="6b — Pertes Supplémentaires" accent="slate">
              <Var>P<sub>sup</sub></Var>{sym.eq}
              <Num>0.005</Num>{sym.dot}<Var>P<sub>n</sub></Var>
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 ml-2">(0.5 % de P<sub>n</sub>)</span>
            </Formula>

            {/* Séparateur */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-5" />

            {/* 7. Puissance utile */}
            <Formula label="7 — Puissance Active Utile" accent="emerald">
              <Var className="text-emerald-700 dark:text-emerald-400">P<sub>n</sub></Var>{sym.eq}
              <Var>S<sub>n</sub></Var>{sym.dot}
              {sym.cos}({sym.phi})
            </Formula>

            {/* 8. Rendement */}
            <Formula label="8 — Rendement Global" accent="sky">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <span className="font-mono italic font-bold text-2xl text-sky-600 dark:text-sky-400">η</span>
                  {sym.eq}
                  <Num>1 −</Num>
                  <Frac
                    num={<span className="text-red-600 dark:text-red-400 font-bold">ΣP</span>}
                    den={
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">P<sub>n</sub></span>
                        <span className="mx-1">+</span>
                        <span className="text-red-600 dark:text-red-400 font-bold">ΣP</span>
                      </>
                    }
                  />
                </div>
                <div
                  className={`font-[Inter,sans-serif] text-xs font-semibold px-3 py-1.5 rounded-full ${
                    isGoodEff
                      ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  η = {fmt(efficiency.eta_percentage, 2)} %{' '}
                  {isGoodEff ? '→ Excellent ✅' : '→ À optimiser ⚠️'}
                </div>
              </div>
            </Formula>

          </CardContent>
        </Card>
      </div>

      {/* ═══ 4. EXPORTATION ═════════════════════════════════════════════════ */}
      <SectionSeparator>Exportation des résultats</SectionSeparator>

      <div className="pt-2 pb-8 print:hidden">
        <div className="flex flex-col items-center justify-center text-center space-y-6">

          <div>
            <h2 className="font-[Inter,sans-serif] text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Exportation des Résultats
            </h2>
            <p className="font-[Inter,sans-serif] text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
              Téléchargez l'ensemble des paramètres calculés (de l'étape 1 à 14) au format Excel,
              générez le code LaTeX ou imprimez un rapport PDF de cette page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-wrap justify-center">
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors font-[Inter,sans-serif]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger Excel (.xlsx)
            </button>

            <button
              onClick={exportToPDF}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors font-[Inter,sans-serif]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer / Sauvegarder en PDF
            </button>

            <button
              onClick={handleGenerateLatex}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors font-[Inter,sans-serif]"
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
                    <span className="ml-3 font-mono text-xs text-slate-400">
                      rapport_alternateur.tex
                    </span>
                  </div>
                  <button
                    onClick={handleCopyLatex}
                    className={`flex items-center gap-1.5 font-[Inter,sans-serif] text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-200 ${
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
              <p className="mt-2 font-[Inter,sans-serif] text-xs text-slate-500 text-center">
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

      {/* ═══ 5. RAPPORT IMPRESSION ══════════════════════════════════════════ */}
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
            {[
              { label: 'Rendement Global', value: `${fmt(efficiency.eta_percentage, 2)} %`,           color: '#16a34a' },
              { label: 'Pertes Totales',   value: `${fmt(losses_kW.total_SigmaP, 1)} kW`,             color: '#dc2626' },
              { label: 'Puissance Utile',  value: `${fmt(efficiency.P_active_nominal_kW, 1)} kW`,     color: '#2563eb' },
            ].map(k => (
              <div key={k.label} style={{ flex: 1, border: `2px solid ${k.color}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{k.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: k.color, margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {Object.entries(exportByCategory).map(([category, rows]) => (
            <div key={category} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase',
                letterSpacing: '1px', color: '#fff', backgroundColor: '#334155',
                padding: '6px 12px', margin: '0 0 0', borderRadius: '4px 4px 0 0' }}>
                {category}
              </h2>
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
                    <tr key={i} style={{
                      backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc',
                      fontWeight: row.symbol === 'SigmaP' || row.symbol === 'eta' ? 'bold' : 'normal',
                      color: row.symbol === 'eta' ? '#16a34a' : row.symbol === 'SigmaP' ? '#dc2626' : '#111',
                    }}>
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
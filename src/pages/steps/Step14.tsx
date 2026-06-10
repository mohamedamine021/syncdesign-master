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
// JAUGE CANVAS
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
// RAPPORT PDF — TABLEAU MULTI-PAGES — STYLE IDENTIQUE AU PDF DE RÉFÉRENCE
// 5 colonnes : Catégorie | Paramètre | Symbole | Valeur | Unité
// ─────────────────────────────────────────────────────────────────────────────

// Palette : une couleur de fond claire par catégorie (comme le .xlsx)
const CAT_COLORS: Record<string, { bg: string; text: string; row0: string; row1: string }> = {
  '1':  { bg:'#1E3A5F', text:'#fff', row0:'#FFFDE7', row1:'#FFF8E1' },
  '2':  { bg:'#0D47A1', text:'#fff', row0:'#E3F2FD', row1:'#DBEAFE' },
  '3':  { bg:'#1B5E20', text:'#fff', row0:'#F0FDF4', row1:'#DCFCE7' },
  '4':  { bg:'#4A148C', text:'#fff', row0:'#F5F3FF', row1:'#EDE9FE' },
  '5':  { bg:'#7F1D1D', text:'#fff', row0:'#FFF1F2', row1:'#FFE4E6' },
  '6':  { bg:'#78350F', text:'#fff', row0:'#FFFBEB', row1:'#FEF3C7' },
  '7':  { bg:'#164E63', text:'#fff', row0:'#F0F9FF', row1:'#E0F2FE' },
  '8':  { bg:'#365314', text:'#fff', row0:'#F7FEE7', row1:'#ECFCCB' },
  '9':  { bg:'#3B0764', text:'#fff', row0:'#FAF5FF', row1:'#F3E8FF' },
  '10': { bg:'#134E4A', text:'#fff', row0:'#F0FDFA', row1:'#CCFBF1' },
  '11': { bg:'#1E293B', text:'#fff', row0:'#F8FAFC', row1:'#F1F5F9' },
  '12': { bg:'#7F0000', text:'#fff', row0:'#FFF5F5', row1:'#FEE2E2' },
  '13': { bg:'#431407', text:'#fff', row0:'#FFF7ED', row1:'#FFEDD5' },
  '14': { bg:'#1E1B4B', text:'#fff', row0:'#EEF2FF', row1:'#E0E7FF' },
};

type PRow = { category: string; label: string; symbol: string; value: string; unit: string };

function PdfReport({
  allRows, inputs, nominal, efficiency, losses_kW, fmt,
}: {
  allRows:    PRow[];
  inputs:     { Pn: number; Un: number; cosPhi: number; f: number; nn: number } | null;
  nominal:    { Sn: number; In: number } | null;
  efficiency: { eta_percentage: number; P_active_nominal_kW: number };
  losses_kW:  { iron_yoke_Pc: number; iron_teeth_Pcd: number; pole_surface_Psur: number;
                mechanical_Pmec: number; stator_copper_Pelec: number;
                supplementary_Psup: number; excitation_PB: number; total_SigmaP: number };
  fmt: (v: number | null | undefined, d?: number) => string;
}) {
  const Pabs     = efficiency.P_active_nominal_kW + losses_kW.total_SigmaP;
  const goodEff  = efficiency.eta_percentage >= 90;
  const warnEff  = efficiency.eta_percentage >= 75;
  const today    = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

  // Grouper les lignes par catégorie (ordre préservé)
  const catOrder: string[] = [];
  const grouped: Record<string, PRow[]> = {};
  for (const r of allRows) {
    if (!grouped[r.category]) { grouped[r.category] = []; catOrder.push(r.category); }
    grouped[r.category].push(r);
  }

  return (
    <div id="pdf-report-root" className="hidden print:block">

      {/* ═══ CSS IMPRESSION ═══════════════════════════════════════════════ */}
      <style>{`
        @media print {
          /* Format A4 portrait, marges réduites */
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }

          /* Masque TOUT sauf le rapport */
          body * {
            visibility: hidden !important;
          }
          #pdf-report-root,
          #pdf-report-root * {
            visibility: visible !important;
          }
          #pdf-report-root {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 99999 !important;
          }

          /* Forcer les couleurs de fond à l'impression */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Le grand tableau s'étale sur plusieurs pages naturellement */
          .pdf-main-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            font-family: Arial, sans-serif;
          }

          /* Les en-têtes de section ne se coupent pas */
          .pdf-cat-header {
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Chaque ligne de données reste entière */
          .pdf-data-row {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* L'en-tête du tableau se répète sur chaque page */
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>

      <div style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        background: '#fff',
        color: '#111',
        padding: '0',
      }}>

        {/* ═══ EN-TÊTE RAPPORT (page 1 uniquement) ══════════════════════════ */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #0F4C75 100%)',
          padding: '14px 16px 12px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* Titre */}
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: '7pt', color: 'rgba(255,255,255,0.55)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
              RAPPORT COMPLET DE DIMENSIONNEMENT
            </div>
            <div style={{ fontSize: '14pt', fontWeight: 900, color: '#fff', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
              Machine Synchrone — Alternateur Industriel
            </div>
            <div style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Méthodologie Kopylov · {allRows.length} paramètres · 14 étapes
            </div>
          </div>

          {/* Chips */}
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            {[
              `Pn = ${fmt(inputs?.Pn, 0)} kW`,
              `Un = ${fmt(inputs?.Un, 0)} V`,
              `cos φ = ${fmt(inputs?.cosPhi, 2)}`,
              `f = ${fmt(inputs?.f, 0)} Hz`,
              `nn = ${fmt(inputs?.nn, 0)} tr/min`,
              `Sn = ${fmt(nominal?.Sn, 0)} kVA`,
              `In = ${fmt(nominal?.In, 1)} A`,
            ].map(c => (
              <span key={c} style={{
                background: 'rgba(255,255,255,0.13)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: '3px', padding: '2px 7px',
                fontSize: '8pt', color: '#fff',
                fontFamily: '"Courier New", monospace',
                whiteSpace: 'nowrap',
              }}>{c}</span>
            ))}
          </div>

          {/* Date */}
          <div style={{ flex: '0 0 auto', textAlign: 'right', fontSize: '7.5pt', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{today}</div>
            <div style={{ marginTop: '2px' }}>Étape 14 / 14</div>
            <div style={{ marginTop: '1px' }}>PWR-EFF-014</div>
          </div>
        </div>

        {/* ═══ BANDE KPI ═════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {[
            {
              label: 'RENDEMENT GLOBAL η',
              value: `${fmt(efficiency.eta_percentage, 2)} %`,
              sub: goodEff ? '✓ EXCELLENT' : warnEff ? '⚠ ACCEPTABLE' : '✗ À OPTIMISER',
              color: goodEff ? '#166534' : warnEff ? '#92400E' : '#991B1B',
              bg:    goodEff ? '#DCFCE7' : warnEff ? '#FEF3C7' : '#FEE2E2',
              border:goodEff ? '#16A34A' : warnEff ? '#D97706' : '#DC2626',
            },
            { label:'PUISSANCE UTILE Pn',      value:`${fmt(efficiency.P_active_nominal_kW, 1)} kW`, sub:'Sn × cos φ',                                              color:'#1E40AF', bg:'#EFF6FF', border:'#3B82F6' },
            { label:'PERTES TOTALES ΣP',        value:`${fmt(losses_kW.total_SigmaP, 1)} kW`,         sub:`${fmt(losses_kW.total_SigmaP / Pabs * 100, 1)} % de Pabs`, color:'#991B1B', bg:'#FEF2F2', border:'#EF4444' },
            { label:'PUISSANCE ABSORBÉE Pabs',  value:`${fmt(Pabs, 1)} kW`,                           sub:'Pn + ΣP',                                                 color:'#5B21B6', bg:'#F5F3FF', border:'#8B5CF6' },
          ].map(k => (
            <div key={k.label} style={{
              flex: 1, border: `1.5px solid ${k.border}`, borderRadius: '5px',
              padding: '7px 10px', textAlign: 'center', background: k.bg,
            }}>
              <div style={{ fontSize: '6.5pt', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px', fontWeight: 600 }}>
                {k.label}
              </div>
              <div style={{ fontSize: '16pt', fontWeight: 900, color: k.color, fontFamily: '"Courier New", monospace', lineHeight: 1 }}>
                {k.value}
              </div>
              <div style={{ fontSize: '6.5pt', color: k.color, fontWeight: 700, marginTop: '3px' }}>
                {k.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ GRAND TABLEAU UNIQUE — S'ÉTALE SUR PLUSIEURS PAGES ═══════════ */}
        <table className="pdf-main-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '8.5pt',
          fontFamily: 'Arial, sans-serif',
        }}>

          {/* En-tête des colonnes — se répète sur chaque page grâce à <thead> */}
          <thead>
            <tr style={{ background: '#1E293B' }}>
              {[
                { label: 'Catégorie',  w: '18%', align: 'left'   as const },
                { label: 'Paramètre', w: '38%', align: 'left'   as const },
                { label: 'Symbole',   w: '14%', align: 'center' as const },
                { label: 'Valeur',    w: '16%', align: 'right'  as const },
                { label: 'Unité',     w: '14%', align: 'left'   as const },
              ].map(col => (
                <th key={col.label} style={{
                  width: col.w,
                  padding: '6px 8px',
                  textAlign: col.align,
                  fontSize: '8pt',
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  borderRight: '1px solid rgba(255,255,255,0.15)',
                  borderBottom: '2px solid rgba(255,255,255,0.3)',
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Footer tableau — numéro de page */}
          <tfoot>
            <tr>
              <td colSpan={5} style={{
                padding: '5px 8px',
                fontSize: '7pt',
                color: '#94A3B8',
                borderTop: '1px solid #E2E8F0',
                fontFamily: 'Arial',
              }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>SyncDesign Pro</span>
                {' · '}Outil de Dimensionnement Machine Synchrone · Méthodologie Kopylov
                {' · '}{allRows.length} paramètres · 14 étapes complétées
                {' · '}Généré le {today}
              </td>
            </tr>
          </tfoot>

          {/* Corps : toutes les lignes groupées par catégorie */}
          <tbody>
            {catOrder.map(cat => {
              const rows   = grouped[cat];
              const catKey = cat.match(/^(\d+)/)?.[1] ?? '1';
              const pal    = CAT_COLORS[catKey] ?? { bg:'#334155', text:'#fff', row0:'#fff', row1:'#F8FAFC' };

              return (
                <React.Fragment key={cat}>

                  {/* Ligne d'en-tête de catégorie */}
                  <tr className="pdf-cat-header">
                    <td colSpan={5} style={{
                      background: pal.bg,
                      color: pal.text,
                      padding: '5px 8px',
                      fontWeight: 800,
                      fontSize: '8pt',
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      fontFamily: 'Arial',
                      borderTop: '2px solid rgba(0,0,0,0.15)',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '3px',
                        padding: '0 6px',
                        marginRight: '8px',
                        fontFamily: '"Courier New", monospace',
                        fontSize: '9pt',
                        fontWeight: 900,
                      }}>
                        {catKey.padStart(2, '0')}
                      </span>
                      {cat.replace(/^\d+\.\s*/, '')}
                      <span style={{
                        float: 'right',
                        fontSize: '7pt',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.65)',
                        letterSpacing: '0.5px',
                        textTransform: 'none',
                      }}>
                        {rows.length} paramètres
                      </span>
                    </td>
                  </tr>

                  {/* Lignes de données */}
                  {rows.map((row, i) => {
                    const isEta = row.symbol === 'eta';
                    const isSig = row.symbol === 'SigmaP';
                    const bold  = isEta || isSig ||
                                  row.label.startsWith('SOMME') ||
                                  row.label.startsWith('RENDEMENT');
                    const bg = isEta ? '#DCFCE7'
                             : isSig ? '#FEE2E2'
                             : i % 2 === 0 ? pal.row0 : pal.row1;
                    const vc = isEta ? '#14532D' : isSig ? '#7F1D1D' : '#111';

                    // Style commun des cellules de données
                    const cell: React.CSSProperties = {
                      padding: '3.5px 8px',
                      borderBottom: '1px solid rgba(0,0,0,0.07)',
                      borderRight: '1px solid rgba(0,0,0,0.07)',
                      verticalAlign: 'middle',
                      lineHeight: 1.4,
                    };

                    return (
                      <tr key={i} className="pdf-data-row" style={{ background: bg }}>

                        {/* Catégorie — texte coloré doux */}
                        <td style={{
                          ...cell,
                          fontSize: '7.5pt',
                          color: pal.bg,
                          fontWeight: 600,
                          fontFamily: 'Arial',
                          borderLeft: `3px solid ${pal.bg}`,
                        }}>
                          {cat}
                        </td>

                        {/* Paramètre */}
                        <td style={{
                          ...cell,
                          fontSize: '8.5pt',
                          fontFamily: 'Arial',
                          fontWeight: bold ? 700 : 400,
                          color: '#1E293B',
                        }}>
                          {row.label}
                        </td>

                        {/* Symbole — monospace centré */}
                        <td style={{
                          ...cell,
                          textAlign: 'center',
                          fontFamily: '"Courier New", monospace',
                          fontSize: '8.5pt',
                          fontWeight: 700,
                          color: pal.bg,
                        }}>
                          {row.symbol}
                        </td>

                        {/* Valeur — alignée droite, tabular */}
                        <td style={{
                          ...cell,
                          textAlign: 'right',
                          fontFamily: '"Courier New", monospace',
                          fontSize: bold ? '9.5pt' : '8.5pt',
                          fontWeight: bold ? 900 : 500,
                          color: vc,
                        }}>
                          {row.value}
                        </td>

                        {/* Unité — gris italique */}
                        <td style={{
                          ...cell,
                          fontFamily: 'Arial',
                          fontSize: '8pt',
                          color: '#64748B',
                          fontStyle: 'italic',
                        }}>
                          {row.unit}
                        </td>

                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 14
// ─────────────────────────────────────────────────────────────────────────────
export default function Step14() {
  const { inputs, nominal, mainDimensions, airGap, stator, setCurrentStep } =
    useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  // =========================================================================
  // CALCUL PRINCIPAL — TOTALEMENT AUTONOME
  // =========================================================================
  const [calcError, setCalcError] = useState<string | null>(null);

  const results = useMemo(() => {
    setCalcError(null);

    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) return null;

    try {
      // ── Étape 6 : Rotor ──────────────────────────────────────────────────
      const rotorData = CalculationEngine.calcRotor(mainDimensions, stator, airGap);

      // ── Étape 7 : Caractéristique à vide ─────────────────────────────────
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

      // ── Étape 8 : Réactances ─────────────────────────────────────────────
      const reactancesData = CalculationEngine.calcLeakageReactance(
        inputs, nominal, stator, airGap, mainDimensions
      );

     const Uph   = inputs.Un / Math.sqrt(3);
const Zbase = Math.pow(Uph, 2) / ((nominal.Sn * 1000) / inputs.m);
const Ra75pu = stator.Ra75pu || 0.02;
const Ra75_ohm = stator.Ra75 != null && stator.Ra75 > 0
  ? stator.Ra75
  : Ra75pu * Zbase;

const safeReactances = {
  xSigma:     reactancesData.x_sigma_pu || 0.1,
  xq:         1.0,
  r_a:        Ra75pu,
  x_sigma_pu: reactancesData.x_sigma_pu || 0.1,
  r_a75:      Ra75_ohm,          // Ω absolus — pour le calcul des pertes Joule
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

      // ── Étape 10 : Système d'excitation ───────────────────────────────────
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

      // ── Détail excitation ──────────────────────────────────────────────────
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
// MATRICE DE DONNÉES ÉTENDUE — 14 catégories / TOUS LES PARAMÈTRES
// =========================================================================
const getExportData = (): ExportRow[] => {
  if (!results || !inputs || !nominal || !mainDimensions || !stator || !airGap) return [];

  const {
    losses_kW, efficiency,
    allData: {
      rotorData, noLoadData, reactancesData, reactancesRaw,
      blondelData, excitationData, dynParams, shortCircuitData, overloadData,
    },
  } = results;

  // ── Raccourcis de base ──────────────────────────────────────────────────
  const p         = (60 * inputs.f) / inputs.nn;
  const Uph       = inputs.Un / Math.sqrt(3);
  const rotor     = rotorData      as any;
  const noLoad    = noLoadData     as any;
  const blondel   = blondelData    as any;
  const exc       = excitationData as any;
  const dyn       = dynParams      as any;
  const sc        = shortCircuitData as any;
  const ol        = overloadData   as any;
  const raw       = reactancesRaw  as any;
  const rxData    = reactancesData as any;

  // ── Sous-objets profonds ────────────────────────────────────────────────
  const pu      = dyn?.reactances_pu       ?? {};
  const tc      = dyn?.timeConstants_s     ?? {};
  const resPu   = sc?.results_pu           ?? {};
  const resA    = sc?.results_A            ?? {};
  const elec    = exc?.electricalSpecs     ?? {};
  const coil    = exc?.coilSizing          ?? {};
  const wire    = exc?.commercialWire      ?? {};
  const cooling = exc?.coolingSpecs        ?? {};
  const kk      = blondel?.coefficients   ?? blondel?.blondel?.coefficients ?? {};
  const bl      = blondel?.blondel        ?? blondel ?? {};
  const mag     = noLoad?.magneticCircuit ?? noLoad ?? {};
  const lossObj = losses_kW               ?? {};

  return [
    // ═══════════════════════════════════════════════════════════════════
    // 1. CAHIER DES CHARGES
    // ═══════════════════════════════════════════════════════════════════
    { category: '1. Cahier des charges', label: 'Puissance apparente nominale',        symbol: 'Sn',        value: fmt(nominal.Sn,            1), unit: 'kVA'    },
    { category: '1. Cahier des charges', label: 'Puissance active nominale',           symbol: 'Pn',        value: fmt(nominal.Pn,            2), unit: 'kW'     },
    { category: '1. Cahier des charges', label: 'Tension nominale (entre phases)',     symbol: 'Un',        value: fmt(inputs.Un,             0), unit: 'V'      },
    { category: '1. Cahier des charges', label: 'Tension de phase',                   symbol: 'Uph',       value: fmt(Uph,                   2), unit: 'V'      },
    { category: '1. Cahier des charges', label: 'Courant nominal',                    symbol: 'In',        value: fmt(nominal.In,            2), unit: 'A'      },
    { category: '1. Cahier des charges', label: 'Fréquence',                          symbol: 'f',         value: fmt(inputs.f,              0), unit: 'Hz'     },
    { category: '1. Cahier des charges', label: 'Facteur de puissance',               symbol: 'cos(phi)',  value: fmt(inputs.cosPhi,         2), unit: ''       },
    { category: '1. Cahier des charges', label: 'Vitesse nominale',                   symbol: 'nn',        value: fmt(inputs.nn,             0), unit: 'tr/min' },
    { category: '1. Cahier des charges', label: 'Nombre de paires de pôles',          symbol: 'p',         value: fmt(p,                     0), unit: ''       },
    { category: '1. Cahier des charges', label: 'Nombre de pôles',                   symbol: '2p',        value: fmt(2 * p,                 0), unit: ''       },
    { category: '1. Cahier des charges', label: 'Connexion',                          symbol: 'conn',      value: inputs.connection ?? 'Y',       unit: ''       },

    // ═══════════════════════════════════════════════════════════════════
    // 2. DIMENSIONS PRINCIPALES
    // ═══════════════════════════════════════════════════════════════════
    { category: '2. Dimensions principales', label: 'Diamètre intérieur stator',      symbol: 'D',         value: fmt(mainDimensions.D,         1), unit: 'cm'  },
    { category: '2. Dimensions principales', label: 'Diamètre extérieur stator',      symbol: 'Da',        value: fmt(mainDimensions.DaNorm,     1), unit: 'cm'  },
    { category: '2. Dimensions principales', label: 'Rayon intérieur stator',         symbol: 'R',         value: fmt(mainDimensions.D / 2,      2), unit: 'cm'  },
    { category: '2. Dimensions principales', label: 'Pas polaire',                   symbol: 'tau',       value: fmt(mainDimensions.tau,        3), unit: 'cm'  },
    { category: '2. Dimensions principales', label: 'Longueur du fer actif',         symbol: 'l',         value: fmt(mainDimensions.l,          1), unit: 'cm'  },
    { category: '2. Dimensions principales', label: 'Rapport lambda = l / tau',      symbol: 'λ',         value: fmt(mainDimensions.lambda,     3), unit: ''    },
    { category: '2. Dimensions principales', label: "Coefficient d'utilisation",      symbol: 'CA',        value: fmt(mainDimensions.CA,         3), unit: ''    },
    { category: '2. Dimensions principales', label: 'Volume du fer statorique',       symbol: 'Vol_fer',   value: fmt(mainDimensions.volFer,     2), unit: 'cm³' },
    { category: '2. Dimensions principales', label: 'Induction dans l\'entrefer',     symbol: 'Bdelta',    value: fmt(mainDimensions.Bdelta,     3), unit: 'T'   },
    { category: '2. Dimensions principales', label: 'Charge linéique',               symbol: 'A1',        value: fmt(mainDimensions.A1,         1), unit: 'A/cm'},
    { category: '2. Dimensions principales', label: "Épaisseur de l'entrefer",       symbol: 'delta',     value: fmt(airGap.delta,              3), unit: 'cm'  },
    { category: '2. Dimensions principales', label: 'Coefficient de Carter',         symbol: 'Kc',        value: fmt(airGap.Kc,                 3), unit: ''    },
    { category: '2. Dimensions principales', label: 'Entrefer corrigé',              symbol: 'delta_eff', value: fmt(airGap.delta_eff,          3), unit: 'cm'  },

    // ═══════════════════════════════════════════════════════════════════
    // 3. STATOR — ENROULEMENT
    // ═══════════════════════════════════════════════════════════════════
    { category: '3. Stator', label: "Nombre total d'encoches stator",      symbol: 'Z1',      value: fmt(stator.Z1,       0), unit: ''    },
    { category: '3. Stator', label: 'Encoches par pôle et par phase',      symbol: 'q1',      value: fmt(stator.q1,       0), unit: ''    },
    { category: '3. Stator', label: 'Nombre de spires par phase',          symbol: 'w1',      value: fmt(stator.w1,       0), unit: ''    },
    { category: '3. Stator', label: 'Conducteurs par encoche',             symbol: 'Nc',      value: fmt(stator.Nc,       0), unit: ''    },
    { category: '3. Stator', label: 'Facteur de distribution',             symbol: 'Kd1',     value: fmt(stator.Kd1,      4), unit: ''    },
    { category: '3. Stator', label: 'Facteur de raccourcissement',         symbol: 'Kp1',     value: fmt(stator.Kp1,      4), unit: ''    },
    { category: '3. Stator', label: "Facteur d'enroulement",               symbol: 'Kw1',     value: fmt(stator.Kw1,      4), unit: ''    },
    { category: '3. Stator', label: 'Pas de bobinage (encoches)',          symbol: 'y1',      value: fmt(stator.y1,       0), unit: ''    },
    { category: '3. Stator', label: 'Pas dentaire',                        symbol: 'ts1',     value: fmt(stator.ts1,      3), unit: 'cm'  },
    { category: '3. Stator', label: 'Largeur de dent',                     symbol: 'bd1',     value: fmt(stator.bd1,      3), unit: 'cm'  },
    { category: '3. Stator', label: 'Largeur d\'encoche',                  symbol: 'bs1',     value: fmt(stator.bs1,      3), unit: 'cm'  },
    { category: '3. Stator', label: 'Hauteur d\'encoche',                  symbol: 'hs1',     value: fmt(stator.hs1,      3), unit: 'cm'  },
    { category: '3. Stator', label: 'Hauteur de culasse stator',           symbol: 'hcs',     value: fmt(stator.hcs,      3), unit: 'cm'  },
    { category: '3. Stator', label: 'Section conducteur',                  symbol: 'Sc',      value: fmt(stator.Sc,       4), unit: 'mm²' },
    { category: '3. Stator', label: 'Densité de courant stator',           symbol: 'Js',      value: fmt(stator.Js,       2), unit: 'A/mm²'},
    { category: '3. Stator', label: 'Résistance de phase (75 °C)',         symbol: 'Ra75',    value: fmt(stator.Ra75,     4), unit: 'Ω'   },
    { category: '3. Stator', label: 'Résistance de phase (20 °C)',         symbol: 'Ra20',    value: fmt(stator.Ra20,     4), unit: 'Ω'   },
    { category: '3. Stator', label: 'Poids cuivre stator',                 symbol: 'Gm',      value: fmt(stator.Gm,       2), unit: 'kg'  },
    { category: '3. Stator', label: 'Induction dans les dents',            symbol: 'Bd1',     value: fmt(stator.Bd1,      3), unit: 'T'   },
    { category: '3. Stator', label: 'Induction dans la culasse',           symbol: 'Bcs',     value: fmt(stator.Bcs,      3), unit: 'T'   },

    // ═══════════════════════════════════════════════════════════════════
    // 4. ROTOR — PÔLES SAILLANTS
    // ═══════════════════════════════════════════════════════════════════
    { category: '4. Rotor', label: 'Diamètre extérieur rotor',             symbol: 'Dr',      value: fmt(rotor?.Dr,        2), unit: 'cm'  },
    { category: '4. Rotor', label: "Largeur de l'épanouissement polaire",  symbol: 'bp',      value: fmt(rotor?.bp,        3), unit: 'cm'  },
    { category: '4. Rotor', label: 'Largeur du noyau polaire',             symbol: 'bM',      value: fmt(rotor?.bM,        3), unit: 'cm'  },
    { category: '4. Rotor', label: 'Hauteur du noyau polaire',             symbol: 'hM',      value: fmt(rotor?.hM,        2), unit: 'cm'  },
    { category: '4. Rotor', label: 'Hauteur totale du pôle',               symbol: 'hp',      value: fmt(rotor?.hp,        2), unit: 'cm'  },
    { category: '4. Rotor', label: 'Rapport bp / tau',                     symbol: 'bp_tau',  value: fmt(rotor?.bpTau,     3), unit: ''    },
    { category: '4. Rotor', label: 'Longueur axiale rotor',                symbol: 'lr',      value: fmt(rotor?.lr,        1), unit: 'cm'  },
    { category: '4. Rotor', label: 'Induction dans le noyau polaire',      symbol: 'BM',      value: fmt(rotor?.BM,        3), unit: 'T'   },
    { category: '4. Rotor', label: 'Section du noyau polaire',             symbol: 'SM',      value: fmt(rotor?.SM,        2), unit: 'cm²' },
    { category: '4. Rotor', label: 'Induction dans la culasse rotor',      symbol: 'Bcr',     value: fmt(rotor?.Bcr,       3), unit: 'T'   },
    { category: '4. Rotor', label: "Courant d'excitation nominal",         symbol: 'IBn',     value: fmt(elec?.I_B_Nominal_A, 1), unit: 'A' },
    { category: '4. Rotor', label: "Courant d'excitation à vide",          symbol: 'IB0',     value: fmt(elec?.I_B0_A,     1), unit: 'A'   },
    { category: '4. Rotor', label: "Force magnéto-motrice d'excitation",   symbol: 'FMM_B',   value: fmt(elec?.FMM_B,      1), unit: 'A'   },
    { category: '4. Rotor', label: 'Densité de courant bobinage rotor',    symbol: 'JB',      value: fmt(coil?.J_B,        2), unit: 'A/mm²'},
    { category: '4. Rotor', label: 'Section conducteur excitation',        symbol: 'SB',      value: fmt(coil?.S_B_mm2,    3), unit: 'mm²' },
    { category: '4. Rotor', label: 'Nombre de spires par pôle',            symbol: 'wB',      value: fmt(coil?.N_turns,    0), unit: ''    },
    { category: '4. Rotor', label: 'Résistance bobinage excitation (75°C)',symbol: 'RB75',    value: fmt(coil?.R_B75,      4), unit: 'Ω'   },
    { category: '4. Rotor', label: 'Poids cuivre excitation',              symbol: 'GB',      value: fmt(coil?.weight_copper_kg ?? coil?.G_B, 2), unit: 'kg' },
    { category: '4. Rotor', label: 'Tension d\'excitation nominale',       symbol: 'UBn',     value: fmt(elec?.U_B_Nominal_V, 1), unit: 'V'  },
    { category: '4. Rotor', label: 'Puissance d\'excitation nominale',     symbol: 'PBn',     value: fmt(elec?.P_B_Nominal_W, 1), unit: 'W'  },

    // ═══════════════════════════════════════════════════════════════════
    // 4b. FIL COMMERCIAL ROTOR
    // ═══════════════════════════════════════════════════════════════════
    { category: '4b. Fil commercial', label: 'Diamètre fil (norme)',        symbol: 'd_wire',  value: fmt(wire?.diameter_mm,   3), unit: 'mm'  },
    { category: '4b. Fil commercial', label: 'Section fil commercial',      symbol: 'S_wire',  value: fmt(wire?.section_mm2,   3), unit: 'mm²' },
    { category: '4b. Fil commercial', label: 'Courant admissible fil',      symbol: 'Iadm',    value: fmt(wire?.I_adm_A,       1), unit: 'A'   },
    { category: '4b. Fil commercial', label: 'Résistance linéique (20°C)',  symbol: 'r_lin',   value: fmt(wire?.r_ohm_per_m,   4), unit: 'Ω/m' },

    // ═══════════════════════════════════════════════════════════════════
    // 5. CIRCUIT MAGNÉTIQUE — À VIDE
    // ═══════════════════════════════════════════════════════════════════
    { category: '5. Circuit magnétique', label: 'Flux nominal par pôle',    symbol: 'Phi_n',   value: fmt(mag?.Phi_n ?? noLoad?.Phi_n,  4), unit: 'Wb'  },
    { category: '5. Circuit magnétique', label: 'FMM entrefer',             symbol: 'Fdelta',  value: fmt(mag?.F_delta,   1), unit: 'A'   },
    { category: '5. Circuit magnétique', label: 'FMM dents stator',         symbol: 'Fd1',     value: fmt(mag?.F_d1,      1), unit: 'A'   },
    { category: '5. Circuit magnétique', label: 'FMM culasse stator',       symbol: 'Fcs',     value: fmt(mag?.F_cs,      1), unit: 'A'   },
    { category: '5. Circuit magnétique', label: 'FMM noyau polaire',        symbol: 'FM',      value: fmt(mag?.F_M,       1), unit: 'A'   },
    { category: '5. Circuit magnétique', label: 'FMM culasse rotor',        symbol: 'Fcr',     value: fmt(mag?.F_cr,      1), unit: 'A'   },
    { category: '5. Circuit magnétique', label: 'FMM totale à vide',        symbol: 'F_tot0',  value: fmt(mag?.F_total,   1), unit: 'A'   },
    { category: '5. Circuit magnétique', label: 'Coefficient de saturation',symbol: 'Ksat',    value: fmt(mag?.Ksat ?? noLoad?.Ksat, 3), unit: '' },
    { category: '5. Circuit magnétique', label: 'Coefficient de Rogowski',  symbol: 'KR',      value: fmt(mag?.KR,        3), unit: ''    },
    { category: '5. Circuit magnétique', label: 'FEM à vide',               symbol: 'E0',      value: fmt(noLoad?.E0,     2), unit: 'V'   },
    { category: '5. Circuit magnétique', label: 'Courant magnétisant',      symbol: 'Im',      value: fmt(noLoad?.Im,     3), unit: 'A'   },
    { category: '5. Circuit magnétique', label: 'Réactance de magnétisation',symbol: 'Xm',    value: fmt(noLoad?.Xm,     3), unit: 'Ω'   },

    // ═══════════════════════════════════════════════════════════════════
    // 6. RÉACTANCES (p.u. et Ω)
    // ═══════════════════════════════════════════════════════════════════
    { category: '6. Réactances', label: 'Réactance de dispersion statorique', symbol: 'x_sigma',  value: fmt(raw?.x_sigma_pu ?? rxData?.xSigma, 4), unit: 'p.u.' },
    { category: '6. Réactances', label: 'Réactance de dispersion (Ω)',        symbol: 'X_sigma',  value: fmt(raw?.X_sigma_ohm,                  3), unit: 'Ω'    },
    { category: '6. Réactances', label: 'Réactance synchrone axe d (p.u.)',   symbol: 'xd',       value: fmt(pu?.x_d,                           4), unit: 'p.u.' },
    { category: '6. Réactances', label: 'Réactance synchrone axe q (p.u.)',   symbol: 'xq',       value: fmt(pu?.x_q,                           4), unit: 'p.u.' },
    { category: '6. Réactances', label: 'Réactance transitoire xd\' (p.u.)',  symbol: "x'd",      value: fmt(pu?.x_d_prime,                     4), unit: 'p.u.' },
    { category: '6. Réactances', label: 'Réactance subtransitoire xd" (p.u.)',symbol: 'x"d',      value: fmt(pu?.x_d_2prime,                    4), unit: 'p.u.' },
    { category: '6. Réactances', label: 'Réactance subtransitoire xq" (p.u.)',symbol: 'x"q',      value: fmt(pu?.x_q_2prime,                    4), unit: 'p.u.' },
    { category: '6. Réactances', label: "Réactance d'ordre inverse (p.u.)",   symbol: 'x2',       value: fmt(pu?.x_2,                           4), unit: 'p.u.' },
    { category: '6. Réactances', label: "Réactance d'ordre zéro (p.u.)",      symbol: 'x0',       value: fmt(pu?.x_0,                           4), unit: 'p.u.' },
    { category: '6. Réactances', label: 'Réactance synchrone axe d (Ω)',      symbol: 'Xd',       value: fmt(raw?.Xd_ohm,                       3), unit: 'Ω'    },
    { category: '6. Réactances', label: 'Réactance synchrone axe q (Ω)',      symbol: 'Xq',       value: fmt(raw?.Xq_ohm,                       3), unit: 'Ω'    },
    { category: '6. Réactances', label: 'Résistance Ra (p.u.)',               symbol: 'ra',       value: fmt(pu?.ra,                            4), unit: 'p.u.' },

    // ═══════════════════════════════════════════════════════════════════
    // 7. CONSTANTES DE TEMPS
    // ═══════════════════════════════════════════════════════════════════
    { category: '7. Constantes de temps', label: "Constante de temps à vide Td0",       symbol: 'Td0',    value: fmt(tc?.T_d0,       3), unit: 's' },
    { category: '7. Constantes de temps', label: "Constante de temps transitoire Td'",  symbol: "T'd",    value: fmt(tc?.T_d_prime,  3), unit: 's' },
    { category: '7. Constantes de temps', label: "Constante de temps subtransitoire Td\"",symbol: "T\"d", value: fmt(tc?.T_d_2prime, 3), unit: 's' },
    { category: '7. Constantes de temps', label: "Constante de temps d'induit Ta",      symbol: 'Ta',     value: fmt(tc?.T_a,        3), unit: 's' },
    { category: '7. Constantes de temps', label: "Constante de temps en CC Tcc",        symbol: 'Tcc',    value: fmt(tc?.T_cc,       3), unit: 's' },

    // ═══════════════════════════════════════════════════════════════════
    // 8. DIAGRAMME DE BLONDEL
    // ═══════════════════════════════════════════════════════════════════
    { category: '8. Blondel', label: 'Composante d (axe d) du courant',    symbol: 'Id',      value: fmt(bl?.Id,               3), unit: 'A'   },
    { category: '8. Blondel', label: 'Composante q (axe q) du courant',    symbol: 'Iq',      value: fmt(bl?.Iq,               3), unit: 'A'   },
    { category: '8. Blondel', label: 'FEM à charge nominale',              symbol: 'Ef',      value: fmt(bl?.Ef,               2), unit: 'V'   },
    { category: '8. Blondel', label: 'Angle interne delta',                symbol: 'delta_i', value: fmt(bl?.delta_deg,        2), unit: '°'   },
    { category: '8. Blondel', label: 'Courant d\'excitation en charge',    symbol: 'IB_charge',value: fmt(bl?.IB_charge,       1), unit: 'A'   },
    { category: '8. Blondel', label: 'Coefficient Kd (Blondel)',           symbol: 'Kd',      value: fmt(kk?.Kd,               3), unit: ''    },
    { category: '8. Blondel', label: 'Coefficient Kq (Blondel)',           symbol: 'Kq',      value: fmt(kk?.Kq,               3), unit: ''    },
    { category: '8. Blondel', label: 'Coefficient psi_d',                  symbol: 'psi_d',   value: fmt(kk?.psi_d,            3), unit: ''    },
    { category: '8. Blondel', label: 'Coefficient psi_q',                  symbol: 'psi_q',   value: fmt(kk?.psi_q,            3), unit: ''    },

    // ═══════════════════════════════════════════════════════════════════
    // 9. COURT-CIRCUIT
    // ═══════════════════════════════════════════════════════════════════
    { category: '9. Court-circuit', label: 'Courant CC à vide (p.u.)',            symbol: 'Icc0',     value: fmt(resPu?.I_cc0,   3), unit: 'p.u.' },
    { category: '9. Court-circuit', label: 'Courant CC nominal (p.u.)',           symbol: 'Iccn',     value: fmt(resPu?.I_ccn,   3), unit: 'p.u.' },
    { category: '9. Court-circuit', label: 'Courant CC initial subtransitoire (p.u.)', symbol: 'I"cc', value: fmt(resPu?.I_cc_init, 3), unit: 'p.u.' },
    { category: '9. Court-circuit', label: 'Courant CC crête asymétrique (p.u.)', symbol: 'Icc_crete',value: fmt(resPu?.I_cc_peak, 3), unit: 'p.u.' },
    { category: '9. Court-circuit', label: 'Courant CC à vide (A)',              symbol: 'Icc0_A',   value: fmt(resA?.I_cc0_A,  2), unit: 'A'    },
    { category: '9. Court-circuit', label: 'Courant CC nominal (A)',             symbol: 'Iccn_A',   value: fmt(resA?.I_ccn_A,  2), unit: 'A'    },
    { category: '9. Court-circuit', label: 'Rapport de court-circuit',           symbol: 'Kcc',      value: fmt(sc?.Kcc,        3), unit: ''     },

    // ═══════════════════════════════════════════════════════════════════
    // 10. SURCHARGE ET STABILITÉ
    // ═══════════════════════════════════════════════════════════════════
    { category: '10. Surcharge', label: 'Capacité de surcharge statique',  symbol: 'Mmax*',    value: fmt(ol?.static_overload_S ?? ol?.S, 2), unit: 'p.u.' },
    { category: '10. Surcharge', label: 'Angle de surcharge',              symbol: 'delta_max',value: fmt(ol?.delta_max_deg,              2), unit: '°'    },
    { category: '10. Surcharge', label: 'Puissance maxi (kVA)',            symbol: 'Smax',     value: fmt(ol?.Smax_kVA,                   2), unit: 'kVA'  },
    { category: '10. Surcharge', label: 'Puissance reluc. (kVA)',          symbol: 'Sreluc',   value: fmt(ol?.Sreluc_kVA,                 2), unit: 'kVA'  },

    // ═══════════════════════════════════════════════════════════════════
    // 11. PERTES DÉTAILLÉES
    // ═══════════════════════════════════════════════════════════════════
    { category: '11. Pertes', label: 'Pertes Joule stator (nominales)',    symbol: 'Pjs',      value: fmt(lossObj?.P_js,          2), unit: 'kW'  },
    { category: '11. Pertes', label: 'Pertes Joule rotor (excitation)',    symbol: 'Pjr',      value: fmt(lossObj?.P_jr,          2), unit: 'kW'  },
    { category: '11. Pertes', label: 'Pertes fer stator (Foucault+hys.)', symbol: 'Pfer',     value: fmt(lossObj?.P_fer,         2), unit: 'kW'  },
    { category: '11. Pertes', label: 'Pertes mécaniques (frott. + vent.)',symbol: 'Pmec',     value: fmt(lossObj?.P_mec,         2), unit: 'kW'  },
    { category: '11. Pertes', label: 'Pertes supplémentaires',            symbol: 'Padd',     value: fmt(lossObj?.P_add,         2), unit: 'kW'  },
    { category: '11. Pertes', label: 'Somme des pertes totales',          symbol: 'SigmaP',   value: fmt(lossObj?.total_SigmaP,  2), unit: 'kW'  },
    { category: '11. Pertes', label: 'Rendement nominal',                 symbol: 'eta',      value: fmt(efficiency?.eta_percentage, 3), unit: '%' },
    { category: '11. Pertes', label: 'Puissance absorbée',                symbol: 'P_abs',    value: fmt(lossObj?.P_absorbed,    2), unit: 'kW'  },

    // ═══════════════════════════════════════════════════════════════════
    // 12. REFROIDISSEMENT EXCITATION
    // ═══════════════════════════════════════════════════════════════════
    { category: '12. Refroidissement', label: 'Échauffement bobinage excitation', symbol: 'dTh_B',   value: fmt(cooling?.delta_T_B,     1), unit: '°C'  },
    { category: '12. Refroidissement', label: 'Surface de refroidissement pôle', symbol: 'S_cool',  value: fmt(cooling?.S_cooling_cm2, 1), unit: 'cm²' },
    { category: '12. Refroidissement', label: 'Pertes surfaciques',              symbol: 'q_surf',  value: fmt(cooling?.q_W_cm2,       2), unit: 'W/cm²'},
    { category: '12. Refroidissement', label: 'Facteur de dissipation K_th',     symbol: 'Kth',     value: fmt(cooling?.K_th,           3), unit: ''    },

    // ═══════════════════════════════════════════════════════════════════
    // 13. MASSES ET MATÉRIAUX
    // ═══════════════════════════════════════════════════════════════════
    { category: '13. Masses', label: 'Masse cuivre stator',               symbol: 'G_Cu_s',   value: fmt(stator.Gm,                2), unit: 'kg' },
    { category: '13. Masses', label: 'Masse cuivre rotor (excitation)',   symbol: 'G_Cu_r',   value: fmt(coil?.weight_copper_kg ?? coil?.G_B, 2), unit: 'kg' },
    { category: '13. Masses', label: 'Masse fer statorique',              symbol: 'G_Fe_s',   value: fmt(stator.GFe,               2), unit: 'kg' },
    { category: '13. Masses', label: 'Masse fer rotorique',               symbol: 'G_Fe_r',   value: fmt(rotor?.GFe,               2), unit: 'kg' },
    { category: '13. Masses', label: 'Masse totale active estimée',       symbol: 'G_tot',    value: fmt(
        (stator.Gm ?? 0) + (coil?.weight_copper_kg ?? coil?.G_B ?? 0) + (stator.GFe ?? 0) + (rotor?.GFe ?? 0), 1
      ), unit: 'kg' },

    // ═══════════════════════════════════════════════════════════════════
    // 14. RÉSUMÉ NORMÉ (reprise synthétique)
    // ═══════════════════════════════════════════════════════════════════
    { category: '14. Résumé normé', label: 'Puissance apparente nominale', symbol: 'Sn',      value: fmt(nominal.Sn,         1), unit: 'kVA'  },
    { category: '14. Résumé normé', label: 'Tension nominale (L-L)',       symbol: 'Un',      value: fmt(inputs.Un,          0), unit: 'V'    },
    { category: '14. Résumé normé', label: 'Courant nominal',              symbol: 'In',      value: fmt(nominal.In,         2), unit: 'A'    },
    { category: '14. Résumé normé', label: 'Vitesse nominale',             symbol: 'nn',      value: fmt(inputs.nn,          0), unit: 'tr/min'},
    { category: '14. Résumé normé', label: 'Rendement nominal',            symbol: 'eta',     value: fmt(efficiency?.eta_percentage, 2), unit: '%' },
    { category: '14. Résumé normé', label: 'Réactance synchrone xd',      symbol: 'xd',      value: fmt(pu?.x_d,            3), unit: 'p.u.' },
    { category: '14. Résumé normé', label: 'Réactance transitoire xd\'',  symbol: "x'd",     value: fmt(pu?.x_d_prime,      3), unit: 'p.u.' },
    { category: '14. Résumé normé', label: "Rapport de court-circuit",     symbol: 'Kcc',     value: fmt(sc?.Kcc,            3), unit: ''     },
    { category: '14. Résumé normé', label: 'Capacité de surcharge',        symbol: 'Mmax*',   value: fmt(ol?.static_overload_S ?? ol?.S, 2), unit: 'p.u.' },
    { category: '14. Résumé normé', label: 'Somme des pertes',             symbol: 'SigmaP',  value: fmt(lossObj?.total_SigmaP, 1), unit: 'kW' },
  ];
};
  // =========================================================================
  // EXPORT EXCEL
  // =========================================================================
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
    const workbook = new ExcelJS.Workbook();
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
      '9': 'FFE8D5F5','10': 'FFFCE4EC','11': 'FFE3F2FD','12': 'FFF1F8E9',
      '13': 'FFFDF6E3','14': 'FFFFE0E0',
    };
    const HIGHLIGHT_GREEN = 'FFC6EFCE';
    const HIGHLIGHT_RED   = 'FFFFC7CE';
    const borderStyle = {
      top: { style: 'thin' as const }, left: { style: 'thin' as const },
      bottom: { style: 'thin' as const }, right: { style: 'thin' as const },
    };
    sorted.forEach((r) => {
      const numericValue     = toNumeric(r.value);
      const stepKey          = r.category.match(/^(\d+)/)?.[1] ?? '';
      let   bgColor          = CATEGORY_COLORS[stepKey] ?? 'FFFFFFFF';
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
    sheet.views      = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Rapport_Dimensionnement_Alternateur.xlsx');
  };

  // =========================================================================
  // EXPORT PDF — génère un fichier HTML standalone, ouverts dans un nouvel
  // onglet et déclenche window.print() automatiquement
  // =========================================================================
  const exportToPDF = () => {
  if (!results) return;
  const allRows = getExportData();
  
  // Category colors matching the screenshots exactly
  const CAT_HEADER_COLORS: Record<string, { bg: string; text: string }> = {
    '1': { bg: '#374151', text: '#ffffff' },
    '2': { bg: '#374151', text: '#ffffff' },
    '3': { bg: '#374151', text: '#ffffff' },
    '4': { bg: '#374151', text: '#ffffff' },
    '5': { bg: '#374151', text: '#ffffff' },
    '6': { bg: '#374151', text: '#ffffff' },
    '7': { bg: '#374151', text: '#ffffff' },
  };

  // Row background colors per category (matching screenshots)
  const CAT_ROW_COLORS: Record<string, { even: string; odd: string }> = {
    '1': { even: '#FFFDE7', odd: '#FFFBDB' },  // yellow tint
    '2': { even: '#E1F5FE', odd: '#D6F0FD' },  // blue tint
    '3': { even: '#E8F5E9', odd: '#DCEEDE' },  // green tint
    '4': { even: '#EDE7F6', odd: '#E5DEEF' },  // purple tint
    '5': { even: '#FCE4EC', odd: '#F8D7E4' },  // pink tint
    '6': { even: '#FFF3E0', odd: '#FAECD4' },  // orange tint
    '7': { even: '#E3F2FD', odd: '#D7EBF9' },  // light blue tint
  };

  let lastCategory = '';
  let catRowIndex = 0;
  let tableRows = '';

  allRows.forEach((row) => {
    const stepKey = row.category.match(/^(\d+)/)?.[1] ?? '1';
    
    if (row.category !== lastCategory) {
      lastCategory = row.category;
      catRowIndex = 0;
      const catLabel = row.category.replace(/^\d+\.\s*/, '').toUpperCase();
      tableRows += `
        <tr class="cat-header">
          <td colspan="4" style="
            background: #334155;
            color: #ffffff;
            font-weight: 800;
            font-size: 8.5pt;
            padding: 6px 10px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-top: 2px solid #1E293B;
            border-bottom: 1px solid #475569;
          ">
            <span style="
              display: inline-block;
              background: rgba(255,255,255,0.15);
              border: 1px solid rgba(255,255,255,0.25);
              border-radius: 3px;
              padding: 1px 6px;
              margin-right: 8px;
              font-family: 'Courier New', monospace;
              font-size: 8.5pt;
              font-weight: 900;
            ">${stepKey.padStart(2, '0')}</span>
            ${stepKey}. ${catLabel}
          </td>
        </tr>`;
    }

    const isEta = row.symbol === 'eta';
    const isSigmaP = row.symbol === 'SigmaP';
    
    let rowBg: string;
    if (isEta) {
      rowBg = '#C6EFCE';
    } else if (isSigmaP) {
      rowBg = '#FFC7CE';
    } else {
      const colors = CAT_ROW_COLORS[stepKey] ?? { even: '#ffffff', odd: '#F8FAFC' };
      rowBg = catRowIndex % 2 === 0 ? colors.even : colors.odd;
    }

    const valueColor = isEta ? '#006100' : isSigmaP ? '#9C0006' : '#1E293B';
    const valueFontWeight = isEta || isSigmaP ? '900' : '500';
    const labelFontWeight = isEta || isSigmaP ? '700' : '400';
    const labelColor = isEta ? '#006100' : isSigmaP ? '#9C0006' : '#1E293B';

    tableRows += `
      <tr style="background: ${rowBg};">
        <td style="
          padding: 4px 10px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
          border-right: 1px solid rgba(0,0,0,0.07);
          font-size: 8.5pt;
          font-family: Arial, sans-serif;
          font-weight: ${labelFontWeight};
          color: ${labelColor};
          vertical-align: middle;
        ">${row.label}</td>
        <td style="
          padding: 4px 10px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
          border-right: 1px solid rgba(0,0,0,0.07);
          font-size: 8.5pt;
          font-family: 'Courier New', monospace;
          font-weight: ${isEta || isSigmaP ? '700' : '400'};
          color: ${isEta ? '#006100' : isSigmaP ? '#9C0006' : '#475569'};
          text-align: center;
          vertical-align: middle;
        ">${row.symbol}</td>
        <td style="
          padding: 4px 10px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
          border-right: 1px solid rgba(0,0,0,0.07);
          font-size: ${isEta || isSigmaP ? '9.5pt' : '8.5pt'};
          font-family: 'Courier New', monospace;
          font-weight: ${valueFontWeight};
          color: ${valueColor};
          text-align: right;
          vertical-align: middle;
        ">${row.value}</td>
        <td style="
          padding: 4px 10px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
          font-size: 8pt;
          font-family: Arial, sans-serif;
          font-style: italic;
          color: #64748B;
          vertical-align: middle;
        ">${row.unit}</td>
      </tr>`;
    
    catRowIndex++;
  });

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const goodEff = results.efficiency.eta_percentage >= 90;
  const warnEff = results.efficiency.eta_percentage >= 75;
  const Pabs = results.efficiency.P_active_nominal_kW + results.losses_kW.total_SigmaP;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Dimensionnement — SYNCDESIGN PRO</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #1e293b;
      background: #ffffff;
    }

    /* ── HEADER ── */
    .header {
      background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #0F4C75 100%);
      padding: 16px 20px 14px;
      margin-bottom: 12px;
    }
    .header-inner {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .header-titles {
      flex: 0 0 auto;
    }
    .header-eyebrow {
      font-size: 7pt;
      color: rgba(255,255,255,0.55);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .header-title {
      font-size: 15pt;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.2px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .header-subtitle {
      font-size: 8pt;
      color: rgba(255,255,255,0.7);
    }
    .header-chips {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: center;
    }
    .chip {
      background: rgba(255,255,255,0.13);
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: 3px;
      padding: 2px 8px;
      font-size: 8pt;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
    }
    .header-date {
      flex: 0 0 auto;
      text-align: right;
      font-size: 7.5pt;
      color: rgba(255,255,255,0.5);
    }
    .header-date strong {
      color: rgba(255,255,255,0.9);
      font-weight: 700;
      display: block;
    }

    /* ── KPI ROW ── */
    .kpi-row {
      display: flex;
      gap: 10px;
      margin: 0 0 14px 0;
      padding: 0 20px;
    }
    .kpi {
      flex: 1;
      border-radius: 6px;
      padding: 10px 8px;
      text-align: center;
      border-width: 1.5px;
      border-style: solid;
    }
    .kpi-label {
      font-size: 6.5pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #475569;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .kpi-value {
      font-size: 18pt;
      font-weight: 900;
      font-family: 'Courier New', monospace;
      line-height: 1;
      margin-bottom: 3px;
    }
    .kpi-sub {
      font-size: 6.5pt;
      font-weight: 700;
    }
    .kpi-green { background: #DCFCE7; border-color: #16A34A; }
    .kpi-green .kpi-value { color: #16A34A; }
    .kpi-green .kpi-sub { color: #166534; }
    .kpi-red { background: #FEE2E2; border-color: #DC2626; }
    .kpi-red .kpi-value { color: #DC2626; }
    .kpi-red .kpi-sub { color: #991B1B; }
    .kpi-blue { background: #DBEAFE; border-color: #3B82F6; }
    .kpi-blue .kpi-value { color: #2563EB; }
    .kpi-blue .kpi-sub { color: #1D4ED8; }

    /* ── TABLE ── */
    .table-wrapper {
      padding: 0 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      font-family: Arial, sans-serif;
      table-layout: fixed;
    }
    col.col-label  { width: 44%; }
    col.col-symbol { width: 17%; }
    col.col-value  { width: 18%; }
    col.col-unit   { width: 21%; }

    thead th {
      background: #1E293B;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      padding: 6px 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.15);
      border-bottom: 2px solid rgba(255,255,255,0.3);
    }
    thead th.left   { text-align: left; }
    thead th.center { text-align: center; }
    thead th.right  { text-align: right; }

    /* ── FOOTER ── */
    .footer {
      margin: 14px 20px 0;
      padding-top: 8px;
      border-top: 1px solid #CBD5E1;
      font-size: 7pt;
      color: #94A3B8;
      text-align: center;
    }
    .footer strong {
      color: #475569;
    }

    /* ── PRINT ── */
    @page {
      size: A4 portrait;
      margin: 10mm 8mm 12mm;
    }
    @media print {
      body { font-size: 8pt; }
      .kpi-row { padding: 0; }
      .table-wrapper { padding: 0; }
      .footer { margin: 10px 0 0; }
      tr { page-break-inside: avoid; }
      tr.cat-header { page-break-after: avoid; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-inner">
      <div class="header-titles">
        <div class="header-eyebrow">RAPPORT COMPLET DE DIMENSIONNEMENT</div>
        <div class="header-title">Machine Synchrone — Alternateur Industriel</div>
        <div class="header-subtitle">Méthodologie Kopylov · ${allRows.length} paramètres · 14 étapes</div>
      </div>
      <div class="header-chips">
        <span class="chip">Pn = ${fmt(inputs?.Pn, 0)} kW</span>
        <span class="chip">Un = ${fmt(inputs?.Un, 0)} V</span>
        <span class="chip">cos φ = ${fmt(inputs?.cosPhi, 2)}</span>
        <span class="chip">f = ${fmt(inputs?.f, 0)} Hz</span>
        <span class="chip">nn = ${fmt(inputs?.nn, 0)} tr/min</span>
        <span class="chip">Sn = ${fmt(nominal?.Sn, 0)} kVA</span>
        <span class="chip">In = ${fmt(nominal?.In, 1)} A</span>
      </div>
      <div class="header-date">
        <strong>${today}</strong>
        <div style="margin-top:2px">Étape 14 / 14</div>
        <div style="margin-top:1px">PWR-EFF-014</div>
      </div>
    </div>
  </div>

  <!-- KPI ROW -->
  <div class="kpi-row">
    <div class="kpi kpi-green">
      <div class="kpi-label">RENDEMENT GLOBAL η</div>
      <div class="kpi-value">${fmt(results.efficiency.eta_percentage, 2)} %</div>
      <div class="kpi-sub">${goodEff ? '✓ EXCELLENT' : warnEff ? '⚠ ACCEPTABLE' : '✗ À OPTIMISER'}</div>
    </div>
    <div class="kpi kpi-red">
      <div class="kpi-label">PERTES TOTALES ΣP</div>
      <div class="kpi-value">${fmt(results.losses_kW.total_SigmaP, 1)} kW</div>
      <div class="kpi-sub">${fmt(results.losses_kW.total_SigmaP / Pabs * 100, 1)} % de Pabs</div>
    </div>
    <div class="kpi kpi-blue">
      <div class="kpi-label">PUISSANCE UTILE Pn</div>
      <div class="kpi-value">${fmt(results.efficiency.P_active_nominal_kW, 1)} kW</div>
      <div class="kpi-sub">Sn × cos φ</div>
    </div>
  </div>

  <!-- TABLE -->
  <div class="table-wrapper">
    <table>
      <colgroup>
        <col class="col-label">
        <col class="col-symbol">
        <col class="col-value">
        <col class="col-unit">
      </colgroup>
      <thead>
        <tr>
          <th class="left">Paramètre</th>
          <th class="center">Symbole</th>
          <th class="right">Valeur</th>
          <th class="left">Unité</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <td colspan="4" style="
            padding: 5px 10px;
            font-size: 7pt;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            font-family: Arial;
            text-align: center;
          ">
            <strong style="color:#475569">SyncDesign Pro</strong>
            · Outil de Dimensionnement Machine Synchrone · Méthodologie Kopylov
            · ${allRows.length} paramètres · 14 étapes complétées
            · Généré le ${today}
          </td>
        </tr>
      </tfoot>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('afterprint', () => URL.revokeObjectURL(url));
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_Dimensionnement_Pn${inputs?.Pn ?? '?'}kW.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
};

  // =========================================================================
  // LATEX
  // =========================================================================
  const [latexCode, setLatexCode]     = useState<string | null>(null);
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
    lines.push('');
    lines.push('\\begin{longtable}{%');
    lines.push('  >{\\bfseries\\small}p{3.8cm}%');
    lines.push('  >{\\ttfamily\\small}l%');
    lines.push('  >{\\small}r%');
    lines.push('  >{\\small\\itshape}l%');
    lines.push('}');
    lines.push('  \\toprule');
    lines.push("  \\multicolumn{1}{l}{\\textbf{Param\\`etre}} & \\textbf{Symbole} & \\textbf{Valeur} & \\textbf{Unit\\'e} \\\\");
    lines.push('  \\midrule');
    lines.push('  \\endfirsthead');
    lines.push('  \\toprule');
    lines.push("  \\multicolumn{4}{l}{\\small\\itshape Suite --- R\\'ecapitulatif du dimensionnement} \\\\");
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
      lines.push(`  % ── ${catEsc}`);
      lines.push('  \\rowcolor{gray!25}');
      lines.push(`  \\multicolumn{4}{l}{\\textbf{\\small ${catEsc}}} \\\\`);
      lines.push('  \\midrule');
      catRows.forEach((row) => {
        const labelEsc  = escapeLatex(row.label);
        const symbolEsc = escapeLatex(row.symbol);
        const valueEsc  = escapeLatex(row.value);
        const unitEsc   = escapeLatex(row.unit);
        const isHG = row.symbol === 'eta';
        const isHR = row.symbol === 'SigmaP';
        if (isHG) lines.push('  \\rowcolor{green!12}');
        if (isHR) lines.push('  \\rowcolor{red!10}');
        lines.push(`  ${labelEsc} & \\texttt{${symbolEsc}} & ${isHG || isHR ? `\\textbf{${valueEsc}}` : valueEsc} & ${unitEsc} \\\\`);
      });
      lines.push('');
    });
    lines.push("  \\caption{R\\'ecapitulatif complet du dimensionnement --- " + categories.length + " \\'etapes, " + rows.length + " param\\`etres}");
    lines.push('  \\label{tab:dimensionnement-complet}');
    lines.push('\\end{longtable}');
    lines.push('');
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
    const textarea         = document.createElement('textarea');
    textarea.value         = latexCode;
    textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus(); textarea.select(); textarea.setSelectionRange(0, textarea.value.length);
    try {
      if (document.execCommand('copy')) { setLatexCopied(true); setTimeout(() => setLatexCopied(false), 2500); }
    } catch (err) { console.error('[LaTeX Copy] execCommand échoué :', err); }
    finally { document.body.removeChild(textarea); }
  };

  // =========================================================================
  // GUARD — données manquantes ou erreur de calcul
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

            <Formula label="1 — Pertes Fer Culasse" accent="sky">
              <Var>P<sub>c</sub></Var>{sym.eq}
              <Var>k<sub>dc</sub></Var>{sym.dot}<Var>ρ<sub>c</sub></Var>{sym.dot}
              <Var>G<sub>c</sub></Var>{sym.dot}<Num>10⁻³</Num>
            </Formula>

            <Formula label="2 — Pertes Fer Dents" accent="emerald">
              <Var>P<sub>cd</sub></Var>{sym.eq}
              <Var>k<sub>d</sub></Var>{sym.dot}<Var>ρ<sub>cd</sub></Var>{sym.dot}
              <Var>G<sub>d</sub></Var>{sym.dot}<Num>10⁻³</Num>
            </Formula>

            <Formula label="3 — Pertes de Surface (Rotor)" accent="violet">
  <div className="flex flex-col items-center w-full gap-2">
    <div className="flex justify-center items-center flex-wrap gap-1">
      <Var>p<sub>sur</sub></Var>{sym.eq}
      <Num>6</Num>{sym.dot}
      <span>(</span>
      <Frac num={<><Var>Z<sub>1</sub></Var>{sym.dot}<Var>n</Var></>} den={<Num>10⁴</Num>} />
      <span>)¹·⁵</span>{sym.dot}
      <Var>t<sub>1</sub></Var><sup>2</sup>{sym.dot}
      <Var>B<sub>0</sub></Var><sup>2</sup>
    </div>
    <div className="flex justify-center items-center flex-wrap gap-1">
      <Var>P<sub>sur</sub></Var>{sym.eq}
      <Num>0.6</Num>{sym.dot}<Num>(2p)</Num>{sym.dot}
      <Var>α<sub>0</sub></Var>{sym.dot}<Var>τ</Var>{sym.dot}
      <Var>l<sub>1</sub></Var>{sym.dot}<Var>p<sub>sur</sub></Var>{sym.dot}
      <Num>10⁻³</Num>
    </div>
    <div className="font-[Inter,sans-serif] text-[9px] text-slate-400 mt-1">
      t₁ [cm] · B₀ [T] · τ, l₁ [cm] · p_sur [W/cm²]
    </div>
  </div>
</Formula>
            <Formula label="4 — Pertes Mécaniques" accent="amber">
              <Var>P<sub>mec</sub></Var>{sym.eq}
              <Num>0.8</Num>{sym.dot}<Num>(2p)</Num>{sym.dot}
              <span className="mx-1">(</span>
              <Frac num={<Var>v<sub>p</sub></Var>} den={<Num>40</Num>} />
              <span className="mx-0.5">)³</span>{sym.dot}
              {sym.sqrt(<Frac num={<Var>l<sub>M</sub></Var>} den={<Num>19</Num>} />)}
            </Formula>

            <Formula label="5 — Pertes Électriques Stator (Joule)" accent="rose">
              <Var>P<sub>elec</sub></Var>{sym.eq}
              <Var>m</Var>{sym.dot}<Var>I<sub>n</sub></Var><sup>2</sup>{sym.dot}
              <Var>R<sub>a75</sub></Var>{sym.dot}<Num>10⁻³</Num>
            </Formula>

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

            <Formula label="6b — Pertes Supplémentaires" accent="slate">
              <Var>P<sub>sup</sub></Var>{sym.eq}
              <Num>0.005</Num>{sym.dot}<Var>P<sub>n</sub></Var>
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 ml-2">(0.5 % de P<sub>n</sub>)</span>
            </Formula>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-5" />

            <Formula label="7 — Puissance Active Utile" accent="emerald">
              <Var className="text-emerald-700 dark:text-emerald-400">P<sub>n</sub></Var>{sym.eq}
              <Var>S<sub>n</sub></Var>{sym.dot}
              {sym.cos}({sym.phi})
            </Formula>

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
              Télécharger PDF (.pdf)
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

      {/* ═══ 5. RAPPORT PDF — TABLEAU MULTI-PAGES PROFESSIONNEL ══════════ */}
      <PdfReport
        allRows={getExportData()}
        inputs={inputs}
        nominal={nominal}
        efficiency={results.efficiency}
        losses_kW={results.losses_kW}
        fmt={fmt}
      />

    </StepLayout>
  );
}
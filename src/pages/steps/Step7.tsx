import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
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
const CURRENT_STEP = 7;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES TYPOGRAPHIQUES CENTRALISÉS
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
  alertTitle:
    'font-[Inter,sans-serif] font-bold text-sm uppercase tracking-wide',
  alertBody:
    'font-[Inter,sans-serif] text-xs font-medium opacity-90',
  errorTitle:
    'font-[Inter,sans-serif] font-bold text-destructive',
  errorBody:
    'font-[Inter,sans-serif] text-sm text-destructive/80 mt-2 leading-relaxed',
  code:
    'font-mono text-xs',
  tableHead:
    'font-[Inter,sans-serif] text-xs font-semibold uppercase tracking-wider text-muted-foreground',
  tableCell:
    'font-mono text-sm tabular-nums',
  tableCellBold:
    'font-mono text-sm tabular-nums font-bold text-primary',
  tableCellMuted:
    'font-mono text-sm tabular-nums text-muted-foreground',
  ampereLabel:
    'font-[Inter,sans-serif] text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400',
  ampereBody:
    'font-mono text-lg font-semibold text-blue-900 dark:text-blue-200',
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
  const accents = {
    sky:     'border-l-sky-400     bg-sky-50/60     dark:bg-sky-950/20',
    emerald: 'border-l-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20',
    violet:  'border-l-violet-400  bg-violet-50/60  dark:bg-violet-950/20',
    amber:   'border-l-amber-400   bg-amber-50/60   dark:bg-amber-950/20',
    rose:    'border-l-rose-400    bg-rose-50/60    dark:bg-rose-950/20',
    cyan:    'border-l-cyan-400    bg-cyan-50/60    dark:bg-cyan-950/20',
    slate:   'border-l-slate-400   bg-slate-50/60   dark:bg-slate-950/20',
  };

  const dots = {
    sky:     'bg-sky-400',
    emerald: 'bg-emerald-400',
    violet:  'bg-violet-400',
    amber:   'bg-amber-400',
    rose:    'bg-rose-400',
    cyan:    'bg-cyan-400',
    slate:   'bg-slate-400',
  };

  return (
    <div
      className={`
        relative border-l-[3px] rounded-r-xl px-5 py-4 mb-3
        border border-slate-100 dark:border-slate-800/60
        shadow-sm transition-all duration-200
        hover:shadow-md hover:scale-[1.01]
        ${accents[accent as keyof typeof accents]}
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[accent as keyof typeof dots]}`} />
        <p className={typo.formulaLabel}>{label}</p>
      </div>
      <div
        className={`
          flex flex-wrap justify-center items-center gap-1
          py-2 overflow-x-auto
          ${typo.mathBody}
        `}
      >
        {children}
      </div>
    </div>
  );
}

function Frac({
  num,
  den,
}: {
  num: React.ReactNode;
  den: React.ReactNode;
}) {
  return (
    <span className="inline-flex flex-col items-center mx-1.5 align-middle">
      <span className={`border-b border-current px-2 pb-0.5 leading-snug ${typo.mathBody}`}>
        {num}
      </span>
      <span className={`px-2 pt-0.5 leading-snug ${typo.mathBody}`}>
        {den}
      </span>
    </span>
  );
}

function Var({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono italic font-semibold text-slate-800 dark:text-slate-200">
      {children}
    </span>
  );
}

function Op({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono font-light text-slate-500 dark:text-slate-400 mx-1.5">
      {children}
    </span>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono font-normal tabular-nums text-slate-700 dark:text-slate-300">
      {children}
    </span>
  );
}

const sym = {
  dot:    <Op>·</Op>,
  eq:     <Op>=</Op>,
  plus:   <Op>+</Op>,
  minus:  <Op>−</Op>,
  delta:  <Var>δ</Var>,
  sigma:  <Var>σ</Var>,
  phi:    <Var>Φ</Var>,
  xi:     <Var>ξ</Var>,
  pi:     <Var>π</Var>,
  sum:    <span className="font-mono font-normal text-slate-700 dark:text-slate-300 mx-0.5">Σ</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  unit,
  accent = 'slate',
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'slate';
}) {
  const borders = {
    sky:     'border-t-sky-400',
    emerald: 'border-t-emerald-400',
    violet:  'border-t-violet-500',
    amber:   'border-t-amber-400',
    rose:    'border-t-rose-400',
    cyan:    'border-t-cyan-400',
    slate:   'border-t-slate-400',
  };

  const valueColors = {
    sky:     'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet:  'text-violet-600 dark:text-violet-400',
    amber:   'text-amber-600 dark:text-amber-400',
    rose:    'text-rose-600 dark:text-rose-400',
    cyan:    'text-cyan-600 dark:text-cyan-400',
    slate:   'text-primary',
  };

  return (
    <div
      className={`
        rounded-xl border border-border border-t-2 p-4
        bg-white dark:bg-slate-900/60
        shadow-sm hover:shadow-md transition-all duration-200
        flex flex-col items-center text-center gap-1
        ${borders[accent as keyof typeof borders]}
      `}
    >
      <p className={typo.label}>{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span
          className={`
            font-mono text-2xl font-bold
            tabular-nums tracking-tight
            ${valueColors[accent as keyof typeof valueColors]}
          `}
        >
          {value}
        </span>
        {unit && <span className={typo.unit}>{unit}</span>}
      </div>
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

          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <span className="font-mono text-white font-black text-2xl tracking-tight">
              {CURRENT_STEP}
            </span>
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className={`${typo.bannerLabel} mb-0.5`}>
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>
            <h1 className={typo.bannerTitle}>
              Caractéristique à Vide
            </h1>
            <p className={typo.bannerDesc}>
              Bilan des forces magnétomotrices (FMM) et courbe de saturation du circuit magnétique
            </p>
          </div>

          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">📈</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Saturation
            </span>
          </div>
        </div>

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

          <div className="relative w-full mt-1.5">
            <div className="flex justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const step      = i + 1;
                const isDone    = step < CURRENT_STEP;
                const isCurrent = step === CURRENT_STEP;

                return (
                  <div
                    key={step}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / TOTAL_STEPS}%` }}
                  >
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
                    {(step === 1 ||
                      step === CURRENT_STEP ||
                      step === TOTAL_STEPS ||
                      step % 7 === 0) && (
                      <span
                        className={`
                          ${typo.stepDot}
                          ${isCurrent
                            ? 'text-emerald-300'
                            : isDone
                              ? 'text-sky-400'
                              : 'text-slate-500'
                          }
                        `}
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

      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Force magnétomotrice', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'           },
          { label: 'Induction dentaire',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Courbe saturation',    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Flux de fuite',        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
          { label: 'Théorème Ampère',      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'         },
        ].map(tag => (
          <span
            key={tag.label}
            className={`${typo.tagLabel} px-2.5 py-0.5 rounded-full border ${tag.color}`}
          >
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
      <span className={`${typo.sectionTitle} px-3 text-center`}>
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Step7() {
  const { mainDimensions, stator, airGap, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!mainDimensions || !stator || !airGap) return null;
    try {
      const nominalData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      const curvePoints = CalculationEngine.generateNoLoadCurve(mainDimensions, stator, airGap);
      return { nominalData, curvePoints };
    } catch (err) {
      console.error('Erreur calcul caractéristique à vide :', err);
      return null;
    }
  }, [mainDimensions, stator, airGap]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v == null || !isFinite(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  const fmtDiv = (v: number | null | undefined, divisor: number, d = 2): string =>
    fmt(v != null && isFinite(v as number) ? (v as number) / divisor : undefined, d);

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Caractéristique à Vide">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour le circuit magnétique.
          </p>
          <p className={typo.errorBody}>
            Veuillez vous assurer que les étapes{' '}
            <code className={typo.code}>3</code> (Dimensions),{' '}
            <code className={typo.code}>4</code> (Stator) et{' '}
            <code className={typo.code}>5</code> (Entrefer) sont calculées.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { nominalData, curvePoints } = results;
  const Bd13Safe    = nominalData?.Bd13 ?? 0;
  const isSaturated = Bd13Safe > 18000;

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Caractéristique à Vide"
      description="Bilan des forces magnétomotrices (FMM) et tracé de la courbe de saturation"
    >
      <StepBanner />

      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ── COLONNE GAUCHE ──────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="FMM Totale (F₀)"
              value={fmt(nominalData?.F_0, 0)}
              unit="A"
              accent="sky"
            />
            <KpiCard
              label="FMM Entrefer (Fδ)"
              value={fmt(nominalData?.F_delta, 0)}
              unit="A"
              accent="emerald"
            />
            <KpiCard
              label="Induction Dent (Bd13)"
              value={fmt(nominalData?.Bd13, 0)}
              unit="G"
              accent="violet"
            />
            <KpiCard
              label="Induction Culasse (Bc)"
              value={fmt(nominalData?.Bc, 0)}
              unit="G"
              accent="amber"
            />
          </div>

          {/* Validation saturation */}
          <div
            className={`
              p-4 rounded-xl border-2 shadow-sm
              ${!isSaturated
                ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                : 'border-destructive/50 bg-destructive/10 text-destructive'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{!isSaturated ? '✅' : '⚠️'}</span>
              <h4 className={typo.alertTitle}>
                Saturation des dents statoriques
              </h4>
            </div>
            <p className={`${typo.alertBody} ml-8`}>
              {!isSaturated
                ? <>L'induction dans les dents (<span className={typo.code}>{fmt(Bd13Safe, 0)} G</span>) est dans les limites acceptables ({'<'} 18 000 G).</>
                : <>Attention : Forte saturation détectée (<span className={typo.code}>{fmt(Bd13Safe, 0)} G {'>'} 18 000 G</span>). Le coefficient K<sub>ex</sub> sera appliqué.</>
              }
            </p>
          </div>

          {/* Tableaux */}
          <ResultTable
            title="Bilan des Forces Magnétomotrices (Loi de Hopkinson)"
            rows={[
              { label: "FMM de l'entrefer",        symbol: <><Var>F<sub>δ</sub></Var></>,      value: fmt(nominalData?.F_delta, 0),   unit: 'A' },
              { label: 'FMM des dents stator',     symbol: <><Var>F<sub>d1</sub></Var></>,     value: fmt(nominalData?.F_d1, 0),      unit: 'A' },
              { label: 'FMM de la culasse stator', symbol: <><Var>F<sub>c</sub></Var></>,      value: fmt(nominalData?.F_c, 0),       unit: 'A' },
              { label: 'FMM de la zone polaire',   symbol: <><Var>F<sub>M0</sub></Var></>,     value: fmt(nominalData?.F_M0, 0),      unit: 'A' },
              { label: 'FMM de la culasse rotor',  symbol: <><Var>F<sub>a</sub></Var></>,      value: fmt(nominalData?.F_a, 0),       unit: 'A' },
              { label: 'FMM jonction pôle-rotor',  symbol: <><Var>F<sub>δM</sub></Var></>,     value: fmt(nominalData?.F_delta_M, 0), unit: 'A' },
              { label: 'FMM TOTALE À VIDE',        symbol: <><Var>F<sub>0</sub></Var></>,      value: fmt(nominalData?.F_0, 0),       unit: 'A' },
            ]}
          />

          <ResultTable
            title="Grandeurs Magnétiques (B et H)"
            rows={[
              { label: 'Induction dent (1/3 hauteur)', symbol: <><Var>B<sub>d13</sub></Var></>, value: fmt(nominalData?.Bd13, 0),  unit: 'G'    },
              { label: 'Champ magnétique dent',        symbol: <><Var>H<sub>d13</sub></Var></>, value: fmt(nominalData?.Hd13, 1),  unit: 'A/cm' },
              { label: 'Induction culasse stator',     symbol: <><Var>B<sub>c</sub></Var></>,   value: fmt(nominalData?.Bc, 0),    unit: 'G'    },
              { label: 'Champ magnétique culasse st.', symbol: <><Var>H<sub>c</sub></Var></>,   value: fmt(nominalData?.Hc, 1),    unit: 'A/cm' },
              { label: 'Induction noyau polaire',      symbol: <><Var>B<sub>M</sub></Var></>,   value: fmt(nominalData?.B_M, 0),   unit: 'G'    },
              { label: 'Champ magnétique noyau pol.',  symbol: <><Var>H<sub>M</sub></Var></>,   value: fmt(nominalData?.H_M, 1),   unit: 'A/cm' },
              { label: 'Induction culasse rotor',      symbol: <><Var>B<sub>a</sub></Var></>,   value: fmt(nominalData?.B_a, 0),   unit: 'G'    },
              { label: 'Champ magnétique culasse rot.',symbol: <><Var>H<sub>a</sub></Var></>,   value: fmt(nominalData?.H_a, 1),   unit: 'A/cm' },
            ]}
          />

          <ResultTable
            title="Géométries et Flux de fuite"
            rows={[
              { label: 'Pas dentaire au tiers',      symbol: <><Var>t<sub>d13</sub></Var></>, value: fmt(nominalData?.t_d13, 2),                         unit: 'cm' },
              { label: 'Largeur dent au tiers',      symbol: <><Var>b<sub>d13</sub></Var></>, value: fmt(nominalData?.b_d13, 2),                         unit: 'cm' },
              { label: 'Longueur culasse stator',    symbol: <><Var>l<sub>c</sub></Var></>,   value: fmt(nominalData?.lc, 2),                            unit: 'cm' },
              { label: 'Coefficient interpolation',  symbol: <Var>ξ</Var>,                    value: fmt(nominalData?.xi, 3),                            unit: ''   },
              { label: 'Flux de dispersion polaire', symbol: <><Var>Φ<sub>σ</sub></Var></>,   value: `${fmtDiv(nominalData?.Phi_sigma, 1e6, 2)} × 10⁶`,  unit: 'Mx' },
              { label: 'Flux total du pôle',         symbol: <><Var>Φ<sub>M</sub></Var></>,   value: `${fmtDiv(nominalData?.Phi_M, 1e6, 2)} × 10⁶`,      unit: 'Mx' },
            ]}
          />
        </div>

        {/* ── COLONNE DROITE ──────────────────────────────────────────────── */}
        <div className="space-y-6 h-fit">

          {/* Formules */}
          <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className={typo.cardTitle}>
                Formules Analytiques
              </CardTitle>
              <CardDescription className={typo.cardDesc}>
                Bilan des FMM (Loi de Hopkinson)
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-1">

              {/* 1. FMM entrefer */}
              <Formula label="1 — FMM de l'Entrefer" accent="sky">
                <Var>F<sub>δ</sub></Var>{sym.eq}
                <Num>1.6</Num>{sym.dot}{sym.delta}{sym.dot}
                <Var>K<sub>δ</sub></Var>{sym.dot}
                <Var>B<sub>δ0</sub></Var>
              </Formula>

              {/* 2. Dent 1/3 */}
              <Formula label="2 — Géométrie de la Dent (1/3 hauteur)" accent="emerald">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex justify-center items-center flex-wrap gap-1">
                    <Var>t<sub>d13</sub></Var>{sym.eq}
                    <Frac
                      num={
                        <span className="flex items-center gap-0.5">
                          {sym.pi}{sym.dot}
                          <span className="font-mono italic text-sm">
                            (D{sym.plus}<Num>2/3</Num>{sym.dot}h<sub>e</sub>)
                          </span>
                        </span>
                      }
                      den={<Var>Z<sub>1</sub></Var>}
                    />
                  </div>
                  <div className="flex justify-center items-center flex-wrap gap-1">
                    <Var>b<sub>d13</sub></Var>{sym.eq}
                    <Var>t<sub>d13</sub></Var>{sym.minus}
                    <Var>b<sub>e</sub></Var>
                  </div>
                </div>
              </Formula>

              {/* 3. FMM dents */}
              <Formula label="3 — FMM des Dents Statoriques" accent="violet">
                <Var>F<sub>d1</sub></Var>{sym.eq}
                <Num>2</Num>{sym.dot}
                <Var>h<sub>e</sub></Var>{sym.dot}
                <Var>H<sub>d13</sub></Var>
              </Formula>

              {/* 4. FMM culasse */}
              <Formula label="4 — FMM de la Culasse Statorique" accent="amber">
                <Var>F<sub>c</sub></Var>{sym.eq}
                <Var>l<sub>c</sub></Var>{sym.dot}
                {sym.xi}{sym.dot}
                <Var>H<sub>c</sub></Var>
              </Formula>

              {/* 5. Flux pôle */}
              <Formula label="5 — Flux Total du Pôle" accent="rose">
                {sym.phi}<sub>M</sub>{sym.eq}
                {sym.phi}<sub>ch</sub>{sym.plus}
                {sym.phi}<sub>σ</sub>
              </Formula>

              {/* 6. FMM zone polaire */}
              <Formula label="6 — FMM de la Zone Polaire" accent="cyan">
                <Var>F<sub>M0</sub></Var>{sym.eq}
                <Num>2</Num>
                <span className="font-mono italic text-sm">
                  (h<sub>m</sub>{sym.plus}h<sub>p</sub>)
                </span>
                {sym.dot}<Var>H<sub>M</sub></Var>
              </Formula>

              {/* 7. FMM culasse rotor */}
              <Formula label="7 — FMM de la Culasse Rotorique" accent="slate">
                <Var>F<sub>a</sub></Var>{sym.eq}
                <Var>l<sub>a,path</sub></Var>{sym.dot}
                <Var>H<sub>a</sub></Var>
              </Formula>

              {/* 8. FMM jonction */}
              <Formula label="8 — FMM Jonction Pôle-Rotor" accent="sky">
                <Var>F<sub>δM</sub></Var>{sym.eq}
                <Num>1.6</Num>{sym.dot}
                <Var>δ<sub>jonc</sub></Var>{sym.dot}
                <Var>B<sub>M</sub></Var>
              </Formula>

              {/* Théorème d'Ampère encadré */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-xl border-2 border-blue-300 dark:border-blue-800 shadow-sm mt-4">
                <p className={`${typo.ampereLabel} mb-3`}>
                  Théorème d'Ampère (FMM Totale)
                </p>
                <div className={`flex justify-center items-center flex-wrap gap-1 ${typo.ampereBody}`}>
                  <Var>F<sub>0</sub></Var>{sym.eq}
                  <Var>F<sub>δ</sub></Var>{sym.plus}
                  <Var>F<sub>d1</sub></Var>{sym.plus}
                  <Var>F<sub>c</sub></Var>{sym.plus}
                  <Var>F<sub>M0</sub></Var>{sym.plus}
                  <Var>F<sub>a</sub></Var>{sym.plus}
                  <Var>F<sub>δM</sub></Var>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Points de la caractéristique à vide */}
          <Card className="shadow-sm border-border bg-white dark:bg-slate-900/60 overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="font-[Inter,sans-serif] text-sm font-bold tracking-tight text-foreground">
                Points de la Caractéristique à Vide
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50">
                  <tr>
                    {['E₀ / Uₙ', 'Bδ (G)', 'Kₑₓ', 'ΣF (A)'].map(h => (
                      <th key={h} className={`px-4 py-2.5 ${typo.tableHead}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {curvePoints.map((pt, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className={`px-4 py-2 ${typo.tableCell}`}>
                        {fmt(pt?.ratio_E0, 2)}
                      </td>
                      <td className={`px-4 py-2 ${typo.tableCell}`}>
                        {fmt(pt?.B_delta_Gauss, 0)}
                      </td>
                      <td className={`px-4 py-2 ${typo.tableCellMuted}`}>
                        {fmt(pt?.K_ex, 2)}
                      </td>
                      <td className={`px-4 py-2 ${typo.tableCellBold}`}>
                        {fmt(pt?.F_total_A, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

        </div>
      </div>
    </StepLayout>
  );
}
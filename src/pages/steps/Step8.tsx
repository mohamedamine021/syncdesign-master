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
const CURRENT_STEP = 8;

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
  constTitle:
    'font-[Inter,sans-serif] font-bold text-blue-800 dark:text-blue-300 mb-2 text-sm',
  constItem:
    'font-mono text-xs text-blue-700 dark:text-blue-400 tabular-nums',
  errorTitle:
    'font-[Inter,sans-serif] font-bold text-destructive',
  errorBody:
    'font-[Inter,sans-serif] text-sm text-destructive/80 mt-2 leading-relaxed',
  code:
    'font-mono text-xs',
  subFormula:
    'font-mono text-sm font-medium text-slate-600 dark:text-slate-400',
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

function Sqrt({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center font-mono mx-1">
      <span className="text-lg font-light text-slate-500 mr-0.5">√</span>
      <span className="border-t border-current px-1 text-sm">{children}</span>
    </span>
  );
}

function Trig({ fn, arg }: { fn: string; arg: React.ReactNode }) {
  return (
    <span className="font-mono text-sm">
      <span className="font-normal text-slate-600 dark:text-slate-400">{fn}</span>
      <span className="italic font-semibold text-slate-800 dark:text-slate-200">({arg})</span>
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
  lambda: <Var>λ</Var>,
  beta:   <Var>β</Var>,
  tau:    <Var>τ</Var>,
  rho:    <Var>ρ</Var>,
  sum:    <span className="font-mono font-normal text-slate-700 dark:text-slate-300 mx-0.5">Σ</span>,
  prime:  <span className="font-mono text-slate-800 dark:text-slate-200 mx-0.5">'</span>,
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
              Réactance de Fuite Statorique
            </h1>
            <p className={typo.bannerDesc}>
              Calcul des coefficients de perméance de fuite et de la réactance de dispersion Xσ
            </p>
          </div>

          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl font-bold">
                X
              </span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Fuite
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

      {/* Tags */}
      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Perméance encoche',    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'          },
          { label: 'Fuite différentielle', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Têtes de bobines',     color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Réactance Xσ',         color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
          { label: 'Constantes temps',     color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'         },
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
export default function Step8() {
  const { inputs, nominal, stator, airGap, mainDimensions, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !stator || !airGap || !mainDimensions) return null;
    try {
      const engineResults = CalculationEngine.calcLeakageReactance(
        inputs, nominal, stator, airGap, mainDimensions
      );

      const he_mm = stator.he || 68;
      const be_mm = stator.be || 15.2;

      const slotGeometry = {
        h1:       he_mm * 0.79,
        ha:       he_mm * 0.13,
        be:       be_mm,
        h2_prime: he_mm * 0.14,
        h4:       he_mm * 0.13,
        bou:      be_mm,
      };

      return { ...engineResults, slotGeometry };
    } catch (err) {
      console.error('Erreur calcul réactances de fuite :', err);
      return null;
    }
  }, [inputs, nominal, stator, airGap, mainDimensions]);

  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Réactance de Fuite Statorique">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour le calcul des réactances.
          </p>
          <p className={typo.errorBody}>
            Veuillez vous assurer que toutes les étapes{' '}
            <code className={typo.code}>1</code> à{' '}
            <code className={typo.code}>7</code> ont bien été complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Réactance de Fuite Statorique"
      description="Calcul exhaustif des coefficients de perméance de fuite et de la réactance de dispersion statorique (Xσ)"
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
              label="Réactance Dispersion"
              value={fmt(results.x_sigma_pu, 3)}
              unit="p.u."
              accent="sky"
            />
            <KpiCard
              label="Réactance Ohmique"
              value={fmt(results.x_sigma_ohm, 3)}
              unit="Ω"
              accent="emerald"
            />
            <KpiCard
              label="Somme Perméances (Σλ)"
              value={fmt(results.sum_lambda, 3)}
              accent="violet"
            />
            <KpiCard
              label="Constante Temps (Td₀)"
              value={fmt(results.timeConstants_s.T_d0, 1)}
              unit="s"
              accent="amber"
            />
          </div>

          {/* Tableaux */}
          <ResultTable
            title="Coefficients de Perméance de Fuite (λ)"
            rows={[
              { label: "Fuite d'encoche",           symbol: <><Var>λ<sub>e1</sub></Var></>,      value: fmt(results.lambda_e1, 4),  unit: '' },
              { label: 'Fuite différentielle',       symbol: <><Var>λ<sub>di1</sub></Var></>,     value: fmt(results.lambda_di1, 4), unit: '' },
              { label: 'Fuite des têtes de bobines', symbol: <><Var>λ<sub>l1</sub></Var></>,      value: fmt(results.lambda_l1, 4),  unit: '' },
              { label: 'SOMME TOTALE DES FUITES',    symbol: <>{sym.sum}{sym.lambda}</>,        value: fmt(results.sum_lambda, 4), unit: '' },
            ]}
          />

          <ResultTable
            title="Réactances de la Machine"
            rows={[
              { label: 'Réactance de dispersion statorique', symbol: <><Var>X<sub>σ</sub></Var></>,  value: fmt(results.x_sigma_ohm, 3), unit: 'Ω'    },
              { label: 'Réactance de dispersion en p.u.',    symbol: <><Var>X<sub>σ</sub></Var>*</>, value: fmt(results.x_sigma_pu, 3),  unit: 'p.u.' },
              { label: "Réactance d'excitation",             symbol: <><Var>X<sub>B</sub></Var></>,  value: fmt(results.x_B, 3),         unit: 'p.u.' },
              { label: 'Réactance dispersion excitation',    symbol: <><Var>X<sub>Bσ</sub></Var></>, value: fmt(results.x_Bsigma, 3),    unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Constantes de Temps Transitoires (Régime dynamique)"
            rows={[
              { label: "Constante d'ouverture à vide",         symbol: <><Var>T<sub>d0</sub></Var></>,          value: fmt(results.timeConstants_s.T_d0, 2),      unit: 's' },
              { label: 'Constante transitoire (court-circuit)', symbol: <><Var>T</Var>{sym.prime}<sub>d</sub></>, value: fmt(results.timeConstants_s.T_d_prime, 2), unit: 's' },
              { label: "Constante d'amortissement",            symbol: <><Var>T<sub>a</sub></Var></>,           value: fmt(results.timeConstants_s.T_a, 2),       unit: 's' },
            ]}
          />

          {/* Paramètres géométriques */}
          <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20">
            <p className={typo.constTitle}>
              Paramètres géométriques d'encoche appliqués
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {[
                { sym: 'h₁',  val: results.slotGeometry.h1       },
                { sym: 'hₐ',  val: results.slotGeometry.ha       },
                { sym: 'bₑ',  val: results.slotGeometry.be       },
                { sym: "h'₂", val: results.slotGeometry.h2_prime },
                { sym: 'h₄',  val: results.slotGeometry.h4       },
                { sym: 'bₒᵤ', val: results.slotGeometry.bou      },
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="font-mono italic font-semibold text-xs text-blue-800 dark:text-blue-300 w-10">
                    {item.sym}
                  </span>
                  <Op>=</Op>
                  <span className={typo.constItem}>
                    {fmt(item.val, 2)} mm
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── COLONNE DROITE : FORMULES ────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 h-fit backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className={typo.cardTitle}>
              Formules Mathématiques
            </CardTitle>
            <CardDescription className={typo.cardDesc}>
              Équations analytiques des fuites magnétiques (Fig 2.13, 2.14)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* 1. λ_e1 */}
            <Formula label="1 — Perméance de fuite d'encoche" accent="sky">
              <Var>λ<sub>e1</sub></Var>{sym.eq}
              <Frac
                num={
                  <span className="flex items-center gap-0.5">
                    <Var>h<sub>1</sub></Var>{sym.minus}<Var>h<sub>a</sub></Var>
                  </span>
                }
                den={
                  <><Num>3</Num><Var>b<sub>e</sub></Var></>
                }
              />
              {sym.dot}<Var>k<sub>β</sub></Var>
              {sym.plus}
              <Frac
                num={<Var>h'<sub>2</sub></Var>}
                den={<Var>b<sub>e</sub></Var>}
              />
              {sym.dot}<Var>k'<sub>β</sub></Var>
              {sym.plus}
              <Frac
                num={<Var>h<sub>4</sub></Var>}
                den={<><Num>4</Num><Var>b<sub>e</sub></Var></>}
              />
            </Formula>

            {/* 2. λ_di1 */}
            <Formula label="2 — Perméance de fuite différentielle" accent="emerald">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="flex flex-wrap justify-center items-center gap-1">
                  <Var>λ<sub>di1</sub></Var>{sym.eq}
                  <Frac
                    num={
                      <span className="flex flex-wrap items-center gap-0.5">
                        <Num>0.9</Num>{sym.dot}
                        <Var>t<sub>1</sub></Var>{sym.dot}
                        <span className="font-mono italic text-sm">
                          (q<sub>1</sub>K<sub>w1</sub>)²
                        </span>
                        {sym.dot}<Var>ρ<sub>d1</sub></Var>{sym.dot}
                        <Var>K<sub>ou</sub></Var>
                      </span>
                    }
                    den={
                      <span className="flex items-center gap-0.5">
                        {sym.delta}{sym.dot}<Var>K<sub>δ</sub></Var>
                      </span>
                    }
                  />
                  {sym.dot}<Var>σ<sub>d1</sub></Var>
                </div>

                {/* Sous-formule Kou */}
                <div className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800`}>
                  <Var>K<sub>ou</sub></Var>{sym.eq}
                  <Num>1</Num>{sym.minus}<Num>0.033</Num>
                  <span className="font-mono italic text-sm mx-1">
                    (
                    <Frac
                      num={<Var>b<sub>ou</sub></Var>}
                      den={<Var>t<sub>1</sub></Var>}
                    />
                    )²
                  </span>
                </div>
              </div>
            </Formula>

            {/* 3. λ_l1 */}
            <Formula label="3 — Perméance de fuite des têtes de bobines" accent="violet">
              <Var>λ<sub>l1</sub></Var>{sym.eq}
              <Num>0.34</Num>{sym.dot}
              <Frac
                num={<Var>q<sub>1</sub></Var>}
                den={<Var>l<sub>δ,fin</sub></Var>}
              />
              {sym.dot}
              <span className="font-mono italic text-sm">
                (l<sub>l1</sub>{sym.minus}<Num>0.64</Num><Var>β<sub>1</sub></Var>{sym.dot}{sym.tau})
              </span>
            </Formula>

            {/* 4. Σλ */}
            <Formula label="4 — Somme des perméances" accent="amber">
              {sym.sum}{sym.lambda}{sym.eq}
              <Var>λ<sub>e1</sub></Var>{sym.plus}
              <Var>λ<sub>di1</sub></Var>{sym.plus}
              <Var>λ<sub>l1</sub></Var>{sym.plus}
              <Var>λ<sub>k1</sub></Var>
            </Formula>

            {/* 5. Xσ (Ω) */}
            <Formula label="5 — Réactance de dispersion (Ω)" accent="rose">
              <Var>X<sub>σ</sub></Var>
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 mx-1">(Ω)</span>
              {sym.eq}
              <Num>0.158</Num>{sym.dot}
              <Frac
                num={<Var>f</Var>}
                den={<Num>100</Num>}
              />
              {sym.dot}
              <span className="font-mono italic text-sm">
                (
                <Frac
                  num={<Var>w<sub>1</sub></Var>}
                  den={<Num>100</Num>}
                />
                )²
              </span>
              {sym.dot}
              <Frac
                num={<Var>l<sub>δ,fin</sub></Var>}
                den={
                  <span className="flex items-center gap-0.5">
                    <Var>p</Var>{sym.dot}<Var>q<sub>1</sub></Var>
                  </span>
                }
              />
              {sym.dot}{sym.sum}{sym.lambda}
            </Formula>

            {/* 6. Xσ* (p.u.) */}
            <Formula label="6 — Réactance de dispersion (p.u.)" accent="cyan">
              <Var>X<sub>σ</sub><sup>*</sup></Var>{sym.eq}
              <Frac
                num={<Var>I<sub>n</sub></Var>}
                den={<Var>U<sub>ph</sub></Var>}
              />
              {sym.dot}
              <Var>X<sub>σ</sub></Var>
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 ml-1">(Ω)</span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
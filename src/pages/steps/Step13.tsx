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
const CURRENT_STEP = 13;

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
  dot:     <Op>·</Op>,
  eq:      <Op>=</Op>,
  plus:    <Op>+</Op>,
  minus:   <Op>−</Op>,
  times:   <Op>×</Op>,
  prime:   <span className="font-mono text-slate-800 dark:text-slate-200 mx-0.5">'</span>,
  epsilon: <Var>ε</Var>,
  phi:     <Var>φ</Var>,
  cos:     <span className="font-mono text-slate-700 dark:text-slate-300 mr-0.5">cos</span>,
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
  accent?: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'slate' | 'green';
  children?: React.ReactNode;
}) {
  const borders: Record<string, string> = {
    sky:     'border-t-sky-400',
    emerald: 'border-t-emerald-400',
    violet:  'border-t-violet-500',
    amber:   'border-t-amber-400',
    rose:    'border-t-rose-400',
    cyan:    'border-t-cyan-400',
    slate:   'border-t-slate-400',
    green:   'border-t-green-400',
  };
  const colors: Record<string, string> = {
    sky:     'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet:  'text-violet-600 dark:text-violet-400',
    amber:   'text-amber-600 dark:text-amber-400',
    rose:    'text-rose-600 dark:text-rose-400',
    cyan:    'text-cyan-600 dark:text-cyan-400',
    slate:   'text-primary',
    green:   'text-green-600 dark:text-green-400',
  };

  return (
    <div
      className={`
        rounded-xl border border-border border-t-2 p-4
        bg-white dark:bg-slate-900/60
        shadow-sm hover:shadow-md transition-all duration-200
        flex flex-col items-center text-center gap-1
        ${borders[accent]}
      `}
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
            <h1 className={typo.bannerTitle}>Stabilité et Surcharge Statique</h1>
            <p className={typo.bannerDesc}>
              Évaluation de la capacité de la machine à maintenir le synchronisme lors d'une augmentation de puissance
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl font-bold">⚖</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              STAB
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
                      className={`w-3 h-3 rounded-full border-2 transition-all duration-300
                        ${isCurrent
                          ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] scale-125'
                          : isDone
                            ? 'bg-sky-400 border-sky-300'
                            : 'bg-white/15 border-white/25'
                        }`}
                    />
                    {(step === 1 ||
                      step === CURRENT_STEP ||
                      step === TOTAL_STEPS ||
                      step % 7 === 0) && (
                      <span
                        className={`${typo.stepDot} ${
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
          { label: 'Surcharge statique',  color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Saillance rotorique', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Tension fictive',     color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Synchronisme',        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Stabilité',           color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
      <span className={`${typo.sectionTitle} px-3 text-center`}>{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Step13() {
  const {
    inputs,
    nominal,
    mainDimensions,
    airGap,
    stator,
    reactances,
    setCurrentStep,
  } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) return null;

    try {
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(
        mainDimensions, stator, airGap,
      );

      // Phi_0 et F_deltadc_A sont maintenant inclus dans le retour natif de calcNoLoadCharacteristic

      const reactancesData =
        reactances ||
        CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      // FIX TYPESCRIPT : "as any" pour extraire les variables correctement
      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || (reactancesData as any).xSigma || 0.1,
        xq:     (reactancesData as any).xq || 1.0,
        r_a:    stator.Ra75pu || 0.02,
      };

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8,
      );

      const safeReaction = {
        coefficients: blondelData.coefficients || (blondelData as any).coeffs,
        F_a:          blondelData.F_a || 0,
      };

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f,
      );

      const dynParams = CalculationEngine.calcMachineParameters(
        nominal, airGap, noLoadData, safeReactances, safeReaction,
        excitationData, mainDimensions, 1.095, inputs.f,
      );

      const shortCircuitData = CalculationEngine.calcShortCircuitCurrents(
        nominal, dynParams, blondelData, 1.08,
      );

      const overloadData = CalculationEngine.calcStaticOverload(
        inputs.cosPhi || 0.8,
        dynParams,
        blondelData,
        shortCircuitData,
      );

      return { dynParams, shortCircuitData, overloadData };
    } catch (err) {
      console.error('Erreur calcul surcharge statique :', err);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances]);

  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ──────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Stabilité et Surcharge Statique">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour les calculs de stabilité.
          </p>
          <p className={typo.errorBody}>
            Vérifiez que toutes les étapes précédentes (notamment les Étapes{' '}
            <code className={typo.code}>11</code> et{' '}
            <code className={typo.code}>12</code>) sont complétées et valides.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { dynParams, shortCircuitData, overloadData } = results;
  const isStable = overloadData.static_overload_S >= 1.5;

  // ── Rendu principal ─────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Stabilité et Surcharge Statique"
      description="Évaluation de la capacité de la machine à maintenir le synchronisme lors d'une augmentation de puissance"
    >
      <StepBanner />

      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COLONNE GAUCHE : KPI + TABLEAUX + CRITÈRES                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="Capacité Surcharge (S)"
              value={fmt(overloadData.static_overload_S, 2)}
              unit="p.u."
              accent="sky"
            />
            <KpiCard
              label="Statut Stabilité"
              value={isStable ? 'STABLE' : 'RISQUÉ'}
              accent={isStable ? 'green' : 'amber'}
            >
              <span className="text-lg mt-0.5">{isStable ? '✅' : '⚠️'}</span>
            </KpiCard>
            <KpiCard
              label="Coeff. Saillance (ε)"
              value={fmt(overloadData.epsilon, 3)}
              accent="violet"
            />
            <KpiCard
              label="Tension Fictive (E₀₀')"
              value={fmt(overloadData.E00_prime_star, 2)}
              unit="p.u."
              accent="emerald"
            />
          </div>

          {/* ── Tableau 1 : Paramètres Déterminants ── */}
          <ResultTable
            title="Paramètres Déterminants"
            rows={[
              {
                label:  'Réactance synchrone directe',
                symbol: <><Var>x<sub>d</sub></Var></>,
                value:  fmt(dynParams.reactances_pu.x_d, 3),
                unit:   'p.u.',
              },
              {
                label:  'Réactance synchrone transversale',
                symbol: <><Var>x<sub>q</sub></Var></>,
                value:  fmt(dynParams.reactances_pu.x_q, 3),
                unit:   'p.u.',
              },
              {
                label:  'Courant de CC en charge',
                symbol: <><Var>I<sub>ccn</sub></Var></>,
                value:  fmt(shortCircuitData.results_pu.I_ccn, 3),
                unit:   'p.u.',
              },
              {
                label:  'Facteur de puissance nominal',
                symbol: <><Op>cos</Op>(<Var>φ</Var>)</>,
                value:  fmt(inputs?.cosPhi, 2),
                unit:   '',
              },
            ]}
          />

          {/* ── Tableau 2 : Résultats de Stabilité Statique ── */}
          <ResultTable
            title="Résultats de Stabilité Statique"
            rows={[
              {
                label:  'Tension interne fictive',
                symbol: <><Var>E<sub>00</sub></Var>{sym.prime}<Var>*</Var></>,
                value:  fmt(overloadData.E00_prime_star, 2),
                unit:   'p.u.',
              },
              {
                label:  'Coefficient de saillance',
                symbol: <Var>ε</Var>,
                value:  fmt(overloadData.epsilon, 3),
                unit:   '',
              },
              {
                label:  'Facteur de correction',
                symbol: <Var>k</Var>,
                value:  fmt(overloadData.k_factor, 3),
                unit:   '',
              },
              {
                label:  'Surcharge statique limite',
                symbol: <Var>S</Var>,
                value:  fmt(overloadData.static_overload_S, 2),
                unit:   'p.u.',
              },
            ]}
          />

          {/* ── Critères industriels ────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-white dark:bg-slate-900/60 shadow-sm p-5">
            <h3 className={`${typo.criteriaTitle} mb-4`}>
              Marge de Sécurité Industrielle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  label:  'Moteur Synchrone',
                  value:  'S ≥ 1.5',
                  accent: 'border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/20',
                },
                {
                  label:  'Turbo-Alternateur',
                  value:  'S ≥ 1.8 à 2.2',
                  accent: 'border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20',
                },
              ].map(c => (
                <div
                  key={c.label}
                  className={`p-3 rounded-lg border ${c.accent} flex flex-col gap-1`}
                >
                  <p className={typo.label}>{c.label}</p>
                  <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
            <p className={typo.criteriaNote}>
              * Une valeur S = {fmt(overloadData.static_overload_S, 2)} signifie que la machine
              peut fournir {fmt(overloadData.static_overload_S * 100, 0)} % de sa puissance
              nominale avant de « décrocher » (perdre le synchronisme).
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COLONNE DROITE : FORMULES                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 h-fit backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className={typo.cardTitle}>Formules Mathématiques</CardTitle>
            <CardDescription className={typo.cardDesc}>
              Limite de stabilité statique — valeurs en p.u.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* ── 1. Tension interne fictive ──────────────────────────────── */}
            <Formula label="1 — Tension interne fictive" accent="sky">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>E<sub>00</sub></Var>{sym.prime}<Var>*</Var>
                  {sym.eq}
                  <Var>E<sub>0</sub></Var>{sym.prime}<Var>*</Var>
                  {sym.dot}
                  <Var>I<sub>Bn</sub>*</Var>
                </div>
                <div
                  className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 w-full text-center`}
                >
                  <span className="font-[Inter,sans-serif] text-xs text-slate-500 mr-1">Avec</span>
                  <Var>I<sub>Bn</sub>*</Var>
                  <span className="font-[Inter,sans-serif] text-xs text-slate-500 mx-1">=</span>
                  <Var>F<sub>Bn</sub>*</Var>
                  <span className="font-[Inter,sans-serif] text-xs text-slate-400 ml-2">
                    (Diagramme de Blondel — Étape 9)
                  </span>
                </div>
              </div>
            </Formula>

            {/* ── 2. Coefficient de saillance ─────────────────────────────── */}
            <Formula label="2 — Coefficient de saillance (Polarité)" accent="emerald">
              <div className="flex justify-center items-center flex-wrap gap-1">
                {sym.epsilon}{sym.eq}
                <Frac
                  num={<><Var>x<sub>d</sub></Var>{sym.minus}<Var>x<sub>q</sub></Var></>}
                  den={<><Var>E<sub>00</sub></Var>{sym.prime}<Var>*</Var>{sym.dot}<Var>x<sub>q</sub></Var></>}
                />
              </div>
            </Formula>

            {/* ── 3. Facteur de correction ─────────────────────────────────── */}
            <Formula label="3 — Facteur de correction de forme" accent="violet">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>k</Var>{sym.eq}
                  <Num>1</Num>{sym.plus}
                  <Num>0.11</Num>{sym.dot}{sym.epsilon}
                </div>
                <div
                  className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 w-full text-center`}
                >
                  <span className="font-[Inter,sans-serif] text-xs text-slate-400">
                    Approximation linéaire de la courbe de puissance
                  </span>
                </div>
              </div>
            </Formula>

            {/* ── 4. Surcharge statique maximale ──────────────────────────── */}
            <Formula label="4 — Surcharge Statique Maximale" accent="amber">
              <div className="flex justify-center items-center flex-wrap gap-1">
                <Var>S</Var>{sym.eq}
                <Frac
                  num={<Var>I<sub>ccn</sub></Var>}
                  den={<>{sym.cos}({sym.phi})</>}
                />
                {sym.dot}<Var>k</Var>
              </div>
            </Formula>

            {/* Séparateur */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-5" />

            {/* ── 5. Critère de stabilité ──────────────────────────────────── */}
            <Formula label="5 — Critère de stabilité statique" accent="rose">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>S</Var>
                  <Op>≥</Op>
                  <Num>1.5</Num>
                  <span className="font-[Inter,sans-serif] text-xs text-slate-500 ml-1">
                    (moteur)
                  </span>
                </div>
                <div
                  className={`font-[Inter,sans-serif] text-xs font-semibold px-3 py-1.5 rounded-full ${
                    isStable
                      ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  S = {fmt(overloadData.static_overload_S, 2)}{' '}
                  {isStable ? '→ Stable ✅' : '→ Risqué ⚠️'}
                </div>
              </div>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
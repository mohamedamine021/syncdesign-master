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
const CURRENT_STEP = 12;

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
      <div
        className={`flex flex-wrap justify-center items-center gap-1 py-2 overflow-x-auto ${typo.mathBody}`}
      >
        {children}
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1.5 align-middle">
      <span className={`border-b border-current px-2 pb-0.5 leading-snug ${typo.mathBody}`}>
        {num}
      </span>
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
  dot:   <Op>·</Op>,
  eq:    <Op>=</Op>,
  plus:  <Op>+</Op>,
  minus: <Op>−</Op>,
  times: <Op>×</Op>,
  prime: (
    <span className="font-mono text-slate-800 dark:text-slate-200 mx-0.5">
      '
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
        <span
          className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${colors[accent]}`}
        >
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
            <h1 className={typo.bannerTitle}>Courants de Court-Circuit</h1>
            <p className={typo.bannerDesc}>
              Évaluation de l'intensité des courants de défaut statorique en régime permanent
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl font-bold">⚡</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              CC
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
          { label: 'Court-circuit permanent', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Exc. à vide',             color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Exc. nominale',            color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Sévérité',                 color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Sécurité',                 color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
export default function Step12() {
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
        F_a: blondelData.F_a || 0,
      };

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f,
      );

      const dynParams = CalculationEngine.calcMachineParameters(
        nominal, airGap, noLoadData, safeReactances, safeReaction,
        excitationData, mainDimensions, 1.095, inputs.f,
      );

      const E0_prime_star_default = 1.08;
      return CalculationEngine.calcShortCircuitCurrents(
        nominal, dynParams, blondelData, E0_prime_star_default,
      );
    } catch (err) {
      console.error('Erreur calcul courants de court-circuit :', err);
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
      <StepLayout stepNumber={CURRENT_STEP} title="Courants de Court-Circuit">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour les calculs de court-circuit.
          </p>
          <p className={typo.errorBody}>
            Vérifiez que toutes les étapes précédentes (en particulier les Étapes{' '}
            <code className={typo.code}>9</code> et{' '}
            <code className={typo.code}>11</code>) sont complétées et valides.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { inputs: scInputs, results_pu, results_real } = results;
  const severityRatio = results_real.I_ccn_A / (nominal?.In || 1);
  const isHighFault   = severityRatio > 2;

  // ── Rendu principal ─────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Courants de Court-Circuit"
      description="Évaluation de l'intensité des courants de défaut statorique en régime permanent"
    >
      <StepBanner />

      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COLONNE GAUCHE : KPI + TABLEAUX                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="CC Nominal (p.u.)"
              value={fmt(results_pu.I_ccn, 2)}
              unit="p.u."
              accent="sky"
            />
            <KpiCard
              label="CC Nominal (Ampères)"
              value={fmt(results_real.I_ccn_A, 0)}
              unit="A"
              accent="emerald"
            />
            <KpiCard
              label="Ratio de Sévérité"
              value={fmt(severityRatio, 1)}
              unit="× Iₙ"
              accent="violet"
            />
            <KpiCard
              label="Statut de sécurité"
              value={isHighFault ? 'ÉLEVÉ' : 'MODÉRÉ'}
              accent={isHighFault ? 'amber' : 'green'}
            >
              <span className="text-lg mt-0.5">{isHighFault ? '⚠️' : '✅'}</span>
            </KpiCard>
          </div>

          {/* ── Tableau 1 : Paramètres d'entrée ── */}
          <ResultTable
            title="Paramètres d'Entrée du Court-Circuit"
            rows={[
              {
                label:  'Tension induite interne à vide',
                symbol: <><Var>E</Var>'<sub>0</sub>*</>,
                value:  fmt(scInputs.E0_prime_star, 2),
                unit:   'p.u.',
              },
              {
                label:  'Réactance synchrone directe',
                symbol: <><Var>x<sub>d</sub></Var></>,
                value:  fmt(scInputs.x_d_pu, 3),
                unit:   'p.u.',
              },
              {
                label:  "Courant d'excitation nominal",
                symbol: <><Var>I<sub>Bn</sub></Var>*</>,
                value:  fmt(scInputs.F_Bn_star_pu, 3),
                unit:   'p.u.',
              },
            ]}
          />

          {/* ── Tableau 2 : Résultats en régime permanent ── */}
          <ResultTable
            title="Résultats en Régime Permanent"
            rows={[
              {
                label:  'Courant CC (excitation à vide)',
                symbol: <><Var>I<sub>cc0</sub></Var></>,
                value:  fmt(results_pu.I_cc0, 3),
                unit:   'p.u.',
              },
              {
                label:  'Courant CC (excitation nominale)',
                symbol: <><Var>I<sub>ccn</sub></Var></>,
                value:  fmt(results_pu.I_ccn, 3),
                unit:   'p.u.',
              },
              {
                label:  'Courant nominal statorique',
                symbol: <><Var>I<sub>n</sub></Var></>,
                value:  fmt(nominal?.In, 0),
                unit:   'A',
              },
              {
                label:  'Courant de défaut absolu',
                symbol: <><Var>I<sub>ccn</sub></Var></>,
                value:  fmt(results_real.I_ccn_A, 0),
                unit:   'A',
              },
            ]}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COLONNE DROITE : FORMULES                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 h-fit backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className={typo.cardTitle}>Formules Mathématiques</CardTitle>
            <CardDescription className={typo.cardDesc}>
              Rapport de court-circuit en régime permanent — toutes les valeurs en p.u. sauf mention contraire
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* ── 1. Courant CC excitation à vide ────────────────────────── */}
            <Formula label="1 — Courant de CC (Excitation à vide)" accent="sky">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>I<sub>cc0</sub></Var>
                  {sym.eq}
                  <Frac
                    num={<><Var>E</Var>{sym.prime}<Var><sub>0</sub></Var><Var>*</Var></>}
                    den={<Var>x<sub>d</sub></Var>}
                  />
                </div>
                <div
                  className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-center`}
                >
                  <span className="font-[Inter,sans-serif] text-xs text-slate-500">
                    Toutes les valeurs en p.u.
                  </span>
                </div>
              </div>
            </Formula>

            {/* ── 2. Courant CC excitation nominale ──────────────────────── */}
            <Formula label="2 — Courant de CC (Excitation nominale)" accent="emerald">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>I<sub>ccn</sub></Var>
                  {sym.eq}
                  <Var>I<sub>cc0</sub></Var>
                  {sym.dot}
                  <Var>I<sub>Bn</sub>*</Var>
                </div>
                <div
                  className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 w-full text-center`}
                >
                  <span className="font-[Inter,sans-serif] text-xs text-slate-500 mr-1">Avec</span>
                  <Var>I<sub>Bn</sub>*</Var>
                  <span className="mx-1 font-[Inter,sans-serif] text-xs text-slate-500">=</span>
                  <Var>F<sub>Bn</sub>*</Var>
                  <span className="font-[Inter,sans-serif] text-xs text-slate-400 ml-2">
                    (calculé via Blondel — Étape 9)
                  </span>
                </div>
              </div>
            </Formula>

            {/* ── 3. Courant absolu ───────────────────────────────────────── */}
            <Formula label="3 — Courant de défaut absolu (Ampères)" accent="violet">
              <div className="flex justify-center items-center flex-wrap gap-1">
                <Var>I<sub>ccn</sub></Var>
                <span className="font-[Inter,sans-serif] text-xs text-slate-500 mx-1">(A)</span>
                {sym.eq}
                <Var>I<sub>ccn</sub></Var>
                <span className="font-[Inter,sans-serif] text-xs text-slate-500 mx-1">(p.u.)</span>
                {sym.times}
                <Var>I<sub>n</sub></Var>
              </div>
            </Formula>

            {/* Séparateur */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-5" />

            {/* ── 4. Critère de sévérité ──────────────────────────────────── */}
            <Formula label="4 — Critère de sévérité du défaut" accent="amber">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>κ</Var>
                  {sym.eq}
                  <Frac
                    num={<Var>I<sub>ccn</sub></Var>}
                    den={<Var>I<sub>n</sub></Var>}
                  />
                </div>

                <div
                  className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 w-full flex justify-center items-center gap-2`}
                >
                  <Var>κ</Var>
                  <span className="font-[Inter,sans-serif] text-xs text-slate-500">=</span>
                  <Num>{fmt(severityRatio, 2)}</Num>
                  <span
                    className={`font-[Inter,sans-serif] text-xs font-semibold ml-2 px-2 py-0.5 rounded-full ${
                      isHighFault
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        : 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {isHighFault ? '> 2 → Défaut élevé ⚠️' : '≤ 2 → Défaut modéré ✅'}
                  </span>
                </div>
              </div>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
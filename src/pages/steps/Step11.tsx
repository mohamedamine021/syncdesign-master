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
const CURRENT_STEP = 11;

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

const sym = {
  dot:    <Op>·</Op>,
  eq:     <Op>=</Op>,
  plus:   <Op>+</Op>,
  minus:  <Op>−</Op>,
  approx: <Op>≈</Op>,
  delta:  <Var>δ</Var>,
  sigma:  <Var>σ</Var>,
  lambda: <Var>λ</Var>,
  phi:    <Var>Φ</Var>,
  omega:  <Var>ω</Var>,
  pi:     <Var>π</Var>,
  prime:  <span className="font-mono text-slate-800 dark:text-slate-200 mx-0.5">'</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, unit, accent = 'slate',
}: {
  label: string; value: string; unit?: string;
  accent?: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'slate';
}) {
  const borders: Record<string, string> = {
    sky: 'border-t-sky-400', emerald: 'border-t-emerald-400', violet: 'border-t-violet-500',
    amber: 'border-t-amber-400', rose: 'border-t-rose-400', cyan: 'border-t-cyan-400',
    slate: 'border-t-slate-400',
  };
  const colors: Record<string, string> = {
    sky: 'text-sky-600 dark:text-sky-400', emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400', amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400', cyan: 'text-cyan-600 dark:text-cyan-400',
    slate: 'text-primary',
  };

  return (
    <div className={`rounded-xl border border-border border-t-2 p-4 bg-white dark:bg-slate-900/60
      shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center gap-1 ${borders[accent]}`}>
      <p className={typo.label}>{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${colors[accent]}`}>
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
            <h1 className={typo.bannerTitle}>Paramètres Dynamiques</h1>
            <p className={typo.bannerDesc}>
              Calcul des réactances synchrones, transitoires et des constantes de temps de la machine
            </p>
          </div>

          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl font-bold">⚙</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Dynamique
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
                const step = i + 1;
                const isDone = step < CURRENT_STEP;
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

      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Réactance synchrone',   color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Réactance transitoire', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Réaction induit',       color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Constantes temps',      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Résistances',           color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Step11() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, excitation, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) return null;

    try {
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      noLoadData.Phi_0 = stator.Phi0;
      if (noLoadData.F_deltadc_A === undefined)
        noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;

      const reactancesData = reactances ||
        CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1,
        xq: reactancesData.xq || 1.0,
        r_a: stator.Ra75pu || 0.02,
      };

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );

      const safeReaction = {
        coefficients: blondelData.coefficients || (blondelData as any).coeffs,
        F_a: blondelData.F_a || 0,
      };

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );

      return CalculationEngine.calcMachineParameters(
        nominal, airGap, noLoadData, safeReactances, safeReaction,
        excitationData, mainDimensions, 1.095, inputs.f
      );
    } catch (err) {
      console.error('Erreur calcul paramètres dynamiques :', err);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances, excitation]);

  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ──────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Paramètres Dynamiques">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour les calculs dynamiques.
          </p>
          <p className={typo.errorBody}>
            Assurez-vous que toutes les étapes de{' '}
            <code className={typo.code}>1</code> à{' '}
            <code className={typo.code}>10</code> sont complétées et valides.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { reactances_pu, resistances_pu, timeConstants_s } = results;

  // ── Rendu principal ─────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Paramètres Dynamiques"
      description="Calcul des réactances synchrones, transitoires et des constantes de temps de la machine"
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
              label="Synchrone Directe (xd)"
              value={fmt(reactances_pu.x_d, 3)}
              unit="p.u."
              accent="sky"
            />
            <KpiCard
              label="Synchrone Transversale (xq)"
              value={fmt(reactances_pu.x_q, 3)}
              unit="p.u."
              accent="emerald"
            />
            <KpiCard
              label="Transitoire Directe (x'd)"
              value={fmt(reactances_pu.x_d_prime, 3)}
              unit="p.u."
              accent="violet"
            />
            <KpiCard
              label="Temps d'ouverture (Td0)"
              value={fmt(timeConstants_s.T_d0, 2)}
              unit="s"
              accent="amber"
            />
          </div>

          <ResultTable
            title="Réactances Statoriques et Rotoriques (En p.u.)"
            rows={[
              { label: "Réaction d'induit longitudinale",   symbol: <><Var>x<sub>ad</sub></Var></>,  value: fmt(reactances_pu.x_ad, 3),     unit: 'p.u.' },
              { label: "Réaction d'induit transversale",    symbol: <><Var>x<sub>aq</sub></Var></>,  value: fmt(reactances_pu.x_aq, 3),     unit: 'p.u.' },
              { label: 'Réactance synchrone longitudinale', symbol: <><Var>x<sub>d</sub></Var></>,   value: fmt(reactances_pu.x_d, 3),      unit: 'p.u.' },
              { label: 'Réactance synchrone transversale',  symbol: <><Var>x<sub>q</sub></Var></>,   value: fmt(reactances_pu.x_q, 3),      unit: 'p.u.' },
              { label: "Réactance d'excitation",            symbol: <><Var>x<sub>B</sub></Var></>,   value: fmt(reactances_pu.x_B, 3),      unit: 'p.u.' },
              { label: 'Réactance dispersion excitation',   symbol: <><Var>x<sub>Bσ</sub></Var></>,  value: fmt(reactances_pu.x_Bsigma, 3), unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Paramètres de Régime Transitoire et Inverse"
            rows={[
              { label: 'Réactance transitoire directe',  symbol: <><Var>x</Var>{sym.prime}<sub>d</sub></>,  value: fmt(reactances_pu.x_d_prime, 3),     unit: 'p.u.'  },
              { label: "Réactance d'ordre inverse",      symbol: <><Var>x<sub>2</sub></Var></>,             value: fmt(reactances_pu.x_2, 3),           unit: 'p.u.'  },
              { label: 'Pulsation électrique',           symbol: {omega: sym.omega}.omega,                  value: fmt(timeConstants_s.omega_rad_s, 1), unit: 'rad/s' },
              { label: 'Résistance rotorique réduite',   symbol: <><Var>r<sub>B</sub></Var></>,             value: fmt(resistances_pu.r_B, 5),          unit: 'p.u.'  },
              { label: 'Résistance statorique',          symbol: <><Var>r<sub>a</sub></Var></>,             value: fmt(resistances_pu.r_a, 5),          unit: 'p.u.'  },
            ]}
          />

          <ResultTable
            title="Constantes de Temps (Secondes)"
            rows={[
              { label: "Constante d'ouverture à vide", symbol: <><Var>T<sub>d0</sub></Var></>,                 value: fmt(timeConstants_s.T_d0, 3),      unit: 's' },
              { label: 'Constante transitoire (CC)',   symbol: <><Var>T</Var>{sym.prime}<sub>d</sub></>,        value: fmt(timeConstants_s.T_d_prime, 3), unit: 's' },
              { label: "Constante d'amortissement",    symbol: <><Var>T<sub>a</sub></Var></>,                   value: fmt(timeConstants_s.T_a, 3),       unit: 's' },
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
              Équations des réactances et de la dynamique du rotor
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* ── 1. Réactances de réaction d'induit ─────────────────────── */}
            <Formula label="1 — Réactances de réaction d'induit" accent="sky">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>x<sub>ad</sub></Var>{sym.eq}
                  <Frac
                    num={<><Var>k<sub>ad</sub></Var>{sym.dot}<Var>F<sub>a</sub></Var></>}
                    den={<><Num>1.04</Num>{sym.dot}<Var>F<sub>δ0</sub></Var></>}
                  />
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>x<sub>aq</sub></Var>{sym.eq}
                  <Frac
                    num={<><Var>k<sub>aq</sub></Var>{sym.dot}<Var>F<sub>a</sub></Var></>}
                    den={<><Var>F<sub>δ0</sub></Var>{sym.dot}<Var>k<sub>δ,avg</sub></Var></>}
                  />
                </div>
              </div>
            </Formula>

            {/* ── 2. Réactances synchrones ───────────────────────────────── */}
            <Formula label="2 — Réactances Synchrones" accent="emerald">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>x<sub>d</sub></Var>{sym.eq}
                  <Var>x<sub>σ</sub></Var>{sym.plus}<Var>x<sub>ad</sub></Var>
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>x<sub>q</sub></Var>{sym.eq}
                  <Var>x<sub>σ</sub></Var>{sym.plus}<Var>x<sub>aq</sub></Var>
                </div>
              </div>
            </Formula>

            {/* ── 3. Réactance d'excitation ──────────────────────────────── */}
            <Formula label="3 — Réactance d'excitation (Rapportée au stator)" accent="violet">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="flex flex-wrap justify-center items-center gap-1">
                  <Var>x<sub>B</sub></Var>{sym.eq}
                  <Num>1.27</Num>{sym.dot}
                  <Var>k<sub>ad</sub></Var>{sym.dot}
                  <Var>x<sub>ad</sub></Var>{sym.dot}
                  <span className="font-mono text-sm">(</span>
                  <Num>1</Num>{sym.plus}
                  <Frac
                    num={
                      <span className="flex items-center gap-0.5">
                        <Num>2</Num>{sym.dot}<Var>F<sub>δ0</sub></Var>{sym.dot}
                        <Var>l<sub>M</sub></Var>{sym.dot}<Var>σ<sub>λ</sub></Var>
                      </span>
                    }
                    den={<Var>Φ<sub>0</sub></Var>}
                  />
                  <span className="font-mono text-sm">)</span>
                </div>

                {/* Sous-formule */}
                <div className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800`}>
                  <span className="font-[Inter,sans-serif] text-xs text-slate-500 mr-2">Avec</span>
                  <Var>x<sub>Bσ</sub></Var>{sym.eq}
                  <Var>x<sub>B</sub></Var>{sym.minus}<Var>x<sub>ad</sub></Var>
                </div>
              </div>
            </Formula>

            {/* ── 4. Réactance transitoire ───────────────────────────────── */}
            <Formula label="4 — Réactance Transitoire Longitudinale" accent="amber">
              <Var>x{sym.prime}<sub>d</sub></Var>{sym.eq}
              <Var>x<sub>σ</sub></Var>{sym.plus}
              <Frac
                num={<><Var>x<sub>ad</sub></Var>{sym.dot}<Var>x<sub>Bσ</sub></Var></>}
                den={<><Var>x<sub>ad</sub></Var>{sym.plus}<Var>x<sub>Bσ</sub></Var></>}
              />
            </Formula>

            {/* ── 5. Réactance inverse ───────────────────────────────────── */}
            <Formula label="5 — Réactance d'Ordre Inverse" accent="rose">
              <Var>x<sub>2</sub></Var>{sym.approx}
              <Sqrt>
                <Var>x{sym.prime}<sub>d</sub></Var>{sym.dot}<Var>x<sub>q</sub></Var>
              </Sqrt>
            </Formula>

            {/* Séparateur */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-5" />

            {/* ── 6. Résistance rotorique ────────────────────────────────── */}
            <Formula label="6 — Résistance Rotorique Réduite (p.u.)" accent="cyan">
              <Var>r<sub>B</sub></Var>{sym.eq}
              <Frac
                num={
                  <span className="flex flex-wrap items-center gap-0.5">
                    <Num>2200</Num>{sym.dot}<Var>F<sub>a</sub></Var>{sym.dot}
                    <Var>k<sub>ad</sub></Var><sup>2</sup>{sym.dot}
                    <Var>L<sub>B,moy</sub></Var>
                  </span>
                }
                den={
                  <span className="flex flex-wrap items-center gap-0.5">
                    <Var>Φ<sub>0</sub></Var>{sym.dot}<Var>f</Var>{sym.dot}
                    {sym.omega}<sub className="font-mono text-[10px]">B</sub>
                    {sym.dot}<Var>S<sub>B</sub></Var>
                  </span>
                }
              />
            </Formula>

            {/* ── 7. Constantes de temps ─────────────────────────────────── */}
            <Formula label="7 — Constantes de temps" accent="slate">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="flex w-full justify-around flex-wrap gap-4">
                  {/* Td0 */}
                  <div className="flex items-center gap-1">
                    <Var>T<sub>d0</sub></Var>{sym.eq}
                    <Frac
                      num={<Var>x<sub>B</sub></Var>}
                      den={<>{sym.omega}{sym.dot}<Var>r<sub>B</sub></Var></>}
                    />
                  </div>
                  {/* T'd */}
                  <div className="flex items-center gap-1">
                    <Var>T{sym.prime}<sub>d</sub></Var>{sym.eq}
                    <Frac
                      num={<Var>x{sym.prime}<sub>d</sub></Var>}
                      den={<Var>x<sub>d</sub></Var>}
                    />
                    {sym.dot}<Var>T<sub>d0</sub></Var>
                  </div>
                </div>

                {/* Ta — sous-formule */}
                <div className={`${typo.subFormula} bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 w-full flex justify-center`}>
                  <Var>T<sub>a</sub></Var>{sym.eq}
                  <Frac
                    num={<Var>x<sub>2</sub></Var>}
                    den={<>{sym.omega}{sym.dot}<Var>r<sub>a</sub></Var></>}
                  />
                </div>
              </div>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
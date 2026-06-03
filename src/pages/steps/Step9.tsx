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
const CURRENT_STEP = 9;

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
      <div
        className={`
          flex flex-wrap justify-center items-center gap-1
          py-2 overflow-x-auto ${typo.mathBody}
        `}
      >
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

function Trig({ fn, arg }: { fn: string; arg: React.ReactNode }) {
  return (
    <span className="font-mono text-sm">
      <span className="font-normal text-slate-600 dark:text-slate-400">{fn}</span>
      <span className="italic font-semibold text-slate-800 dark:text-slate-200">({arg})</span>
    </span>
  );
}

const sym = {
  dot:   <Op>·</Op>,
  eq:    <Op>=</Op>,
  plus:  <Op>+</Op>,
  minus: <Op>−</Op>,
  pi:    <Var>π</Var>,
  delta: <Var>δ</Var>,
  sigma: <Var>σ</Var>,
  phi:   <Var>φ</Var>,
  psi:   <Var>ψ</Var>,
  theta: <Var>Θ</Var>,
  omega: <Var>ω</Var>,
  alpha: <Var>α</Var>,
  tau:   <Var>τ</Var>,
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPERATURE KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function TempKpiCard({
  label,
  value,
  unit,
  isOverheating,
}: {
  label: string;
  value: string;
  unit: string;
  isOverheating: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl border border-t-2 p-4
        shadow-sm hover:shadow-md transition-all duration-300
        flex flex-col items-center text-center gap-1
        ${isOverheating
          ? 'border-red-500/50 border-t-red-500 bg-red-50 dark:bg-red-950/20 shadow-red-500/20'
          : 'border-emerald-500/50 border-t-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
        }
      `}
    >
      <p className={typo.label}>{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span
          className={`
            font-mono text-2xl font-bold tabular-nums tracking-tight
            ${isOverheating ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}
          `}
        >
          {value}
        </span>
        <span className={`${typo.unit} opacity-70`}>{unit}</span>
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
            <h1 className={typo.bannerTitle}>Système d'Excitation</h1>
            <p className={typo.bannerDesc}>
              FMM en charge par la méthode de Blondel et dimensionnement thermique de la bobine rotorique
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">⚡</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Excitation
            </span>
          </div>
        </div>

        {/* Barre de progression */}
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
                const isDone = step < CURRENT_STEP;
                const isCurrent = step === CURRENT_STEP;
                return (
                  <div key={step} className="flex flex-col items-center" style={{ width: `${100 / TOTAL_STEPS}%` }}>
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
                    {(step === 1 || step === CURRENT_STEP || step === TOTAL_STEPS || step % 7 === 0) && (
                      <span
                        className={`
                          ${typo.stepDot}
                          ${isCurrent ? 'text-emerald-300' : isDone ? 'text-sky-400' : 'text-slate-500'}
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
          { label: 'Blondel',      color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'FMM charge',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Bobine rotor', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Thermique',    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Cuivre',       color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
export default function Step9() {
  const {
    inputs, nominal, mainDimensions, airGap, stator, reactances,
    setCurrentStep, setExcitation,
  } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  // ── Calculs ─────────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) return null;

    try {
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      const reactancesData = reactances ||
        CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      if (noLoadData.F_deltadc_A === undefined) {
        noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;
      }

      let xSigma_val = reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1;
      let xq_estim = 1.0;

      if (reactancesData.xq) {
        xq_estim = reactancesData.xq;
      } else {
        const F_a_temp = 2.7 * stator.w1 * (stator.Kw1 / nominal.p) * nominal.In;
        const k_delta_avg = (1 + airGap.Kdelta) / 2;
        const k_aq_estim = 0.475;
        const x_aq_temp = (k_aq_estim * F_a_temp) / (noLoadData.F_delta * k_delta_avg);
        xq_estim = xSigma_val + x_aq_temp;
      }

      const safeReactances = { xSigma: xSigma_val, xq: xq_estim };
      const delta_M = airGap.delta * 1.5;
      const alpha_p = mainDimensions.alphap || 0.73;
      const powerFactor = inputs.cosPhi || 0.8;

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions,
        noLoadData, safeReactances, delta_M, alpha_p, powerFactor
      );

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );

      const actualDeltaB = excitationData.electricalSpecs.I_B_Nominal_A /
        excitationData.commercialWire.section_mm2;
      const b_max_mm    = excitationData.commercialWire.b_max_limit_mm;
      const alpha_coeff = excitationData.thermal.alpha_coeff;
      const k_coeff     = excitationData.thermal.k_coeff;
      const deltaTemp   = Math.pow(actualDeltaB / 20, 2) * (b_max_mm / (alpha_coeff * k_coeff));
      const exactThetaB = 20 + deltaTemp;

      return { blondel: blondelData, excitation: excitationData, actualDeltaB, exactThetaB };
    } catch (err) {
      console.error('Erreur calcul excitation :', err);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances]);

  // ── Sauvegarde excitation dans le store ─────────────────────────────────
  useEffect(() => {
    if (results?.excitation && typeof setExcitation === 'function') {
      setExcitation(results.excitation);
    }
  }, [results, setExcitation]);

  // ── Formatage ───────────────────────────────────────────────────────────
  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ──────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Système d'Excitation">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour le diagramme de Blondel.
          </p>
          <p className={typo.errorBody}>
            Veuillez vérifier que les dimensions et la caractéristique à vide sont calculées.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { blondel, excitation, actualDeltaB, exactThetaB } = results;
  const isOverheating = exactThetaB > 115;

  // ── Rendu principal ─────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Système d'Excitation"
      description="Résolution de la FMM d'excitation par la méthode de Blondel et dimensionnement thermique"
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

          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="FMM Excitation Totale"
              value={fmt(blondel.F_Bn, 0)}
              unit="A"
              accent="sky"
            />
            <KpiCard
              label="Angle Interne (ψ)"
              value={fmt(blondel.blondel.psi_deg, 1)}
              unit="°"
              accent="emerald"
            />
            <KpiCard
              label="Courant Nominal (I_B)"
              value={fmt(excitation.electricalSpecs.I_B_Nominal_A, 1)}
              unit="A"
              accent="violet"
            />
            <TempKpiCard
              label="Température (Θ_B)"
              value={fmt(exactThetaB, 0)}
              unit="°C"
              isOverheating={isOverheating}
            />
          </div>

          {/* ── Coefficients de saturation ────────────────────────────────── */}
          <ResultTable
            title="Coefficients de Saturation et Réaction d'Induit"
            rows={[
              { label: 'Ratio de saturation',               symbol: <><Var>F<sub>δdc</sub></Var> / <Var>F<sub>δ</sub></Var></>, value: fmt(blondel.saturationRatio, 3),   unit: ''  },
              { label: 'Coeff. saturation axe transversal', symbol: <><Var>x<sub>q,sat</sub></Var></>,                          value: fmt(blondel.coefficients.x_q, 3),  unit: ''  },
              { label: 'Coeff. saturation axe direct',      symbol: <><Var>x<sub>d,sat</sub></Var></>,                          value: fmt(blondel.coefficients.x_d, 3),  unit: ''  },
              { label: "Coeff. global d'entrefer",          symbol: <Var>k</Var>,                                               value: fmt(blondel.coefficients.k, 3),    unit: ''  },
              { label: 'Réaction axe direct',               symbol: <><Var>k<sub>ad</sub></Var></>,                             value: fmt(blondel.coefficients.k_ad, 3), unit: ''  },
              { label: 'Réaction axe transversal',          symbol: <><Var>k<sub>aq</sub></Var></>,                             value: fmt(blondel.coefficients.k_aq, 3), unit: ''  },
            ]}
          />

          {/* ── Diagramme de Blondel ─────────────────────────────────────── */}
          <ResultTable
            title="Diagramme de Blondel (Valeurs P.U.)"
            rows={[
              { label: 'FMM induit nominale',             symbol: <><Var>F<sub>a</sub></Var></>,           value: fmt(blondel.F_a, 0),               unit: 'A'    },
              { label: 'FMM induit (p.u.)',               symbol: <><Var>F<sub>a</sub></Var>*</>,          value: fmt(blondel.F_a_star, 3),          unit: 'p.u.' },
              { label: 'sin(ψ)',                          symbol: <><Op>sin</Op>(<Var>ψ</Var>)</>,         value: fmt(blondel.blondel.sin_psi, 4),   unit: ''     },
              { label: 'cos(ψ)',                          symbol: <><Op>cos</Op>(<Var>ψ</Var>)</>,         value: fmt(blondel.blondel.cos_psi, 4),   unit: ''     },
              { label: 'Tension résultante projetée',     symbol: <><Var>E<sub>rd</sub></Var>*</>,         value: fmt(blondel.blondel.E_rd_star, 3), unit: 'p.u.' },
              { label: "Réaction d'induit axe direct",    symbol: <><Var>F<sub>ad</sub></Var>*</>,         value: fmt(blondel.F_ad_star, 3),         unit: 'p.u.' },
              { label: "FMM totale d'excitation (p.u.)",  symbol: <><Var>F<sub>Bn</sub></Var>*</>,         value: fmt(blondel.F_Bn_star, 3),         unit: 'p.u.' },
            ]}
          />

          {/* ── Bobine d'excitation ──────────────────────────────────────── */}
          <ResultTable
            title="Dimensionnement de la Bobine d'Excitation"
            rows={[
              { label: 'Courant nominal bobine',     symbol: <><Var>I<sub>B</sub></Var></>,           value: fmt(excitation.electricalSpecs.I_B_Nominal_A, 1),   unit: 'A'     },
              { label: 'Courant maximal admissible', symbol: <><Var>I<sub>B,max</sub></Var></>,       value: fmt(excitation.electricalSpecs.I_B_Max_A, 1),       unit: 'A'     },
              { label: 'Disponibilité de courant',   symbol: <><Var>k<sub>dispo</sub></Var></>,       value: fmt(excitation.electricalSpecs.k_dispo, 3),         unit: ''      },
              { label: 'Densité de courant réelle',  symbol: <><Var>Δ<sub>B</sub></Var></>,           value: fmt(actualDeltaB, 2),                               unit: 'A/mm²' },
              { label: 'Résistance bobine (75°C)',   symbol: <><Var>R<sub>B75</sub></Var></>,         value: fmt(excitation.electricalSpecs.R_B_75_Ohm, 3),      unit: 'Ω'     },
              { label: 'Résistance bobine (120°C)',  symbol: <><Var>R<sub>B120</sub></Var></>,        value: fmt(excitation.electricalSpecs.R_B_120_Ohm, 3),     unit: 'Ω'     },
              { label: 'Puissance dissipée (Joule)', symbol: <><Var>P<sub>Bn</sub></Var></>,          value: fmt(excitation.electricalSpecs.P_Excitation_kW, 2), unit: 'kW'    },
            ]}
          />

          {/* ── Fil commercial ───────────────────────────────────────────── */}
          <ResultTable
            title="Fil Commercial Normalisé"
            rows={[
              { label: 'Section fil standardisée',   symbol: <><Var>S<sub>B</sub></Var></>,       value: fmt(excitation.commercialWire.section_mm2, 2),  unit: 'mm²' },
              { label: 'Dim. standard b (largeur)',   symbol: <><Var>b<sub>std</sub></Var></>,     value: fmt(excitation.commercialWire.b_standard_mm, 2),  unit: 'mm'  },
              { label: 'Dim. standard a (épaisseur)', symbol: <><Var>a<sub>std</sub></Var></>,     value: fmt(excitation.commercialWire.a_standard_mm, 2),  unit: 'mm'  },
              { label: 'Limite b_max (contrainte)',   symbol: <><Var>b<sub>max</sub></Var></>,     value: fmt(excitation.commercialWire.b_max_limit_mm, 2), unit: 'mm'  },
            ]}
          />

          {/* ── Modèle thermique ─────────────────────────────────────────── */}
          <ResultTable
            title="Modèle Thermique (Kopylov)"
            rows={[
              { label: 'Vitesse périphérique rotor',     symbol: <><Var>v<sub>p</sub></Var></>,         value: fmt(excitation.thermal.v_p_ms, 2),       unit: 'm/s'   },
              { label: 'Coefficient dissipation (α)',    symbol: {sym: sym.alpha}.sym,                  value: fmt(excitation.thermal.alpha_coeff, 4),  unit: ''      },
              { label: 'Coefficient conduction (k)',     symbol: <Var>k</Var>,                          value: fmt(excitation.thermal.k_coeff, 4),      unit: ''      },
              { label: 'Densité courant tolérée (est.)', symbol: <><Var>Δ<sub>B,est</sub></Var></>,     value: fmt(excitation.thermal.delta_B_A_mm2, 2), unit: 'A/mm²' },
            ]}
          />

          {/* ── Géométrie bobine ─────────────────────────────────────────── */}
          <ResultTable
            title="Géométrie de la Bobine Rotorique"
            rows={[
              { label: 'Spires par pôle',              symbol: <><Var>ω<sub>B</sub></Var></>,          value: fmt(excitation.coilSizing.omega_B_turns, 0),    unit: 'tours'  },
              { label: "Longueur moyenne d'une spire", symbol: <><Var>L<sub>B,moy</sub></Var></>,      value: fmt(excitation.coilSizing.L_Bmoy_cm, 1),        unit: 'cm'     },
              { label: 'Hauteur bobine (rotor)',       symbol: <><Var>h<sub>bobine</sub></Var></>,     value: fmt(excitation.coilSizing.h_bobine_cm, 2),      unit: 'cm'     },
              { label: 'Hauteur noyau polaire occ.',   symbol: <><Var>h<sub>M,pôle</sub></Var></>,     value: fmt(excitation.coilSizing.h_M_pole_cm, 2),      unit: 'cm'     },
              { label: 'Poids cuivre rotor',           symbol: <><Var>G<sub>B</sub></Var></>,          value: fmt(excitation.coilSizing.weight_copper_kg, 1), unit: 'kg'     },
              { label: 'Poids cuivre / kVA installé',  symbol: <><Var>G<sub>B</sub></Var> / kVA</>,    value: fmt(excitation.coilSizing.weight_per_kVA, 3),   unit: 'kg/kVA' },
            ]}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COLONNE DROITE : FORMULES                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 h-fit backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className={typo.cardTitle}>
              Formules Mathématiques
            </CardTitle>
            <CardDescription className={typo.cardDesc}>
              Équations analytiques du système d'excitation
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* ── 1. Ratio de Saturation ─────────────────────────────────── */}
            <Formula label="1 — Ratio de Saturation" accent="sky">
              <Var>Ratio</Var>{sym.eq}
              <Frac
                num={
                  <span className="flex items-center gap-0.5">
                    <Var>F<sub>δ</sub></Var>{sym.plus}
                    <Var>F<sub>d1</sub></Var>{sym.plus}
                    <Var>F<sub>c</sub></Var>
                  </span>
                }
                den={<Var>F<sub>δ</sub></Var>}
              />
            </Formula>

            {/* ── 2. FMM d'Induit Nominale ───────────────────────────────── */}
            <Formula label="2 — FMM d'Induit Nominale" accent="emerald">
              <Var>F<sub>a</sub></Var>{sym.eq}
              <Num>2.7</Num>{sym.dot}
              <Var>w<sub>1</sub></Var>{sym.dot}
              <Frac
                num={<Var>K<sub>w1</sub></Var>}
                den={<Var>p</Var>}
              />
              {sym.dot}<Var>I<sub>n</sub></Var>
            </Formula>

            {/* ── 3. Angle Interne ψ ─────────────────────────────────────── */}
            <Formula label="3 — Angle Interne du Diagramme (ψ)" accent="violet">
              <Trig fn="tan" arg={sym.psi} />{sym.eq}
              <Frac
                num={
                  <span className="flex flex-wrap items-center gap-0.5">
                    <Var>U*</Var>{sym.dot}<Trig fn="sin" arg={sym.phi} />
                    {sym.plus}<Var>I*</Var>{sym.dot}<Var>x<sub>q,sat</sub></Var>
                  </span>
                }
                den={
                  <span className="flex items-center gap-0.5">
                    <Var>U*</Var>{sym.dot}<Trig fn="cos" arg={sym.phi} />
                  </span>
                }
              />
            </Formula>

            {/* ── 4. Tension Résultante E_rd* ────────────────────────────── */}
            <Formula label="4 — Tension Résultante (E_rd*)" accent="amber">
              <Var>E<sub>rd</sub>*</Var>{sym.eq}
              <Var>U*</Var>{sym.dot}
              <Trig fn="cos" arg={<>{sym.psi}{sym.minus}{sym.phi}</>} />
              {sym.plus}<Var>I*</Var>{sym.dot}
              <Var>X<sub>σ</sub></Var>{sym.dot}
              <Trig fn="sin" arg={sym.psi} />
            </Formula>

            {/* ── 5. Réaction d'Induit F_ad* ─────────────────────────────── */}
            <Formula label="5 — Réaction d'Induit Directe (F_ad*)" accent="rose">
              <Var>F<sub>ad</sub>*</Var>{sym.eq}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-wrap items-center gap-0.5">
                  <Var>x<sub>d,sat</sub></Var>{sym.dot}
                  <Var>k<sub>ad</sub></Var>{sym.dot}
                  <Var>F<sub>a</sub>*</Var>{sym.dot}
                  <Trig fn="sin" arg={sym.psi} />
                </div>
                <div className="flex flex-wrap items-center gap-0.5 ml-4">
                  {sym.plus}<Var>k</Var>{sym.dot}
                  <Frac num={sym.tau} den={sym.delta} />
                  {sym.dot}<Var>F<sub>a</sub>*</Var>{sym.dot}
                  <Trig fn="cos" arg={sym.psi} />
                </div>
              </div>
            </Formula>

            {/* ── 6. FMM Totale F_Bn* ────────────────────────────────────── */}
            <Formula label="6 — FMM Totale d'Excitation (F_Bn*)" accent="cyan">
              <Var>F<sub>Bn</sub>*</Var>{sym.eq}
              <Var>E<sub>rd</sub>*</Var>{sym.plus}
              <Var>F<sub>ad</sub>*</Var>{sym.plus}
              <Var>F'</Var>
            </Formula>

            {/* ── Séparateur dégradé ──────────────────────────────────────── */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-5" />

            {/* ── 7. Vitesse Périphérique ─────────────────────────────────── */}
            <Formula label="7 — Vitesse Périphérique du Rotor" accent="slate">
              <Var>v<sub>p</sub></Var>{sym.eq}
              <Frac
                num={<>{sym.pi}{sym.dot}<Var>D</Var>{sym.dot}<Var>n</Var></>}
                den={<Num>60</Num>}
              />
            </Formula>

            {/* ── 8. Densité de Courant Tolérée ──────────────────────────── */}
            <Formula label="8 — Densité de Courant Tolérée" accent="sky">
              <Var>δ<sub>B,est</sub></Var>{sym.eq}
              <Num>20</Num>{sym.dot}
              <Sqrt>
                <Frac
                  num={
                    <span className="flex items-center gap-0.5">
                      {sym.theta}<sub className="font-mono text-[10px]">cible</sub>
                      {sym.dot}{sym.alpha}{sym.dot}<Var>k</Var>
                    </span>
                  }
                  den={<Var>b<sub>max</sub></Var>}
                />
              </Sqrt>
            </Formula>

            {/* ── 9. Modèle Thermique Réel ───────────────────────────────── */}
            <Formula label="9 — Modèle Thermique Réel (Échauffement)" accent="emerald">
              <Var>Θ<sub>B,réelle</sub></Var>{sym.eq}
              <Num>20°C</Num>{sym.plus}
              <span className="font-mono text-sm">
                (
                <Frac
                  num={<Var>δ<sub>B,réelle</sub></Var>}
                  den={<Num>20</Num>}
                />
                )²
              </span>
              {sym.dot}
              <Frac
                num={<Var>b<sub>max</sub></Var>}
                den={<>{sym.alpha}{sym.dot}<Var>k</Var></>}
              />
            </Formula>

            {/* ── 10. Poids Cuivre Rotorique ─────────────────────────────── */}
            <Formula label="10 — Poids du Cuivre Rotorique (G_B)" accent="violet">
              <Var>G<sub>B</sub></Var>{sym.eq}
              <Num>8.9</Num>{sym.dot}
              <Num>2p</Num>{sym.dot}
              {sym.omega}<sub className="font-mono text-[10px]">B</sub>
              {sym.dot}
              <Var>L<sub>B,moy</sub></Var>{sym.dot}
              <Var>S<sub>fil</sub></Var>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
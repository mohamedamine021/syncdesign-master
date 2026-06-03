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
const CURRENT_STEP = 10;

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

const sym = {
  dot:   <Op>·</Op>,
  eq:    <Op>=</Op>,
  plus:  <Op>+</Op>,
  minus: <Op>−</Op>,
  pi:    <Var>π</Var>,
  delta: <Var>δ</Var>,
  sigma: <Var>σ</Var>,
  theta: <Var>Θ</Var>,
  omega: <Var>ω</Var>,
  alpha: <Var>α</Var>,
  rho:   <Var>ρ</Var>,
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
            <h1 className={typo.bannerTitle}>
              Dimensionnement de la Bobine Rotor
            </h1>
            <p className={typo.bannerDesc}>
              Calcul de l'espace interpolaire, modèle thermique et choix du fil de cuivre industriel
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl font-bold">⏛</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Bobine
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
          { label: 'Espace interpolaire', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Modèle thermique',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Fil de cuivre',       color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Spires rotor',        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Poids cuivre',        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
export default function Step10() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) return null;

    try {
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      const reactancesData = reactances ||
        CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      if (noLoadData.F_deltadc_A === undefined) {
        noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;
      }

      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1,
        xq: reactancesData.xq || 1.0,
      };

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );

      return CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );
    } catch (err) {
      console.error("Erreur calcul bobine rotor :", err);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ──────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Dimensionnement de la Bobine Rotor">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour le dimensionnement de la bobine rotor.
          </p>
          <p className={typo.errorBody}>
            Veuillez vérifier que toutes les étapes{' '}
            <code className={typo.code}>1</code> à{' '}
            <code className={typo.code}>9</code> ont bien été complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ─────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Dimensionnement de la Bobine Rotor"
      description="Calcul de l'espace interpolaire, modèle thermique et choix du fil de cuivre industriel"
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
              label="Espace max. disponible"
              value={fmt(results.commercialWire.b_max_limit_mm, 1)}
              unit="mm"
              accent="sky"
            />
            <KpiCard
              label="Densité Courant Adm."
              value={fmt(results.thermal.delta_B_A_mm2, 2)}
              unit="A/mm²"
              accent="emerald"
            />
            <KpiCard
              label="Nombre de Spires"
              value={fmt(results.coilSizing.omega_B_turns, 0)}
              accent="violet"
            />
            <KpiCard
              label="Poids Cuivre Total"
              value={fmt(results.coilSizing.weight_copper_kg, 0)}
              unit="kg"
              accent="amber"
            />
          </div>

          {/* ── Thermique ────────────────────────────────────────────────── */}
          <ResultTable
            title="Thermique et Limites Physiques"
            rows={[
              { label: 'Vitesse périphérique',           symbol: <><Var>v<sub>p</sub></Var></>,      value: fmt(results.thermal.v_p_ms, 1),                unit: 'm/s'    },
              { label: "Coefficient d'échange",          symbol: sym.alpha,                          value: fmt(results.thermal.alpha_coeff, 4),           unit: 'W/m²°C' },
              { label: 'Coefficient de refroidissement', symbol: <Var>k</Var>,                       value: fmt(results.thermal.k_coeff, 3),               unit: ''       },
              { label: 'Largeur bobine maximum tolérée', symbol: <><Var>b<sub>max</sub></Var></>,    value: fmt(results.commercialWire.b_max_limit_mm, 2), unit: 'mm'     },
            ]}
          />

          {/* ── Fil commercial ───────────────────────────────────────────── */}
          <ResultTable
            title="Choix Industriel du Conducteur"
            rows={[
              { label: 'Section standardisée choisie',    symbol: <><Var>S<sub>B</sub></Var></>,       value: fmt(results.commercialWire.section_mm2, 2),   unit: 'mm²'    },
              { label: 'Largeur du conducteur nu',        symbol: <><Var>b<sub>std</sub></Var></>,     value: fmt(results.commercialWire.b_standard_mm, 2), unit: 'mm'     },
              { label: 'Hauteur du conducteur nu',        symbol: <><Var>a<sub>std</sub></Var></>,     value: fmt(results.commercialWire.a_standard_mm, 2), unit: 'mm'     },
              { label: 'Longueur moyenne spire',          symbol: <><Var>L<sub>B,moy</sub></Var></>,   value: fmt(results.coilSizing.L_Bmoy_cm, 2),         unit: 'cm'     },
              { label: 'Hauteur de la bobine',            symbol: <><Var>h<sub>bobine</sub></Var></>,  value: fmt(results.coilSizing.h_bobine_cm, 2),       unit: 'cm'     },
              { label: 'Hauteur noyau polaire nécessaire',symbol: <><Var>h<sub>M,pôle</sub></Var></>, value: fmt(results.coilSizing.h_M_pole_cm, 2),       unit: 'cm'     },
              { label: 'Ratio poids cuivre / kVA',        symbol: <><Var>G<sub>B</sub></Var> / kVA</>, value: fmt(results.coilSizing.weight_per_kVA, 3),    unit: 'kg/kVA' },
            ]}
          />

          {/* ── Performances électriques ─────────────────────────────────── */}
          <ResultTable
            title="Performances Électriques"
            rows={[
              { label: "Courant d'excitation nominal", symbol: <><Var>I<sub>B</sub></Var></>,       value: fmt(results.electricalSpecs.I_B_Nominal_A, 0), unit: 'A'  },
              { label: "Courant d'excitation maximum", symbol: <><Var>I<sub>B,max</sub></Var></>,   value: fmt(results.electricalSpecs.I_B_Max_A, 0),     unit: 'A'  },
              { label: 'Résistance à 75°C',            symbol: <><Var>R<sub>B75</sub></Var></>,     value: fmt(results.electricalSpecs.R_B_75_Ohm, 3),   unit: 'Ω'  },
              { label: 'Résistance à 120°C',           symbol: <><Var>R<sub>B120</sub></Var></>,    value: fmt(results.electricalSpecs.R_B_120_Ohm, 3),  unit: 'Ω'  },
              { label: 'Coefficient de disponibilité', symbol: <><Var>k<sub>dispo</sub></Var></>,   value: fmt(results.electricalSpecs.k_dispo, 2),       unit: ''   },
              { label: "Puissance d'excitation (Max)", symbol: <><Var>P<sub>Bn</sub></Var></>,      value: fmt(results.electricalSpecs.P_Excitation_kW, 1), unit: 'kW' },
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
              Dimensionnement par contrainte d'espace interpolaire
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* ── 1. Espace Interpolaire ─────────────────────────────────── */}
            <Formula label="1 — Espace Interpolaire (Pas)" accent="sky">
              <Var>t<sub>p</sub></Var>{sym.eq}
              <Frac
                num={
                  <span className="flex flex-wrap items-center gap-0.5">
                    {sym.pi}{sym.dot}
                    <span className="font-mono italic text-sm">
                      (D{sym.minus}<Num>2</Num>{sym.delta}{sym.minus}<Num>2</Num>h<sub>p</sub>{sym.minus}<Num>2</Num>h<sub>M</sub>)
                    </span>
                  </span>
                }
                den={<><Num>2</Num><Var>p</Var></>}
              />
            </Formula>

            {/* ── 2. Largeur max bobine ──────────────────────────────────── */}
            <Formula label="2 — Largeur max bobine" accent="emerald">
              <Var>b<sub>max</sub></Var>{sym.eq}
              <Frac
                num={
                  <span className="flex flex-wrap items-center gap-0.5">
                    <Var>t<sub>p</sub></Var>{sym.minus}
                    <Var>b<sub>M</sub></Var>{sym.minus}
                    <Num>2</Num><Var>δ<sub>isol</sub></Var>{sym.minus}
                    <Var>x</Var>
                  </span>
                }
                den={<Num>2</Num>}
              />
            </Formula>

            {/* ── 3. Modèle de Refroidissement ──────────────────────────── */}
            <Formula label="3 — Modèle de Refroidissement" accent="violet">
              {sym.alpha}{sym.eq}
              <Frac
                num={<Num>0.06</Num>}
                den={
                  <span className="flex items-center gap-0.5">
                    <Num>1</Num>{sym.plus}<Num>0.1</Num>{sym.dot}<Var>v<sub>p</sub></Var>
                  </span>
                }
              />
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 dark:text-slate-500 ml-3">
                (auto-ventilé)
              </span>
            </Formula>

            {/* ── 4. Densité de Courant Admissible ──────────────────────── */}
            <Formula label="4 — Densité de Courant Admissible" accent="amber">
              <Var>δ<sub>B,adm</sub></Var>{sym.eq}
              <Num>20</Num>{sym.dot}
              <Sqrt>
                <Frac
                  num={
                    <span className="flex items-center gap-0.5">
                      {sym.theta}<sub className="font-mono text-[10px]">B,adm</sub>
                      {sym.dot}{sym.alpha}{sym.dot}<Var>k</Var>
                    </span>
                  }
                  den={<Var>b<sub>max</sub></Var>}
                />
              </Sqrt>
            </Formula>

            {/* ── 5. Spires par pôle ────────────────────────────────────── */}
            <Formula label="5 — Spires par pôle" accent="rose">
              {sym.omega}<sub className="font-mono text-[10px]">B</sub>
              {sym.eq}
              <Frac
                num={
                  <span className="flex items-center gap-0.5">
                    <Var>F<sub>Bn</sub></Var>
                    <span className="font-[Inter,sans-serif] text-xs text-slate-400 ml-1">(Blondel)</span>
                  </span>
                }
                den={<><Num>2</Num>{sym.dot}<Var>I<sub>B</sub></Var></>}
              />
            </Formula>

            {/* ── 6. Résistance de Phase à 75°C ─────────────────────────── */}
            <Formula label="6 — Résistance de Phase à 75°C" accent="cyan">
              <Var>R<sub>B75</sub></Var>{sym.eq}
              {sym.rho}<sub className="font-mono text-[10px]">75</sub>
              {sym.dot}
              <Frac
                num={
                  <span className="flex flex-wrap items-center gap-0.5">
                    <Num>2p</Num>{sym.dot}
                    {sym.omega}<sub className="font-mono text-[10px]">B</sub>
                    {sym.dot}<Var>L<sub>B,moy</sub></Var>
                  </span>
                }
                den={<Var>S<sub>B</sub></Var>}
              />
            </Formula>

            {/* ── 7. Poids du Cuivre Rotorique ──────────────────────────── */}
            <Formula label="7 — Poids du Cuivre Rotorique" accent="slate">
              <Var>G<sub>B</sub></Var>{sym.eq}
              <Num>8.9</Num>{sym.dot}
              <span className="font-mono text-sm">(</span>
              <Num>2p</Num>
              <span className="font-mono text-sm">)</span>
              {sym.dot}
              {sym.omega}<sub className="font-mono text-[10px]">B</sub>
              {sym.dot}<Var>L<sub>B,moy</sub></Var>
              {sym.dot}<Var>S<sub>B</sub></Var>
              {sym.dot}<Num>10<sup>−3</sup></Num>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
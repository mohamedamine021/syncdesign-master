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
const CURRENT_STEP = 3;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES TYPOGRAPHIQUES CENTRALISÉS
// ─────────────────────────────────────────────────────────────────────────────
const typo = {
  label:
    'font-[Inter,sans-serif] text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400',
  value:
    'font-mono text-2xl font-bold tabular-nums tracking-tight text-primary',
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
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS MATHÉMATIQUES
// ─────────────────────────────────────────────────────────────────────────────

// Conteneur de formule avec bordure gauche colorée
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
      {/* Pastille + label */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[accent as keyof typeof dots]}`} />
        <p className={typo.formulaLabel}>{label}</p>
      </div>

      {/* Corps centré */}
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

// Fraction verticale
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

// Variable mathématique — italique monospace
function Var({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono italic font-semibold text-slate-800 dark:text-slate-200">
      {children}
    </span>
  );
}

// Opérateur — léger, non italique
function Op({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono font-light text-slate-500 dark:text-slate-400 mx-1.5">
      {children}
    </span>
  );
}

// Constante numérique
function Num({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono font-normal tabular-nums text-slate-700 dark:text-slate-300">
      {children}
    </span>
  );
}

// Racine carrée
function Sqrt({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center font-mono mx-1">
      <span className="text-lg font-light text-slate-500 mr-0.5">√</span>
      <span className="border-t border-current px-1 text-sm">{children}</span>
    </span>
  );
}

// Symboles réutilisables
const sym = {
  dot:    <Op>·</Op>,
  eq:     <Op>=</Op>,
  approx: <Op>≈</Op>,
  minus:  <Op>−</Op>,
  pi:     <Var>π</Var>,
  tau:    <Var>τ</Var>,
  lambda: <Var>λ</Var>,
  alpha:  <Var>α</Var>,
  delta:  <Var>δ</Var>,
  cos:    <span className="font-mono italic text-sm text-slate-700 dark:text-slate-300">cos(φ)</span>,
  sin:    <span className="font-mono italic text-sm text-slate-700 dark:text-slate-300">sin(φ)</span>,
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
        {unit && (
          <span className={typo.unit}>{unit}</span>
        )}
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
              Dimensions Principales
            </h1>
            <p className={typo.bannerDesc}>
              Calcul du diamètre, du pas polaire, des charges électromagnétiques
              et de la longueur du stator
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl">📐</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Dimensions
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

      {/* Tags thématiques */}
      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Diamètre stator',   color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'          },
          { label: 'Pas polaire',       color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Charge linéique',   color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Induction entrefer',color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
          { label: 'Longueur stator',   color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'         },
          { label: 'Ventilation',       color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'         },
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
export default function Step3() {
  const { inputs, nominal, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs?.Pn || !nominal?.p) return null;
    try {
      return CalculationEngine.calcMainDimensions(inputs, nominal);
    } catch (err) {
      console.error('Erreur calcul dimensions :', err);
      return null;
    }
  }, [inputs, nominal]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Dimensions Principales">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres d'entrée ou nominaux manquants.
          </p>
          <p className={typo.errorBody}>
            Veuillez vérifier que les étapes{' '}
            <code className={typo.code}>1</code> et{' '}
            <code className={typo.code}>2</code>{' '}
            (Valeurs nominales) ont bien été calculées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Dimensions Principales"
      description="Calcul du diamètre, du pas polaire, des charges électromagnétiques et de la longueur du stator"
    >
      <StepBanner />

      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ── COLONNE GAUCHE ─────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="Diamètre Intérieur (D)"
              value={fmt(results.D, 1)}
              unit="cm"
              accent="sky"
            />
            <KpiCard
              label="Pas Polaire (τ)"
              value={fmt(results.tau, 2)}
              unit="cm"
              accent="emerald"
            />
            <KpiCard
              label="Charge Linéique (A)"
              value={fmt(results.A, 0)}
              unit="A/cm"
              accent="violet"
            />
            <KpiCard
              label="Induction (Bdn)"
              value={fmt(results.Bdn, 0)}
              unit="G"
              accent="amber"
            />
          </div>

          {/* Bannière Lambda */}
          <div
            className={`
              p-4 rounded-xl border-2 shadow-sm
              ${results.isLambdaValid
                ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {results.isLambdaValid ? '✅' : '⚠️'}
              </span>
              <h4 className={typo.alertTitle}>
                Ratio de proportion{' '}
                <span className="font-mono tabular-nums">
                  (λ = {fmt(results.lambda, 2)})
                </span>
              </h4>
            </div>
            <p className={`${typo.alertBody} ml-8`}>
              {results.lambdaMessage}
            </p>
          </div>

          {/* Tableau détaillé */}
          <ResultTable
            title="Détail des Dimensions"
            rows={[
              { label: 'Coefficient KE',              symbol: <><Var>K<sub>E</sub></Var></>,            value: fmt(results.KE, 3),           unit: ''       },
              { label: "Puissance apparente calcul",  symbol: <><Var>S</Var>'</>,                       value: fmt(results.Sprime, 1),       unit: 'kVA'    },
              { label: 'Diamètre intérieur stator',   symbol: <Var>D</Var>,                             value: fmt(results.D, 1),            unit: 'cm'     },
              { label: 'Diamètre extérieur calculé',  symbol: <><Var>D<sub>a</sub></Var></>,            value: fmt(results.Da, 1),           unit: 'cm'     },
              { label: 'Diamètre extérieur normé',    symbol: <><Var>D<sub>a</sub></Var> (normé)</>,    value: fmt(results.DaNorm, 1),       unit: 'cm'     },
              { label: 'Pas polaire',                 symbol: {sym: sym.tau}.sym,                       value: fmt(results.tau, 2),          unit: 'cm'     },
              { label: 'Charge linéique',             symbol: <Var>A</Var>,                             value: fmt(results.A, 0),            unit: 'A/cm'   },
              { label: "Induction dans l'entrefer",   symbol: <><Var>B<sub>dn</sub></Var></>,           value: fmt(results.Bdn, 0),          unit: 'G'      },
              { label: 'Arc polaire relatif',         symbol: <><Var>α<sub>p</sub></Var></>,            value: fmt(results.alphap, 3),       unit: '—'      },
              { label: "Coefficient arc de flux",     symbol: <><Var>α<sub>δ</sub></Var></>,            value: fmt(results.alphaDelta, 3),   unit: '—'      },
              { label: "Coefficient d'induction",     symbol: <><Var>K<sub>B</sub></Var></>,            value: fmt(results.KB, 3),           unit: '—'      },
              { label: 'Coefficient de bobinage',     symbol: <><Var>K<sub>01</sub></Var></>,           value: fmt(results.K01, 3),          unit: '—'      },
              { label: "Longueur électromagnétique",  symbol: <><Var>l'<sub>δ</sub></Var></>,           value: fmt(results.lPrimeDelta, 1),  unit: 'cm'     },
              { label: 'Longueur estimée',            symbol: <><Var>l<sub>δ</sub></Var></>,            value: fmt(results.lDelta, 1),       unit: 'cm'     },
              { label: 'Canaux de ventilation',       symbol: <><Var>n<sub>v</sub></Var></>,            value: fmt(results.nv, 0),           unit: 'canaux' },
              { label: "Largeur d'un canal",          symbol: <><Var>b<sub>v</sub></Var></>,            value: fmt(results.bv, 1),           unit: 'cm'     },
              { label: "Épaisseur paquet tôles",      symbol: <><Var>l<sub>paq</sub></Var></>,          value: fmt(results.lpaq, 1),         unit: 'cm'     },
              { label: 'Longueur physique active',    symbol: <Var>l</Var>,                             value: fmt(results.l, 1),            unit: 'cm'     },
              { label: 'Longueur totale fer + air',   symbol: <><Var>l<sub>1</sub></Var></>,            value: fmt(results.l1, 1),           unit: 'cm'     },
              { label: "Longueur magnétique équiv.",  symbol: <><Var>l<sub>δ,fin</sub></Var></>,        value: fmt(results.lDeltaFinal, 2),  unit: 'cm'     },
              { label: 'Ratio de proportion',         symbol: {sym: sym.lambda}.sym,                    value: fmt(results.lambda, 2),       unit: '—'      },
            ]}
          />
        </div>

        {/* ── COLONNE DROITE : FORMULES ──────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 h-fit backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className={typo.cardTitle}>
              Formules Mathématiques
            </CardTitle>
            <CardDescription className={typo.cardDesc}>
              Équations analytiques utilisées pour l'Étape 3
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* S' */}
            <Formula label="Puissance Apparente de Calcul (S')" accent="sky">
              <Var>S'</Var>{sym.eq}
              <Frac
                num={<><Var>K<sub>E</sub></Var>{sym.dot}<Var>P<sub>n</sub></Var></>}
                den={sym.cos}
              />
              <span className="mx-3 text-slate-300 dark:text-slate-600 select-none">│</span>
              <Var>K<sub>E</sub></Var>{sym.eq}
              <Sqrt>
                <span>
                  cos²φ <Op>+</Op> (sinφ <Op>+</Op> x<sub>σ</sub>)²
                </span>
              </Sqrt>
            </Formula>

            {/* D */}
            <Formula label="Diamètre Intérieur Empirique (D)" accent="emerald">
              <Var>D</Var>{sym.approx}
              <Num>7.1</Num>{sym.dot}
              <Sqrt><Var>p</Var></Sqrt>
              {sym.dot}
              <span className="font-mono text-sm">
                (S')<sup>0.25</sup>
              </span>
            </Formula>

            {/* τ */}
            <Formula label="Pas Polaire (τ)" accent="violet">
              {sym.tau}{sym.eq}
              <Frac
                num={<>{sym.pi}{sym.dot}<Var>D</Var></>}
                den={<><Num>2</Num><Var>p</Var></>}
              />
            </Formula>

            {/* A et Bdn */}
            <Formula label="Charge Linéique (A) et Induction (Bdn)" accent="amber">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>A</Var>{sym.eq}
                  <Var>c<sub>1</sub></Var>{sym.dot}
                  <span className="font-mono text-sm italic">
                    ln({sym.tau})
                  </span>
                  <Op>+</Op>
                  <Var>c<sub>2</sub></Var>
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>B<sub>dn</sub></Var>{sym.eq}
                  <Var>c<sub>3</sub></Var>
                  {sym.minus}
                  <Frac
                    num={<Var>c<sub>4</sub></Var>}
                    den={sym.tau}
                  />
                </div>
              </div>
            </Formula>

            {/* l'δ */}
            <Formula label="Longueur Électromagnétique (l'δ)" accent="rose">
              <Var>l'<sub>δ</sub></Var>{sym.eq}
              <Frac
                num={
                  <><Num>6.1</Num>{sym.dot}<Num>10<sup>11</sup></Num>{sym.dot}<Var>S'</Var></>
                }
                den={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Var>α<sub>δ</sub></Var>{sym.dot}
                    <Var>K<sub>B</sub></Var>{sym.dot}
                    <Var>K<sub>01</sub></Var>{sym.dot}
                    <Var>A</Var>{sym.dot}
                    <Var>B<sub>dn</sub></Var>{sym.dot}
                    <Var>D</Var><sup>2</sup>{sym.dot}
                    <Var>n<sub>n</sub></Var>
                  </span>
                }
              />
            </Formula>

            {/* lδ */}
            <Formula label="Longueur Estimée avec Conduites (lδ)" accent="cyan">
              <Var>l<sub>δ</sub></Var>{sym.eq}
              <Num>1.08</Num>{sym.dot}<Var>l'<sub>δ</sub></Var>
            </Formula>

            {/* l */}
            <Formula label="Longueur Physique du Fer Actif (l)" accent="slate">
              <Var>l</Var>{sym.eq}
              <Var>l<sub>paq</sub></Var>{sym.dot}
              <span className="font-mono text-sm">
                (1 <Op>+</Op> <Var>n<sub>v</sub></Var>)
              </span>
            </Formula>

            {/* l₁ */}
            <Formula label="Longueur Totale Fer + Air (l₁)" accent="sky">
              <Var>l<sub>1</sub></Var>{sym.eq}
              <Var>l</Var><Op>+</Op>
              <Var>n<sub>v</sub></Var>{sym.dot}<Var>b<sub>v</sub></Var>
            </Formula>

            {/* lδ,fin */}
            <Formula label="Longueur Magnétique Équivalente Finale" accent="emerald">
              <Var>l<sub>δ,fin</sub></Var>{sym.eq}
              <Var>l<sub>1</sub></Var>
              {sym.minus}
              <Num>0.5</Num>{sym.dot}<Var>n<sub>v</sub></Var>{sym.dot}<Var>b<sub>v</sub></Var>
            </Formula>

            {/* λ */}
            <Formula label="Ratio de Proportionnalité (λ)" accent="violet">
              {sym.lambda}{sym.eq}
              <Frac
                num={<Var>l<sub>δ,final</sub></Var>}
                den={sym.tau}
              />
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
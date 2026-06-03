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
import { RotorVisualization } from '@/components/RotorVisualization';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 6;

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
  vizTitle:
    'font-[Inter,sans-serif] text-base font-bold text-slate-700 dark:text-slate-200',
  vizDesc:
    'font-[Inter,sans-serif] text-xs mt-0.5 text-slate-500 dark:text-slate-400',
  vizBadgeLabel:
    'font-[Inter,sans-serif] text-[9px] text-slate-500 uppercase tracking-wider',
  vizBadgeValue:
    'font-mono text-lg font-black tabular-nums',
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
  plus:   <Op>+</Op>,
  minus:  <Op>−</Op>,
  approx: <Op>≈</Op>,
  delta:  <Var>δ</Var>,
  tau:    <Var>τ</Var>,
  alpha:  <Var>α</Var>,
  sigma:  <Var>σ</Var>,
  phi:    <Var>Φ</Var>,
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
              Dimensionnement du Rotor
            </h1>
            <p className={typo.bannerDesc}>
              Calcul des pôles magnétiques, du noyau polaire et de la culasse rotorique
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl">⚙</span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Rotor
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

      {/* Tags */}
      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Pôles magnétiques', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'           },
          { label: 'Noyau polaire',     color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Culasse rotorique', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Flux polaire',      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
          { label: 'Induction Ba',      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'         },
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
function SectionSeparator({
  children,
  className = 'mb-4',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
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
export default function Step6() {
  const { mainDimensions, stator, airGap, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (
      !mainDimensions?.tau || !mainDimensions?.D ||
      !mainDimensions?.l1 || !mainDimensions?.alphap ||
      !stator?.PhiCh ||
      !airGap?.delta
    ) return null;

    try {
      const rotor = CalculationEngine.calcRotor(mainDimensions, stator, airGap);

      const BM_target = 15600;
      const dnoy      = 20;
      const deltaM    = 1.5 * airGap.delta;
      const lM        = mainDimensions.l1;
      const SM        = rotor.PhiM / BM_target;
      const hM_calc   = 10.5 * airGap.delta + 8;
      const la        = lM + 11.5;

      return { ...rotor, deltaM, lM, SM, hM_calc, dnoy, la };
    } catch (err) {
      console.error('Erreur calcul rotor :', err);
      return null;
    }
  }, [mainDimensions, stator, airGap]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  const D     = mainDimensions?.D ?? 0;
  const delta = airGap?.delta ?? 0;

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Dimensionnement du Rotor">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour le dimensionnement du rotor.
          </p>
          <p className={typo.errorBody}>
            Veuillez vous assurer que les étapes{' '}
            <code className={typo.code}>3</code> (Dimensions principales),{' '}
            <code className={typo.code}>4</code> (Stator) et{' '}
            <code className={typo.code}>5</code> (Entrefer) ont bien été complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Dimensionnement du Rotor"
      description="Dimensionnement complet des pôles magnétiques, du noyau et de la culasse du rotor"
    >
      <StepBanner />

      {/* ══ VISUALISATION ══════════════════════════════════════════════════ */}
      <div className="w-full mb-10">
        <SectionSeparator className="mb-4">
          Visualisation géométrique du rotor
        </SectionSeparator>

        <Card className="shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 py-3 px-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className={typo.vizTitle}>
                  Coupe transversale du rotor
                </CardTitle>
                <CardDescription className={typo.vizDesc}>
                  Représentation simplifiée —{' '}
                  <span className="font-mono tabular-nums">
                    D = {fmt(D, 1)} cm
                  </span>,{' '}
                  <span className="font-mono tabular-nums">
                    δ = {fmt(delta, 3)} cm
                  </span>,{' '}
                  <span className="font-mono tabular-nums">
                    bₚ = {fmt(results.bp, 2)} cm
                  </span>
                </CardDescription>
              </div>

              {/* Indicateurs rapides */}
              <div className="hidden sm:flex gap-6">
                {[
                  { label: 'bₚ', value: `${fmt(results.bp, 2)} cm`, color: 'text-sky-600 dark:text-sky-400'         },
                  { label: 'hM', value: `${fmt(results.hM, 2)} cm`, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Ba', value: `${fmt(results.Ba, 0)} G`,  color: 'text-violet-600 dark:text-violet-400'   },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className={`${typo.vizBadgeValue} ${item.color}`}>
                      {item.value}
                    </p>
                    <p className={typo.vizBadgeLabel}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 bg-white dark:bg-slate-950">
            <RotorVisualization
              D={D}
              delta={delta}
              bp={results.bp}
              hp={results.hp}
              hM={results.hM}
              bM={results.bM}
              Ha={results.Ha}
              PhiM={results.PhiM}
              Ba={results.Ba}
            />
          </CardContent>
        </Card>
      </div>

      {/* ══ SÉPARATEUR ═════════════════════════════════════════════════════ */}
      <SectionSeparator className="mb-8">
        Résultats numériques &amp; formules
      </SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ── COLONNE GAUCHE ──────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="Arc Polaire (bp)"
              value={fmt(results.bp, 2)}
              unit="cm"
              accent="sky"
            />
            <KpiCard
              label="Hauteur Noyau (hM)"
              value={fmt(results.hM, 2)}
              unit="cm"
              accent="emerald"
            />
            <KpiCard
              label="Flux Polaire (ΦM)"
              value={fmt(results.PhiM / 1e6, 2)}
              unit="×10⁶ Mx"
              accent="violet"
            />
            <KpiCard
              label="Induction Culasse (Ba)"
              value={fmt(results.Ba, 0)}
              unit="G"
              accent="amber"
            />
          </div>

          {/* Validation Ba */}
          <div
            className={`
              p-4 rounded-xl border-2 shadow-sm
              ${results.Ba <= 16000
                ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {results.Ba <= 16000 ? '✅' : '⚠️'}
              </span>
              <h4 className={typo.alertTitle}>
                Induction Rotor{' '}
                <span className="font-mono italic">B<sub>a</sub></span>
                {' '}={' '}
                <span className="font-mono tabular-nums">
                  {fmt(results.Ba, 0)} G
                </span>
              </h4>
            </div>
            <p className={`${typo.alertBody} ml-8`}>
              {results.Ba <= 16000
                ? "L'induction dans la culasse rotorique est optimale, inférieure ou égale à 16 000 Gauss."
                : "Attention : l'induction est un peu élevée, risque de saturation magnétique."}
            </p>
          </div>

          {/* Tableau détaillé */}
          <ResultTable
            title="Détails du Dimensionnement Rotorique"
            rows={[
              { label: 'Entrefer max sous pôle',      symbol: <><Var>δ<sub>M</sub></Var></>,        value: fmt(results.deltaM, 3),                unit: 'cm'   },
              { label: 'Arc polaire',                 symbol: <><Var>b<sub>p</sub></Var></>,        value: fmt(results.bp, 2),                    unit: 'cm'   },
              { label: "Rayon d'épanouissement",      symbol: <><Var>R<sub>p</sub></Var></>,        value: fmt(results.Rp, 2),                    unit: 'cm'   },
              { label: "Hauteur d'épanouissement",    symbol: <><Var>h<sub>p</sub></Var></>,        value: fmt(results.hp, 2),                    unit: 'cm'   },
              { label: 'Longueur noyau polaire',      symbol: <><Var>l<sub>M</sub></Var></>,        value: fmt(results.lM, 1),                    unit: 'cm'   },
              { label: 'Coefficient de dispersion',   symbol: <><Var>σ<sub>N</sub></Var></>,        value: fmt(results.sigmaN, 3),                unit: 'p.u.' },
              { label: 'Flux magnétique polaire',     symbol: <><Var>Φ<sub>M</sub></Var></>,        value: `${fmt(results.PhiM / 1e6, 2)} × 10⁶`, unit: 'Mx'   },
              { label: 'Section théorique noyau',    symbol: <><Var>S<sub>M</sub></Var></>,        value: fmt(results.SM, 0),                    unit: 'cm²'  },
              { label: 'Largeur du noyau polaire',   symbol: <><Var>b<sub>M</sub></Var></>,        value: fmt(results.bM, 1),                    unit: 'cm'   },
              { label: 'Hauteur noyau calculée',     symbol: <><Var>h<sub>M,calc</sub></Var></>,   value: fmt(results.hM_calc, 2),               unit: 'cm'   },
              { label: 'Hauteur noyau adoptée',      symbol: <><Var>h<sub>M</sub></Var></>,        value: fmt(results.hM, 1),                    unit: 'cm'   },
              { label: "Diamètre de l'arbre",        symbol: <><Var>d<sub>noy</sub></Var></>,      value: fmt(results.dnoy, 0),                  unit: 'cm'   },
              { label: 'Hauteur de la culasse rotor',symbol: <><Var>H<sub>a</sub></Var></>,        value: fmt(results.Ha, 2),                    unit: 'cm'   },
              { label: 'Longueur du rotor sans axe', symbol: <><Var>l<sub>a</sub></Var></>,        value: fmt(results.la, 1),                    unit: 'cm'   },
              { label: 'Induction culasse rotor',    symbol: <><Var>B<sub>a</sub></Var></>,        value: fmt(results.Ba, 0),                    unit: 'G'    },
            ]}
          />
        </div>

        {/* ── COLONNE DROITE : FORMULES ────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-white/80 dark:bg-slate-900/60 h-fit backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className={typo.cardTitle}>
              Formules Mathématiques
            </CardTitle>
            <CardDescription className={typo.cardDesc}>
              Équations analytiques utilisées pour l'Étape 6
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* Arc polaire & entrefer max */}
            <Formula label="Arc Polaire et Entrefer Max" accent="sky">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>b<sub>p</sub></Var>{sym.eq}
                  <Var>α<sub>p</sub></Var>{sym.dot}{sym.tau}
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>δ<sub>M</sub></Var>{sym.eq}
                  <Num>1.5</Num>{sym.dot}{sym.delta}
                </div>
              </div>
            </Formula>

            {/* Rayon épanouissement */}
            <Formula label="Rayon de l'Épanouissement Polaire" accent="emerald">
              <Var>R<sub>p</sub></Var>{sym.eq}
              <Frac
                num={<Var>D</Var>}
                den={<Num>2</Num>}
              />
              {sym.plus}
              <Frac
                num={
                  <span className="flex items-center gap-0.5">
                    <Num>8</Num>{sym.dot}<Var>D</Var>{sym.dot}
                    <span className="font-mono italic text-sm">
                      (δ<sub>M</sub>{sym.minus}δ)
                    </span>
                  </span>
                }
                den={<><Var>b<sub>p</sub></Var><sup>2</sup></>}
              />
            </Formula>

            {/* Hauteur épanouissement */}
            <Formula label="Hauteur de l'Épanouissement" accent="violet">
              <Var>h<sub>p</sub></Var>{sym.eq}
              <span className="font-mono italic text-sm">h'</span>
              {sym.plus}
              <Var>R<sub>p</sub></Var>
              {sym.minus}
              <Sqrt>
                <span className="flex items-center gap-0.5">
                  <Var>R<sub>p</sub></Var><sup>2</sup>
                  {sym.minus}
                  <span className="font-mono italic text-sm">
                    (b<sub>p</sub>/2)²
                  </span>
                </span>
              </Sqrt>
            </Formula>

            {/* Coefficient de dispersion */}
            <Formula label="Coefficient de Dispersion" accent="amber">
              <Var>σ<sub>N</sub></Var>{sym.eq}
              <Num>1</Num>{sym.plus}
              <Var>K<sub>σ</sub></Var>{sym.dot}
              <Frac
                num={<><Num>35</Num>{sym.dot}{sym.delta}</>}
                den={<>{sym.tau}<sup>2</sup></>}
              />
            </Formula>

            {/* Flux polaire */}
            <Formula label="Flux Magnétique Polaire" accent="rose">
              <Var>Φ<sub>M</sub></Var>{sym.eq}
              <Var>σ<sub>N</sub></Var>{sym.dot}<Var>Φ<sub>ch</sub></Var>
            </Formula>

            {/* Section & largeur noyau */}
            <Formula label="Section Théorique et Largeur du Noyau" accent="cyan">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>S<sub>M</sub></Var>{sym.eq}
                  <Frac
                    num={<Var>Φ<sub>M</sub></Var>}
                    den={<Var>B<sub>M,target</sub></Var>}
                  />
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>b<sub>M</sub></Var>{sym.eq}
                  <Frac
                    num={<Var>S<sub>M</sub></Var>}
                    den={
                      <span className="flex items-center gap-0.5">
                        <Var>K<sub>f,rotor</sub></Var>{sym.dot}<Var>l<sub>M</sub></Var>
                      </span>
                    }
                  />
                </div>
              </div>
            </Formula>

            {/* Hauteur noyau */}
            <Formula label="Hauteur du Noyau Polaire Calculée" accent="slate">
              <Var>h<sub>M,calc</sub></Var>{sym.eq}
              <Num>10.5</Num>{sym.dot}{sym.delta}
              {sym.plus}<Num>8</Num>
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 dark:text-slate-500 ml-3">
                (h<sub>M</sub> final arrondi)
              </span>
            </Formula>

            {/* Hauteur culasse rotor */}
            <Formula label="Hauteur Culasse Rotor" accent="sky">
              <Var>H<sub>a</sub></Var>{sym.eq}
              <Frac
                num={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Var>D</Var>
                    {sym.minus}<Num>2</Num>{sym.delta}
                    {sym.minus}<Num>2</Num>
                    <span className="font-mono italic text-sm">
                      (h<sub>p</sub>{sym.plus}h<sub>M</sub>)
                    </span>
                    {sym.minus}<Var>d<sub>noy</sub></Var>
                  </span>
                }
                den={<Num>2</Num>}
              />
            </Formula>

            {/* Induction culasse */}
            <Formula label="Induction Culasse Rotor" accent="emerald">
              <Var>B<sub>a</sub></Var>{sym.eq}
              <Frac
                num={<Var>Φ<sub>M</sub></Var>}
                den={
                  <span className="flex items-center gap-0.5">
                    <Num>2</Num>{sym.dot}
                    <Var>H<sub>a</sub></Var>{sym.dot}
                    <Var>l<sub>a</sub></Var>
                  </span>
                }
              />
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 dark:text-slate-500 ml-3 border-l border-current pl-2">
                l<sub>a</sub> = l<sub>M</sub> + 11.5
              </span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
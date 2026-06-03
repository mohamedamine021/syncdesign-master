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
const CURRENT_STEP = 5;

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
    'font-mono text-sm text-blue-700 dark:text-blue-400',
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
  approx: <Op>≈</Op>,
  minus:  <Op>−</Op>,
  delta:  <Var>δ</Var>,
  gamma:  <Var>γ</Var>,
  tau:    <Var>τ</Var>,
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
        rounded-xl border border-border border-t-2 p-5
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
            font-mono text-3xl font-bold
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
              Entrefer et Coefficient de Carter
            </h1>
            <p className={typo.bannerDesc}>
              Calcul détaillé de l'entrefer mécanique et du coefficient correcteur de Carter
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="font-mono text-white text-2xl font-bold">
                ↔
              </span>
            </div>
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Entrefer
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
          { label: 'Entrefer mécanique', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'           },
          { label: 'Coefficient Carter', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Ouverture encoche',  color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Réluctance',         color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
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
export default function Step5() {
  const { mainDimensions, stator, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (
      !mainDimensions?.A || !mainDimensions?.tau ||
      !stator?.Bd0 || !stator?.be || !stator?.t1
    ) return null;

    try {
      const engine = CalculationEngine.calcAirGap(mainDimensions, stator);

      const xd_star     = 1.35;
      const xSigma_star = 0.1;
      const Kprime      = 1.06;

      const delta_calc  = (0.36 * mainDimensions.A * mainDimensions.tau) /
                          (Kprime * (xd_star - xSigma_star) * stator.Bd0);
      const b0          = stator.be / 10;
      const ratio       = b0 / engine.delta;
      const gamma       = Math.pow(ratio, 2) / (5 + ratio);
      const Kdelta_calc = stator.t1 / (stator.t1 - gamma * engine.delta);

      return {
        delta: engine.delta,
        Kdelta: engine.Kdelta,
        delta_calc,
        b0,
        ratio,
        gamma,
        Kdelta_calc,
        xd_star,
        xSigma_star,
        Kprime,
      };
    } catch (err) {
      console.error("Erreur calcul entrefer :", err);
      return null;
    }
  }, [mainDimensions, stator]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Entrefer et Coefficient de Carter">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour le calcul de l'entrefer.
          </p>
          <p className={typo.errorBody}>
            Veuillez vous assurer que l'Étape{' '}
            <code className={typo.code}>3</code> (Dimensions principales) et
            l'Étape{' '}
            <code className={typo.code}>4</code> (Stator) ont été validées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Entrefer et Coefficient de Carter"
      description="Calcul détaillé de l'entrefer mécanique et du coefficient correcteur de Carter"
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
              label="Entrefer Arrondi (δ)"
              value={fmt(results.delta, 2)}
              unit="cm"
              accent="sky"
            />
            <KpiCard
              label="Coefficient Carter (Kδ)"
              value={fmt(results.Kdelta, 3)}
              accent="emerald"
            />
          </div>

          {/* Tableau */}
          <ResultTable
            title="Détails des paramètres calculés"
            rows={[
              { label: 'Entrefer théorique',           symbol: <><Var>δ<sub>calc</sub></Var></>,      value: fmt(results.delta_calc, 4),  unit: 'cm' },
              { label: 'Entrefer adopté (arrondi)',     symbol: {sym: sym.delta}.sym,                 value: fmt(results.delta, 2),       unit: 'cm' },
              { label: "Ouverture d'encoche",           symbol: <><Var>b<sub>0</sub></Var></>,        value: fmt(results.b0, 2),          unit: 'cm' },
              { label: 'Ratio ouverture / entrefer',   symbol: <><Var>b<sub>0</sub></Var> / {sym.delta}</>, value: fmt(results.ratio, 3),       unit: ''   },
              { label: 'Coefficient géométrique',      symbol: {sym: sym.gamma}.sym,                  value: fmt(results.gamma, 4),       unit: ''   },
              { label: 'Coefficient Carter théorique', symbol: <><Var>K<sub>δ,calc</sub></Var></>,    value: fmt(results.Kdelta_calc, 4), unit: ''   },
              { label: 'Coefficient Carter final',     symbol: <><Var>K<sub>δ</sub></Var></>,         value: fmt(results.Kdelta, 3),      unit: ''   },
            ]}
          />

          {/* Constantes de conception */}
          <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20">
            <p className={typo.constTitle}>
              Constantes d'entrée utilisées
            </p>
            <ul className="space-y-2">
              {[
                { sym: <><Var>x<sub>d</sub></Var>*</>,  val: results.xd_star     },
                { sym: <><Var>x<sub>σ</sub></Var>*</>,  val: results.xSigma_star },
                { sym: <><Var>K</Var>'</>,              val: results.Kprime      },
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  {/* Symbole — JetBrains Mono italic */}
                  <span className="font-mono italic font-semibold text-sm text-blue-800 dark:text-blue-300 w-16">
                    {item.sym}
                  </span>
                  <Op>=</Op>
                  {/* Valeur — JetBrains Mono tabular */}
                  <span className="font-mono font-bold tabular-nums text-sm text-blue-700 dark:text-blue-400">
                    {item.val}
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
              Équations exhaustives utilisées pour l'Étape 5
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* 1. Entrefer théorique */}
            <Formula label="1 — Entrefer Théorique" accent="sky">
              <Var>δ<sub>calc</sub></Var>{sym.eq}
              <Frac
                num={
                  <><Num>0.36</Num>{sym.dot}<Var>A</Var>{sym.dot}{sym.tau}</>
                }
                den={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Var>K'</Var>{sym.dot}
                    <span className="font-mono italic text-sm">
                      (x*<sub>d</sub>
                    </span>
                    {sym.minus}
                    <span className="font-mono italic text-sm">
                      x*<sub>σ</sub>)
                    </span>
                    {sym.dot}<Var>B<sub>δ0</sub></Var>
                  </span>
                }
              />
            </Formula>

            {/* 2. Entrefer adopté */}
            <Formula label="2 — Entrefer Adopté (Arrondi au 0.05)" accent="emerald">
              {sym.delta}{sym.approx}<Var>δ<sub>calc</sub></Var>
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 dark:text-slate-500 ml-3">
                (arrondi au pas de 0.05)
              </span>
            </Formula>

            {/* 3. Ouverture d'encoche */}
            <Formula label="3 — Ouverture d'Encoche" accent="violet">
              <Var>b<sub>0</sub></Var>{sym.eq}
              <Frac
                num={<Var>b<sub>e</sub></Var>}
                den={<Num>10</Num>}
              />
            </Formula>

            {/* 4. Ratio */}
            <Formula label="4 — Ratio d'Ouverture d'Encoche" accent="amber">
              <span className="font-mono italic font-semibold text-sm">
                ratio
              </span>
              {sym.eq}
              <Frac
                num={<Var>b<sub>0</sub></Var>}
                den={sym.delta}
              />
            </Formula>

            {/* 5. γ */}
            <Formula label="5 — Coefficient Géométrique (γ)" accent="rose">
              {sym.gamma}{sym.eq}
              <Frac
                num={
                  <span className="font-mono italic text-sm">
                    (ratio)²
                  </span>
                }
                den={
                  <span className="flex items-center gap-0.5">
                    <Num>5</Num><Op>+</Op>
                    <span className="font-mono italic text-sm">ratio</span>
                  </span>
                }
              />
            </Formula>

            {/* 6. Kδ calc */}
            <Formula label="6 — Coefficient de Carter Théorique" accent="cyan">
              <Var>K<sub>δ,calc</sub></Var>{sym.eq}
              <Frac
                num={<Var>t<sub>1</sub></Var>}
                den={
                  <span className="flex items-center gap-0.5">
                    <Var>t<sub>1</sub></Var>
                    {sym.minus}
                    {sym.gamma}{sym.dot}{sym.delta}
                  </span>
                }
              />
            </Formula>

            {/* 7. Kδ final */}
            <Formula label="7 — Coefficient de Carter Final (Arrondi)" accent="slate">
              <Var>K<sub>δ</sub></Var>{sym.approx}<Var>K<sub>δ,calc</sub></Var>
              <span className="font-[Inter,sans-serif] text-xs text-slate-400 dark:text-slate-500 ml-3">
                (arrondi à 2 déc.)
              </span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
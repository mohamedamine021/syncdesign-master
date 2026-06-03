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

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 2;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES TYPOGRAPHIQUES CENTRALISÉS
// ─────────────────────────────────────────────────────────────────────────────
const typo = {
  // Labels / étiquettes de paramètres
  label:
    'font-[Inter,sans-serif] text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400',

  // Valeurs numériques (monospace moderne)
  value:
    'font-mono text-2xl font-bold tabular-nums tracking-tight text-primary',

  // Unités
  unit: 'font-[Inter,sans-serif] text-sm font-normal text-muted-foreground',

  // Titres de section
  sectionTitle:
    'font-[Inter,sans-serif] text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400',

  // Titre de carte
  cardTitle:
    'font-[Inter,sans-serif] text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100',

  // Description de carte
  cardDesc:
    'font-[Inter,sans-serif] text-sm text-slate-500 dark:text-slate-400 leading-relaxed',

  // Symboles mathématiques (élégant)
  mathSymbol:
    'font-mono italic font-medium text-slate-700 dark:text-slate-300',

  // Corps des formules
  mathBody:
    'font-mono text-sm font-normal text-slate-800 dark:text-slate-200',

  // Label de formule
  formulaLabel:
    'font-[Inter,sans-serif] text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500',
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
  accent?: 'sky' | 'emerald' | 'violet' | 'amber';
}) {
  const accents = {
    sky:     'border-l-sky-400 bg-sky-50/60 dark:bg-sky-950/20',
    emerald: 'border-l-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20',
    violet:  'border-l-violet-400 bg-violet-50/60 dark:bg-violet-950/20',
    amber:   'border-l-amber-400 bg-amber-50/60 dark:bg-amber-950/20',
  };

  const dotColors = {
    sky:     'bg-sky-400',
    emerald: 'bg-emerald-400',
    violet:  'bg-violet-400',
    amber:   'bg-amber-400',
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
      {/* Pastille colorée + label */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[accent as keyof typeof dotColors]}`} />
        <p className={typo.formulaLabel}>{label}</p>
      </div>

      {/* Formule centrée */}
      <div
        className={`
          flex justify-center items-center py-2 overflow-x-auto
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
      <span
        className={`
          border-b border-current px-2 pb-0.5 leading-snug
          ${typo.mathBody}
        `}
      >
        {num}
      </span>
      <span className={`px-2 pt-0.5 leading-snug ${typo.mathBody}`}>
        {den}
      </span>
    </span>
  );
}

// Symbole variable (italique monospace)
function Var({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono italic font-semibold
                 text-slate-800 dark:text-slate-200"
    >
      {children}
    </span>
  );
}

// Opérateur (non italique, légèrement plus léger)
function Op({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono font-light
                 text-slate-500 dark:text-slate-400 mx-1.5"
    >
      {children}
    </span>
  );
}

const sym = {
  dot: <Op>·</Op>,
  eq:  <Op>=</Op>,

  sqrt3: (
    <span className="inline-flex items-center font-mono">
      <span className="text-lg font-light text-slate-500 mr-0.5">√</span>
      <span className="border-t border-current px-1 text-sm">3</span>
    </span>
  ),

  cos: (
    <span className="font-mono italic text-sm
                     text-slate-700 dark:text-slate-300">
      cos(φ)
    </span>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD — Carte de paramètre individuelle
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
  accent?: 'sky' | 'emerald' | 'violet' | 'amber' | 'slate';
}) {
  const borders = {
    sky:     'border-t-sky-400',
    emerald: 'border-t-emerald-400',
    violet:  'border-t-violet-500',
    amber:  'border-t-amber-400',
    slate:   'border-t-slate-400',
  };

  const valueColors = {
    sky:     'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet:  'text-violet-600 dark:text-violet-400',
    amber:   'text-amber-600 dark:text-amber-400',
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
      {/* Label Inter — petit, aéré */}
      <p className={typo.label}>{label}</p>

      {/* Valeur JetBrains Mono */}
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
          <span className={`${typo.unit} text-xs`}>{unit}</span>
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
            <span
              className="font-mono text-white
                         font-black text-2xl tracking-tight"
            >
              {CURRENT_STEP}
            </span>
          </div>

          {/* Textes */}
          <div className="flex flex-col flex-1 min-w-0">
            <span
              className="font-[Inter,sans-serif] text-[10px] font-semibold
                         text-slate-300 uppercase tracking-[0.2em] mb-0.5"
            >
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>

            <h1
              className="font-[Inter,sans-serif] text-2xl md:text-3xl
                         font-extrabold text-white leading-tight
                         tracking-tight truncate"
            >
              Valeurs Nominales
            </h1>

            <p
              className="font-[Inter,sans-serif] text-slate-300 text-sm
                         mt-1 leading-relaxed font-light"
            >
              Calcul des grandeurs électriques et mécaniques de base
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span
                className="font-mono text-white
                           text-2xl font-bold"
              >
                Ω
              </span>
            </div>
            <span
              className="font-[Inter,sans-serif] text-[9px] text-white
                         font-bold uppercase tracking-widest"
            >
              Nominal
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-5">
          <div className="flex justify-between mb-1.5">
            <span
              className="font-[Inter,sans-serif] text-[9px] text-slate-400
                         font-semibold uppercase tracking-widest"
            >
              Progression globale
            </span>
            <span
              className="font-mono text-[9px]
                         text-slate-400 font-medium tabular-nums"
            >
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
                          font-mono text-[8px]
                          font-bold mt-0.5 tabular-nums
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
          { label: 'Tension de phase',   color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'          },
          { label: 'Puissance apparente', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Courant nominal',    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Paires de pôles',    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
        ].map(tag => (
          <span
            key={tag.label}
            className={`
              font-[Inter,sans-serif] text-[10px] font-semibold
              uppercase tracking-wider px-2.5 py-0.5 rounded-full border
              ${tag.color}
            `}
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
      <span className="font-[Inter,sans-serif] text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 px-3 text-center">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Step2() {
  const { inputs, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs?.Un || !inputs?.Pn || !inputs?.cosPhi || !inputs?.f || !inputs?.nn)
      return null;

    const Uph = inputs.Un / Math.sqrt(3);
    const Sn  = inputs.Pn / inputs.cosPhi;
    const In  = (Sn * 1000) / (Math.sqrt(3) * inputs.Un);
    const p   = (60 * inputs.f) / inputs.nn;

    return { Uph, Sn, In, p };
  }, [inputs]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Valeurs Nominales">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="font-[Inter,sans-serif] font-bold text-destructive">
            Erreur : Paramètres d'entrée manquants ou invalides.
          </p>
          <p className="font-[Inter,sans-serif] text-sm text-destructive/80 mt-2 leading-relaxed">
            Veuillez retourner à l'Étape 1 et vérifier que{' '}
            <code className="font-mono text-xs">Un</code>,{' '}
            <code className="font-mono text-xs">Pn</code>,{' '}
            <code className="font-mono text-xs">cos(φ)</code>,{' '}
            <code className="font-mono text-xs">f</code> et{' '}
            <code className="font-mono text-xs">nn</code>{' '}
            sont bien remplis.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Valeurs Nominales"
      description="Calcul des grandeurs électriques et mécaniques de base de l'alternateur"
    >
      <StepBanner />

      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ── COLONNE GAUCHE ─────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* KPI Cards avec accents colorés et typo différenciée */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="Puissance Utile (Pn)"
              value={fmt(inputs.Pn, 0)}
              unit="kW"
              accent="sky"
            />
            <KpiCard
              label="Tension Réseau (Un)"
              value={fmt(inputs.Un, 0)}
              unit="V"
              accent="emerald"
            />
            <KpiCard
              label="Courant Nominal (In)"
              value={fmt(results.In, 2)}
              unit="A"
              accent="violet"
            />
            <KpiCard
              label="Paires de pôles (p)"
              value={fmt(results.p, 0)}
              accent="amber"
            />
          </div>

          {/* Tableau */}
          <ResultTable
            title="Résultats Calculés"
            rows={[
              { label: 'Tension par phase',         symbol: <><Var>U<sub>ph</sub></Var></>, value: fmt(results.Uph, 2), unit: 'V'   },
              { label: 'Puissance apparente',        symbol: <><Var>S<sub>n</sub></Var></>,  value: fmt(results.Sn, 2),  unit: 'kVA' },
              { label: 'Courant nominal',            symbol: <><Var>I<sub>n</sub></Var></>,  value: fmt(results.In, 2),  unit: 'A'   },
              { label: 'Nombre de paires de pôles', symbol: <Var>p</Var>,                   value: fmt(results.p, 0),   unit: '—'   },
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
              Rappel des équations utilisées pour l'Étape 2
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* Tension de phase */}
            <Formula label="Tension de Phase" accent="sky">
              <Var>U<sub>ph</sub></Var>
              {sym.eq}
              <Frac
                num={<Var>U<sub>n</sub></Var>}
                den={sym.sqrt3}
              />
            </Formula>

            {/* Puissance apparente */}
            <Formula label="Puissance Apparente" accent="emerald">
              <Var>S<sub>n</sub></Var>
              {sym.eq}
              <Frac
                num={<Var>P<sub>n</sub></Var>}
                den={sym.cos}
              />
            </Formula>

            {/* Courant nominal */}
            <Formula label="Courant Nominal" accent="violet">
              <Var>I<sub>n</sub></Var>
              {sym.eq}
              <Frac
                num={<><Var>S<sub>n</sub></Var>{sym.dot}<span className="font-mono text-sm">1000</span></>}
                den={<>{sym.sqrt3}{sym.dot}<Var>U<sub>n</sub></Var></>}
              />
            </Formula>

            {/* Paires de pôles */}
            <Formula label="Nombre de Paires de Pôles" accent="amber">
              <Var>p</Var>
              {sym.eq}
              <Frac
                num={<><span className="font-mono text-sm">60</span>{sym.dot}<Var>f</Var></>}
                den={<Var>n<sub>n</sub></Var>}
              />
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
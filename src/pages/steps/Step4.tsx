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
import { StatorVisualization } from '@/components/StatorVisualization';
import { Cpu } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 4;

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
  pi:     <Var>π</Var>,
  tau:    <Var>τ</Var>,
  beta:   <Var>β</Var>,
  phi:    <Var>Φ</Var>,
  delta:  <Var>δ</Var>,
  alpha:  <Var>α</Var>,
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
  value: React.ReactNode;
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
              Dimensionnement du Stator
            </h1>
            <p className={typo.bannerDesc}>
              Calcul des encoches, enroulements et culasse magnétique du stator
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <Cpu className="w-12 h-12 text-white" />
            <span className="font-[Inter,sans-serif] text-[9px] text-white font-bold uppercase tracking-widest">
              Stator
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
          { label: 'Encoches stator',    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'          },
          { label: 'Enroulements',        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Culasse magnétique',  color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
          { label: 'Circuit magnétique',  color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'      },
          { label: 'Conducteurs cuivre',  color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'         },
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
export default function Step4() {
  const { inputs, nominal, mainDimensions, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (
      !inputs?.m || !inputs?.f || !inputs?.Un ||
      !nominal?.p || !nominal?.In || !nominal?.Uph ||
      !mainDimensions?.D || !mainDimensions?.A ||
      !mainDimensions?.tau || !mainDimensions?.lDeltaFinal
    ) return null;

    try {
      return CalculationEngine.calcStator(inputs, nominal, mainDimensions);
    } catch (err) {
      console.error('Erreur calcul stator :', err);
      return null;
    }
  }, [inputs, nominal, mainDimensions]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v == null || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Dimensionnement du Stator">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className={typo.errorTitle}>
            Erreur : Paramètres manquants pour dimensionner le Stator.
          </p>
          <p className={typo.errorBody}>
            Veuillez vous assurer que les étapes{' '}
            <code className={typo.code}>1</code>,{' '}
            <code className={typo.code}>2</code> et{' '}
            <code className={typo.code}>3</code>{' '}
            ont bien été validées et complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Dimensionnement du Stator"
      description="Calcul des encoches, enroulements et culasse magnétique du stator"
    >
      {/* ══ 1. BANDEAU ══════════════════════════════════════════════════════ */}
      <StepBanner />

      {/* ══ 2. VISUALISATION STATOR ════════════════════════════════════════ */}
      <div className="w-full mb-10">
        <SectionSeparator>
          Visualisation géométrique du stator
        </SectionSeparator>

        <Card className="shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 py-3 px-5">
            <div className="flex items-center justify-between">
              <div>
                {/* Titre visualisation — Inter bold */}
                <CardTitle className={typo.vizTitle}>
                  Coupe transversale du stator
                </CardTitle>

                {/* Description — Inter léger avec valeurs JetBrains Mono */}
                <CardDescription className={typo.vizDesc}>
                  Représentation à l'échelle —{' '}
                  <span className="font-mono tabular-nums">
                    Z₁ = {fmt(results.Z1, 0)}
                  </span>{' '}
                  encoches,{' '}
                  <span className="font-mono tabular-nums">
                    D = {fmt(mainDimensions.D, 1)} cm
                  </span>,{' '}
                  <span className="font-mono tabular-nums">
                    Da = {fmt(mainDimensions.DaNorm, 1)} cm
                  </span>
                </CardDescription>
              </div>

              {/* Indicateurs rapides */}
              <div className="hidden sm:flex gap-6">
                {[
                  { label: 'Z₁', value: fmt(results.Z1, 0),  color: 'text-sky-600 dark:text-sky-400'           },
                  { label: 'q₁', value: fmt(results.q1, 0),  color: 'text-emerald-600 dark:text-emerald-400'   },
                  { label: 'w₁', value: fmt(results.w1, 0),  color: 'text-violet-600 dark:text-violet-400'     },
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
            <StatorVisualization
              D={mainDimensions.D}
              Da={mainDimensions.DaNorm}
              hc={results.hc}
              he={results.he}
              be={results.be}
              bd1={results.bd1}
              Z1={results.Z1}
              q1={results.q1}
              w1={results.w1}
              Bd0={results.Bd0}
              Bd1={results.Bd1}
              Bc={results.Bc}
            />
          </CardContent>
        </Card>
      </div>

      {/* ══ 3. SÉPARATEUR ══════════════════════════════════════════════════ */}
      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      {/* ══ 4. GRILLE 2 COLONNES ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ── COLONNE GAUCHE ──────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              label="Nombre d'encoches (Z₁)"
              value={fmt(results.Z1, 0)}
              accent="sky"
            />
            <KpiCard
              label="Spires par Phase (w₁)"
              value={fmt(results.w1, 0)}
              accent="emerald"
            />
            <KpiCard
              label="Flux Nominal (Φch)"
              value={fmt(results.PhiCh / 1e6, 2)}
              unit="×10⁶ Mx"
              accent="violet"
            />
            <KpiCard
              label="Densité Courant (Δc)"
              value={fmt(results.DeltaC, 2)}
              unit="A/mm²"
              accent="amber"
            />
          </div>

          {/* Tableaux */}
          <ResultTable
            title="Géométrie et Enroulements"
            rows={[
              { label: "Nombre total d'encoches", symbol: <><Var>Z<sub>1</sub></Var></>,    value: fmt(results.Z1, 0),   unit: ''         },
              { label: 'Encoches par pôle/phase', symbol: <><Var>q<sub>1</sub></Var></>,    value: fmt(results.q1, 0),   unit: ''         },
              { label: 'Pas dentaire',            symbol: <><Var>t<sub>1</sub></Var></>,    value: fmt(results.t1, 2),   unit: 'cm'       },
              { label: 'Spires par phase',        symbol: <><Var>w<sub>1</sub></Var></>,    value: fmt(results.w1, 0),   unit: ''         },
              { label: 'Conducteurs par encoche', symbol: <><Var>up<sub>1</sub></Var></>,   value: fmt(results.up1, 0),  unit: ''         },
              { label: "Pas d'enroulement",       symbol: <Var>Y</Var>,                      value: fmt(results.Y, 0),    unit: 'encoches' },
              { label: 'Raccourcissement du pas', symbol: <Var>β</Var>,                      value: fmt(results.beta, 3), unit: ''         },
              { label: "Facteur d'enroulement",   symbol: <><Var>K<sub>w1</sub></Var></>,    value: fmt(results.Kw1, 3),  unit: ''         },
            ]}
          />

          <ResultTable
            title="Dimensions des Encoches"
            rows={[
              { label: "Largeur d'encoche",         symbol: <><Var>b<sub>e</sub></Var></>,   value: fmt(results.be, 2),  unit: 'mm' },
              { label: "Hauteur d'encoche (calcul)",symbol: <><Var>h<sub>e</sub></Var></>,   value: fmt(results.he, 2),  unit: 'mm' },
              { label: 'Largeur de la dent',        symbol: <><Var>b<sub>d1</sub></Var></>,  value: fmt(results.bd1, 2), unit: 'cm' },
              { label: 'Encombrement (têtes)',      symbol: <><Var>l<sub>e</sub></Var></>,   value: fmt(results.le, 2),  unit: 'mm' },
            ]}
          />

          <ResultTable
            title="Circuit Magnétique Stator"
            rows={[
              { label: 'Flux magnétique à vide',      symbol: <><Var>Φ<sub>0</sub></Var></>,    value: `${fmt(results.Phi0 / 1e6, 2)} × 10⁶`,  unit: 'Mx' },
              { label: 'Flux magnétique en charge',   symbol: <><Var>Φ<sub>ch</sub></Var></>,   value: `${fmt(results.PhiCh / 1e6, 2)} × 10⁶`, unit: 'Mx' },
              { label: "Induction entrefer (à vide)", symbol: <><Var>B<sub>δ0</sub></Var></>,   value: fmt(results.Bd0, 0),                    unit: 'G'  },
              { label: 'Induction entrefer nominale', symbol: <><Var>B<sub>δN</sub></Var></>,   value: fmt(results.BdN, 0),                    unit: 'G'  },
              { label: 'Induction dentaire (charge)', symbol: <><Var>B<sub>d1</sub></Var></>,   value: fmt(results.Bd1, 0),                    unit: 'G'  },
              { label: 'Hauteur culasse stator',      symbol: <><Var>h<sub>c</sub></Var></>,    value: fmt(results.hc, 2),                     unit: 'cm' },
              { label: 'Induction culasse (charge)',  symbol: <><Var>B<sub>c</sub></Var></>,    value: fmt(results.Bc, 0),                     unit: 'G'  },
            ]}
          />

          <ResultTable
            title="Cuivre et Conducteurs"
            rows={[
              { label: 'Dimensions fil nu (a × b)', symbol: 'a × b',                                 value: `${fmt(results.a_cond, 2)} × ${fmt(results.b_cond, 2)}`, unit: 'mm'    },
              { label: 'Section conducteur',        symbol: <><Var>S<sub>c</sub></Var></>,           value: fmt(results.Sc, 2),                                      unit: 'mm²'   },
              { label: 'Densité de courant',        symbol: <><Var>Δ<sub>c</sub></Var></>,           value: fmt(results.DeltaC, 2),                                  unit: 'A/mm²' },
              { label: 'Longueur phase',            symbol: <><Var>L<sub>c</sub></Var></>,           value: fmt(results.Lc, 2),                                      unit: 'm'     },
              { label: 'Résistance phase (75°C)',   symbol: <><Var>R<sub>a75</sub></Var></>,         value: fmt(results.Ra75, 4),                                    unit: 'Ω'     },
              { label: 'Résistance par unité',      symbol: <><Var>R<sub>a75</sub></Var>*</>,        value: fmt(results.Ra75pu, 4),                                  unit: 'p.u.'  },
              { label: 'Poids total cuivre stator', symbol: <><Var>G<sub>M</sub></Var></>,           value: fmt(results.Gm, 1),                                      unit: 'kg'    },
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
              Rappel des équations utilisées pour l'Étape 4
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">

            {/* Z₁ */}
            <Formula label="Nombre total d'encoches" accent="sky">
              <Var>Z<sub>1</sub></Var>{sym.eq}
              <Num>2</Num><Var>p</Var>{sym.dot}
              <Var>m</Var>{sym.dot}
              <Var>q<sub>1</sub></Var>
            </Formula>

            {/* t₁ */}
            <Formula label="Pas dentaire" accent="emerald">
              <Var>t<sub>1</sub></Var>{sym.eq}
              <Frac
                num={<>{sym.pi}{sym.dot}<Var>D</Var></>}
                den={<Var>Z<sub>1</sub></Var>}
              />
            </Formula>

            {/* up₁ */}
            <Formula label="Conducteurs par encoche" accent="violet">
              <Var>up<sub>1</sub></Var>{sym.eq}
              <Frac
                num={<><Var>A</Var>{sym.dot}<Var>t<sub>1</sub></Var></>}
                den={<Var>I<sub>n</sub></Var>}
              />
            </Formula>

            {/* w₁ */}
            <Formula label="Spires par phase" accent="amber">
              <Var>w<sub>1</sub></Var>{sym.eq}
              <Frac
                num={<><Var>p</Var>{sym.dot}<Var>q<sub>1</sub></Var>{sym.dot}<Var>up<sub>1</sub></Var></>}
                den={<Var>a</Var>}
              />
            </Formula>

            {/* Y & Kw1 */}
            <Formula label="Pas & Facteur d'enroulement" accent="rose">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>Y</Var>{sym.approx}
                  <Num>0.778</Num>{sym.dot}
                  <Var>τ<sub>slots</sub></Var>
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>K<sub>w1</sub></Var>{sym.eq}
                  <Var>K<sub>d</sub></Var>{sym.dot}
                  <Var>K<sub>p</sub></Var>
                </div>
              </div>
            </Formula>

            {/* Φ₀ */}
            <Formula label="Flux magnétique à vide (Φ₀)" accent="cyan">
              <Var>Φ<sub>0</sub></Var>{sym.eq}
              <Frac
                num={<><Var>U<sub>ph</sub></Var>{sym.dot}<Num>10<sup>8</sup></Num></>}
                den={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Num>4</Num>{sym.dot}
                    <Var>K<sub>B</sub></Var>{sym.dot}
                    <Var>f</Var>{sym.dot}
                    <Var>w<sub>1</sub></Var>{sym.dot}
                    <Var>K<sub>w1</sub></Var>
                  </span>
                }
              />
            </Formula>

            {/* Φch */}
            <Formula label="Flux en charge (Φch)" accent="slate">
              <Var>Φ<sub>ch</sub></Var>{sym.eq}
              <Num>1.08</Num>{sym.dot}<Var>Φ<sub>0</sub></Var>
            </Formula>

            {/* Bδ0 */}
            <Formula label="Induction entrefer à vide (Bδ0)" accent="sky">
              <Var>B<sub>δ0</sub></Var>{sym.eq}
              <Frac
                num={<Var>Φ<sub>0</sub></Var>}
                den={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Var>α<sub>δ</sub></Var>{sym.dot}
                    <Var>τ</Var>{sym.dot}
                    <Var>l<sub>δ,fin</sub></Var>
                  </span>
                }
              />
            </Formula>

            {/* BδN */}
            <Formula label="Induction nominale en charge (BδN)" accent="emerald">
              <Var>B<sub>δN</sub></Var>{sym.eq}
              <Num>1.08</Num>{sym.dot}<Var>B<sub>δ0</sub></Var>
            </Formula>

            {/* Géométrie dent */}
            <Formula label="Géométrie de la dent" accent="violet">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>b<sub>e</sub></Var>{sym.eq}
                  <Num>0.5</Num>{sym.dot}<Var>t<sub>1</sub></Var>{sym.dot}<Num>10</Num>
                </div>
                <div className="flex justify-center items-center flex-wrap gap-1">
                  <Var>b<sub>d1</sub></Var>{sym.eq}
                  <Var>t<sub>1</sub></Var>
                  {sym.minus}
                  <span className="font-mono text-sm italic">
                    (b<sub>e</sub> / 10)
                  </span>
                </div>
              </div>
            </Formula>

            {/* hc */}
            <Formula label="Hauteur de la culasse" accent="amber">
              <Var>h<sub>c</sub></Var>{sym.eq}
              <Frac
                num={<><Var>D<sub>a</sub></Var>{sym.minus}<Var>D</Var></>}
                den={<Num>2</Num>}
              />
              {sym.minus}
              <Frac
                num={<Var>h<sub>e</sub></Var>}
                den={<Num>10</Num>}
              />
            </Formula>

            {/* Bd1 */}
            <Formula label="Induction dentaire en charge" accent="rose">
              <Var>B<sub>d1</sub></Var>{sym.eq}
              <Frac
                num={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Var>B<sub>δN</sub></Var>{sym.dot}
                    <Var>t<sub>1</sub></Var>{sym.dot}
                    <Var>l<sub>δ,fin</sub></Var>
                  </span>
                }
                den={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Var>b<sub>d1</sub></Var>{sym.dot}
                    <Var>l</Var>{sym.dot}
                    <Var>K<sub>f</sub></Var>
                  </span>
                }
              />
            </Formula>

            {/* Bc */}
            <Formula label="Induction dans la culasse" accent="cyan">
              <Var>B<sub>c</sub></Var>{sym.eq}
              <Frac
                num={<Var>Φ<sub>ch</sub></Var>}
                den={
                  <span className="flex flex-wrap justify-center items-center gap-0.5">
                    <Num>2</Num>{sym.dot}
                    <Var>h<sub>c</sub></Var>{sym.dot}
                    <Var>l</Var>{sym.dot}
                    <Var>K<sub>f</sub></Var>
                  </span>
                }
              />
            </Formula>

            {/* Δc */}
            <Formula label="Densité de courant" accent="slate">
              <Var>Δ<sub>c</sub></Var>{sym.eq}
              <Frac
                num={<Var>I<sub>n</sub></Var>}
                den={<Var>S<sub>c</sub></Var>}
              />
            </Formula>

            {/* Ra75 */}
            <Formula label="Résistance de phase (à 75°C)" accent="sky">
              <Var>R<sub>a75</sub></Var>{sym.eq}
              <Frac num={<Num>1</Num>} den={<Num>46</Num>} />
              {sym.dot}
              <Frac
                num={<Var>L<sub>c</sub></Var>}
                den={<Var>S<sub>c</sub></Var>}
              />
            </Formula>

            {/* Ra75* */}
            <Formula label="Résistance en Per Unit (R*a75)" accent="emerald">
              <Var>R<sub>a75</sub><sup>*</sup></Var>{sym.eq}
              <Frac
                num={<><Var>I<sub>n</sub></Var>{sym.dot}<Var>R<sub>a75</sub></Var></>}
                den={<Var>U<sub>ph</sub></Var>}
              />
            </Formula>

            {/* GM */}
            <Formula label="Poids total du Cuivre (Stator)" accent="violet">
              <Var>G<sub>M</sub></Var>{sym.eq}
              <Num>8.9</Num>{sym.dot}
              <Var>m</Var>{sym.dot}
              <Var>L<sub>c</sub></Var>{sym.dot}
              <Var>S<sub>c</sub></Var>{sym.dot}
              <Num>10<sup>−3</sup></Num>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
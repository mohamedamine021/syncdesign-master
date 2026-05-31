import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalculationEngine } from '@/engine/CalculationEngine';
import { StatorVisualization } from '@/components/StatorVisualization';
import { Cpu } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS HTML POUR RENDU MATHÉMATIQUE SÉCURISÉ (ZÉRO LATEX)
// ─────────────────────────────────────────────────────────────────────────────
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex justify-center items-center py-2 overflow-x-auto text-slate-800 dark:text-slate-200 text-sm font-serif">
        {children}
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1 align-middle">
      <span className="border-b border-current px-1 leading-tight text-sm pb-0.5">{num}</span>
      <span className="px-1 leading-tight text-sm pt-0.5">{den}</span>
    </span>
  );
}

const sym = {
  dot:    <span className="mx-0.5">·</span>,
  pi:     <span className="mx-0.5">π</span>,
  tau:    <span className="mx-0.5">τ</span>,
  beta:   <span className="mx-0.5">β</span>,
  phi:    <span className="mx-0.5">Φ</span>,
  delta:  <span className="mx-0.5">δ</span>,
  alpha:  <span className="mx-0.5">α</span>,
  approx: <span className="mx-1">≈</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTE GLOBALE : NOMBRE TOTAL D'ÉTAPES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 4;

// ─────────────────────────────────────────────────────────────────────────────
// BANDEAU TITRE DE L'ÉTAPE
// ─────────────────────────────────────────────────────────────────────────────
function StepBanner() {
  const progressPercent = (CURRENT_STEP / TOTAL_STEPS) * 100;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-8">
      {/* Fond dégradé */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">

          {/* Numéro badge */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-2xl tracking-tight">{CURRENT_STEP}</span>
          </div>

          {/* Textes */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Étiquette surtitre */}
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>
            {/* Titre principal en français */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight truncate">
              Dimensionnement du Stator
            </h1>
            {/* Sous-titre descriptif */}
            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Calcul des encoches, enroulements et culasse magnétique du stator
            </p>
          </div>

          {/* Icône décorative à droite */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <Cpu className="w-12 h-12 text-white" />
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">Stator</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-5">
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
            <span>Progression globale</span>
            <span>{CURRENT_STEP} / {TOTAL_STEPS} — {Math.round(progressPercent)} %</span>
          </div>

          {/* Barre principale */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Marqueurs des 14 étapes */}
          <div className="relative w-full mt-1.5">
            <div className="flex justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const step = i + 1;
                const isDone    = step < CURRENT_STEP;
                const isCurrent = step === CURRENT_STEP;
                return (
                  <div key={step} className="flex flex-col items-center" style={{ width: `${100 / TOTAL_STEPS}%` }}>
                    {/* Pastille */}
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
                    {/* Numéro sous la pastille — affiché seulement pour étapes clés */}
                    {(step === 1 || step === CURRENT_STEP || step === TOTAL_STEPS || step % 7 === 0) && (
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
                          isCurrent ? 'text-emerald-300' : isDone ? 'text-sky-400' : 'text-slate-500'
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

      {/* Bande de tags colorée en bas du bandeau */}
      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Encoches stator',   color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'         },
          { label: 'Enroulements',       color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Culasse magnétique', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'    },
          { label: 'Circuit magnétique', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'       },
          { label: 'Conducteurs cuivre', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'          },
        ].map(tag => (
          <span
            key={tag.label}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tag.color}`}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 4
// ─────────────────────────────────────────────────────────────────────────────
export default function Step4() {
  const { inputs, nominal, mainDimensions, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(4);
    }
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (
      !inputs || !inputs.m || !inputs.f || !inputs.Un ||
      !nominal || !nominal.p || !nominal.In || !nominal.Uph ||
      !mainDimensions || !mainDimensions.D || !mainDimensions.A ||
      !mainDimensions.tau || !mainDimensions.lDeltaFinal
    ) {
      return null;
    }
    try {
      return CalculationEngine.calcStator(inputs, nominal, mainDimensions);
    } catch (error) {
      console.error("Erreur lors du calcul du stator :", error);
      return null;
    }
  }, [inputs, nominal, mainDimensions]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  if (!results) {
    return (
      <StepLayout stepNumber={4} title="Dimensionnement du Stator">
        <StepBanner />
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour dimensionner le Stator.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que les Étapes 1, 2 et 3 ont bien été validées et complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      stepNumber={4}
      title="Dimensionnement du Stator"
      description="Calcul des encoches, enroulements et culasse magnétique du stator"
    >
      {/* ══ 1. BANDEAU TITRE ══════════════════════════════════════════════════ */}
      <StepBanner />

      {/* ══ 2. VISUALISATION STATOR ══════════════════════════════════════════ */}
      <div className="w-full mb-10">
        {/* En-tête de section visualisation */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-3">
            Visualisation géométrique du stator
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
        </div>

        {/* Carte contenant la visualisation */}
        <Card className="shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 py-3 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Coupe transversale du stator
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Représentation à l'échelle — Z₁ = {fmt(results.Z1, 0)} encoches,
                  D = {fmt(mainDimensions.D, 1)} cm,
                  Da = {fmt(mainDimensions.DaNorm, 1)} cm
                </CardDescription>
              </div>
              {/* Indicateurs rapides */}
              <div className="hidden sm:flex gap-4">
                {[
                  { label: 'Z₁', value: fmt(results.Z1, 0),  color: 'text-sky-600 dark:text-sky-400'     },
                  { label: 'q₁', value: fmt(results.q1, 0),  color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'w₁', value: fmt(results.w1, 0),  color: 'text-violet-600 dark:text-violet-400'   },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className={`text-lg font-black font-mono ${item.color}`}>{item.value}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">{item.label}</p>
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

      {/* ══ 3. SÉPARATEUR ════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-3">
          Résultats numériques &amp; formules
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
      </div>

      {/* ══ 4. GRILLE 2 COLONNES : Résultats | Formules ══════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES KPI ET TABLEAUX                          */}
        {/* ================================================================ */}
        <div className="space-y-6">

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Nombre d'encoches (Z₁)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.Z1, 0)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Spires par Phase (w₁)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.w1, 0)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Flux Nominal (Φch)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.PhiCh / 1e6, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">×10⁶ Mx</span>
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Densité Courant (Δc)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.DeltaC, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">A/mm²</span>
              </p>
            </div>
          </div>

          <ResultTable
            title="Géométrie et Enroulements"
            rows={[
              { label: "Nombre total d'encoches", symbol: 'Z_1',    value: fmt(results.Z1, 0),   unit: ''         },
              { label: 'Encoches par pôle/phase', symbol: 'q_1',    value: fmt(results.q1, 0),   unit: ''         },
              { label: 'Pas dentaire',            symbol: 't_1',    value: fmt(results.t1, 2),   unit: 'cm'       },
              { label: 'Spires par phase',        symbol: 'w_1',    value: fmt(results.w1, 0),   unit: ''         },
              { label: 'Conducteurs par encoche', symbol: 'up_1',   value: fmt(results.up1, 0),  unit: ''         },
              { label: "Pas d'enroulement",       symbol: 'Y',      value: fmt(results.Y, 0),    unit: 'encoches' },
              { label: 'Raccourcissement du pas', symbol: 'β',      value: fmt(results.beta, 3), unit: ''         },
              { label: "Facteur d'enroulement",   symbol: 'K_{w1}', value: fmt(results.Kw1, 3),  unit: ''         },
            ]}
          />

          <ResultTable
            title="Dimensions des Encoches"
            rows={[
              { label: "Largeur d'encoche",          symbol: 'b_e',    value: fmt(results.be, 2),  unit: 'mm' },
              { label: "Hauteur d'encoche (calcul)",  symbol: 'h_e',   value: fmt(results.he, 2),  unit: 'mm' },
              { label: 'Largeur de la dent',          symbol: 'b_{d1}',value: fmt(results.bd1, 2), unit: 'cm' },
              { label: 'Encombrement (têtes)',        symbol: 'l_e',   value: fmt(results.le, 2),  unit: 'mm' },
            ]}
          />

          <ResultTable
            title="Circuit Magnétique Stator"
            rows={[
              { label: 'Flux magnétique à vide',      symbol: 'Φ_0',    value: `${fmt(results.Phi0 / 1e6, 2)} × 10⁶`,  unit: 'Mx' },
              { label: 'Flux magnétique en charge',   symbol: 'Φ_{ch}', value: `${fmt(results.PhiCh / 1e6, 2)} × 10⁶`, unit: 'Mx' },
              { label: "Induction entrefer (à vide)", symbol: 'B_{δ0}', value: fmt(results.Bd0, 0),                     unit: 'G'  },
              { label: 'Induction entrefer nominale', symbol: 'B_{δN}', value: fmt(results.BdN, 0),                     unit: 'G'  },
              { label: 'Induction dentaire (charge)', symbol: 'B_{d1}', value: fmt(results.Bd1, 0),                     unit: 'G'  },
              { label: 'Hauteur culasse stator',      symbol: 'h_c',    value: fmt(results.hc, 2),                      unit: 'cm' },
              { label: 'Induction culasse (charge)',  symbol: 'B_c',    value: fmt(results.Bc, 0),                      unit: 'G'  },
            ]}
          />

          <ResultTable
            title="Cuivre et Conducteurs"
            rows={[
              { label: 'Dimensions fil nu (a × b)', symbol: 'a × b',    value: `${fmt(results.a_cond, 2)} × ${fmt(results.b_cond, 2)}`, unit: 'mm'    },
              { label: 'Section conducteur',        symbol: 'S_c',      value: fmt(results.Sc, 2),                                      unit: 'mm²'   },
              { label: 'Densité de courant',        symbol: 'Δ_c',      value: fmt(results.DeltaC, 2),                                  unit: 'A/mm²' },
              { label: 'Longueur phase',            symbol: 'L_c',      value: fmt(results.Lc, 2),                                      unit: 'm'     },
              { label: 'Résistance phase (75°C)',   symbol: 'R_{a75}',  value: fmt(results.Ra75, 4),                                    unit: 'Ω'     },
              { label: 'Résistance par unité',      symbol: 'R_{a75}*', value: fmt(results.Ra75pu, 4),                                  unit: 'p.u.'  },
              { label: 'Poids total cuivre stator', symbol: 'G_M',      value: fmt(results.Gm, 1),                                      unit: 'kg'    },
            ]}
          />

        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Rappel des équations utilisées pour l'Étape 4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="Nombre total d'encoches">
              <span className="italic font-semibold mr-2">Z<sub>1</sub></span>
              <span className="mr-2">=</span>
              <span>2p {sym.dot} m {sym.dot} q<sub>1</sub></span>
            </Formula>

            <Formula label="Pas dentaire">
              <span className="italic font-semibold mr-2">t<sub>1</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>{sym.pi} {sym.dot} D</span>} den={<span>Z<sub>1</sub></span>} />
            </Formula>

            <Formula label="Conducteurs par encoche">
              <span className="italic font-semibold mr-2">up<sub>1</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>A {sym.dot} t<sub>1</sub></span>} den={<span>I<sub>n</sub></span>} />
            </Formula>

            <Formula label="Spires par phase">
              <span className="italic font-semibold mr-2">w<sub>1</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>p {sym.dot} q<sub>1</sub> {sym.dot} up<sub>1</sub></span>} den="a" />
            </Formula>

            <Formula label="Pas & Facteur d'enroulement">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">Y</span>
                  {sym.approx}
                  <span>0.778 {sym.dot} {sym.tau}<sub>slots</sub></span>
                </div>
                <div>
                  <span className="italic font-semibold mr-2">K<sub>w1</sub></span>
                  <span className="mr-2">=</span>
                  <span>K<sub>d</sub> {sym.dot} K<sub>p</sub></span>
                </div>
              </div>
            </Formula>

            <Formula label="Flux magnétique à vide (Φ₀)">
              <span className="italic font-semibold mr-2">{sym.phi}<sub>0</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>U<sub>ph</sub> {sym.dot} 10<sup>8</sup></span>}
                den={<span>4 {sym.dot} K<sub>B</sub> {sym.dot} f {sym.dot} w<sub>1</sub> {sym.dot} K<sub>w1</sub></span>}
              />
            </Formula>

            <Formula label="Flux en charge (Φch)">
              <span className="italic font-semibold mr-2">{sym.phi}<sub>ch</sub></span>
              <span className="mr-2">=</span>
              <span>1.08 {sym.dot} {sym.phi}<sub>0</sub></span>
            </Formula>

            <Formula label="Induction dans l'entrefer à vide (Bδ0)">
              <span className="italic font-semibold mr-2">B<sub>{sym.delta}0</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>{sym.phi}<sub>0</sub></span>}
                den={<span>{sym.alpha}<sub>{sym.delta}</sub> {sym.dot} {sym.tau} {sym.dot} l<sub>{sym.delta},fin</sub></span>}
              />
            </Formula>

            <Formula label="Induction nominale en charge (BδN)">
              <span className="italic font-semibold mr-2">B<sub>{sym.delta}N</sub></span>
              <span className="mr-2">=</span>
              <span>1.08 {sym.dot} B<sub>{sym.delta}0</sub></span>
            </Formula>

            <Formula label="Géométrie de la dent">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">b<sub>e</sub></span>
                  <span className="mr-2">=</span>
                  <span>0.5 {sym.dot} t<sub>1</sub> {sym.dot} 10</span>
                </div>
                <div>
                  <span className="italic font-semibold mr-2">b<sub>d1</sub></span>
                  <span className="mr-2">=</span>
                  <span>t<sub>1</sub> − (b<sub>e</sub> / 10)</span>
                </div>
              </div>
            </Formula>

            <Formula label="Hauteur de la culasse">
              <span className="italic font-semibold mr-2">h<sub>c</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>D<sub>a</sub> − D</span>} den="2" />
              <span className="mx-2">−</span>
              <Frac num={<span>h<sub>e</sub></span>} den="10" />
            </Formula>

            <Formula label="Induction dentaire en charge">
              <span className="italic font-semibold mr-2">B<sub>d1</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>B<sub>{sym.delta}N</sub> {sym.dot} t<sub>1</sub> {sym.dot} l<sub>{sym.delta},fin</sub></span>}
                den={<span>b<sub>d1</sub> {sym.dot} l {sym.dot} K<sub>f</sub></span>}
              />
            </Formula>

            <Formula label="Induction dans la culasse">
              <span className="italic font-semibold mr-2">B<sub>c</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>{sym.phi}<sub>ch</sub></span>}
                den={<span>2 {sym.dot} h<sub>c</sub> {sym.dot} l {sym.dot} K<sub>f</sub></span>}
              />
            </Formula>

            <Formula label="Densité de courant">
              <span className="italic font-semibold mr-2">Δ<sub>c</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>I<sub>n</sub></span>} den={<span>S<sub>c</sub></span>} />
            </Formula>

            <Formula label="Résistance de phase (à 75°C)">
              <span className="italic font-semibold mr-2">R<sub>a75</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>1</span>} den={<span>46</span>} />
              <span className="mx-2">{sym.dot}</span>
              <Frac num={<span>L<sub>c</sub></span>} den={<span>S<sub>c</sub></span>} />
            </Formula>

            <Formula label="Résistance en Per Unit (R*a75)">
              <span className="italic font-semibold mr-2">R<sub>a75</sub><sup>*</sup></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>I<sub>n</sub> {sym.dot} R<sub>a75</sub></span>}
                den={<span>U<sub>ph</sub></span>}
              />
            </Formula>

            <Formula label="Poids total du Cuivre (Stator)">
              <span className="italic font-semibold mr-2">G<sub>M</sub></span>
              <span className="mr-2">=</span>
              <span>8.9 {sym.dot} m {sym.dot} L<sub>c</sub> {sym.dot} S<sub>c</sub> {sym.dot} 10<sup>−3</sup></span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
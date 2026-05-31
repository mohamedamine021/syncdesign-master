import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES GLOBALES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 13;

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
  dot: <span className="mx-0.5">·</span>,
  prime: <span className="mx-0.5">'</span>,
  epsilon: <span className="mx-0.5 italic">ε</span>,
  phi: <span className="mx-0.5 italic">φ</span>,
  cos: <span className="mr-1">cos</span>,
};

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

          {/* Badge numéro */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-2xl tracking-tight">{CURRENT_STEP}</span>
          </div>

          {/* Textes */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight truncate">
              Stabilité et Surcharge Statique
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Évaluation de la capacité de la machine à maintenir le synchronisme lors d'une augmentation de puissance
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">⚖️</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              STAB
            </span>
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
                const isDone = step < CURRENT_STEP;
                const isCurrent = step === CURRENT_STEP;

                return (
                  <div
                    key={step}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / TOTAL_STEPS}%` }}
                  >
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

                    {/* Numéro sous la pastille — étapes clés seulement */}
                    {(step === 1 ||
                      step === CURRENT_STEP ||
                      step === TOTAL_STEPS ||
                      step % 7 === 0) && (
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
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
          { label: 'Surcharge statique',     color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Saillance rotorique',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Tension fictive',        color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Synchronisme',           color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Stabilité',              color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
// SÉPARATEUR DE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SectionSeparator({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-3 text-center">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 13
// ─────────────────────────────────────────────────────────────────────────────
export default function Step13() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(CURRENT_STEP);
    }
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) {
      return null;
    }

    try {
      // Step 7
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      noLoadData.Phi_0 = stator.Phi0;
      if (noLoadData.F_deltadc_A === undefined)
        noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;

      // Step 8
      const reactancesData = reactances || CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);
      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1,
        xq: reactancesData.xq || 1.0,
        r_a: stator.Ra75pu || 0.02,
      };

      // Step 9
      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );
      const safeReaction = {
        coefficients: blondelData.coefficients || blondelData.coeffs,
        F_a: blondelData.F_a || 0,
      };

      // Step 10
      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );

      // Step 11
      const dynParams = CalculationEngine.calcMachineParameters(
        nominal, airGap, noLoadData, safeReactances, safeReaction, excitationData,
        mainDimensions.l1, 1.095, inputs.f
      );

      // Step 12
      const shortCircuitData = CalculationEngine.calcShortCircuitCurrents(
        nominal, dynParams, blondelData, 1.08
      );

      // Step 13 : Surcharge Statique
      const overloadData = CalculationEngine.calcStaticOverload(
        inputs.cosPhi || 0.8,
        dynParams,
        blondelData,
        shortCircuitData
      );

      return { dynParams, shortCircuitData, overloadData };

    } catch (error) {
      console.error("Erreur lors du calcul de la surcharge statique :", error);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances]);

  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur : données manquantes ───────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Stabilité et Surcharge Statique">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour les calculs de stabilité.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Vérifiez que toutes les étapes précédentes sont complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { dynParams, shortCircuitData, overloadData } = results;
  const isStable = overloadData.static_overload_S >= 1.5;

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Stabilité et Surcharge Statique"
      description="Évaluation de la capacité de la machine à maintenir le synchronisme lors d'une augmentation de puissance"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. BANDEAU TITRE                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <StepBanner />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. SÉPARATEUR                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SectionSeparator>
        Résultats numériques &amp; formules
      </SectionSeparator>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. RÉSULTATS ET FORMULES                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE GAUCHE : CARTES KPI ET TABLEAUX                         */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Capacité Surcharge (S)
              </p>
              <p className="text-3xl font-bold font-mono text-primary">
                {fmt(overloadData.static_overload_S, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">p.u.</span>
              </p>
            </div>

            <div
              className={`rounded-lg border p-4 text-center shadow-sm ${
                isStable
                  ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
                  : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
              }`}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Statut Stabilité
              </p>
              <p
                className={`text-xl font-bold font-mono mt-1 ${
                  isStable
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {isStable ? 'STABLE ✅' : 'RISQUÉ ⚠️'}
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Coeff. Saillance (ε)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(overloadData.epsilon, 3)}
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Tension Fictive (E₀₀')
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(overloadData.E00_prime_star, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">p.u.</span>
              </p>
            </div>
          </div>

          <ResultTable
            title="Paramètres Déterminants"
            rows={[
              { label: 'Réactance synchrone directe',     symbol: 'x_d',     value: fmt(dynParams.reactances_pu.x_d, 3),        unit: 'p.u.' },
              { label: 'Réactance synchrone transversale', symbol: 'x_q',    value: fmt(dynParams.reactances_pu.x_q, 3),        unit: 'p.u.' },
              { label: 'Courant de CC en charge',          symbol: 'I_{ccn}', value: fmt(shortCircuitData.results_pu.I_ccn, 3), unit: 'p.u.' },
              { label: 'Facteur de puissance nominal',     symbol: 'cos(φ)',  value: fmt(inputs?.cosPhi, 2),                    unit: '' },
            ]}
          />

          <ResultTable
            title="Résultats de Stabilité Statique"
            rows={[
              { label: 'Tension interne fictive',   symbol: "E'₀₀*", value: fmt(overloadData.E00_prime_star, 2), unit: 'p.u.' },
              { label: 'Coefficient de saillance',  symbol: 'ε',      value: fmt(overloadData.epsilon, 3),        unit: '' },
              { label: 'Facteur de correction',     symbol: 'k',      value: fmt(overloadData.k_factor, 3),       unit: '' },
              { label: 'Surcharge statique limite', symbol: 'S',      value: fmt(overloadData.static_overload_S, 2), unit: 'p.u.' },
            ]}
          />

          {/* Critères d'ingénierie */}
          <div className="rounded-lg border border-border p-5 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Marge de Sécurité Industrielle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Moteur Synchrone</p>
                <p className="text-sm text-foreground font-mono font-bold">S ≥ 1.5</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Turbo-Alternateur</p>
                <p className="text-sm text-foreground font-mono font-bold">S ≥ 1.8 à 2.2</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              * Une valeur S = {fmt(overloadData.static_overload_S, 2)} signifie que la machine peut
              fournir {fmt(overloadData.static_overload_S * 100, 0)}% de sa puissance nominale avant
              de "décrocher" (perdre le synchronisme).
            </p>
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE DROITE : FORMULES                                       */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Limite de stabilité statique</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="1. Tension interne fictive">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex items-center">
                  <span className="italic font-semibold mr-2">
                    E<sub>00</sub>{sym.prime}*
                  </span>
                  <span className="mr-2">=</span>
                  <span>
                    E<sub>0</sub>{sym.prime}* {sym.dot} I<sub>Bn</sub>*
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                  Note :{' '}
                  <span className="italic font-semibold mx-1">I<sub>Bn</sub>*</span> ={' '}
                  <span className="italic font-semibold mx-1">F<sub>Bn</sub>*</span>{' '}
                  <span className="opacity-80">(obtenu par le Diagramme de Blondel)</span>
                </div>
              </div>
            </Formula>

            <Formula label="2. Coefficient de saillance (Polarité)">
              <div className="flex items-center">
                <span className="italic font-semibold mr-2">{sym.epsilon}</span>
                <span className="mr-2">=</span>
                <Frac
                  num={<span>x<sub>d</sub> - x<sub>q</sub></span>}
                  den={<span>E<sub>00</sub>{sym.prime}* {sym.dot} x<sub>q</sub></span>}
                />
              </div>
            </Formula>

            <Formula label="3. Facteur de correction de forme">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex items-center">
                  <span className="italic font-semibold mr-2">k</span>
                  <span className="mr-2">=</span>
                  <span className="whitespace-nowrap">
                    1 + 0.11 {sym.dot} {sym.epsilon}
                  </span>
                </div>
                <div className="w-full text-center mt-2 opacity-60 text-xs">
                  (Approximation linéaire de la courbe de puissance)
                </div>
              </div>
            </Formula>

            <Formula label="4. Surcharge Statique Maximale">
              <div className="flex items-center">
                <span className="italic font-semibold mr-2 text-lg">S</span>
                <span className="mr-2 text-lg">=</span>
                <Frac
                  num={<span>I<sub>ccn</sub></span>}
                  den={<span>{sym.cos}({sym.phi})</span>}
                />
                <span className="ml-2 whitespace-nowrap">{sym.dot} k</span>
              </div>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
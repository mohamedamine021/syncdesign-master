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
const CURRENT_STEP = 12;

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
              Courants de Court-Circuit
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Évaluation de l'intensité des courants de défaut statorique en régime permanent
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">⚡</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              CC
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
          { label: 'Court-circuit permanent', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Exc. à vide',              color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Exc. nominale',           color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Sévérité',                color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Sécurité',               color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
// COMPOSANT PRINCIPAL : STEP 12
// ─────────────────────────────────────────────────────────────────────────────
export default function Step12() {
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
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      noLoadData.Phi_0 = stator.Phi0; 
      if (noLoadData.F_deltadc_A === undefined) noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;

      const reactancesData = reactances || CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);
      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1,
        xq: reactancesData.xq || 1.0,
        r_a: stator.Ra75pu || 0.02
      };

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );
      const safeReaction = {
        coefficients: blondelData.coefficients || blondelData.coeffs,
        F_a: blondelData.F_a || 0
      };

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );

      const dynParams = CalculationEngine.calcMachineParameters(
        nominal, airGap, noLoadData, safeReactances, safeReaction, excitationData,
        mainDimensions.l1, 1.095, inputs.f
      );

      const E0_prime_star_default = 1.08;
      const shortCircuitData = CalculationEngine.calcShortCircuitCurrents(
        nominal, 
        dynParams, 
        blondelData, 
        E0_prime_star_default
      );

      return shortCircuitData;

    } catch (error) {
      console.error("Erreur lors du calcul des courants de court-circuit :", error);
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
      <StepLayout stepNumber={CURRENT_STEP} title="Courants de Court-Circuit">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour les calculs de court-circuit.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Vérifiez que toutes les étapes précédentes (en particulier les Étapes 9 et 11) sont complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { inputs: scInputs, results_pu, results_real } = results;
  const severityRatio = results_real.I_ccn_A / (nominal?.In || 1);

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Courants de Court-Circuit"
      description="Évaluation de l'intensité des courants de défaut statorique en régime permanent"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. BANDEAU TITRE EN FRANÇAIS                                       */}
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
        {/* COLONNE GAUCHE : CARTES KPI ET TABLEAU                          */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                CC Nominal (p.u.)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results_pu.I_ccn, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">p.u.</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                CC Nominal (Ampères)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results_real.I_ccn_A, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">A</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Ratio de Sévérité
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(severityRatio, 1)}
                <span className="text-sm font-normal text-muted-foreground"> × I<sub>n</sub></span>
              </p>
            </div>

            <div
              className={`rounded-lg border p-4 text-center shadow-sm ${
                severityRatio > 2
                  ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
                  : 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
              }`}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Statut de sécurité
              </p>
              <p
                className={`text-sm font-bold font-mono mt-2 ${
                  severityRatio > 2
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-green-700 dark:text-green-400'
                }`}
              >
                {severityRatio > 2 ? 'DÉFAUT ÉLEVÉ ⚠️' : 'DÉFAUT MODÉRÉ ✅'}
              </p>
            </div>
          </div>

          <ResultTable
            title="Paramètres d'Entrée du Court-Circuit"
            rows={[
              { label: "Tension induite interne à vide", symbol: "E'₀*", value: fmt(scInputs.E0_prime_star, 2), unit: 'p.u.' },
              { label: 'Réactance synchrone directe',    symbol: 'x_d',     value: fmt(scInputs.x_d_pu, 3),        unit: 'p.u.' },
              { label: "Courant d'excitation nominal",  symbol: 'I_{Bn}*', value: fmt(scInputs.F_Bn_star_pu, 3),  unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Résultats en Régime Permanent"
            rows={[
              { label: 'Courant CC (excitation à vide)',    symbol: 'I_{cc0}', value: fmt(results_pu.I_cc0, 3), unit: 'p.u.' },
              { label: 'Courant CC (excitation nominale)',  symbol: 'I_{ccn}', value: fmt(results_pu.I_ccn, 3), unit: 'p.u.' },
              { label: 'Courant nominal statorique',        symbol: 'I_n',     value: fmt(nominal?.In, 0),      unit: 'A' },
              { label: 'Courant de défaut absolu',          symbol: 'I_{ccn}', value: fmt(results_real.I_ccn_A, 0), unit: 'A' },
            ]}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE DROITE : FORMULES                                       */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>
              Rapport de court-circuit en régime permanent
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="1. Courant de CC (Excitation à vide)">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex items-center">
                  <span className="italic font-semibold mr-2">I<sub>cc0</sub></span>
                  <span className="mr-2">=</span>
                  <Frac
                    num={<span>E{sym.prime}<sub>0</sub>*</span>}
                    den={<span>x<sub>d</sub></span>}
                  />
                </div>
                <div className="text-xs opacity-60">
                  (Toutes les valeurs sont en p.u.)
                </div>
              </div>
            </Formula>

            <Formula label="2. Courant de CC (Excitation nominale)">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex items-center">
                  <span className="italic font-semibold mr-2">I<sub>ccn</sub></span>
                  <span className="mr-2">=</span>
                  <span>I<sub>cc0</sub> {sym.dot} I<sub>Bn</sub>*</span>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                  Note : <span className="italic font-semibold mx-1">I<sub>Bn</sub>*</span> ={' '}
                  <span className="italic font-semibold mx-1">F<sub>Bn</sub>*</span>{' '}
                  <span className="opacity-80">(Calculé à l'Étape 9 via Blondel)</span>
                </div>
              </div>
            </Formula>

            <Formula label="3. Courant de défaut Absolu">
              <div className="flex items-center">
                <span className="italic font-semibold mr-2">I<sub>ccn</sub> (Ampères)</span>
                <span className="mr-2">=</span>
                <span>I<sub>ccn</sub> (p.u.) {sym.dot} I<sub>n</sub></span>
              </div>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
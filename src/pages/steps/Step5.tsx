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
const CURRENT_STEP = 5;

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
  delta: <span className="mx-0.5 italic">δ</span>,
  gamma: <span className="mx-0.5 italic">γ</span>,
  tau: <span className="mx-0.5 italic">τ</span>,
  approx: <span className="mx-1">≈</span>,
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
              Entrefer et Coefficient de Carter
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Calcul détaillé de l'entrefer mécanique et du coefficient correcteur de Carter
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">↔</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              Entrefer
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
          { label: 'Entrefer mécanique',   color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'    },
          { label: 'Coefficient Carter',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Ouverture encoche',    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'    },
          { label: 'Réluctance',           color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'       },
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
// COMPOSANT PRINCIPAL : STEP 5
// ─────────────────────────────────────────────────────────────────────────────
export default function Step5() {
  const { mainDimensions, stator, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(CURRENT_STEP);
    }
  }, [setCurrentStep]);

  // Calcul de l'entrefer
  const results = useMemo(() => {
    if (
      !mainDimensions || !mainDimensions.A || !mainDimensions.tau ||
      !stator || !stator.Bd0 || !stator.be || !stator.t1
    ) {
      return null;
    }

    try {
      const engine = CalculationEngine.calcAirGap(mainDimensions, stator);

      const xd_star    = 1.35;
      const xSigma_star = 0.1;
      const Kprime     = 1.06;

      const delta_calc  = (0.36 * mainDimensions.A * mainDimensions.tau) /
                          (Kprime * (xd_star - xSigma_star) * stator.Bd0);
      const b0          = stator.be / 10;
      const ratio       = b0 / engine.delta;
      const gamma       = Math.pow(ratio, 2) / (5 + ratio);
      const Kdelta_calc = stator.t1 / (stator.t1 - gamma * engine.delta);

      return {
        delta:        engine.delta,
        Kdelta:       engine.Kdelta,
        delta_calc,
        b0,
        ratio,
        gamma,
        Kdelta_calc,
        xd_star,
        xSigma_star,
        Kprime,
      };
    } catch (error) {
      console.error("Erreur lors du calcul de l'entrefer :", error);
      return null;
    }
  }, [mainDimensions, stator]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur : données manquantes ───────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Entrefer et Coefficient de Carter">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour le calcul de l'entrefer.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que l'Étape 3 (Dimensions principales) et l'Étape 4 (Stator) ont été validées.
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
            <div className="rounded-lg border border-border p-5 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                Entrefer Arrondi (δ)
              </p>
              <p className="text-3xl font-bold font-mono text-primary">
                {fmt(results.delta, 2)}{' '}
                <span className="text-base font-normal text-muted-foreground">cm</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-5 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                Coefficient Carter (Kδ)
              </p>
              <p className="text-3xl font-bold font-mono text-primary">
                {fmt(results.Kdelta, 3)}
              </p>
            </div>
          </div>

          {/* Tableau des résultats */}
          <ResultTable
            title="Détails des paramètres calculés"
            rows={[
              { label: 'Entrefer théorique',           symbol: 'δ_calc',      value: fmt(results.delta_calc, 4), unit: 'cm' },
              { label: 'Entrefer adopté (arrondi)',    symbol: 'δ',           value: fmt(results.delta, 2),      unit: 'cm' },
              { label: "Ouverture d'encoche",          symbol: 'b_0',         value: fmt(results.b0, 2),         unit: 'cm' },
              { label: 'Ratio ouverture / entrefer',   symbol: 'b_0/δ',       value: fmt(results.ratio, 3),      unit: '' },
              { label: 'Coefficient géométrique',      symbol: 'γ',           value: fmt(results.gamma, 4),      unit: '' },
              { label: 'Coefficient Carter théorique', symbol: 'K_{δ,calc}',  value: fmt(results.Kdelta_calc, 4), unit: '' },
              { label: 'Coefficient Carter final',     symbol: 'K_δ',         value: fmt(results.Kdelta, 3),     unit: '' },
            ]}
          />

          {/* Informations sur les constantes de conception */}
          <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 text-sm">
            <p className="font-bold text-blue-800 dark:text-blue-300 mb-2">
              Constantes d'entrée utilisées :
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400 font-mono">
              <li>
                x<sub>d</sub>* = {results.xd_star}
              </li>
              <li>
                x<sub>σ</sub>* = {results.xSigma_star}
              </li>
              <li>K' = {results.Kprime}</li>
            </ul>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE DROITE : FORMULES                                       */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>
              Équations exhaustives utilisées pour l'Étape 5
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="1. Entrefer Théorique">
              <span className="italic font-semibold mr-2">
                {sym.delta}<sub>calc</sub>
              </span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>0.36 {sym.dot} A {sym.dot} {sym.tau}</span>}
                den={
                  <span>
                    K' {sym.dot} (x*<sub>d</sub> - x*<sub>σ</sub>) {sym.dot} B<sub>δ0</sub>
                  </span>
                }
              />
            </Formula>

            <Formula label="2. Entrefer Adopté (Arrondi au 0.05)">
              <span className="italic font-semibold mr-2">{sym.delta}</span>
              {sym.approx}
              <span>{sym.delta}<sub>calc</sub></span>
            </Formula>

            <Formula label="3. Ouverture d'Encoche">
              <span className="italic font-semibold mr-2">b<sub>0</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>b<sub>e</sub></span>}
                den="10"
              />
            </Formula>

            <Formula label="4. Ratio d'Ouverture d'Encoche">
              <span className="italic font-semibold mr-2">ratio</span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>b<sub>0</sub></span>}
                den={sym.delta}
              />
            </Formula>

            <Formula label="5. Coefficient Géométrique (γ)">
              <span className="italic font-semibold mr-2">{sym.gamma}</span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>(ratio)²</span>}
                den={<span>5 + ratio</span>}
              />
            </Formula>

            <Formula label="6. Coefficient de Carter Théorique">
              <span className="italic font-semibold mr-2">K<sub>{sym.delta},calc</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>t<sub>1</sub></span>}
                den={
                  <span>
                    t<sub>1</sub> - {sym.gamma} {sym.dot} {sym.delta}
                  </span>
                }
              />
            </Formula>

            <Formula label="7. Coefficient de Carter Final (Arrondi)">
              <span className="italic font-semibold mr-2">K<sub>{sym.delta}</sub></span>
              {sym.approx}
              <span>K<sub>{sym.delta},calc</sub></span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
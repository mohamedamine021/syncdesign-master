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
const CURRENT_STEP = 8;

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
  sigma: <span className="mx-0.5 italic">σ</span>,
  lambda: <span className="mx-0.5 italic">λ</span>,
  beta: <span className="mx-0.5 italic">β</span>,
  tau: <span className="mx-0.5 italic">τ</span>,
  rho: <span className="mx-0.5 italic">ρ</span>,
  sum: <span className="mx-0.5">Σ</span>,
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
              Réactance de Fuite Statorique
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Calcul des coefficients de perméance de fuite et de la réactance de dispersion Xσ
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">X</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              Fuite
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
          { label: 'Perméance encoche',  color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'     },
          { label: 'Fuite différentielle', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Têtes de bobines',    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'      },
          { label: 'Réactance Xσ',        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'         },
          { label: 'Constantes temps',    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'            },
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
// COMPOSANT PRINCIPAL : STEP 8
// ─────────────────────────────────────────────────────────────────────────────
export default function Step8() {
  const { inputs, nominal, stator, airGap, mainDimensions, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(CURRENT_STEP);
    }
  }, [setCurrentStep]);

  // Calcul des réactances de fuite
  const results = useMemo(() => {
    if (!inputs || !nominal || !stator || !airGap || !mainDimensions) {
      return null;
    }
    try {
      const engineResults = CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      const he_mm = stator.he || 68;
      const be_mm = stator.be || 15.2;

      const slotGeometry = {
        h1:      he_mm * 0.79,
        ha:      he_mm * 0.13,
        be:      be_mm,
        h2_prime: he_mm * 0.14,
        h4:      he_mm * 0.13,
        bou:     be_mm,
      };

      return { ...engineResults, slotGeometry };
    } catch (error) {
      console.error("Erreur lors du calcul des réactances de fuite :", error);
      return null;
    }
  }, [inputs, nominal, stator, airGap, mainDimensions]);

  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur : données manquantes ───────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Réactance de Fuite Statorique">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour le calcul des réactances.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que toutes les étapes précédentes (1 à 7) ont bien été complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Réactance de Fuite Statorique"
      description="Calcul exhaustif des coefficients de perméance de fuite et de la réactance de dispersion statorique (Xσ)"
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
                Réactance Dispersion
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.x_sigma_pu, 3)}{' '}
                <span className="text-sm font-normal text-muted-foreground">p.u.</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Réactance Ohmique
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.x_sigma_ohm, 3)}{' '}
                <span className="text-sm font-normal text-muted-foreground">Ω</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Somme Perméances (Σλ)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.sum_lambda, 3)}
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Constante Temps (Td₀)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.timeConstants_s.T_d0, 1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">s</span>
              </p>
            </div>
          </div>

          {/* Tableaux des résultats */}
          <ResultTable
            title="Coefficients de Perméance de Fuite (λ)"
            rows={[
              { label: "Fuite d'encoche",             symbol: 'λ_e1',  value: fmt(results.lambda_e1, 4),  unit: '' },
              { label: 'Fuite différentielle',         symbol: 'λ_di1', value: fmt(results.lambda_di1, 4), unit: '' },
              { label: 'Fuite des têtes de bobines',   symbol: 'λ_l1',  value: fmt(results.lambda_l1, 4),  unit: '' },
              { label: 'SOMME TOTALE DES FUITES',      symbol: 'Σλ',    value: fmt(results.sum_lambda, 4), unit: '' },
            ]}
          />

          <ResultTable
            title="Réactances de la Machine"
            rows={[
              { label: 'Réactance de dispersion statorique', symbol: 'X_σ',   value: fmt(results.x_sigma_ohm, 3), unit: 'Ω' },
              { label: 'Réactance de dispersion en p.u.',    symbol: 'X_σ*',  value: fmt(results.x_sigma_pu, 3),  unit: 'p.u.' },
              { label: "Réactance d'excitation",             symbol: 'X_B',   value: fmt(results.x_B, 3),         unit: 'p.u.' },
              { label: 'Réactance dispersion excitation',    symbol: 'X_Bσ',  value: fmt(results.x_Bsigma, 3),    unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Constantes de Temps Transitoires (Régime dynamique)"
            rows={[
              { label: "Constante d'ouverture à vide",        symbol: 'T_d0',  value: fmt(results.timeConstants_s.T_d0, 2),      unit: 's' },
              { label: 'Constante transitoire (court-circuit)',symbol: "T'_d",  value: fmt(results.timeConstants_s.T_d_prime, 2), unit: 's' },
              { label: "Constante d'amortissement",           symbol: 'T_a',   value: fmt(results.timeConstants_s.T_a, 2),       unit: 's' },
            ]}
          />

          {/* Bannière paramètres géométriques */}
          <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 text-sm">
            <p className="font-bold text-blue-800 dark:text-blue-300 mb-2">
              Paramètres géométriques d'encoche appliqués :
            </p>
            <ul className="grid grid-cols-2 gap-2 text-blue-700 dark:text-blue-400 font-mono text-xs">
              <li>h₁ = {fmt(results.slotGeometry.h1, 2)} mm</li>
              <li>h_a = {fmt(results.slotGeometry.ha, 2)} mm</li>
              <li>b_e = {fmt(results.slotGeometry.be, 2)} mm</li>
              <li>h'₂ = {fmt(results.slotGeometry.h2_prime, 2)} mm</li>
              <li>h₄ = {fmt(results.slotGeometry.h4, 2)} mm</li>
              <li>b_ou = {fmt(results.slotGeometry.bou, 2)} mm</li>
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
              Équations analytiques des fuites magnétiques (Fig 2.13, 2.14)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="1. Perméance de fuite d'encoche">
              <span className="italic font-semibold mr-2">{sym.lambda}<sub>e1</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>h<sub>1</sub> - h<sub>a</sub></span>}
                den={<span>3b<sub>e</sub></span>}
              />
              <span className="mx-1">{sym.dot} k<sub>{sym.beta}</sub> +</span>
              <Frac
                num={<span>h'<sub>2</sub></span>}
                den={<span>b<sub>e</sub></span>}
              />
              <span className="mx-1">{sym.dot} k'<sub>{sym.beta}</sub> +</span>
              <Frac
                num={<span>h<sub>4</sub></span>}
                den={<span>4b<sub>e</sub></span>}
              />
            </Formula>

            <Formula label="2. Perméance de fuite différentielle">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="flex items-center">
                  <span className="italic font-semibold mr-2">{sym.lambda}<sub>di1</sub></span>
                  <span className="mr-2">=</span>
                  <Frac
                    num={
                      <span>
                        0.9 {sym.dot} t<sub>1</sub> {sym.dot} (q<sub>1</sub> K<sub>w1</sub>)² {sym.dot} {sym.rho}<sub>d1</sub> {sym.dot} K<sub>ou</sub>
                      </span>
                    }
                    den={<span>{sym.delta} {sym.dot} K<sub>{sym.delta}</sub></span>}
                  />
                  <span className="ml-2">{sym.dot} {sym.sigma}<sub>d1</sub></span>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="italic font-semibold mr-2">K<sub>ou</sub></span>
                  <span className="mr-2">=</span>
                  <span>
                    1 - 0.033 (
                    <Frac
                      num={<span>b<sub>ou</sub></span>}
                      den={<span>t<sub>1</sub></span>}
                    />
                    )²
                  </span>
                </div>
              </div>
            </Formula>

            <Formula label="3. Perméance de fuite des têtes de bobines">
              <span className="italic font-semibold mr-2">{sym.lambda}<sub>l1</sub></span>
              <span className="mr-2">=</span>
              <span>0.34</span>
              <span className="mx-1">{sym.dot}</span>
              <Frac
                num={<span>q<sub>1</sub></span>}
                den={<span>l<sub>{sym.delta},fin</sub></span>}
              />
              <span className="mx-1">{sym.dot}</span>
              <span>
                (l<sub>l1</sub> - 0.64 {sym.beta}<sub>1</sub> {sym.tau})
              </span>
            </Formula>

            <Formula label="4. Somme des perméances">
              <span className="italic font-semibold mr-2">{sym.sum}{sym.lambda}</span>
              <span className="mr-2">=</span>
              <span>
                {sym.lambda}<sub>e1</sub> + {sym.lambda}<sub>di1</sub> + {sym.lambda}<sub>l1</sub> + {sym.lambda}<sub>k1</sub>
              </span>
            </Formula>

            <Formula label="5. Réactance de dispersion (Ω)">
              <span className="italic font-semibold mr-2">X<sub>{sym.sigma}</sub> (Ω)</span>
              <span className="mr-2">=</span>
              <span>0.158</span>
              <span className="mx-1">{sym.dot}</span>
              <Frac
                num={<span>f</span>}
                den="100"
              />
              <span className="mx-1">{sym.dot}</span>
              <span>
                (<Frac
                  num={<span>w<sub>1</sub></span>}
                  den="100"
                />
                )²
              </span>
              <span className="mx-1">{sym.dot}</span>
              <Frac
                num={<span>l<sub>{sym.delta},fin</sub></span>}
                den={<span>p {sym.dot} q<sub>1</sub></span>}
              />
              <span className="ml-2">{sym.dot} {sym.sum}{sym.lambda}</span>
            </Formula>

            <Formula label="6. Réactance de dispersion (p.u.)">
              <span className="italic font-semibold mr-2">X<sub>{sym.sigma}</sub>*</span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>I<sub>n</sub></span>}
                den={<span>U<sub>ph</sub></span>}
              />
              <span className="mx-2">{sym.dot}</span>
              <span>X<sub>{sym.sigma}</sub> (Ω)</span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
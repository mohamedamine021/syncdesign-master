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
const CURRENT_STEP = 10;

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
  phi: <span className="mx-0.5 italic">φ</span>,
  psi: <span className="mx-0.5 italic">ψ</span>,
  theta: <span className="mx-0.5 italic">Θ</span>,
  omega: <span className="mx-0.5 italic">ω</span>,
  tau: <span className="mx-0.5 italic">τ</span>,
  alpha: <span className="mx-0.5 italic">α</span>,
  rho: <span className="mx-0.5 italic">ρ</span>,
  pi: <span className="mx-0.5">π</span>,
  sqrt: (content: React.ReactNode) => (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">{content}</span>
    </span>
  ),
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
              Dimensionnement de la Bobine Rotor
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Calcul de l'espace interpolaire, modèle thermique et choix du fil de cuivre industriel
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">⏛</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              Bobine
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
          { label: 'Espace interpolaire', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Modèle thermique',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Fil de cuivre',       color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Spires rotor',        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Poids cuivre',        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
// COMPOSANT PRINCIPAL : STEP 10
// ─────────────────────────────────────────────────────────────────────────────
export default function Step10() {
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
      const reactancesData = reactances || CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);

      if (noLoadData.F_deltadc_A === undefined) {
        noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;
      }

      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1,
        xq: reactancesData.xq || 1.0,
      };

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );

      return excitationData;

    } catch (error) {
      console.error("Erreur lors du calcul du système d'excitation complet :", error);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // ── Erreur : données manquantes ───────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Dimensionnement de la Bobine Rotor">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour le dimensionnement de la bobine rotor.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vérifier que toutes les étapes précédentes (1 à 9) ont bien été complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Dimensionnement de la Bobine Rotor"
      description="Calcul de l'espace interpolaire, modèle thermique et choix du fil de cuivre industriel"
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
                Espace max. disponible
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.commercialWire.b_max_limit_mm, 1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">mm</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Densité Courant Adm.
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.thermal.delta_B_A_mm2, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">A/mm²</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Nombre de Spires
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.coilSizing.omega_B_turns, 0)}
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Poids Cuivre Total
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.coilSizing.weight_copper_kg, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">kg</span>
              </p>
            </div>
          </div>

          {/* Thermique */}
          <ResultTable
            title="Thermique et Limites Physiques"
            rows={[
              { label: 'Vitesse périphérique',           symbol: 'v_p',     value: fmt(results.thermal.v_p_ms, 1),                unit: 'm/s' },
              { label: "Coefficient d'échange",          symbol: 'α',       value: fmt(results.thermal.alpha_coeff, 4),           unit: 'W/m²°C' },
              { label: 'Coefficient de refroidissement', symbol: 'k',       value: fmt(results.thermal.k_coeff, 3),               unit: '' },
              { label: 'Largeur bobine maximum tolérée', symbol: 'b_{max}', value: fmt(results.commercialWire.b_max_limit_mm, 2), unit: 'mm' },
            ]}
          />

          {/* Fil commercial */}
          <ResultTable
            title="Choix Industriel du Conducteur"
            rows={[
              { label: 'Section standardisée choisie',    symbol: 'S_B',           value: fmt(results.commercialWire.section_mm2, 2),     unit: 'mm²' },
              { label: 'Largeur du conducteur nu',         symbol: 'b_{std}',       value: fmt(results.commercialWire.b_standard_mm, 2),   unit: 'mm' },
              { label: 'Hauteur du conducteur nu',         symbol: 'a_{std}',       value: fmt(results.commercialWire.a_standard_mm, 2),   unit: 'mm' },
              { label: 'Longueur moyenne spire',           symbol: 'L_{B,moy}',     value: fmt(results.coilSizing.L_Bmoy_cm, 2),           unit: 'cm' },
              { label: 'Hauteur de la bobine',             symbol: 'h_{bobine}',    value: fmt(results.coilSizing.h_bobine_cm, 2),         unit: 'cm' },
              { label: 'Hauteur noyau polaire nécessaire', symbol: 'h_{M,pôle}',   value: fmt(results.coilSizing.h_M_pole_cm, 2),         unit: 'cm' },
              { label: 'Ratio poids cuivre / kVA',         symbol: 'G_B / kVA',    value: fmt(results.coilSizing.weight_per_kVA, 3),      unit: 'kg/kVA' },
            ]}
          />

          {/* Performances électriques */}
          <ResultTable
            title="Performances Électriques"
            rows={[
              { label: "Courant d'excitation nominal", symbol: 'I_B',       value: fmt(results.electricalSpecs.I_B_Nominal_A, 0), unit: 'A' },
              { label: "Courant d'excitation maximum", symbol: 'I_{B,max}', value: fmt(results.electricalSpecs.I_B_Max_A, 0),     unit: 'A' },
              { label: 'Résistance à 75°C',            symbol: 'R_{B75}',   value: fmt(results.electricalSpecs.R_B_75_Ohm, 3),   unit: 'Ω' },
              { label: 'Résistance à 120°C',           symbol: 'R_{B120}',  value: fmt(results.electricalSpecs.R_B_120_Ohm, 3),  unit: 'Ω' },
              { label: 'Coefficient de disponibilité', symbol: 'k_{dispo}', value: fmt(results.electricalSpecs.k_dispo, 2),       unit: '' },
              { label: "Puissance d'excitation (Max)", symbol: 'P_{Bn}',    value: fmt(results.electricalSpecs.P_Excitation_kW, 1), unit: 'kW' },
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
              Dimensionnement par contrainte d'espace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="1. Espace Interpolaire (Pas)">
              <span className="italic font-semibold mr-2">t<sub>p</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={
                  <span>
                    {sym.pi} {sym.dot} (D - 2{sym.delta} - 2h<sub>p</sub> - 2h<sub>M</sub>)
                  </span>
                }
                den={<span>2p</span>}
              />
            </Formula>

            <Formula label="2. Largeur max bobine">
              <span className="italic font-semibold mr-2">b<sub>max</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={
                  <span>
                    t<sub>p</sub> - b<sub>M</sub> - 2{sym.delta}<sub>isol</sub> - x
                  </span>
                }
                den="2"
              />
            </Formula>

            <Formula label="3. Modèle de Refroidissement">
              <span className="italic font-semibold mr-2">{sym.alpha}</span>
              <span className="mr-2">=</span>
              <Frac num="0.06" den={<span>1 + 0.1 {sym.dot} v<sub>p</sub></span>} />
              <span className="mx-2 text-xs opacity-60">(auto-ventilé)</span>
            </Formula>

            <Formula label="4. Densité de Courant Admissible">
              <span className="italic font-semibold mr-2">{sym.delta}<sub>B,adm</sub></span>
              <span className="mr-2">=</span>
              <span>
                20 {sym.dot}{' '}
                {sym.sqrt(
                  <Frac
                    num={
                      <span>
                        {sym.theta}<sub>B,adm</sub> {sym.dot} {sym.alpha} {sym.dot} k
                      </span>
                    }
                    den={<span>b<sub>max</sub></span>}
                  />
                )}
              </span>
            </Formula>

            <Formula label="5. Spires par pôle">
              <span className="italic font-semibold mr-2">{sym.omega}<sub>B</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>F<sub>Bn</sub> (Blondel)</span>}
                den={<span>2 {sym.dot} I<sub>B</sub></span>}
              />
            </Formula>

            <Formula label="6. Résistance de Phase à 75°C">
              <span className="italic font-semibold mr-2">R<sub>B75</sub></span>
              <span className="mr-2">=</span>
              <span>{sym.rho}<sub>75</sub></span>
              <span className="mx-1">{sym.dot}</span>
              <Frac
                num={
                  <span>
                    2p {sym.dot} {sym.omega}<sub>B</sub> {sym.dot} L<sub>B,moy</sub>
                  </span>
                }
                den={<span>S<sub>B</sub></span>}
              />
            </Formula>

            <Formula label="7. Poids du Cuivre Rotorique">
              <span className="italic font-semibold mr-2">G<sub>B</sub></span>
              <span className="mr-2">=</span>
              <span>
                8.9 {sym.dot} (2p) {sym.dot} {sym.omega}<sub>B</sub> {sym.dot} L<sub>B,moy</sub> {sym.dot} S<sub>B</sub> {sym.dot} 10<sup>-3</sup>
              </span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
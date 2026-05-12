import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalculationEngine } from '@/engine/CalculationEngine';

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
  dot:   <span className="mx-0.5">·</span>,
  pi:    <span className="mx-0.5">π</span>,
  delta: <span className="mx-0.5 italic">δ</span>,
  sigma: <span className="mx-0.5 italic">σ</span>,
  phi:   <span className="mx-0.5 italic">φ</span>,
  psi:   <span className="mx-0.5 italic">ψ</span>,
  theta: <span className="mx-0.5 italic">Θ</span>,
  omega: <span className="mx-0.5 italic">ω</span>,
  alpha: <span className="mx-0.5 italic">α</span>,
  tau:   <span className="mx-0.5 italic">τ</span>,
  cos:   <span className="mr-1">cos</span>,
  sin:   <span className="mr-1">sin</span>,
  tan:   <span className="mr-1">tan</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 9
// ─────────────────────────────────────────────────────────────────────────────
export default function Step9() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(9);
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

      let xSigma_val = reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1;
      let xq_estim = 1.0;

      if (reactancesData.xq) {
        xq_estim = reactancesData.xq;
      } else {
        const F_a_temp = 2.7 * stator.w1 * (stator.Kw1 / nominal.p) * nominal.In;
        const k_delta_avg = (1 + airGap.Kdelta) / 2;
        const k_aq_estim = 0.475;
        const x_aq_temp = (k_aq_estim * F_a_temp) / (noLoadData.F_delta * k_delta_avg);
        xq_estim = xSigma_val + x_aq_temp;
      }

      const safeReactances = { xSigma: xSigma_val, xq: xq_estim };
      const delta_M   = airGap.delta * 1.5;
      const alpha_p   = mainDimensions.alphap || 0.73;
      const powerFactor = inputs.cosPhi || 0.8;

      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions,
        noLoadData, safeReactances, delta_M, alpha_p, powerFactor
      );

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );

      // Calcul thermique réel
      const actualDeltaB  = excitationData.electricalSpecs.I_B_Nominal_A / excitationData.commercialWire.section_mm2;
      const b_max_mm      = excitationData.commercialWire.b_max_limit_mm;
      const alpha_coeff   = excitationData.thermal.alpha_coeff;
      const k_coeff       = excitationData.thermal.k_coeff;
      const deltaTemp     = Math.pow(actualDeltaB / 20, 2) * (b_max_mm / (alpha_coeff * k_coeff));
      const exactThetaB   = 20 + deltaTemp;

      return { blondel: blondelData, excitation: excitationData, actualDeltaB, exactThetaB };

    } catch (error) {
      console.error("Erreur lors du calcul de l'excitation :", error);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances]);

  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  if (!results) {
    return (
      <StepLayout stepNumber={9} title="Step 9 : Système d'excitation">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres manquants pour le diagramme de Blondel.</p>
          <p className="text-destructive/80 text-sm mt-2">Vérifiez que les dimensions et la caractéristique à vide sont calculées.</p>
        </div>
      </StepLayout>
    );
  }

  const { blondel, excitation, actualDeltaB, exactThetaB } = results;
  const isOverheating = exactThetaB > 115;

  return (
    <StepLayout
      stepNumber={9}
      title="Step 9 : FMM en Charge & Excitation"
      description="Résolution de la FMM d'excitation par la méthode de Blondel et dimensionnement thermique (Kopylov)"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES RÉSUMÉ ET TABLEAUX                       */}
        {/* ================================================================ */}
        <div className="space-y-6">

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">FMM Excitation Totale</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(blondel.F_Bn, 0)} <span className="text-sm font-normal text-muted-foreground">A</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Angle Interne (ψ)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(blondel.blondel.psi_deg, 1)} <span className="text-sm font-normal text-muted-foreground">°</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Courant Nominal (I_B)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(excitation.electricalSpecs.I_B_Nominal_A, 1)} <span className="text-sm font-normal text-muted-foreground">A</span></p>
            </div>
            <div className={`rounded-lg border p-4 text-center shadow-sm transition-colors duration-500 ${!isOverheating ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' : 'border-red-500/50 bg-red-50 dark:bg-red-950/20 shadow-red-500/20'}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Température (Θ_B)</p>
              <p className={`text-2xl font-bold font-mono ${!isOverheating ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{fmt(exactThetaB, 0)} <span className="text-sm font-normal opacity-70">°C</span></p>
            </div>
          </div>

          {/* Coefficients et saturation */}
          <ResultTable
            title="Coefficients de Saturation et Réaction d'Induit"
            rows={[
              { label: 'Ratio de saturation (F_δdc / F_δ)', symbol: 'Ratio',     value: fmt(blondel.saturationRatio, 3),   unit: '' },
              { label: 'Coeff. saturation axe transversal', symbol: 'x_{q,sat}', value: fmt(blondel.coefficients.x_q, 3),  unit: '' },
              { label: 'Coeff. saturation axe direct',      symbol: 'x_{d,sat}', value: fmt(blondel.coefficients.x_d, 3),  unit: '' },
              { label: "Coeff. global d'entrefer",          symbol: 'k',         value: fmt(blondel.coefficients.k, 3),    unit: '' },
              { label: 'Réaction axe direct',               symbol: 'k_{ad}',    value: fmt(blondel.coefficients.k_ad, 3), unit: '' },
              { label: 'Réaction axe transversal',          symbol: 'k_{aq}',    value: fmt(blondel.coefficients.k_aq, 3), unit: '' },
            ]}
          />

          {/* Diagramme de Blondel — COMPLET avec sin/cos psi */}
          <ResultTable
            title="Diagramme de Blondel (Valeurs P.U.)"
            rows={[
              { label: 'FMM induit nominale (Ampères)',  symbol: 'F_a',       value: fmt(blondel.F_a, 0),               unit: 'A' },
              { label: 'FMM induit (p.u.)',              symbol: 'F_a*',      value: fmt(blondel.F_a_star, 3),          unit: 'p.u.' },
              { label: 'sin(ψ)',                         symbol: 'sin(ψ)',    value: fmt(blondel.blondel.sin_psi, 4),   unit: '' },
              { label: 'cos(ψ)',                         symbol: 'cos(ψ)',    value: fmt(blondel.blondel.cos_psi, 4),   unit: '' },
              { label: 'Tension résultante projetée',    symbol: 'E_{rd}*',   value: fmt(blondel.blondel.E_rd_star, 3), unit: 'p.u.' },
              { label: "Réaction d'induit axe direct",   symbol: 'F_{ad}*',   value: fmt(blondel.F_ad_star, 3),         unit: 'p.u.' },
              { label: 'FMM totale d\'excitation (p.u)', symbol: 'F_{Bn}*',   value: fmt(blondel.F_Bn_star, 3),         unit: 'p.u.' },
            ]}
          />

          {/* Électrique — COMPLET avec I_B_Max et R_B_120 et k_dispo */}
          <ResultTable
            title="Dimensionnement de la Bobine d'Excitation"
            rows={[
              { label: 'Courant nominal de la bobine',    symbol: 'I_B',       value: fmt(excitation.electricalSpecs.I_B_Nominal_A, 1), unit: 'A' },
              { label: 'Courant maximal admissible',      symbol: 'I_B,max',   value: fmt(excitation.electricalSpecs.I_B_Max_A, 1),     unit: 'A' },
              { label: 'Disponibilité de courant',        symbol: 'k_{dispo}', value: fmt(excitation.electricalSpecs.k_dispo, 3),       unit: '' },
              { label: 'Densité de courant réelle',       symbol: 'Δ_B',       value: fmt(actualDeltaB, 2),                            unit: 'A/mm²' },
              { label: 'Résistance bobine (75°C)',        symbol: 'R_{B75}',   value: fmt(excitation.electricalSpecs.R_B_75_Ohm, 3),   unit: 'Ω' },
              { label: 'Résistance bobine (120°C)',       symbol: 'R_{B120}',  value: fmt(excitation.electricalSpecs.R_B_120_Ohm, 3),  unit: 'Ω' },
              { label: 'Puissance dissipée (Joule)',      symbol: 'P_{Bn}',    value: fmt(excitation.electricalSpecs.P_Excitation_kW, 2),unit: 'kW' },
            ]}
          />

          {/* Fil commercial — COMPLET avec b_max, b_std, a_std */}
          <ResultTable
            title="Fil Commercial Normalisé"
            rows={[
              { label: 'Section de fil standardisée',   symbol: 'S_B',      value: fmt(excitation.commercialWire.section_mm2, 2),     unit: 'mm²' },
              { label: 'Dim. standard b (largeur)',      symbol: 'b_std',    value: fmt(excitation.commercialWire.b_standard_mm, 2),   unit: 'mm' },
              { label: 'Dim. standard a (épaisseur)',   symbol: 'a_std',    value: fmt(excitation.commercialWire.a_standard_mm, 2),   unit: 'mm' },
              { label: 'Limite b_max (contrainte)',      symbol: 'b_{max}',  value: fmt(excitation.commercialWire.b_max_limit_mm, 2),  unit: 'mm' },
            ]}
          />

          {/* Thermique — COMPLET avec v_p, alpha, k, delta_B */}
          <ResultTable
            title="Modèle Thermique (Kopylov)"
            rows={[
              { label: 'Vitesse périphérique rotor',          symbol: 'v_p',       value: fmt(excitation.thermal.v_p_ms, 2),       unit: 'm/s' },
              { label: 'Coefficient de dissipation (α)',       symbol: 'α',         value: fmt(excitation.thermal.alpha_coeff, 4),  unit: '' },
              { label: 'Coefficient de conduction (k)',        symbol: 'k',         value: fmt(excitation.thermal.k_coeff, 4),      unit: '' },
              { label: 'Densité courant tolérée (estimée)',    symbol: 'Δ_B,est',   value: fmt(excitation.thermal.delta_B_A_mm2, 2),unit: 'A/mm²' },
            ]}
          />

          {/* Géométrie bobine rotor — COMPLET */}
          <ResultTable
            title="Géométrie de la Bobine Rotorique"
            rows={[
              { label: 'Nombre de spires par pôle',        symbol: 'ω_B',           value: fmt(excitation.coilSizing.omega_B_turns, 0),    unit: 'tours' },
              { label: 'Longueur moyenne d\'une spire',     symbol: 'L_{B,moy}',     value: fmt(excitation.coilSizing.L_Bmoy_cm, 1),        unit: 'cm' },
              { label: 'Hauteur de la bobine (rotor)',      symbol: 'h_{bobine}',    value: fmt(excitation.coilSizing.h_bobine_cm, 2),      unit: 'cm' },
              { label: 'Hauteur noyau polaire occupée',     symbol: 'h_{M,pôle}',   value: fmt(excitation.coilSizing.h_M_pole_cm, 2),      unit: 'cm' },
              { label: 'Poids cuivre rotor',                symbol: 'G_B',           value: fmt(excitation.coilSizing.weight_copper_kg, 1), unit: 'kg' },
              { label: 'Poids cuivre / kVA installé',      symbol: 'G_B / kVA',     value: fmt(excitation.coilSizing.weight_per_kVA, 3),   unit: 'kg/kVA' },
            ]}
          />

        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Équations analytiques du système d'excitation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="1. Ratio de Saturation">
              <span className="italic font-semibold mr-2">Ratio</span>
              <span className="mr-2">=</span>
              <Frac num={<span>F<sub>{sym.delta}</sub> + F<sub>d1</sub> + F<sub>c</sub></span>} den={<span>F<sub>{sym.delta}</sub></span>} />
            </Formula>

            <Formula label="2. FMM d'Induit Nominale">
              <span className="italic font-semibold mr-2">F<sub>a</sub></span>
              <span className="mr-2">=</span>
              <span>2.7 {sym.dot} w<sub>1</sub> {sym.dot} <Frac num={<span>K<sub>w1</sub></span>} den="p" /> {sym.dot} I<sub>n</sub></span>
            </Formula>

            <Formula label="3. Angle Interne du Diagramme (ψ)">
              <span className="italic font-semibold mr-2">{sym.tan}({sym.psi})</span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>U* {sym.dot} {sym.sin}({sym.phi}) + I* {sym.dot} x<sub>q,sat</sub></span>}
                den={<span>U* {sym.dot} {sym.cos}({sym.phi})</span>}
              />
            </Formula>

            <Formula label="4. Tension Résultante (E_rd*)">
              <span className="italic font-semibold mr-2">E<sub>rd</sub>*</span>
              <span className="mr-2">=</span>
              <span>U* {sym.dot} {sym.cos}({sym.psi} - {sym.phi}) + I* {sym.dot} X<sub>{sym.sigma}</sub> {sym.dot} {sym.sin}({sym.psi})</span>
            </Formula>

            <Formula label="5. Réaction d'Induit Directe (F_ad*)">
              <span className="italic font-semibold mr-2">F<sub>ad</sub>*</span>
              <span className="mr-2">=</span>
              <div className="flex flex-col items-start gap-1 w-full">
                <div>
                  <span>x<sub>d,sat</sub> {sym.dot} k<sub>ad</sub> {sym.dot} F<sub>a</sub>* {sym.dot} {sym.sin}({sym.psi})</span>
                </div>
                <div className="ml-4">
                  <span className="mr-2">+</span>
                  <span>k {sym.dot} <Frac num={sym.tau} den={sym.delta} /> {sym.dot} F<sub>a</sub>* {sym.dot} {sym.cos}({sym.psi})</span>
                </div>
              </div>
            </Formula>

            <Formula label="6. FMM Totale d'Excitation (F_Bn*)">
              <span className="italic font-semibold mr-2">F<sub>Bn</sub>*</span>
              <span className="mr-2">=</span>
              <span>E<sub>rd</sub>* + F<sub>ad</sub>* + F'</span>
            </Formula>

            <div className="h-px bg-border my-4" />

            {/* ── Nouvelles formules ── */}
            <Formula label="7. Vitesse Périphérique du Rotor">
              <span className="italic font-semibold mr-2">v<sub>p</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>{sym.pi} {sym.dot} D {sym.dot} n</span>} den="60" />
            </Formula>

            <Formula label="8. Densité de Courant Tolérée">
              <span className="italic font-semibold mr-2">{sym.delta}<sub>B,est</sub></span>
              <span className="mr-2">=</span>
              <span>20 {sym.dot} <span className="text-lg">√</span><Frac num={<span>{sym.theta}<sub>cible</sub> {sym.dot} {sym.alpha} {sym.dot} k</span>} den={<span>b<sub>max</sub></span>} /></span>
            </Formula>

            <Formula label="9. Modèle Thermique Réel (Échauffement)">
              <span className="italic font-semibold mr-2">{sym.theta}<sub>B,réelle</sub></span>
              <span className="mr-2">=</span>
              <span>20°C + ( <Frac num={<span>{sym.delta}<sub>B,réelle</sub></span>} den="20" /> )² {sym.dot} <Frac num={<span>b<sub>max</sub></span>} den={<span>{sym.alpha} {sym.dot} k</span>} /></span>
            </Formula>

            <Formula label="10. Poids du Cuivre Rotorique (G_B)">
              <span className="italic font-semibold mr-2">G<sub>B</sub></span>
              <span className="mr-2">=</span>
              <span>8.9 {sym.dot} 2p {sym.dot} {sym.omega}<sub>B</sub> {sym.dot} L<sub>B,moy</sub> {sym.dot} S<sub>fil</sub></span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
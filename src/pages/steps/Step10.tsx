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
// COMPOSANT PRINCIPAL : STEP 10
// ─────────────────────────────────────────────────────────────────────────────
export default function Step10() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(10);
    }
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) {
      return null;
    }

    try {
      // 1. Appel de l'Étape 7
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);

      // 2. Appel de l'Étape 8
      const reactancesData = reactances || CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);
      if (noLoadData.F_deltadc_A === undefined) {
        noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;
      }
      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1,
        xq: reactancesData.xq || 1.0,
      };

      // 3. Appel de l'Étape 9 (Blondel) pour obtenir FBn
      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );

      // 4. ÉTAPE 10 : SYSTÈME D'EXCITATION COMPLET
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

  if (!results) {
    return (
      <StepLayout stepNumber={10} title="Step 10 : Système d'excitation complet">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres manquants pour le dimensionnement de la bobine.</p>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      stepNumber={10}
      title="Step 10 : Dimensionnement de la Bobine Rotor"
      description="Calcul de l'espace interpolaire, modèle thermique et choix du fil de cuivre industriel"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        <div className="space-y-6">

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Espace max. dispo</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.commercialWire.b_max_limit_mm, 1)} <span className="text-sm font-normal text-muted-foreground">mm</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Densité Courant Adm.</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.thermal.delta_B_A_mm2, 2)} <span className="text-sm font-normal text-muted-foreground">A/mm²</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Nombre Spires</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.coilSizing.omega_B_turns, 0)}</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Poids Cuivre Total</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.coilSizing.weight_copper_kg, 0)} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
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

          {/* Fil commercial — COMPLET avec h_bobine, h_M_pole, weight_per_kVA */}
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

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Dimensionnement par contrainte d'espace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="1. Espace Interpolaire (Pas)">
              <span className="italic font-semibold mr-2">t<sub>p</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>{sym.pi} {sym.dot} (D - 2{sym.delta} - 2h<sub>p</sub> - 2h<sub>M</sub>)</span>} den={<span>2p</span>} />
            </Formula>

            <Formula label="2. Largeur max bobine">
              <span className="italic font-semibold mr-2">b<sub>max</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>t<sub>p</sub> - b<sub>M</sub> - 2{sym.delta}<sub>isol</sub> - x</span>} den="2" />
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
              <span>20 {sym.dot} {sym.sqrt(<Frac num={<span>{sym.theta}<sub>B,adm</sub> {sym.dot} {sym.alpha} {sym.dot} k</span>} den={<span>b<sub>max</sub></span>} />)}</span>
            </Formula>

            <Formula label="5. Spires par pôle">
              <span className="italic font-semibold mr-2">{sym.omega}<sub>B</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>F<sub>Bn</sub> (Blondel)</span>} den={<span>2 {sym.dot} I<sub>B</sub></span>} />
            </Formula>

            {/* ── Nouvelle formule : résistance à 75°C ── */}
            <Formula label="6. Résistance de Phase à 75°C">
              <span className="italic font-semibold mr-2">R<sub>B75</sub></span>
              <span className="mr-2">=</span>
              <span>{sym.rho}<sub>75</sub></span>
              <span className="mx-1">{sym.dot}</span>
              <Frac
                num={<span>2p {sym.dot} {sym.omega}<sub>B</sub> {sym.dot} L<sub>B,moy</sub></span>}
                den={<span>S<sub>B</sub></span>}
              />
            </Formula>

            <Formula label="7. Poids du Cuivre Rotorique">
              <span className="italic font-semibold mr-2">G<sub>B</sub></span>
              <span className="mr-2">=</span>
              <span>8.9 {sym.dot} (2p) {sym.dot} {sym.omega}<sub>B</sub> {sym.dot} L<sub>B,moy</sub> {sym.dot} S<sub>B</sub> {sym.dot} 10<sup>-3</sup></span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
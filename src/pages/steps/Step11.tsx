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
  lambda: <span className="mx-0.5 italic">λ</span>,
  phi: <span className="mx-0.5 italic">φ</span>,
  omega: <span className="mx-0.5 italic">ω</span>,
  pi: <span className="mx-0.5">π</span>,
  prime: <span className="mx-0.5">'</span>,
  sqrt: (content: React.ReactNode) => (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">{content}</span>
    </span>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 11
// ─────────────────────────────────────────────────────────────────────────────
export default function Step11() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, excitation, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(11);
    }
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) {
      return null;
    }

    try {
      // 1. RECONSTRUCTION SÉCURISÉE DE TOUTE LA CHAÎNE DE DONNÉES
      
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
        coefficients: blondelData.coefficients || (blondelData as any).coeffs,
        F_a: blondelData.F_a || 0
      };

      const excitationData = CalculationEngine.calcExcitationSystem(
        nominal, mainDimensions, airGap, blondelData.F_Bn, inputs.f
      );

      // 2. APPEL DU CALCUL DES PARAMÈTRES DYNAMIQUES
      const dynParams = CalculationEngine.calcMachineParameters(
        nominal,
        airGap,
        noLoadData,
        safeReactances,
        safeReaction,
        excitationData,
        mainDimensions,    // ✅ CORRECTION : On passe l'objet complet !
        1.095,             
        inputs.f           
      );

      return dynParams;

    } catch (error) {
      console.error("Erreur lors du calcul des paramètres dynamiques :", error);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator, airGap, reactances, excitation]);

  const fmt = (v: number | null | undefined, d = 3): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  if (!results) {
    return (
      <StepLayout stepNumber={11} title="Step 11 : Paramètres Dynamiques">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres manquants pour les calculs dynamiques.</p>
          <p className="text-destructive/80 text-sm mt-2">Assurez-vous que toutes les étapes de 1 à 10 sont complétées et valides.</p>
        </div>
      </StepLayout>
    );
  }

  const { reactances_pu, resistances_pu, timeConstants_s } = results;

  return (
    <StepLayout
      stepNumber={11}
      title="Step 11 : Paramètres Dynamiques"
      description="Calcul des réactances synchrones, transitoires et des constantes de temps de la machine"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES RÉSUMÉ ET TABLEAUX                       */}
        {/* ================================================================ */}
        <div className="space-y-6">
          
          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Synchrone Directe (xd)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(reactances_pu.x_d, 3)} <span className="text-sm font-normal text-muted-foreground">p.u.</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Synchrone Transversale (xq)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(reactances_pu.x_q, 3)} <span className="text-sm font-normal text-muted-foreground">p.u.</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Transitoire Directe (x'd)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(reactances_pu.x_d_prime, 3)} <span className="text-sm font-normal text-muted-foreground">p.u.</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Temps d'ouverture (Td0)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(timeConstants_s.T_d0, 2)} <span className="text-sm font-normal text-muted-foreground">s</span></p>
            </div>
          </div>

          <ResultTable
            title="Réactances Statoriques et Rotoriques (En p.u.)"
            rows={[
              { label: 'Réaction d\'induit longitudinale',  symbol: 'x_{ad}',   value: fmt(reactances_pu.x_ad, 3),       unit: 'p.u.' },
              { label: 'Réaction d\'induit transversale',   symbol: 'x_{aq}',   value: fmt(reactances_pu.x_aq, 3),       unit: 'p.u.' },
              { label: 'Réactance synchrone longitudinale', symbol: 'x_d',      value: fmt(reactances_pu.x_d, 3),        unit: 'p.u.' },
              { label: 'Réactance synchrone transversale',  symbol: 'x_q',      value: fmt(reactances_pu.x_q, 3),        unit: 'p.u.' },
              { label: 'Réactance d\'excitation',           symbol: 'x_B',      value: fmt(reactances_pu.x_B, 3),        unit: 'p.u.' },
              { label: 'Réactance dispersion excitation',   symbol: 'x_{Bσ}',   value: fmt(reactances_pu.x_Bsigma, 3),   unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Paramètres de Régime Transitoire et Inverse"
            rows={[
              { label: 'Réactance transitoire directe',     symbol: 'x\'_d',    value: fmt(reactances_pu.x_d_prime, 3),  unit: 'p.u.' },
              { label: 'Réactance d\'ordre inverse',        symbol: 'x_2',      value: fmt(reactances_pu.x_2, 3),        unit: 'p.u.' },
              { label: 'Pulsation électrique',              symbol: 'ω',        value: fmt(timeConstants_s.omega_rad_s, 1), unit: 'rad/s' },
              { label: 'Résistance rotorique réduite',      symbol: 'r_B',      value: fmt(resistances_pu.r_B, 5),       unit: 'p.u.' },
              { label: 'Résistance statorique',             symbol: 'r_a',      value: fmt(resistances_pu.r_a, 5),       unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Constantes de Temps (Secondes)"
            rows={[
              { label: 'Const. de temps d\'ouverture à vide',  symbol: 'T_{d0}',  value: fmt(timeConstants_s.T_d0, 3),      unit: 's' },
              { label: 'Const. transitoire (court-circuit)',  symbol: 'T\'_d',   value: fmt(timeConstants_s.T_d_prime, 3), unit: 's' },
              { label: 'Const. de temps d\'amortissement',    symbol: 'T_a',     value: fmt(timeConstants_s.T_a, 3),       unit: 's' },
            ]}
          />

        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Équations des réactances et de la dynamique du rotor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="1. Réactances de réaction d'induit">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">x<sub>ad</sub></span>
                  <span className="mr-2">=</span>
                  <Frac num={<span>k<sub>ad</sub> {sym.dot} F<sub>a</sub></span>} den={<span>1.04 {sym.dot} F<sub>{sym.delta}0</sub></span>} />
                </div>
                <div>
                  <span className="italic font-semibold mr-2">x<sub>aq</sub></span>
                  <span className="mr-2">=</span>
                  <Frac num={<span>k<sub>aq</sub> {sym.dot} F<sub>a</sub></span>} den={<span>F<sub>{sym.delta}0</sub> {sym.dot} k<sub>{sym.delta},avg</sub></span>} />
                </div>
              </div>
            </Formula>

            <Formula label="2. Réactances Synchrones">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">x<sub>d</sub></span>
                  <span className="mr-2">=</span>
                  <span>x<sub>{sym.sigma}</sub> + x<sub>ad</sub></span>
                </div>
                <div>
                  <span className="italic font-semibold mr-2">x<sub>q</sub></span>
                  <span className="mr-2">=</span>
                  <span>x<sub>{sym.sigma}</sub> + x<sub>aq</sub></span>
                </div>
              </div>
            </Formula>

            <Formula label="3. Réactance d'excitation (Rapportée au stator)">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="flex items-center">
                  <span className="italic font-semibold mr-2">x<sub>B</sub></span>
                  <span className="mr-2">=</span>
                  <span>
                    1.27 {sym.dot} k<sub>ad</sub> {sym.dot} x<sub>ad</sub> {sym.dot} 
                    <span className="mx-1">(1 +</span>
                    <Frac 
                      num={<span>2 {sym.dot} F<sub>{sym.delta}0</sub> {sym.dot} l<sub>M</sub> {sym.dot} {sym.sigma}<sub>{sym.lambda}</sub></span>} 
                      den={<span>{sym.phi}<sub>0</sub></span>} 
                    />
                    <span className="mx-1">)</span>
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                  Avec <span className="italic font-semibold mx-1">x<sub>B{sym.sigma}</sub></span> = <span className="italic font-semibold mx-1">x<sub>B</sub></span> - <span className="italic font-semibold mx-1">x<sub>ad</sub></span>
                </div>
              </div>
            </Formula>

            <Formula label="4. Réactance Transitoire Longitudinale">
              <span className="italic font-semibold mr-2">x{sym.prime}<sub>d</sub></span>
              <span className="mr-2">=</span>
              <span>x<sub>{sym.sigma}</sub> + <Frac num={<span>x<sub>ad</sub> {sym.dot} x<sub>B{sym.sigma}</sub></span>} den={<span>x<sub>ad</sub> + x<sub>B{sym.sigma}</sub></span>} /></span>
            </Formula>

            <Formula label="5. Réactance d'Ordre Inverse">
              <span className="italic font-semibold mr-2">x<sub>2</sub></span>
              <span className="mr-2">≈</span>
              <span>{sym.sqrt(<span>x{sym.prime}<sub>d</sub> {sym.dot} x<sub>q</sub></span>)}</span>
            </Formula>

            <div className="h-px bg-border my-4" />

            <Formula label="6. Résistance Rotorique Réduite (p.u.)">
              <span className="italic font-semibold mr-2">r<sub>B</sub></span>
              <span className="mr-2">=</span>
              <Frac 
                num={<span>2200 {sym.dot} F<sub>a</sub> {sym.dot} k<sub>ad</sub>² {sym.dot} L<sub>B,moy</sub></span>} 
                den={<span>{sym.phi}<sub>0</sub> {sym.dot} f {sym.dot} {sym.omega}<sub>B</sub> {sym.dot} S<sub>B</sub></span>} 
              />
            </Formula>

            <Formula label="7. Constantes de temps">
              <div className="flex flex-col items-center w-full gap-4">
                <div className="flex w-full justify-around text-center">
                  <div>
                    <span className="italic font-semibold mr-1">T<sub>d0</sub></span>
                    <span className="mr-1">=</span>
                    <Frac num={<span>x<sub>B</sub></span>} den={<span>{sym.omega} {sym.dot} r<sub>B</sub></span>} />
                  </div>
                  <div>
                    <span className="italic font-semibold mr-1">T{sym.prime}<sub>d</sub></span>
                    <span className="mr-1">=</span>
                    <Frac num={<span>x{sym.prime}<sub>d</sub></span>} den={<span>x<sub>d</sub></span>} />
                    <span className="ml-1">{sym.dot} T<sub>d0</sub></span>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="italic font-semibold mr-2">T<sub>a</sub></span>
                  <span className="mr-2">=</span>
                  <Frac num={<span>x<sub>2</sub></span>} den={<span>{sym.omega} {sym.dot} r<sub>a</sub></span>} />
                </div>
              </div>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}

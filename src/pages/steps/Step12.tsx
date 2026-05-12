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
  prime: <span className="mx-0.5">'</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 12
// ─────────────────────────────────────────────────────────────────────────────
export default function Step12() {
  const { inputs, nominal, mainDimensions, airGap, stator, reactances, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(12);
    }
  }, [setCurrentStep]);

  const results = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap) {
      return null;
    }

    try {
      // 1. RECONSTRUCTION SÉCURISÉE DE LA CHAÎNE (Pour garantir x_d et F_Bn_star)
      
      // Step 7
      const noLoadData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      noLoadData.Phi_0 = stator.Phi0; 
      if (noLoadData.F_deltadc_A === undefined) noLoadData.F_deltadc_A = noLoadData.F_delta + noLoadData.F_d1 + noLoadData.F_c;

      // Step 8
      const reactancesData = reactances || CalculationEngine.calcLeakageReactance(inputs, nominal, stator, airGap, mainDimensions);
      const safeReactances = {
        xSigma: reactancesData.x_sigma_pu || reactancesData.xSigma || 0.1,
        xq: reactancesData.xq || 1.0,
        r_a: stator.Ra75pu || 0.02
      };

      // Step 9
      const blondelData = CalculationEngine.calcLoadExcitation(
        nominal, stator, airGap, mainDimensions, noLoadData, safeReactances,
        airGap.delta * 1.5, mainDimensions.alphap || 0.73, inputs.cosPhi || 0.8
      );
      const safeReaction = {
        coefficients: blondelData.coefficients || blondelData.coeffs,
        F_a: blondelData.F_a || 0
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

      // 2. ÉTAPE 12 : COURANTS DE COURT-CIRCUIT
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

  if (!results) {
    return (
      <StepLayout stepNumber={12} title="Step 12 : Courants de Court-Circuit">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres manquants pour les calculs de court-circuit.</p>
          <p className="text-destructive/80 text-sm mt-2">Vérifiez que toutes les étapes précédentes (en particulier l'Étape 9 et 11) sont complétées.</p>
        </div>
      </StepLayout>
    );
  }

  const { inputs: scInputs, results_pu, results_real } = results;

  // Calcul du ratio d'intensité du court-circuit par rapport au nominal
  const severityRatio = results_real.I_ccn_A / (nominal?.In || 1);

  return (
    <StepLayout
      stepNumber={12}
      title="Step 12 : Courants de Court-Circuit"
      description="Évaluation de l'intensité des courants de défaut statorique en régime permanent"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES RÉSUMÉ ET TABLEAUX                       */}
        {/* ================================================================ */}
        <div className="space-y-6">
          
          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">C.C. Nominal (p.u.)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results_pu.I_ccn, 2)} <span className="text-sm font-normal text-muted-foreground">p.u.</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">C.C. Nominal (Ampères)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results_real.I_ccn_A, 0)} <span className="text-sm font-normal text-muted-foreground">A</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ratio de Sévérité</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(severityRatio, 1)}<span className="text-sm font-normal text-muted-foreground">x In</span></p>
            </div>
            <div className={`rounded-lg border p-4 text-center shadow-sm ${severityRatio > 2 ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20' : 'border-green-500/50 bg-green-50 dark:bg-green-950/20'}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Statut de sécurité</p>
              <p className={`text-sm font-bold font-mono mt-2 ${severityRatio > 2 ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                {severityRatio > 2 ? 'DÉFAUT ÉLEVÉ ⚠️' : 'DÉFAUT MODÉRÉ ✅'}
              </p>
            </div>
          </div>

          <ResultTable
            title="Paramètres d'Entrée du Court-Circuit"
            rows={[
              { label: 'Tension induite interne à vide', symbol: 'E\'_0*', value: fmt(scInputs.E0_prime_star, 2), unit: 'p.u.' },
              { label: 'Réactance synchrone directe',    symbol: 'x_d',     value: fmt(scInputs.x_d_pu, 3),        unit: 'p.u.' },
              { label: 'Courant d\'excitation nominal',  symbol: 'I_{Bn}*', value: fmt(scInputs.F_Bn_star_pu, 3),  unit: 'p.u.' },
            ]}
          />

          <ResultTable
            title="Résultats Analytiques (Régime permanent)"
            rows={[
              { label: 'Courant de court-circuit (excitation à vide)',    symbol: 'I_{cc0}', value: fmt(results_pu.I_cc0, 3), unit: 'p.u.' },
              { label: 'Courant de court-circuit (excitation nominale)',  symbol: 'I_{ccn}', value: fmt(results_pu.I_ccn, 3), unit: 'p.u.' },
              { label: 'Courant nominal statorique de la machine',        symbol: 'I_n',     value: fmt(nominal?.In, 0),      unit: 'A' },
              { label: 'Courant de défaut absolu',                        symbol: 'I_{ccn}', value: fmt(results_real.I_ccn_A, 0), unit: 'A' },
            ]}
          />

        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Rapport de court-circuit en régime permanent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="1. Courant de CC (Excitation à vide)">
              <div className="flex flex-col items-center w-full gap-3">
                <div className="flex items-center">
                  <span className="italic font-semibold mr-2">I<sub>cc0</sub></span>
                  <span className="mr-2">=</span>
                  <Frac num={<span>E{sym.prime}<sub>0</sub>*</span>} den={<span>x<sub>d</sub></span>} />
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
                {/* BLOC NOTE DÉCALÉ ET MIS EN VALEUR ICI */}
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                  Note : <span className="italic font-semibold mx-1">I<sub>Bn</sub>*</span> = <span className="italic font-semibold mx-1">F<sub>Bn</sub>*</span> <span className="opacity-80">(Calculé à l'Étape 9 via Blondel)</span>
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
'use client';

import { useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

// Safe math component without KaTeX/LaTeX
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex justify-center items-center py-2 overflow-x-auto text-slate-800 dark:text-slate-200 text-sm">
        {children}
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1 align-middle">
      <span className="border-b border-current px-1 leading-tight text-sm">{num}</span>
      <span className="px-1 leading-tight text-sm">{den}</span>
    </span>
  );
}

const sym = {
  dot: <span className="mx-0.5">·</span>,
  sqrt3: (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">3</span>
    </span>
  ),
  pi: <span className="mx-0.5">π</span>,
  tau: <span className="mx-0.5">τ</span>,
  phi: <span className="mx-0.5">φ</span>,
  sigma: <span className="mx-0.5">σ</span>,
};

export default function Step3() {
  const { inputs, nominal, mainDimensions, setCurrentStep } = useMachineStore();

  // Error handling: return early if basic params are missing
  if (!inputs || !nominal) {
    return (
      <StepLayout stepNumber={3} title="Dimensions principales" description="Diamètres, pas polaire et longueur du stator">
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10">
          <p className="text-destructive font-semibold">Erreur : paramètres d'entrée manquants</p>
          <p className="text-sm text-destructive/80 mt-2">Veuillez vérifier que vous avez complété les étapes précédentes (valeurs nominales).</p>
        </div>
      </StepLayout>
    );
  }

  // Use useMemo to compute dimensions if not already in store
  const dim = useMemo(() => {
    setCurrentStep(3);
    
    // If already calculated, return it
    if (mainDimensions) {
      return mainDimensions;
    }

    // Otherwise, compute it from scratch using CalculationEngine
    try {
      const computed = CalculationEngine.calcMainDimensions(inputs, nominal);
      if (!computed) throw new Error('calcMainDimensions returned null');
      return computed;
    } catch (err) {
      console.error('[Step3] Error computing main dimensions:', err);
      return null;
    }
  }, [inputs, nominal, mainDimensions, setCurrentStep]);

  // If calculation failed, show error
  if (!dim) {
    return (
      <StepLayout stepNumber={3} title="Dimensions principales" description="Diamètres, pas polaire et longueur du stator">
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10">
          <p className="text-destructive font-semibold">Erreur : calcul impossible</p>
          <p className="text-sm text-destructive/80 mt-2">Le moteur synchrone ne peut pas être dimensionné avec les paramètres actuels.</p>
        </div>
      </StepLayout>
    );
  }

  const fmt = (v: number | null | undefined, d = 2) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  return (
    <StepLayout
      stepNumber={3}
      title="Dimensions principales"
      description="Diamètres, pas polaire et longueur du stator"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Summary cards and ResultTable */}
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Diamètre D</p>
              <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2">{fmt(dim.D, 1)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">cm</p>
            </div>
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Pas Polaire τ</p>
              <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2">{fmt(dim.tau, 2)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">cm</p>
            </div>
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Charge A</p>
              <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2">{fmt(dim.A, 0)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A/cm</p>
            </div>
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Induction Bdn</p>
              <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2">{fmt(dim.Bdn, 0)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">G</p>
            </div>
          </div>

          {/* Results table */}
          <ResultTable
            title="Résumé - Dimensions principales"
            rows={[
              { label: 'Coefficient KE', symbol: 'K_E', value: fmt(dim.KE, 3), unit: '' },
              { label: 'Puissance apparente', symbol: "S'", value: fmt(dim.Sprime, 1), unit: 'kVA' },
              { label: 'Diamètre intérieur', symbol: 'D', value: fmt(dim.D, 1), unit: 'cm' },
              { label: 'Diamètre extérieur', symbol: 'D_a', value: fmt(dim.Da, 1), unit: 'cm' },
              { label: 'Diamètre normalisé', symbol: 'D_{a,norm}', value: fmt(dim.DaNorm, 1), unit: 'cm' },
              { label: 'Pas polaire', symbol: '{tau}', value: fmt(dim.tau, 2), unit: 'cm' },
              { label: 'Charge linéique', symbol: 'A', value: fmt(dim.A, 0), unit: 'A/cm' },
              { label: 'Induction entrefer', symbol: 'B_{dn}', value: fmt(dim.Bdn, 0), unit: 'G' },
              { label: 'Longueur théorique', symbol: "l'_δ", value: fmt(dim.lPrimeDelta, 1), unit: 'cm' },
              { label: 'Longueur réelle', symbol: 'l_δ', value: fmt(dim.lDelta, 1), unit: 'cm' },
              { label: 'Longueur totale', symbol: 'l_1', value: fmt(dim.l1, 1), unit: 'cm' },
              { label: 'Ratio λ', symbol: 'λ', value: fmt(dim.lambda, 2), unit: '' },
            ]}
          />

          {/* Validation check */}
          <div
            className={`p-4 rounded-lg border ${
              dim.isLambdaValid
                ? 'border-green-500/30 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                : 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
            }`}
          >
            <p className="text-sm font-semibold mb-1">{dim.isLambdaValid ? '✓ Vérification réussie' : '⚠ Attention'}</p>
            <p className="text-xs">{dim.lambdaMessage}</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Engineering formulas */}
        <div className="space-y-6">
          <Formula label="Coefficient KE (adaptation réactance)">
            <span>
              K<sub>E</sub> = √(cos²φ + (sinφ + x<sub>σ</sub>)<sup>2</sup>)
            </span>
          </Formula>

          <Formula label="Puissance apparente de calcul">
            <span>
              S' = <Frac num={<span>K_E · P_n</span>} den={<span>cos φ</span>} />
            </span>
          </Formula>

          <Formula label="Diamètre d'alésage (formule empirique)">
            <span>
              D ≈ 7.1 · √p · (S')<sup>1/4</sup>
            </span>
          </Formula>

          <Formula label="Pas polaire">
            <span>
              {sym.tau} = <Frac num={<span>{sym.pi} · D</span>} den={<span>2p</span>} />
            </span>
          </Formula>

          <Formula label="Charge linéique de courant">
            <span>
              A = c<sub>1</sub> · ln({sym.tau}) + c<sub>2</sub>
            </span>
          </Formula>

          <Formula label="Densité de flux entrefer">
            <span>
              B<sub>dn</sub> = c<sub>3</sub> − <Frac num={<span>c₄</span>} den={<span>{sym.tau}</span>} />
            </span>
          </Formula>

          <Formula label="Longueur théorique stator">
            <span>
              l'<sub>δ</sub> = <Frac num={<span>6.1 × 10¹¹ · S'</span>} den={<span>α<sub>δ</sub> · K<sub>B</sub> · K₀₁ · A · B<sub>dn</sub> · D² · n<sub>n</sub></span>} />
            </span>
          </Formula>

          <Formula label="Longueur réelle avec ventilation">
            <span>
              l<sub>δ</sub> = l<sub>t</sub> · l'<sub>δ</sub>
            </span>
          </Formula>

          <Formula label="Ratio de vérification lambda">
            <span>
              λ = <Frac num={<span>l<sub>δ</sub></span>} den={<span>{sym.tau}</span>} />
            </span>
          </Formula>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Norme :</strong> 1 ≤ λ ≤ 3 pour une bonne répartition mécanique.
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}

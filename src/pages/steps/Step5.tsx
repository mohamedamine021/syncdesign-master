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
  gamma: <span className="mx-0.5 italic">γ</span>,
  tau: <span className="mx-0.5 italic">τ</span>,
  approx: <span className="mx-1">≈</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 5
// ─────────────────────────────────────────────────────────────────────────────
export default function Step5() {
  const { mainDimensions, stator, setCurrentStep } = useMachineStore();

  // 1. Sécurité anti-boucle infinie pour l'étape
  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(5);
    }
  }, [setCurrentStep]);

  // 2. Délégation au moteur + variables d'affichage pédagogiques
  const results = useMemo(() => {
    if (
      !mainDimensions || !mainDimensions.A || !mainDimensions.tau ||
      !stator || !stator.Bd0 || !stator.be || !stator.t1
    ) {
      return null;
    }

    try {
      // ── Résultats finaux via le moteur (source de vérité) ──
      const engine = CalculationEngine.calcAirGap(mainDimensions, stator);

      // ── Constantes de conception (identiques aux défauts du moteur) ──
      const xd_star    = 1.35;
      const xSigma_star = 0.1;
      const Kprime     = 1.06;

      // ── Variables intermédiaires pédagogiques (affichage tableau) ──
      // CORRECTION : b0 = stator.be / 10 (ouverture d'encoche, pas l'encombrement le)
      const delta_calc  = (0.36 * mainDimensions.A * mainDimensions.tau) /
                          (Kprime * (xd_star - xSigma_star) * stator.Bd0);
      const b0          = stator.be / 10;
      const ratio       = b0 / engine.delta;
      const gamma       = Math.pow(ratio, 2) / (5 + ratio);
      const Kdelta_calc = stator.t1 / (stator.t1 - gamma * engine.delta);

      return {
        // Résultats finaux du moteur
        delta:        engine.delta,
        Kdelta:       engine.Kdelta,
        // Variables intermédiaires pour le tableau détaillé
        delta_calc,
        b0,
        ratio,
        gamma,
        Kdelta_calc,
        // Constantes exposées dans la bannière
        xd_star,
        xSigma_star,
        Kprime,
      };

    } catch (error) {
      console.error("Erreur lors du calcul de l'entrefer :", error);
      return null;
    }
  }, [mainDimensions, stator]);

  // Formatage des valeurs
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // 3. Bouclier d'erreur si données manquantes
  if (!results) {
    return (
      <StepLayout stepNumber={5} title="Step 5 : Air Gap">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres manquants pour le calcul de l'entrefer.</p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que l'Étape 3 (Dimensions) et l'Étape 4 (Stator) ont été validées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // 4. Rendu de la page
  return (
    <StepLayout
      stepNumber={5}
      title="Step 5 : Air Gap"
      description="Calcul détaillé de l'entrefer mécanique et du coefficient de Carter"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES RÉSUMÉ ET TABLEAUX                       */}
        {/* ================================================================ */}
        <div className="space-y-6">

          {/* Cartes KPI (Key Performance Indicators) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-5 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Entrefer Arrondi (δ)</p>
              <p className="text-3xl font-bold font-mono text-primary">
                {fmt(results.delta, 2)} <span className="text-base font-normal text-muted-foreground">cm</span>
              </p>
            </div>
            <div className="rounded-lg border border-border p-5 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Coeff. Carter (Kδ)</p>
              <p className="text-3xl font-bold font-mono text-primary">{fmt(results.Kdelta, 3)}</p>
            </div>
          </div>

          {/* Tableau des résultats exhaustifs */}
          <ResultTable
            title="Détails de tous les paramètres calculés"
            rows={[
              { label: 'Entrefer calculé (théorique)', symbol: 'δ_calc',      value: fmt(results.delta_calc, 4), unit: 'cm' },
              { label: 'Entrefer adopté (arrondi)',    symbol: 'δ',           value: fmt(results.delta, 2),      unit: 'cm' },
              { label: "Ouverture d'encoche",          symbol: 'b_0',         value: fmt(results.b0, 2),         unit: 'cm' },
              { label: 'Ratio ouverture / entrefer',   symbol: 'b_0/δ',       value: fmt(results.ratio, 3),      unit: '' },
              { label: 'Coefficient géométrique',      symbol: 'γ',           value: fmt(results.gamma, 4),      unit: '' },
              { label: 'Coeff. Carter (théorique)',    symbol: 'K_{δ,calc}',  value: fmt(results.Kdelta_calc, 4),unit: '' },
              { label: 'Coefficient de Carter final',  symbol: 'K_δ',         value: fmt(results.Kdelta, 3),     unit: '' },
            ]}
          />

          {/* Informations sur les constantes de conception */}
          <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 text-sm">
            <p className="font-bold text-blue-800 dark:text-blue-300 mb-2">Constantes d'entrée utilisées :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400 font-mono">
              <li>x<sub className="font-sans">d</sub>* = {results.xd_star}</li>
              <li>x<sub className="font-sans">σ</sub>* = {results.xSigma_star}</li>
              <li>K' = {results.Kprime}</li>
            </ul>
          </div>

        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Équations exhaustives utilisées pour l'Étape 5</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            <Formula label="1. Entrefer Théorique">
              <span className="italic font-semibold mr-2">{sym.delta}<sub>calc</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>0.36 {sym.dot} A {sym.dot} {sym.tau}</span>}
                den={<span>K' {sym.dot} (x*<sub>d</sub> - x*<sub>σ</sub>) {sym.dot} B<sub>δ0</sub></span>}
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
              <Frac num={<span>b<sub>e</sub></span>} den="10" />
            </Formula>

            <Formula label="4. Ratio d'Ouverture d'Encoche">
              <span className="italic font-semibold mr-2">ratio</span>
              <span className="mr-2">=</span>
              <Frac num={<span>b<sub>0</sub></span>} den={sym.delta} />
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
                den={<span>t<sub>1</sub> - {sym.gamma} {sym.dot} {sym.delta}</span>}
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
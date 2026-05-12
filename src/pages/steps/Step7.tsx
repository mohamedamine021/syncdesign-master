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
  gamma: <span className="mx-0.5 italic">γ</span>,
  phi: <span className="mx-0.5 italic">Φ</span>,
  xi: <span className="mx-0.5 italic">ξ</span>,
  pi: <span className="mx-0.5">π</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 7
// ─────────────────────────────────────────────────────────────────────────────
export default function Step7() {
  const { mainDimensions, stator, airGap, setCurrentStep } = useMachineStore();

  // 1. Sécurité anti-boucle infinie
  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(7);
    }
  }, [setCurrentStep]);

  // 2. Délégation au moteur
  const results = useMemo(() => {
    if (!mainDimensions || !stator || !airGap) {
      return null;
    }
    try {
      // Bilan nominal (Loi de Hopkinson)
      const nominalData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      // Points de la caractéristique à vide
      const curvePoints = CalculationEngine.generateNoLoadCurve(mainDimensions, stator, airGap);
      return { nominalData, curvePoints };
    } catch (error) {
      console.error("Erreur lors du calcul de la caractéristique à vide :", error);
      return null;
    }
  }, [mainDimensions, stator, airGap]);

  // Formatage des valeurs — protège aussi les divisions par 1e6
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number) || !isFinite(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // Helper sécurisé pour les divisions avant formatage
  const fmtDiv = (v: number | null | undefined, divisor: number, d = 2): string =>
    fmt((v != null && isFinite(v as number)) ? (v as number) / divisor : undefined, d);

  // 3. Bouclier d'erreur si données manquantes
  if (!results) {
    return (
      <StepLayout stepNumber={7} title="Step 7 : Caractéristique à vide">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres manquants pour le circuit magnétique.</p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que les dimensions (Step 3), le stator (Step 4) et l'entrefer (Step 5) sont calculés.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { nominalData, curvePoints } = results;

  // Validation de saturation — valeur par défaut 0 pour éviter un crash si clé absente
  const Bd13Safe = nominalData?.Bd13 ?? 0;
  const isSaturated = Bd13Safe > 18000;

  // 4. Rendu de la page
  return (
    <StepLayout
      stepNumber={7}
      title="Step 7 : Caractéristique à vide"
      description="Bilan des forces magnétomotrices (FMM) et tracé de la courbe de saturation"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES RÉSUMÉ ET TABLEAUX                       */}
        {/* ================================================================ */}
        <div className="space-y-6">

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">FMM Totale (F₀)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(nominalData?.F_0, 0)} <span className="text-sm font-normal text-muted-foreground">A</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">FMM Entrefer (Fδ)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(nominalData?.F_delta, 0)} <span className="text-sm font-normal text-muted-foreground">A</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Induction Dent (Bd13)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(nominalData?.Bd13, 0)} <span className="text-sm font-normal text-muted-foreground">G</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Induction Culasse (Bc)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(nominalData?.Bc, 0)} <span className="text-sm font-normal text-muted-foreground">G</span></p>
            </div>
          </div>

          {/* Validation de saturation */}
          <div className={`p-4 rounded-lg border-2 shadow-sm ${
            !isSaturated
              ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
              : 'border-destructive/50 bg-destructive/10 text-destructive'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{!isSaturated ? '✅' : '⚠️'}</span>
              <h4 className="font-bold text-sm uppercase tracking-wide">Saturation des dents statoriques</h4>
            </div>
            <p className="text-xs font-medium opacity-90 ml-8">
              {!isSaturated
                ? `L'induction dans les dents (${fmt(Bd13Safe, 0)} G) est dans les limites (< 18000 G).`
                : `Attention : Forte saturation détectée (${fmt(Bd13Safe, 0)} G > 18000 G). Le calcul du coefficient K_ex (Fig 2.11) sera appliqué.`}
            </p>
          </div>

          {/* Tableau détaillé des FMM */}
          <ResultTable
            title="Bilan des Forces Magnétomotrices (Loi de Hopkinson)"
            rows={[
              { label: "FMM de l'entrefer",            symbol: 'F_δ',    value: fmt(nominalData?.F_delta, 0),   unit: 'A' },
              { label: 'FMM des dents stator',         symbol: 'F_{d1}', value: fmt(nominalData?.F_d1, 0),      unit: 'A' },
              { label: 'FMM de la culasse stator',     symbol: 'F_c',    value: fmt(nominalData?.F_c, 0),       unit: 'A' },
              { label: 'FMM de la zone polaire',       symbol: 'F_{M0}', value: fmt(nominalData?.F_M0, 0),      unit: 'A' },
              { label: 'FMM de la culasse rotor',      symbol: 'F_a',    value: fmt(nominalData?.F_a, 0),       unit: 'A' },
              { label: 'FMM de la jonction pôle-rotor',symbol: 'F_{δM}', value: fmt(nominalData?.F_delta_M, 0), unit: 'A' },
              { label: 'FMM TOTALE À VIDE',            symbol: 'F_0',    value: fmt(nominalData?.F_0, 0),       unit: 'A' },
            ]}
          />

          {/* Tableau des inductions et champs H */}
          <ResultTable
            title="Grandeurs Magnétiques (B et H)"
            rows={[
              { label: 'Induction dans la dent (1/3)', symbol: 'B_{d13}', value: fmt(nominalData?.Bd13, 0),  unit: 'G' },
              { label: 'Champ magn. dans la dent',     symbol: 'H_{d13}', value: fmt(nominalData?.Hd13, 1),  unit: 'A/cm' },
              { label: 'Induction culasse stator',     symbol: 'B_c',     value: fmt(nominalData?.Bc, 0),    unit: 'G' },
              { label: 'Champ magn. culasse stator',   symbol: 'H_c',     value: fmt(nominalData?.Hc, 1),    unit: 'A/cm' },
              { label: 'Induction noyau polaire',      symbol: 'B_M',     value: fmt(nominalData?.B_M, 0),   unit: 'G' },
              { label: 'Champ magn. noyau polaire',    symbol: 'H_M',     value: fmt(nominalData?.H_M, 1),   unit: 'A/cm' },
              { label: 'Induction culasse rotor',      symbol: 'B_a',     value: fmt(nominalData?.B_a, 0),   unit: 'G' },
              { label: 'Champ magn. culasse rotor',    symbol: 'H_a',     value: fmt(nominalData?.H_a, 1),   unit: 'A/cm' },
            ]}
          />

          {/* Tableau des géométries et flux */}
          <ResultTable
            title="Géométries et Flux de fuite"
            rows={[
              { label: 'Pas dentaire au tiers',        symbol: 't_{d13}', value: fmt(nominalData?.t_d13, 2),                          unit: 'cm' },
              { label: 'Largeur dent au tiers',        symbol: 'b_{d13}', value: fmt(nominalData?.b_d13, 2),                          unit: 'cm' },
              { label: 'Longueur culasse stator',      symbol: 'l_c',     value: fmt(nominalData?.lc, 2),                             unit: 'cm' },
              { label: 'Coefficient interpolation',    symbol: 'ξ',       value: fmt(nominalData?.xi, 3),                             unit: '' },
              { label: 'Flux de dispersion polaire',   symbol: 'Φ_σ',     value: `${fmtDiv(nominalData?.Phi_sigma, 1e6, 2)} × 10⁶`,   unit: 'Mx' },
              { label: 'Flux total du pôle',           symbol: 'Φ_M',     value: `${fmtDiv(nominalData?.Phi_M, 1e6, 2)} × 10⁶`,       unit: 'Mx' },
            ]}
          />

        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES & POINTS DE COURBE                     */}
        {/* ================================================================ */}
        <div className="space-y-6 h-fit">
          <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-xl">Formules Analytiques</CardTitle>
              <CardDescription>Bilan des FMM (Loi de Hopkinson)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">

              <Formula label="1. FMM de l'Entrefer">
                <span className="italic font-semibold mr-2">F<sub>{sym.delta}</sub></span>
                <span className="mr-2">=</span>
                <span>1.6 {sym.dot} {sym.delta} {sym.dot} K<sub>{sym.delta}</sub> {sym.dot} B<sub>{sym.delta}0</sub></span>
              </Formula>

              <Formula label="2. Géométrie de la Dent (1/3 de la hauteur)">
                <div className="flex flex-col gap-2 w-full text-center">
                  <div>
                    <span className="italic font-semibold mr-2">t<sub>d13</sub></span>
                    <span className="mr-2">=</span>
                    <Frac num={<span>{sym.pi} {sym.dot} (D + 2/3 {sym.dot} h<sub>e</sub>)</span>} den={<span>Z<sub>1</sub></span>} />
                  </div>
                  <div>
                    <span className="italic font-semibold mr-2">b<sub>d13</sub></span>
                    <span className="mr-2">=</span>
                    <span>t<sub>d13</sub> - b<sub>e</sub></span>
                  </div>
                </div>
              </Formula>

              <Formula label="3. FMM des Dents Statoriques">
                <span className="italic font-semibold mr-2">F<sub>d1</sub></span>
                <span className="mr-2">=</span>
                <span>2 {sym.dot} h<sub>e</sub> {sym.dot} H<sub>d13</sub></span>
              </Formula>

              <Formula label="4. FMM de la Culasse Statorique">
                <span className="italic font-semibold mr-2">F<sub>c</sub></span>
                <span className="mr-2">=</span>
                <span>l<sub>c</sub> {sym.dot} {sym.xi} {sym.dot} H<sub>c</sub></span>
              </Formula>

              <Formula label="5. Flux Total du Pôle">
                <span className="italic font-semibold mr-2">{sym.phi}<sub>M</sub></span>
                <span className="mr-2">=</span>
                <span>{sym.phi}<sub>ch</sub> + {sym.phi}<sub>{sym.sigma}</sub></span>
              </Formula>

              <Formula label="6. FMM de la Zone Polaire">
                <span className="italic font-semibold mr-2">F<sub>M0</sub></span>
                <span className="mr-2">=</span>
                <span>2(h<sub>m</sub> + h<sub>p</sub>) {sym.dot} H<sub>M</sub></span>
              </Formula>

              <Formula label="7. FMM de la Culasse Rotorique">
                <span className="italic font-semibold mr-2">F<sub>a</sub></span>
                <span className="mr-2">=</span>
                <span>l<sub>a,path</sub> {sym.dot} H<sub>a</sub></span>
              </Formula>

              <Formula label="8. FMM Jonction Pôle-Rotor">
                <span className="italic font-semibold mr-2">F<sub>{sym.delta}M</sub></span>
                <span className="mr-2">=</span>
                <span>1.6 {sym.dot} {sym.delta}<sub>jonc</sub> {sym.dot} B<sub>M</sub></span>
              </Formula>

              <div className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-lg border-2 border-blue-300 dark:border-blue-800 shadow-sm mt-6">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3">
                  Théorème d'Ampère (FMM Totale)
                </p>
                <div className="flex justify-center items-center text-lg font-semibold text-blue-900 dark:text-blue-200">
                  <span>F<sub>0</sub></span>
                  <span className="mx-2">=</span>
                  <span>F<sub>{sym.delta}</sub> + F<sub>d1</sub> + F<sub>c</sub> + F<sub>M0</sub> + F<sub>a</sub> + F<sub>{sym.delta}M</sub></span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Points de la caractéristique à vide */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold text-foreground">Points Caractéristique à Vide (Fig 2.12)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">E₀ / U<sub>n</sub></th>
                    <th className="px-4 py-2 font-medium">B<sub>δ</sub> (G)</th>
                    <th className="px-4 py-2 font-medium">K<sub>ex</sub></th>
                    <th className="px-4 py-2 font-medium">ΣF (A)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {curvePoints.map((pt, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono">{fmt(pt?.ratio_E0, 2)}</td>
                      <td className="px-4 py-2 font-mono">{fmt(pt?.B_delta_Gauss, 0)}</td>
                      <td className="px-4 py-2 font-mono text-muted-foreground">{fmt(pt?.K_ex, 2)}</td>
                      <td className="px-4 py-2 font-mono font-bold text-primary">{fmt(pt?.F_total_A, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

        </div>

      </div>
    </StepLayout>
  );
}
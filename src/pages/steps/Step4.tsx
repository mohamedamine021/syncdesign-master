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
  pi: <span className="mx-0.5">π</span>,
  tau: <span className="mx-0.5">τ</span>,
  beta: <span className="mx-0.5">β</span>,
  phi: <span className="mx-0.5">Φ</span>,
  delta: <span className="mx-0.5">δ</span>,
  alpha: <span className="mx-0.5">α</span>,
  approx: <span className="mx-1">≈</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 4
// ─────────────────────────────────────────────────────────────────────────────
export default function Step4() {
  const { inputs, nominal, mainDimensions, setCurrentStep } = useMachineStore();

  // 1. Sécurité anti-boucle infinie pour la navigation
  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(4);
    }
  }, [setCurrentStep]);

  // 2. Délégation complète au moteur de calcul
  const results = useMemo(() => {
    if (
      !inputs || !inputs.m || !inputs.f || !inputs.Un ||
      !nominal || !nominal.p || !nominal.In || !nominal.Uph ||
      !mainDimensions || !mainDimensions.D || !mainDimensions.A ||
      !mainDimensions.tau || !mainDimensions.lDeltaFinal
    ) {
      return null;
    }
    try {
      return CalculationEngine.calcStator(inputs, nominal, mainDimensions);
    } catch (error) {
      console.error("Erreur lors du calcul du stator :", error);
      return null;
    }
  }, [inputs, nominal, mainDimensions]);

  // Formatage propre des nombres
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // 3. Bouclier si données manquantes
  if (!results) {
    return (
      <StepLayout stepNumber={4} title="Step 4 : Stator design">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres manquants pour dimensionner le Stator.</p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que les Étapes 1, 2 et 3 ont bien été validées et complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      stepNumber={4}
      title="Step 4 : Stator design"
      description="Dimensionnement complet des encoches, des enroulements et de la culasse du stator"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES KPI ET TABLEAUX                          */}
        {/* ================================================================ */}
        <div className="space-y-6">

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Nombre d'encoches (Z₁)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.Z1, 0)}</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Spires par Phase (w₁)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.w1, 0)}</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Flux Nominal (Φch)</p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.PhiCh / 1e6, 2)} <span className="text-sm font-normal text-muted-foreground">×10⁶ Mx</span>
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Densité Courant (Δc)</p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.DeltaC, 2)} <span className="text-sm font-normal text-muted-foreground">A/mm²</span>
              </p>
            </div>
          </div>

          {/* Géométrie et Enroulements */}
          <ResultTable
            title="Géométrie et Enroulements"
            rows={[
              { label: "Nombre total d'encoches",  symbol: 'Z_1',    value: fmt(results.Z1, 0),   unit: '' },
              { label: 'Encoches par pôle/phase',  symbol: 'q_1',    value: fmt(results.q1, 0),   unit: '' },
              { label: 'Pas dentaire',             symbol: 't_1',    value: fmt(results.t1, 2),   unit: 'cm' },
              { label: 'Spires par phase',         symbol: 'w_1',    value: fmt(results.w1, 0),   unit: '' },
              { label: 'Conducteurs par encoche',  symbol: 'up_1',   value: fmt(results.up1, 0),  unit: '' },
              { label: "Pas d'enroulement",        symbol: 'Y',      value: fmt(results.Y, 0),    unit: 'encoches' },
              { label: 'Raccourcissement du pas',  symbol: 'β',      value: fmt(results.beta, 3), unit: '' },
              { label: "Facteur d'enroulement",    symbol: 'K_{w1}', value: fmt(results.Kw1, 3),  unit: '' },
            ]}
          />

          {/* Dimensions des Encoches */}
          <ResultTable
            title="Dimensions des Encoches"
            rows={[
              { label: "Largeur d'encoche",         symbol: 'b_e',    value: fmt(results.be, 2),  unit: 'mm' },
              { label: "Hauteur d'encoche (calcul)", symbol: 'h_e',   value: fmt(results.he, 2),  unit: 'mm' },
              { label: 'Largeur de la dent',         symbol: 'b_{d1}',value: fmt(results.bd1, 2), unit: 'cm' },
              { label: 'Encombrement (têtes)',       symbol: 'l_e',   value: fmt(results.le, 2),  unit: 'mm' },
            ]}
          />

          {/* Circuit Magnétique Stator */}
          <ResultTable
            title="Circuit Magnétique Stator"
            rows={[
              { label: 'Flux magnétique à vide',      symbol: 'Φ_0',    value: `${fmt(results.Phi0 / 1e6, 2)} × 10⁶`,   unit: 'Mx' },
              { label: 'Flux magnétique en charge',   symbol: 'Φ_{ch}', value: `${fmt(results.PhiCh / 1e6, 2)} × 10⁶`,  unit: 'Mx' },
              { label: "Induction entrefer (à vide)", symbol: 'B_{δ0}', value: fmt(results.Bd0, 0),                      unit: 'G' },
              { label: 'Induction entrefer nominale', symbol: 'B_{δN}', value: fmt(results.BdN, 0),                      unit: 'G' },
              { label: 'Induction dentaire (charge)', symbol: 'B_{d1}', value: fmt(results.Bd1, 0),                      unit: 'G' },
              { label: 'Hauteur culasse stator',      symbol: 'h_c',    value: fmt(results.hc, 2),                       unit: 'cm' },
              { label: 'Induction culasse (charge)',  symbol: 'B_c',    value: fmt(results.Bc, 0),                       unit: 'G' },
            ]}
          />

          {/* Cuivre et Conducteurs */}
          <ResultTable
            title="Cuivre et Conducteurs"
            rows={[
              { label: 'Dimensions fil nu (a × b)',  symbol: 'a × b',    value: `${fmt(results.a_cond, 2)} × ${fmt(results.b_cond, 2)}`, unit: 'mm' },
              { label: 'Section conducteur',         symbol: 'S_c',      value: fmt(results.Sc, 2),                                      unit: 'mm²' },
              { label: 'Densité de courant',         symbol: 'Δ_c',      value: fmt(results.DeltaC, 2),                                  unit: 'A/mm²' },
              { label: 'Longueur phase',             symbol: 'L_c',      value: fmt(results.Lc, 2),                                      unit: 'm' },
              { label: 'Résistance phase (75°C)',    symbol: 'R_{a75}',  value: fmt(results.Ra75, 4),                                    unit: 'Ω' },
              { label: 'Résistance par unité',       symbol: 'R_{a75}*', value: fmt(results.Ra75pu, 4),                                  unit: 'p.u.' },
              { label: 'Poids total cuivre stator',  symbol: 'G_M',      value: fmt(results.Gm, 1),                                      unit: 'kg' },
            ]}
          />

        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Rappel des équations utilisées pour l'Étape 4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            {/* ── Encoches et spires ── */}
            <Formula label="Nombre total d'encoches">
              <span className="italic font-semibold mr-2">Z<sub>1</sub></span>
              <span className="mr-2">=</span>
              <span>2p {sym.dot} m {sym.dot} q<sub>1</sub></span>
            </Formula>

            <Formula label="Pas dentaire">
              <span className="italic font-semibold mr-2">t<sub>1</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>{sym.pi} {sym.dot} D</span>} den={<span>Z<sub>1</sub></span>} />
            </Formula>

            <Formula label="Conducteurs par encoche">
              <span className="italic font-semibold mr-2">up<sub>1</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>A {sym.dot} t<sub>1</sub></span>} den={<span>I<sub>n</sub></span>} />
            </Formula>

            <Formula label="Spires par phase">
              <span className="italic font-semibold mr-2">w<sub>1</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>p {sym.dot} q<sub>1</sub> {sym.dot} up<sub>1</sub></span>} den="a" />
            </Formula>

            <Formula label="Pas & Facteur d'enroulement">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">Y</span>
                  {sym.approx}
                  <span>0.778 {sym.dot} {sym.tau}<sub>slots</sub></span>
                </div>
                <div>
                  <span className="italic font-semibold mr-2">K<sub>w1</sub></span>
                  <span className="mr-2">=</span>
                  <span>K<sub>d</sub> {sym.dot} K<sub>p</sub></span>
                </div>
              </div>
            </Formula>

            {/* ── Flux et Inductions ── */}
            <Formula label="Flux magnétique à vide (Φ₀)">
              <span className="italic font-semibold mr-2">{sym.phi}<sub>0</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>U<sub>ph</sub> {sym.dot} 10<sup>8</sup></span>}
                den={<span>4 {sym.dot} K<sub>B</sub> {sym.dot} f {sym.dot} w<sub>1</sub> {sym.dot} K<sub>w1</sub></span>}
              />
            </Formula>

            <Formula label="Flux en charge (Φch)">
              <span className="italic font-semibold mr-2">{sym.phi}<sub>ch</sub></span>
              <span className="mr-2">=</span>
              <span>1.08 {sym.dot} {sym.phi}<sub>0</sub></span>
            </Formula>

            <Formula label="Induction dans l'entrefer à vide (Bδ0)">
              <span className="italic font-semibold mr-2">B<sub>{sym.delta}0</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>{sym.phi}<sub>0</sub></span>}
                den={<span>{sym.alpha}<sub>{sym.delta}</sub> {sym.dot} {sym.tau} {sym.dot} l<sub>{sym.delta},fin</sub></span>}
              />
            </Formula>

            <Formula label="Induction nominale en charge (BδN)">
              <span className="italic font-semibold mr-2">B<sub>{sym.delta}N</sub></span>
              <span className="mr-2">=</span>
              <span>1.08 {sym.dot} B<sub>{sym.delta}0</sub></span>
            </Formula>

            {/* ── Géométrie dent / culasse ── */}
            <Formula label="Géométrie de la dent">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">b<sub>e</sub></span>
                  <span className="mr-2">=</span>
                  <span>0.47 {sym.dot} t<sub>1</sub> {sym.dot} 10</span>
                </div>
                <div>
                  <span className="italic font-semibold mr-2">b<sub>d1</sub></span>
                  <span className="mr-2">=</span>
                  <span>t<sub>1</sub> − (b<sub>e</sub> / 10)</span>
                </div>
              </div>
            </Formula>

            <Formula label="Hauteur de la culasse">
              <span className="italic font-semibold mr-2">h<sub>c</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>D<sub>a</sub> − D</span>} den="2" />
              <span className="mx-2">−</span>
              <Frac num={<span>h<sub>e</sub></span>} den="10" />
            </Formula>

            <Formula label="Induction dentaire en charge">
              <span className="italic font-semibold mr-2">B<sub>d1</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>B<sub>{sym.delta}N</sub> {sym.dot} t<sub>1</sub> {sym.dot} l<sub>{sym.delta},fin</sub></span>}
                den={<span>b<sub>d1</sub> {sym.dot} l {sym.dot} K<sub>f</sub></span>}
              />
            </Formula>

            <Formula label="Induction dans la culasse">
              <span className="italic font-semibold mr-2">B<sub>c</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>{sym.phi}<sub>ch</sub></span>}
                den={<span>2 {sym.dot} h<sub>c</sub> {sym.dot} l {sym.dot} K<sub>f</sub></span>}
              />
            </Formula>

            {/* ── Cuivre ── */}
            <Formula label="Densité de courant">
              <span className="italic font-semibold mr-2">Δ<sub>c</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>I<sub>n</sub></span>} den={<span>S<sub>c</sub></span>} />
            </Formula>

            <Formula label="Résistance de phase (à 75°C)">
              <span className="italic font-semibold mr-2">R<sub>a75</sub></span>
              <span className="mr-2">=</span>
              <Frac num={<span>1</span>} den={<span>46</span>} />
              <span className="mx-2">{sym.dot}</span>
              <Frac num={<span>L<sub>c</sub></span>} den={<span>S<sub>c</sub></span>} />
            </Formula>

            <Formula label="Résistance en Per Unit (R*a75)">
              <span className="italic font-semibold mr-2">R<sub>a75</sub><sup>*</sup></span>
              <span className="mr-2">=</span>
              <Frac num={<span>I<sub>n</sub> {sym.dot} R<sub>a75</sub></span>} den={<span>U<sub>ph</sub></span>} />
            </Formula>

            <Formula label="Poids total du Cuivre (Stator)">
              <span className="italic font-semibold mr-2">G<sub>M</sub></span>
              <span className="mr-2">=</span>
              <span>8.9 {sym.dot} m {sym.dot} L<sub>c</sub> {sym.dot} S<sub>c</sub> {sym.dot} 10<sup>−3</sup></span>
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
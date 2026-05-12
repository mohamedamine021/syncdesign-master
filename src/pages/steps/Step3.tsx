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
  approx: <span className="mx-1">≈</span>,
  pi: <span className="mx-0.5">π</span>,
  tau: <span className="mx-0.5">τ</span>,
  lambda: <span className="mx-0.5">λ</span>,
  alpha: <span className="mx-0.5">α</span>,
  delta: <span className="mx-0.5">δ</span>,
  cos: <span className="mr-1">cos(φ)</span>,
  sin: <span className="mr-1">sin(φ)</span>,
  sqrt: (content: React.ReactNode) => (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">{content}</span>
    </span>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 3
// ─────────────────────────────────────────────────────────────────────────────
export default function Step3() {
  const { inputs, nominal, setCurrentStep } = useMachineStore();

  // 1. Sécurité anti boucle infinie : mise à jour de l'étape
  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(3);
    }
  }, [setCurrentStep]);

  // 2. Calcul local sécurisé (Ne met pas à jour le store mondial ici !)
  const results = useMemo(() => {
    if (!inputs || !inputs.Pn || !nominal || !nominal.p) {
      return null;
    }
    try {
      return CalculationEngine.calcMainDimensions(inputs, nominal);
    } catch (error) {
      console.error("Erreur lors du calcul des dimensions :", error);
      return null;
    }
  }, [inputs, nominal]);

  // Formatage propre des nombres
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  // 3. Bouclier si données manquantes
  if (!results) {
    return (
      <StepLayout stepNumber={3} title="Step 3 : Dimensions Principales">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">Erreur : Paramètres d'entrée ou nominaux manquants.</p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vérifier que les étapes 1 et 2 ont bien été calculées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // 4. Rendu de la page
  return (
    <StepLayout
      stepNumber={3}
      title="Step 3 : Dimensions Principales"
      description="Calcul du diamètre, du pas polaire, des charges et de la longueur du stator"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ================================================================ */}
        {/* COLONNE GAUCHE : CARTES RÉSUMÉ ET TABLEAUX                       */}
        {/* ================================================================ */}
        <div className="space-y-6">

          {/* Cartes KPI (Key Performance Indicators) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Diamètre Intérieur (D)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.D, 1)} <span className="text-sm font-normal text-muted-foreground">cm</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Pas Polaire (τ)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.tau, 2)} <span className="text-sm font-normal text-muted-foreground">cm</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Charge Linéique (A)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.A, 0)} <span className="text-sm font-normal text-muted-foreground">A/cm</span></p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Induction (Bdn)</p>
              <p className="text-2xl font-bold font-mono text-primary">{fmt(results.Bdn, 0)} <span className="text-sm font-normal text-muted-foreground">G</span></p>
            </div>
          </div>

          {/* Bannière d'alerte pour le ratio Lambda */}
          <div className={`p-4 rounded-lg border-2 shadow-sm ${
            results.isLambdaValid
              ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
              : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{results.isLambdaValid ? '✅' : '⚠️'}</span>
              <h4 className="font-bold text-sm uppercase tracking-wide">
                Ratio de proportion (λ = {fmt(results.lambda, 2)})
              </h4>
            </div>
            <p className="text-xs font-medium opacity-90 ml-8">{results.lambdaMessage}</p>
          </div>

          {/* Tableau détaillé — EXHAUSTIF */}
          <ResultTable
            title="Détail des Dimensions"
            rows={[
              // ── Coefficients et puissance ──────────────────────────────
              { label: 'Coefficient KE',                  symbol: 'K_E',         value: fmt(results.KE, 3),            unit: '' },
              { label: 'Puissance apparente calcul',      symbol: "S'",          value: fmt(results.Sprime, 1),        unit: 'kVA' },
              // ── Diamètres ──────────────────────────────────────────────
              { label: 'Diamètre intérieur stator',       symbol: 'D',           value: fmt(results.D, 1),             unit: 'cm' },
              { label: 'Diamètre extérieur calculé',      symbol: 'D_a',         value: fmt(results.Da, 1),            unit: 'cm' },
              { label: 'Diamètre extérieur normé',        symbol: 'D_a (normé)', value: fmt(results.DaNorm, 1),        unit: 'cm' },
              // ── Géométrie polaire ──────────────────────────────────────
              { label: 'Pas polaire',                     symbol: 'τ',           value: fmt(results.tau, 2),           unit: 'cm' },
              // ── Charges électromagnétiques ─────────────────────────────
              { label: 'Charge linéique',                 symbol: 'A',           value: fmt(results.A, 0),             unit: 'A/cm' },
              { label: 'Induction dans l\'entrefer',      symbol: 'B_dn',        value: fmt(results.Bdn, 0),           unit: 'G' },
              // ── Coefficients de conception ─────────────────────────────
              { label: 'Arc polaire relatif',             symbol: 'α_p',         value: fmt(results.alphap, 3),        unit: '—' },
              { label: 'Coefficient arc de flux',         symbol: 'α_δ',         value: fmt(results.alphaDelta, 3),    unit: '—' },
              { label: 'Coefficient de forme d\'induction', symbol: 'K_B',       value: fmt(results.KB, 3),            unit: '—' },
              { label: 'Coefficient de bobinage initial', symbol: 'K_01',        value: fmt(results.K01, 3),           unit: '—' },
              // ── Longueurs ──────────────────────────────────────────────
              { label: 'Longueur électromagnétique',      symbol: "l'_δ",        value: fmt(results.lPrimeDelta, 1),   unit: 'cm' },
              { label: 'Longueur estimée (avec conduites)', symbol: 'l_δ',       value: fmt(results.lDelta, 1),        unit: 'cm' },
              // ── Ventilation ────────────────────────────────────────────
              { label: 'Canaux de ventilation',           symbol: 'n_v',         value: fmt(results.nv, 0),            unit: 'canaux' },
              { label: 'Largeur d\'un canal de ventilation', symbol: 'b_v',      value: fmt(results.bv, 1),            unit: 'cm' },
              { label: 'Épaisseur d\'un paquet de tôles', symbol: 'l_paq',      value: fmt(results.lpaq, 1),          unit: 'cm' },
              // ── Longueurs finales de fabrication ───────────────────────
              { label: 'Longueur physique active',        symbol: 'l',           value: fmt(results.l, 1),             unit: 'cm' },
              { label: 'Longueur totale (fer + air)',     symbol: 'l_1',         value: fmt(results.l1, 1),            unit: 'cm' },
              { label: 'Longueur magnétique équiv.',      symbol: 'l_{δ,fin}',   value: fmt(results.lDeltaFinal, 2),   unit: 'cm' },
              // ── Validation ─────────────────────────────────────────────
              { label: 'Ratio de proportion',             symbol: 'λ',           value: fmt(results.lambda, 2),        unit: '—' },
            ]}
          />
        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : FORMULES D'INGÉNIERIE SÉCURISÉES (HTML INLINE)  */}
        {/* ================================================================ */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>Équations analytiques utilisées pour l'Étape 3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">

            {/* ── Puissance apparente ── */}
            <Formula label="Puissance Apparente de Calcul (S')">
              <span className="italic font-semibold mr-2">S'</span>
              <span className="mr-2">=</span>
              <Frac num={<span>K<sub>E</sub> {sym.dot} P<sub>n</sub></span>} den={sym.cos} />
              <span className="ml-4 text-xs opacity-50 border-l border-current pl-2">
                K<sub>E</sub> = {sym.sqrt(<span>cos²φ + (sinφ + x<sub>σ</sub>)²</span>)}
              </span>
            </Formula>

            {/* ── Diamètre intérieur ── */}
            <Formula label="Diamètre Intérieur Empirique (D)">
              <span className="italic font-semibold mr-2">D</span>
              {sym.approx}
              <span>7.1 {sym.dot} {sym.sqrt('p')} {sym.dot} (S')<sup>0.25</sup></span>
            </Formula>

            {/* ── Pas polaire ── */}
            <Formula label="Pas Polaire (τ)">
              <span className="italic font-semibold mr-2">{sym.tau}</span>
              <span className="mr-2">=</span>
              <Frac num={<span>{sym.pi} {sym.dot} D</span>} den={<span>2p</span>} />
            </Formula>

            {/* ── Charge linéique et induction ── */}
            <Formula label="Charge Linéique (A) & Induction (Bdn)">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">A</span>
                  <span className="mr-2">=</span>
                  <span>c<sub>1</sub> {sym.dot} ln({sym.tau}) + c<sub>2</sub></span>
                </div>
                <div>
                  <span className="italic font-semibold mr-2">B<sub>dn</sub></span>
                  <span className="mr-2">=</span>
                  <span>c<sub>3</sub> − <Frac num={<span>c<sub>4</sub></span>} den={sym.tau} /></span>
                </div>
              </div>
            </Formula>

            {/* ── Longueur électromagnétique ── */}
            <Formula label="Longueur Électromagnétique (l'δ)">
              <span className="italic font-semibold mr-2">l'<sub>{sym.delta}</sub></span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>6.1 {sym.dot} 10<sup>11</sup> {sym.dot} S'</span>}
                den={<span>{sym.alpha}<sub>{sym.delta}</sub> {sym.dot} K<sub>B</sub> {sym.dot} K<sub>01</sub> {sym.dot} A {sym.dot} B<sub>dn</sub> {sym.dot} D² {sym.dot} n<sub>n</sub></span>}
              />
            </Formula>

            {/* ── Longueur estimée avec conduites de ventilation ── */}
            <Formula label="Longueur Estimée avec Conduites (lδ)">
              <span className="italic font-semibold mr-2">l<sub>{sym.delta}</sub></span>
              <span className="mr-2">=</span>
              <span>1.08 {sym.dot} l'<sub>{sym.delta}</sub></span>
            </Formula>

            {/* ── Longueur physique du fer actif ── */}
            <Formula label="Longueur Physique du Fer Actif (l)">
              <span className="italic font-semibold mr-2">l</span>
              <span className="mr-2">=</span>
              <span>l<sub>paq</sub> {sym.dot} (1 + n<sub>v</sub>)</span>
            </Formula>

            {/* ── Longueur totale avec air ── */}
            <Formula label="Longueur Totale Fer + Air (l₁)">
              <span className="italic font-semibold mr-2">l<sub>1</sub></span>
              <span className="mr-2">=</span>
              <span>l + n<sub>v</sub> {sym.dot} b<sub>v</sub></span>
            </Formula>

            {/* ── Longueur magnétique équivalente finale ── */}
            <Formula label="Longueur Magnétique Équivalente Finale (lδ,fin)">
              <span className="italic font-semibold mr-2">l<sub>{sym.delta},fin</sub></span>
              <span className="mr-2">=</span>
              <span>l<sub>1</sub> − 0.5 {sym.dot} n<sub>v</sub> {sym.dot} b<sub>v</sub></span>
            </Formula>

            {/* ── Ratio de proportionnalité ── */}
            <Formula label="Ratio de Proportionnalité (λ)">
              <span className="italic font-semibold mr-2">{sym.lambda}</span>
              <span className="mr-2">=</span>
              <Frac num={<span>l<sub>{sym.delta},final</sub></span>} den={sym.tau} />
            </Formula>

          </CardContent>
        </Card>

      </div>
    </StepLayout>
  );
}
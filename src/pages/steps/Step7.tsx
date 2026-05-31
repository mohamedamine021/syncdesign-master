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
const CURRENT_STEP = 7;

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
              Caractéristique à Vide
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Bilan des forces magnétomotrices (FMM) et courbe de saturation du circuit magnétique
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl font-bold">📈</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">
              Saturation
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
          { label: 'Force magnétomotrice', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Induction dentaire',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Courbe saturation',    color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Flux de fuite',        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Théorème Ampère',      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
// COMPOSANT PRINCIPAL : STEP 7
// ─────────────────────────────────────────────────────────────────────────────
export default function Step7() {
  const { mainDimensions, stator, airGap, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(CURRENT_STEP);
    }
  }, [setCurrentStep]);

  // Calcul de la caractéristique à vide
  const results = useMemo(() => {
    if (!mainDimensions || !stator || !airGap) {
      return null;
    }
    try {
      const nominalData = CalculationEngine.calcNoLoadCharacteristic(mainDimensions, stator, airGap);
      const curvePoints = CalculationEngine.generateNoLoadCurve(mainDimensions, stator, airGap);
      return { nominalData, curvePoints };
    } catch (error) {
      console.error("Erreur lors du calcul de la caractéristique à vide :", error);
      return null;
    }
  }, [mainDimensions, stator, airGap]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number) || !isFinite(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  const fmtDiv = (v: number | null | undefined, divisor: number, d = 2): string =>
    fmt((v != null && isFinite(v as number)) ? (v as number) / divisor : undefined, d);

  // ── Erreur : données manquantes ───────────────────────────────────────────
  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Caractéristique à Vide">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour le circuit magnétique.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que les dimensions (Étape 3), le stator (Étape 4) et l'entrefer (Étape 5) sont calculés.
          </p>
        </div>
      </StepLayout>
    );
  }

  const { nominalData, curvePoints } = results;

  const Bd13Safe = nominalData?.Bd13 ?? 0;
  const isSaturated = Bd13Safe > 18000;

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Caractéristique à Vide"
      description="Bilan des forces magnétomotrices (FMM) et tracé de la courbe de saturation"
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
                FMM Totale (F₀)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(nominalData?.F_0, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">A</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                FMM Entrefer (Fδ)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(nominalData?.F_delta, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">A</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Induction Dent (Bd13)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(nominalData?.Bd13, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">G</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Induction Culasse (Bc)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(nominalData?.Bc, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">G</span>
              </p>
            </div>
          </div>

          {/* Validation de saturation */}
          <div
            className={`p-4 rounded-lg border-2 shadow-sm ${
              !isSaturated
                ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
                : 'border-destructive/50 bg-destructive/10 text-destructive'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{!isSaturated ? '✅' : '⚠️'}</span>
              <h4 className="font-bold text-sm uppercase tracking-wide">
                Saturation des dents statoriques
              </h4>
            </div>
            <p className="text-xs font-medium opacity-90 ml-8">
              {!isSaturated
                ? `L'induction dans les dents (${fmt(Bd13Safe, 0)} G) est dans les limites acceptables (< 18000 G).`
                : `Attention : Forte saturation détectée (${fmt(Bd13Safe, 0)} G > 18000 G). Le calcul du coefficient K_ex sera appliqué.`}
            </p>
          </div>

          {/* Tableau des FMM */}
          <ResultTable
            title="Bilan des Forces Magnétomotrices (Loi de Hopkinson)"
            rows={[
              { label: "FMM de l'entrefer",             symbol: 'F_δ',     value: fmt(nominalData?.F_delta, 0),   unit: 'A' },
              { label: 'FMM des dents stator',          symbol: 'F_{d1}',  value: fmt(nominalData?.F_d1, 0),      unit: 'A' },
              { label: 'FMM de la culasse stator',      symbol: 'F_c',     value: fmt(nominalData?.F_c, 0),       unit: 'A' },
              { label: 'FMM de la zone polaire',        symbol: 'F_{M0}',  value: fmt(nominalData?.F_M0, 0),      unit: 'A' },
              { label: 'FMM de la culasse rotor',       symbol: 'F_a',     value: fmt(nominalData?.F_a, 0),       unit: 'A' },
              { label: 'FMM jonction pôle-rotor',       symbol: 'F_{δM}',  value: fmt(nominalData?.F_delta_M, 0), unit: 'A' },
              { label: 'FMM TOTALE À VIDE',             symbol: 'F_0',     value: fmt(nominalData?.F_0, 0),       unit: 'A' },
            ]}
          />

          {/* Tableau des inductions */}
          <ResultTable
            title="Grandeurs Magnétiques (B et H)"
            rows={[
              { label: 'Induction dent (1/3 hauteur)', symbol: 'B_{d13}', value: fmt(nominalData?.Bd13, 0),  unit: 'G' },
              { label: 'Champ magnétique dent',        symbol: 'H_{d13}', value: fmt(nominalData?.Hd13, 1),  unit: 'A/cm' },
              { label: 'Induction culasse stator',     symbol: 'B_c',     value: fmt(nominalData?.Bc, 0),    unit: 'G' },
              { label: 'Champ magnétique culasse st.', symbol: 'H_c',     value: fmt(nominalData?.Hc, 1),    unit: 'A/cm' },
              { label: 'Induction noyau polaire',      symbol: 'B_M',     value: fmt(nominalData?.B_M, 0),   unit: 'G' },
              { label: 'Champ magnétique noyau pol.',  symbol: 'H_M',     value: fmt(nominalData?.H_M, 1),   unit: 'A/cm' },
              { label: 'Induction culasse rotor',      symbol: 'B_a',     value: fmt(nominalData?.B_a, 0),   unit: 'G' },
              { label: 'Champ magnétique culasse rot.', symbol: 'H_a',    value: fmt(nominalData?.H_a, 1),   unit: 'A/cm' },
            ]}
          />

          {/* Tableau des géométries */}
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

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE DROITE : FORMULES ET POINTS DE COURBE                    */}
        {/* ─────────────────────────────────────────────────────────────── */}
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

              <Formula label="2. Géométrie de la Dent (1/3 hauteur)">
                <div className="flex flex-col gap-2 w-full text-center">
                  <div>
                    <span className="italic font-semibold mr-2">t<sub>d13</sub></span>
                    <span className="mr-2">=</span>
                    <Frac
                      num={<span>{sym.pi} {sym.dot} (D + 2/3 {sym.dot} h<sub>e</sub>)</span>}
                      den={<span>Z<sub>1</sub></span>}
                    />
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
                  <span>
                    F<sub>{sym.delta}</sub> + F<sub>d1</sub> + F<sub>c</sub> + F<sub>M0</sub> + F<sub>a</sub> + F<sub>{sym.delta}M</sub>
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Points de la caractéristique à vide */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold text-foreground">
                Points de la Caractéristique à Vide
              </CardTitle>
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
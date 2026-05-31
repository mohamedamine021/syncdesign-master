import React, { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalculationEngine } from '@/engine/CalculationEngine';
import { RotorVisualization } from '@/components/RotorVisualization';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES GLOBALES
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;
const CURRENT_STEP = 6;

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS HTML POUR RENDU MATHÉMATIQUE
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
  dot:    <span className="mx-0.5">·</span>,
  delta:  <span className="mx-0.5 italic">δ</span>,
  tau:    <span className="mx-0.5 italic">τ</span>,
  alpha:  <span className="mx-0.5 italic">α</span>,
  sigma:  <span className="mx-0.5 italic">σ</span>,
  phi:    <span className="mx-0.5 italic">Φ</span>,
  approx: <span className="mx-1">≈</span>,
  sqrt: (content: React.ReactNode) => (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">{content}</span>
    </span>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// BANDEAU TITRE DE L'ÉTAPE
// ─────────────────────────────────────────────────────────────────────────────
function StepBanner() {
  const progressPercent = (CURRENT_STEP / TOTAL_STEPS) * 100;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-8">
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">

          {/* Badge numéro */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-2xl tracking-tight">{CURRENT_STEP}</span>
          </div>

          {/* Texte */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">
              Étape {CURRENT_STEP} sur {TOTAL_STEPS}
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight truncate">
              Dimensionnement du Rotor
            </h1>

            <p className="text-slate-300 text-sm mt-1 leading-snug">
              Calcul des pôles magnétiques, du noyau polaire et de la culasse rotorique
            </p>
          </div>

          {/* Icône décorative */}
          <div className="ml-auto hidden md:flex flex-col items-center gap-1 opacity-30 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-2xl">⚙</span>
            </div>
            <span className="text-[9px] text-white font-bold uppercase tracking-widest">Rotor</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-5">
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
            <span>Progression globale</span>
            <span>{CURRENT_STEP} / {TOTAL_STEPS} — {Math.round(progressPercent)} %</span>
          </div>

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
                    <div
                      className={`
                        w-3 h-3 rounded-full border-2 transition-all duration-300
                        ${
                          isCurrent
                            ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] scale-125'
                            : isDone
                              ? 'bg-sky-400 border-sky-300'
                              : 'bg-white/15 border-white/25'
                        }
                      `}
                    />

                    {(step === 1 || step === CURRENT_STEP || step === TOTAL_STEPS || step % 7 === 0) && (
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
                          isCurrent ? 'text-emerald-300' : isDone ? 'text-sky-400' : 'text-slate-500'
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

      {/* Tags */}
      <div className="bg-slate-700 dark:bg-slate-900 px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { label: 'Pôles magnétiques', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
          { label: 'Noyau polaire', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: 'Culasse rotorique', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
          { label: 'Flux polaire', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
          { label: 'Induction Ba', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
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
function SectionSeparator({
  children,
  className = 'mb-4',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-3 text-center">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : STEP 6
// ─────────────────────────────────────────────────────────────────────────────
export default function Step6() {
  const { mainDimensions, stator, airGap, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(CURRENT_STEP);
    }
  }, [setCurrentStep]);

  // ── Calculs rotor ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (
      !mainDimensions || !mainDimensions.tau || !mainDimensions.D ||
      !mainDimensions.l1 || !mainDimensions.alphap ||
      !stator || !stator.PhiCh ||
      !airGap || !airGap.delta
    ) {
      return null;
    }

    try {
      const rotor = CalculationEngine.calcRotor(mainDimensions, stator, airGap);

      const BM_target = 15600;
      const dnoy      = 20;
      const deltaM    = 1.5 * airGap.delta;
      const lM        = mainDimensions.l1;
      const SM        = rotor.PhiM / BM_target;
      const hM_calc   = 10.5 * airGap.delta + 8;
      const la        = lM + 11.5;

      return {
        ...rotor,
        deltaM,
        lM,
        SM,
        hM_calc,
        dnoy,
        la,
      };
    } catch (error) {
      console.error('Erreur lors du calcul du rotor :', error);
      return null;
    }
  }, [mainDimensions, stator, airGap]);

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || isNaN(v as number)) return '—';
    return (v as number).toFixed(d);
  };

  if (!results) {
    return (
      <StepLayout stepNumber={CURRENT_STEP} title="Dimensionnement du Rotor">
        <StepBanner />

        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-destructive font-bold">
            Erreur : Paramètres manquants pour le dimensionnement du rotor.
          </p>
          <p className="text-destructive/80 text-sm mt-2">
            Veuillez vous assurer que les étapes précédentes : Dimensions principales, Stator et Entrefer,
            ont bien été complétées.
          </p>
        </div>
      </StepLayout>
    );
  }

  // ── Extraction des valeurs pour la visualisation ─────────────────────────
  const D     = mainDimensions?.D ?? 0;
  const delta = airGap?.delta ?? 0;

  return (
    <StepLayout
      stepNumber={CURRENT_STEP}
      title="Dimensionnement du Rotor"
      description="Dimensionnement complet des pôles magnétiques, du noyau et de la culasse du rotor"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. NOM DE L'ÉTAPE EN FRANÇAIS                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <StepBanner />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. VISUALISATION ROTOR EN HAUT                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full mb-10">
        <SectionSeparator>
          Visualisation géométrique du rotor
        </SectionSeparator>

        <Card className="shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 py-3 px-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Coupe transversale du rotor
                </CardTitle>

                <CardDescription className="text-xs mt-0.5">
                  Représentation simplifiée — D = {fmt(D, 1)} cm,
                  δ = {fmt(delta, 3)} cm,
                  bₚ = {fmt(results.bp, 2)} cm
                </CardDescription>
              </div>

              {/* Indicateurs rapides */}
              <div className="hidden sm:flex gap-4">
                {[
                  { label: 'bₚ', value: `${fmt(results.bp, 2)} cm`, color: 'text-sky-600 dark:text-sky-400' },
                  { label: 'hM', value: `${fmt(results.hM, 2)} cm`, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Ba', value: `${fmt(results.Ba, 0)} G`, color: 'text-violet-600 dark:text-violet-400' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className={`text-lg font-black font-mono ${item.color}`}>
                      {item.value}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 bg-white dark:bg-slate-950">
            <RotorVisualization
              D={D}
              delta={delta}
              bp={results.bp}
              hp={results.hp}
              hM={results.hM}
              bM={results.bM}
              Ha={results.Ha}
              PhiM={results.PhiM}
              Ba={results.Ba}
            />
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. RÉSULTATS ET FORMULES                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SectionSeparator className="mb-8">
        Résultats numériques &amp; formules
      </SectionSeparator>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE GAUCHE : RÉSULTATS                                      */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* KPI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Arc Polaire (bp)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.bp, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">cm</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Hauteur Noyau (hM)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.hM, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">cm</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Flux Polaire (ΦM)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.PhiM / 1e6, 2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">×10⁶ Mx</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-slate-50 dark:bg-slate-900/50 text-center shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Induction Culasse (Ba)
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmt(results.Ba, 0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">G</span>
              </p>
            </div>
          </div>

          {/* Validation Ba */}
          <div
            className={`p-4 rounded-lg border-2 shadow-sm ${
              results.Ba <= 16000
                ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300'
                : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{results.Ba <= 16000 ? '✅' : '⚠️'}</span>
              <h4 className="font-bold text-sm uppercase tracking-wide">
                Induction Rotor B<sub>a</sub>
              </h4>
            </div>

            <p className="text-xs font-medium opacity-90 ml-8">
              {results.Ba <= 16000
                ? "L'induction dans la culasse rotorique est optimale, inférieure ou égale à 16000 Gauss."
                : "Attention : l'induction est un peu élevée, risque de saturation magnétique."}
            </p>
          </div>

          {/* Tableau détaillé */}
          <ResultTable
            title="Détails du Dimensionnement Rotorique"
            rows={[
              { label: 'Entrefer max sous pôle',       symbol: 'δ_M',        value: fmt(results.deltaM, 3),                 unit: 'cm' },
              { label: 'Arc polaire',                  symbol: 'b_p',        value: fmt(results.bp, 2),                     unit: 'cm' },
              { label: "Rayon d'épanouissement",       symbol: 'R_p',        value: fmt(results.Rp, 2),                     unit: 'cm' },
              { label: "Hauteur d'épanouissement",     symbol: 'h_p',        value: fmt(results.hp, 2),                     unit: 'cm' },
              { label: 'Longueur noyau polaire',       symbol: 'l_M',        value: fmt(results.lM, 1),                     unit: 'cm' },
              { label: 'Coefficient de dispersion',    symbol: 'σ_N',        value: fmt(results.sigmaN, 3),                 unit: 'p.u.' },
              { label: 'Flux magnétique polaire',      symbol: 'Φ_M',        value: `${fmt(results.PhiM / 1e6, 2)} × 10⁶`,  unit: 'Mx' },
              { label: 'Section théorique noyau',      symbol: 'S_M',        value: fmt(results.SM, 0),                     unit: 'cm²' },
              { label: 'Largeur du noyau polaire',     symbol: 'b_M',        value: fmt(results.bM, 1),                     unit: 'cm' },
              { label: 'Hauteur noyau calculée',       symbol: 'h_{M,calc}', value: fmt(results.hM_calc, 2),                unit: 'cm' },
              { label: 'Hauteur noyau adoptée',        symbol: 'h_M',        value: fmt(results.hM, 1),                     unit: 'cm' },
              { label: "Diamètre de l'arbre",          symbol: 'd_{noy}',    value: fmt(results.dnoy, 0),                   unit: 'cm' },
              { label: 'Hauteur de la culasse rotor',  symbol: 'H_a',        value: fmt(results.Ha, 2),                     unit: 'cm' },
              { label: 'Longueur du rotor sans axe',   symbol: 'l_a',        value: fmt(results.la, 1),                     unit: 'cm' },
              { label: 'Induction culasse rotor',      symbol: 'B_a',        value: fmt(results.Ba, 0),                     unit: 'G' },
            ]}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* COLONNE DROITE : FORMULES                                      */}
        {/* ─────────────────────────────────────────────────────────────── */}
        <Card className="shadow-sm border-t-4 border-t-slate-600 bg-slate-50/50 dark:bg-slate-900/50 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Formules Mathématiques</CardTitle>
            <CardDescription>
              Équations analytiques utilisées pour l'Étape 6
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">

            <Formula label="Arc Polaire et Entrefer Max">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">
                    b<sub>p</sub>
                  </span>
                  <span className="mr-2">=</span>
                  <span>{sym.alpha}<sub>p</sub> {sym.dot} {sym.tau}</span>
                </div>

                <div>
                  <span className="italic font-semibold mr-2">
                    {sym.delta}<sub>M</sub>
                  </span>
                  <span className="mr-2">=</span>
                  <span>1.5 {sym.dot} {sym.delta}</span>
                </div>
              </div>
            </Formula>

            <Formula label="Rayon de l'Épanouissement Polaire">
              <span className="italic font-semibold mr-2">
                R<sub>p</sub>
              </span>
              <span className="mr-2">=</span>
              <Frac num="D" den="2" />
              <span className="mx-2">+</span>
              <Frac
                num={
                  <span>
                    8 {sym.dot} D {sym.dot} ({sym.delta}<sub>M</sub> - {sym.delta})
                  </span>
                }
                den={<span>b<sub>p</sub>²</span>}
              />
            </Formula>

            <Formula label="Hauteur de l'Épanouissement">
              <span className="italic font-semibold mr-2">
                h<sub>p</sub>
              </span>
              <span className="mr-2">=</span>
              <span>
                h' + R<sub>p</sub> -{' '}
                {sym.sqrt(
                  <span>
                    R<sub>p</sub>² - (b<sub>p</sub> / 2)²
                  </span>
                )}
              </span>
            </Formula>

            <Formula label="Coefficient de Dispersion">
              <span className="italic font-semibold mr-2">
                σ<sub>N</sub>
              </span>
              <span className="mr-2">=</span>
              <span>
                1 + K<sub>σ</sub> {sym.dot}{' '}
                <Frac
                  num={<span>35 {sym.dot} {sym.delta}</span>}
                  den={<span>{sym.tau}²</span>}
                />
              </span>
            </Formula>

            <Formula label="Flux Magnétique Polaire">
              <span className="italic font-semibold mr-2">
                Φ<sub>M</sub>
              </span>
              <span className="mr-2">=</span>
              <span>
                σ<sub>N</sub> {sym.dot} Φ<sub>ch</sub>
              </span>
            </Formula>

            <Formula label="Section Théorique et Largeur du Noyau">
              <div className="flex flex-col gap-2 w-full text-center">
                <div>
                  <span className="italic font-semibold mr-2">
                    S<sub>M</sub>
                  </span>
                  <span className="mr-2">=</span>
                  <Frac
                    num={<span>Φ<sub>M</sub></span>}
                    den={<span>B<sub>M,target</sub></span>}
                  />
                </div>

                <div>
                  <span className="italic font-semibold mr-2">
                    b<sub>M</sub>
                  </span>
                  <span className="mr-2">=</span>
                  <Frac
                    num={<span>S<sub>M</sub></span>}
                    den={<span>K<sub>f,rotor</sub> {sym.dot} l<sub>M</sub></span>}
                  />
                </div>
              </div>
            </Formula>

            <Formula label="Hauteur du Noyau Polaire Calculée">
              <span className="italic font-semibold mr-2">
                h<sub>M,calc</sub>
              </span>
              <span className="mr-2">=</span>
              <span>10.5 {sym.dot} {sym.delta} + 8</span>
              <span className="ml-4 text-xs opacity-60">
                h<sub>M</sub> final est arrondi
              </span>
            </Formula>

            <Formula label="Hauteur Culasse Rotor">
              <span className="italic font-semibold mr-2">
                H<sub>a</sub>
              </span>
              <span className="mr-2">=</span>
              <Frac
                num={
                  <span>
                    D - 2{sym.delta} - 2(h<sub>p</sub> + h<sub>M</sub>) - d<sub>noy</sub>
                  </span>
                }
                den="2"
              />
            </Formula>

            <Formula label="Induction Culasse Rotor">
              <span className="italic font-semibold mr-2">
                B<sub>a</sub>
              </span>
              <span className="mr-2">=</span>
              <Frac
                num={<span>Φ<sub>M</sub></span>}
                den={
                  <span>
                    2 {sym.dot} H<sub>a</sub> {sym.dot} l<sub>a</sub>
                  </span>
                }
              />
              <span className="ml-4 text-xs opacity-60 border-l border-current pl-2">
                l<sub>a</sub> = l<sub>M</sub> + 11.5
              </span>
            </Formula>

          </CardContent>
        </Card>
      </div>
    </StepLayout>
  );
}
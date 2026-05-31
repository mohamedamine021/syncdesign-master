import React, { useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EfficiencyDashboardProps {
  rendement:      number;   // ex: 96.5 (%)
  puissanceUtile: number;   // ex: 400  (kW)
  pertesTotales:  number;   // ex: 14.5 (kW)
  pertesfer?:     number;   // Pertes fer culasse + dents + surface (kW)
  pertesMeca?:    number;   // Pertes mécaniques (kW)
  pertesJoule?:   number;   // Pertes Joule stator (kW)
  pertesExcit?:   number;   // Pertes excitation (kW)
  pertesSupp?:    number;   // Pertes supplémentaires (kW)
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function fmt(v: number | undefined, d = 1): string {
  if (v == null || isNaN(v) || !isFinite(v)) return '—';
  return v.toFixed(d);
}

// ─── Composant ───────────────────────────────────────────────────────────────
export const EfficiencyDashboard: React.FC<EfficiencyDashboardProps> = ({
  rendement,
  puissanceUtile,
  pertesTotales,
  pertesfer,
  pertesMeca,
  pertesJoule,
  pertesExcit,
  pertesSupp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Couleur thématique selon rendement ──────────────────────────────────────
  const isGood = rendement >= 90;
  const isWarn = rendement >= 75 && rendement < 90;
  const accentColor = isGood ? '#1D9E75' : isWarn ? '#BA7517' : '#E24B4A';
  const accentBg    = isGood ? '#E1F5EE' : isWarn ? '#FAEEDA' : '#FCEBEB';
  const accentBorder= isGood ? 'border-emerald-500/40' : isWarn ? 'border-amber-500/40' : 'border-red-500/40';
  const accentText  = isGood ? 'text-emerald-700 dark:text-emerald-400'
                              : isWarn ? 'text-amber-700 dark:text-amber-400'
                              : 'text-red-700 dark:text-red-400';
  const badgeTxt    = isGood ? '✓ EXCELLENT' : isWarn ? '⚠ ACCEPTABLE' : '✗ À OPTIMISER';

  const puissanceAbsorbee = puissanceUtile + pertesTotales;
  const pnPct  = puissanceAbsorbee > 0 ? (puissanceUtile / puissanceAbsorbee) * 100 : 0;
  const spPct  = puissanceAbsorbee > 0 ? (pertesTotales  / puissanceAbsorbee) * 100 : 0;

  // ── Barres de répartition des pertes ────────────────────────────────────────
  const detailBars = [
    { label: 'Fer + surface',    val: pertesfer   ?? 0, color: '#534AB7' },
    { label: 'Mécaniques',       val: pertesMeca  ?? 0, color: '#BA7517' },
    { label: 'Joule stator',     val: pertesJoule ?? 0, color: '#E24B4A' },
    { label: 'Excitation',       val: pertesExcit ?? 0, color: '#D4537E' },
    { label: 'Supplémentaires',  val: pertesSupp  ?? 0, color: '#7F77DD' },
  ].filter(b => b.val > 0.001);

  // ── Jauge Canvas animée ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const R  = Math.min(W, H) / 2 - 14;
    const SW = 13;

    const START_ANGLE = (225 * Math.PI) / 180;
    const TOTAL_ARC   = (270 * Math.PI) / 180;
    const clampedPct  = Math.min(Math.max(rendement, 0), 100) / 100;

    const FRAMES = 60;
    let frame = 0;

    function drawTicks() {
      for (let i = 0; i <= 10; i++) {
        const frac  = i / 10;
        const angle = Math.PI + START_ANGLE + frac * TOTAL_ARC;
        const isMaj = i % 2 === 0;
        const r1    = R - SW / 2 - (isMaj ? 12 : 7);
        const r2    = R - SW / 2 - 1;
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(angle), CY + r1 * Math.sin(angle));
        ctx.lineTo(CX + r2 * Math.cos(angle), CY + r2 * Math.sin(angle));
        ctx.strokeStyle = isMaj ? '#64748b' : '#94a3b8';
        ctx.lineWidth   = isMaj ? 1.5 : 0.8;
        ctx.stroke();
        if (isMaj) {
          const rT = R - SW / 2 - 23;
          ctx.fillStyle    = '#94a3b8';
          ctx.font         = '8px "Courier New", monospace';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${i * 10}`, CX + rT * Math.cos(angle), CY + rT * Math.sin(angle));
        }
      }
    }

    function draw(progress: number) {
      ctx.clearRect(0, 0, W, H);
      const currentPct = clampedPct * progress;

      // Piste de fond
      ctx.beginPath();
      ctx.arc(CX, CY, R, Math.PI + START_ANGLE, Math.PI + START_ANGLE + TOTAL_ARC);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth   = SW;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // Arc actif
      if (currentPct > 0) {
        ctx.beginPath();
        ctx.arc(CX, CY, R, Math.PI + START_ANGLE, Math.PI + START_ANGLE + TOTAL_ARC * currentPct);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth   = SW;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      drawTicks();

      // Aiguille
      const needleAngle = Math.PI + START_ANGLE + TOTAL_ARC * currentPct;
      const nLen        = R - SW - 8;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + nLen * Math.cos(needleAngle), CY + nLen * Math.sin(needleAngle));
      ctx.strokeStyle = '#475569';
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // Pivot
      ctx.beginPath();
      ctx.arc(CX, CY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CX, CY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = accentColor;
      ctx.fill();
    }

    function animate() {
      frame++;
      const t     = frame / FRAMES;
      const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      draw(eased);
      if (frame < FRAMES) requestAnimationFrame(animate);
    }

    animate();
  }, [rendement, accentColor]);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden font-mono">

      {/* ── En-tête ── */}
      <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex justify-between items-center">
        <span className="text-[9px] text-slate-400 tracking-widest">PWR-EFF-014</span>
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tracking-[0.1em]">
          TABLEAU DE BORD — PERFORMANCES &amp; RENDEMENT
        </span>
        <span className="text-[9px] text-slate-400 tracking-widest">REV.A</span>
      </div>

      {/* ── Corps 3 colonnes ── */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── COL 1 : Jauge ── */}
        <div className={`flex flex-col items-center rounded-xl border ${accentBorder} p-4`} style={{ background: accentBg + '33' }}>
          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.12em] uppercase mb-1">
            Rendement Global
          </p>

          <div className="relative">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="block"
              aria-label={`Jauge rendement : ${fmt(rendement, 2)} %`}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-5">
              <span className={`text-4xl font-black tabular-nums ${accentText}`}>
                {fmt(rendement, 2)}
              </span>
              <span className={`text-lg font-bold ${accentText} -mt-1`}>%</span>
              <span className="text-[9px] text-slate-400 mt-1 tracking-[0.08em]">RENDEMENT GLOBAL</span>
            </div>
          </div>

          {/* Badge */}
          <div
            className={`mt-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border`}
            style={{ color: accentColor, borderColor: accentColor, background: accentBg }}
          >
            {badgeTxt}
          </div>

          {/* Puissance absorbée */}
          <div className="mt-3 w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">
              Puissance absorbée P<sub>abs</sub>
            </p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {fmt(puissanceAbsorbee, 1)}
              <span className="text-xs font-normal text-slate-400 ml-1">kW</span>
            </p>
          </div>
        </div>

        {/* ── COL 2 : Cartes puissance / pertes ── */}
        <div className="flex flex-col gap-4">

          {/* Puissance utile */}
          <div className="flex-1 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.12em]">
                Puissance Utile
              </p>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black tabular-nums text-emerald-800 dark:text-emerald-200">
                {fmt(puissanceUtile, 0)}
              </span>
              <span className="text-xl text-emerald-600 mb-1 font-bold">kW</span>
            </div>
            <div className="w-full h-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${pnPct.toFixed(1)}%` }}
              />
            </div>
            <p className="text-[8px] text-emerald-600 mt-1 text-right">
              {fmt(pnPct, 1)} % de P_abs
            </p>
          </div>

          {/* Pertes totales */}
          <div className="flex-1 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <p className="text-[9px] font-bold text-red-700 dark:text-red-400 uppercase tracking-[0.12em]">
                Pertes Totales ΣP
              </p>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black tabular-nums text-red-800 dark:text-red-200">
                {fmt(pertesTotales, 1)}
              </span>
              <span className="text-xl text-red-600 mb-1 font-bold">kW</span>
            </div>
            <div className="w-full h-2 bg-red-100 dark:bg-red-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-1000"
                style={{ width: `${spPct.toFixed(1)}%` }}
              />
            </div>
            <p className="text-[8px] text-red-600 mt-1 text-right">
              {fmt(spPct, 1)} % de P_abs
            </p>
          </div>

          {/* Équation bilan */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-center">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">Bilan Énergétique</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              P<sub>abs</sub> = P<sub>n</sub> + ΣP
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              {fmt(puissanceAbsorbee, 1)} = {fmt(puissanceUtile, 1)} + {fmt(pertesTotales, 1)} kW
            </p>
          </div>
        </div>

        {/* ── COL 3 : Flux d'énergie + Répartition + Formule ── */}
        <div className="flex flex-col gap-4">

          {/* Diagramme flux SVG */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 text-center">
              Flux d'Énergie
            </p>
            <svg viewBox="0 0 280 130" className="w-full" aria-label="Diagramme flux énergie">
              <defs>
                <marker id="arG" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#1D9E75" />
                </marker>
                <marker id="arR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#E24B4A" />
                </marker>
                <marker id="arN" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
                </marker>
              </defs>

              {/* P_abs */}
              <rect x="4" y="38" width="52" height="36" rx="5"
                fill="none" stroke="#64748b" strokeWidth="1.2" />
              <text x="30" y="52" textAnchor="middle" fill="#64748b"
                fontSize="7.5" fontFamily="Courier New">P_abs</text>
              <text x="30" y="66" textAnchor="middle" fill="#334155"
                fontSize="9" fontFamily="Courier New" fontWeight="700">
                {fmt(puissanceAbsorbee, 0)}
              </text>

              {/* Flèche principale */}
              <line x1="56" y1="56" x2="86" y2="56"
                stroke="#64748b" strokeWidth="2.5" markerEnd="url(#arN)" />

              {/* Machine */}
              <rect x="86" y="43" width="48" height="26" rx="5"
                fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
              <text x="110" y="54" textAnchor="middle" fill="#64748b"
                fontSize="7" fontFamily="Courier New">Machine</text>
              <text x="110" y="63" textAnchor="middle" fill="#94a3b8"
                fontSize="6.5" fontFamily="Courier New">
                η={fmt(rendement, 1)}%
              </text>

              {/* Flèche vers P_n */}
              <line x1="134" y1="56" x2="162" y2="56"
                stroke="#1D9E75" strokeWidth="2.5" markerEnd="url(#arG)" />

              {/* P_n */}
              <rect x="162" y="38" width="52" height="36" rx="5"
                fill="#E1F5EE" stroke="#1D9E75" strokeWidth="1.5" />
              <text x="188" y="52" textAnchor="middle" fill="#0F6E56"
                fontSize="7.5" fontFamily="Courier New">P_n</text>
              <text x="188" y="66" textAnchor="middle" fill="#0F6E56"
                fontSize="9" fontFamily="Courier New" fontWeight="700">
                {fmt(puissanceUtile, 0)}
              </text>

              {/* Flèche pertes (vers bas) */}
              <line x1="110" y1="69" x2="110" y2="96"
                stroke="#E24B4A" strokeWidth="2.2" markerEnd="url(#arR)" />

              {/* Bloc ΣP */}
              <rect x="66" y="96" width="88" height="22" rx="4"
                fill="#FCEBEB" stroke="#E24B4A" strokeWidth="1.2" />
              <text x="110" y="107" textAnchor="middle" fill="#A32D2D"
                fontSize="7" fontFamily="Courier New">
                ΣP = {fmt(pertesTotales, 1)} kW
              </text>
              <text x="110" y="115" textAnchor="middle" fill="#E24B4A"
                fontSize="6" fontFamily="Courier New">
                ({fmt(spPct, 1)}% dissipé)
              </text>
            </svg>
          </div>

          {/* Répartition des pertes */}
          {detailBars.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-3 text-center">
                Répartition des Pertes
              </p>
              <div className="space-y-2">
                {detailBars.map(({ label, val, color }) => {
                  const pct = pertesTotales > 0 ? (val / pertesTotales) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px]" style={{ color }}>{label}</span>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                          {fmt(val, 2)} kW
                          <span className="text-slate-400 ml-1">({fmt(pct, 1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formule rendement */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-center">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-2">Formule</p>
            <div className="text-sm text-slate-600 dark:text-slate-300 font-mono flex items-center justify-center gap-2">
              <span className="text-xl italic font-bold" style={{ color: accentColor }}>η</span>
              <span>=</span>
              <span className="inline-flex flex-col items-center mx-1 align-middle">
                <span className="border-b border-slate-400 px-2 pb-0.5 text-emerald-700 dark:text-emerald-400">
                  P<sub>n</sub>
                </span>
                <span className="pt-0.5 text-slate-400">P<sub>n</sub> + ΣP</span>
              </span>
              <span>=</span>
              <span className="font-bold text-base" style={{ color: accentColor }}>
                {fmt(rendement, 2)} %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

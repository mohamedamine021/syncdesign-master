import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Settings2 } from 'lucide-react';

// ─── Constantes ──────────────────────────────────────────────────────────────
// 👇 CORRECTION ICI : On déclare chaque image manuellement car moteur8 est un .png !
const IMAGES = [
  './moteur1.jpg',
  './moteur2.jpg',
  './moteur7.jpg',
  './moteur13.jpg',
];

const SLIDE_INTERVAL = 4000;

// ─── Carrousel ───────────────────────────────────────────────────────────────
function Carousel() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(prev => (prev + 1) % IMAGES.length);
      setVisible(true);
    }, 600); // cross-fade
  }, []);

  useEffect(() => {
    const id = setInterval(advance, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [advance]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
      {/* Image */}
      <img
        src={IMAGES[current]}
        alt={`moteur ${current + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1000ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />

      {/* Vignette bas */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(7,10,20,0.88) 0%, transparent 100%)',
        }}
      />

      {/* Vignette côtés subtile */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(7,10,20,0.45) 100%)',
        }}
      />

      {/* Indicateurs */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setVisible(false);
              setTimeout(() => { setCurrent(i); setVisible(true); }, 600);
            }}
            className="h-1 rounded-full transition-all duration-500 focus:outline-none"
            style={{
              width: i === current ? '2rem' : '0.5rem',
              background:
                i === current
                  ? 'rgba(56,189,248,0.95)'
                  : 'rgba(255,255,255,0.3)',
            }}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="h-screen w-full overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #070a14 0%, #0d1525 55%, #091220 100%)',
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* ═══ HAUT ════════════════════════════════════════════════════════════ */}
      <header className="flex-none flex flex-col items-center pt-8 pb-4 px-6 select-none">
        {/* Logo avec halo */}
        <div className="relative mb-4">
          {/* Halo diffus */}
          <div
            className="absolute inset-0 -m-6 rounded-full blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(56,189,248,0.20) 0%, transparent 70%)',
            }}
          />
          <img
            src="./logo.png"
            alt="SYNCDESIGN logo"
            className="relative w-16 h-16 object-contain drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.5))' }}
          />
        </div>

        {/* Titre */}
        <h1
          className="text-3xl font-bold tracking-tight text-white mb-1"
          style={{ letterSpacing: '-0.02em' }}
        >
          Bienvenue à{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SYNCDESIGN
          </span>
        </h1>

        {/* Sous-titre */}
        <p
          className="text-xs font-semibold tracking-[0.28em] uppercase"
          style={{ color: 'rgba(148,163,184,0.75)' }}
        >
          Édition Professionnelle
        </p>

        {/* Séparateur décoratif */}
        <div className="mt-4 flex items-center gap-3 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.18)' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(56,189,248,0.55)' }} />
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.18)' }} />
        </div>
      </header>

      {/* ═══ MILIEU — Carrousel ══════════════════════════════════════════════ */}
      <main className="flex-1 flex items-center justify-center px-8 min-h-0">
        <div className="w-full max-w-4xl h-full py-2">
          <Carousel />
        </div>
      </main>

      {/* ═══ BAS ═════════════════════════════════════════════════════════════ */}
      <footer className="flex-none flex flex-col items-center gap-4 pt-3 pb-8 px-6">

        {/* Séparateur */}
        <div className="w-full max-w-lg h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* À propos */}
        <div className="flex items-start gap-3 max-w-lg w-full">
          <div
            className="flex-none mt-0.5 p-1.5 rounded-lg"
            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}
          >
            <Settings2 size={16} style={{ color: 'rgba(56,189,248,0.85)' }} />
          </div>
          <div>
            <p
              className="text-xs font-semibold mb-0.5"
              style={{ color: 'rgba(203,213,225,0.9)', letterSpacing: '0.01em' }}
            >
              À propos de l'application
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.95)' }}>
              SYNCDESIGN PRO est un outil expert de dimensionnement d'alternateurs synchrones.
              Il guide l'ingénieur pas à pas — des grandeurs nominales jusqu'au bilan énergétique
              final — avec calculs physiques précis et export complet des résultats.
            </p>
          </div>
        </div>

        {/* Bouton CTA */}
        <button
          onClick={() => navigate('/step/1')}
          className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-semibold text-sm text-white
                     transition-all duration-300 ease-out
                     hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            boxShadow: '0 4px 24px rgba(14,165,233,0.35), 0 1px 4px rgba(0,0,0,0.4)',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 6px 32px rgba(14,165,233,0.55), 0 2px 8px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 4px 24px rgba(14,165,233,0.35), 0 1px 4px rgba(0,0,0,0.4)';
          }}
        >
          Début de calcul
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight size={18} />
          </span>
        </button>

      </footer>
    </div>
  );
}
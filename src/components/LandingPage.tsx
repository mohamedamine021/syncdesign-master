import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Settings2 } from 'lucide-react';

// Vous pourrez remplacer ces liens par vos propres images locales plus tard (ex: '/moteur1.jpg')
const MOTOR_IMAGES = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80'
];

export function LandingPage() {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);

  // Le timer pour faire défiler les photos toutes les 4 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % MOTOR_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-8 text-center">
      
      {/* 1. Le Grand Logo */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <img 
          src="/logo.ico" 
          alt="Logo SyncDesign" 
          className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl"
        />
      </div>

      {/* 2. Le Message de Bienvenue */}
      <h1 className="text-5xl font-extrabold tracking-tight text-foreground mb-2">
        Bienvenue à <span className="text-primary">SYNCDESIGN</span>
      </h1>
      <p className="text-lg text-muted-foreground font-medium mb-10 tracking-widest uppercase">
        Édition Professionnelle
      </p>

      {/* 3. Le Carrousel de Photos */}
      <div className="relative w-full max-w-3xl h-72 rounded-2xl overflow-hidden shadow-2xl mb-12 border border-border">
        {MOTOR_IMAGES.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Moteur ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* Petit filtre assombrissant sur les images pour faire plus joli */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* 4. Section À propos (About) */}
      <div className="max-w-2xl mb-14 space-y-4">
        <div className="flex items-center justify-center gap-2 text-primary mb-2">
          <Settings2 size={24} />
          <h2 className="text-2xl font-bold text-foreground">À propos de l'application</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          SYNCDESIGN PRO est votre outil d'ingénierie avancé dédié au dimensionnement et à l'analyse des machines synchrones. 
          Conçu pour les ingénieurs et concepteurs, il vous accompagne pas à pas depuis le cahier des charges jusqu'au calcul 
          des pertes et du rendement global de l'alternateur.
        </p>
      </div>

      {/* 5. Le Bouton de démarrage */}
      <div className="flex flex-col items-center gap-4">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Prêt à commencer le design ?
        </span>
        <button
          onClick={() => navigate('/step/1')}
          className="group relative flex items-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-full font-bold text-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] shadow-primary/50"
        >
          Début de calcul
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
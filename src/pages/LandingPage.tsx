import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-primary/80 text-white px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6">SyncDesign</h1>
        <p className="text-xl text-white/90 mb-12">
          Bienvenue dans votre outil d'ingénierie. Commencez votre processus de conception.
        </p>
        <Button
          size="lg"
          onClick={() => navigate("/step/1")}
          className="bg-white text-primary hover:bg-white/90"
        >
          Commencer
        </Button>
      </div>
    </div>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom"; // J'ai retiré 'Navigate' car on n'en a plus besoin ici
import { AppLayout } from "@/components/AppLayout";

// 1️⃣ N'oubliez pas d'importer votre nouvelle page !
// (Ajustez le chemin selon l'endroit où vous avez créé le fichier)
import { LandingPage } from "@/components/LandingPage"; 

import Step1 from "@/pages/steps/Step1";
import Step2 from "@/pages/steps/Step2";
import Step3 from "@/pages/steps/Step3";
import Step4 from "@/pages/steps/Step4";
import Step5 from "@/pages/steps/Step5";
import Step6 from "@/pages/steps/Step6";
import Step7 from "@/pages/steps/Step7";
import Step8 from "@/pages/steps/Step8";
import Step9 from "@/pages/steps/Step9";
import Step10 from "@/pages/steps/Step10";
import Step11 from "@/pages/steps/Step11";
import Step12 from "@/pages/steps/Step12";
import Step13 from "@/pages/steps/Step13";
import Step14 from "@/pages/steps/Step14";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          
          {/* 2️⃣ La nouvelle route pour la page d'accueil (en dehors de l'AppLayout pour ne pas avoir la barre latérale) */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Les étapes de calcul avec la barre latérale (AppLayout) */}
          <Route element={<AppLayout />}>
            <Route path="/step/1" element={<Step1 />} />
            <Route path="/step/2" element={<Step2 />} />
            <Route path="/step/3" element={<Step3 />} />
            <Route path="/step/4" element={<Step4 />} />
            <Route path="/step/5" element={<Step5 />} />
            <Route path="/step/6" element={<Step6 />} />
            <Route path="/step/7" element={<Step7 />} />
            <Route path="/step/8" element={<Step8 />} />
            <Route path="/step/9" element={<Step9 />} />
            <Route path="/step/10" element={<Step10 />} />
            <Route path="/step/11" element={<Step11 />} />
            <Route path="/step/12" element={<Step12 />} />
            <Route path="/step/13" element={<Step13 />} />
            <Route path="/step/14" element={<Step14 />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
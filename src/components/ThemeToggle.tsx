import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  const buttonStyle = {
    background: theme === 'dark' 
      ? 'rgba(15, 23, 42, 0.85)' 
      : 'rgba(226, 232, 240, 0.9)',
    borderColor: theme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(71, 85, 105, 0.2)',
    color: theme === 'dark'
      ? 'rgba(226, 232, 240, 0.9)'
      : 'rgba(51, 65, 85, 0.9)',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${className} inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-sky-400/60`}
      style={buttonStyle}
      aria-label={`Activer le mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
    >
      {theme === 'dark' ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}

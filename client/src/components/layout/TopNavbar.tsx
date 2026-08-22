import LogoBlack from "../../assets/Zap logo black.png";
import LogoWhite from "../../assets/Zap logo white.png";
import { useTheme } from "../../context/ThemeContext";

export function TopNavbar() {
  const { theme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:hidden border-b border-pure-border-light dark:border-pure-border-dark bg-white dark:bg-black flex items-center justify-between px-4 z-50 transition-colors">
      {/* Left: Branding */}
      <div className="flex items-center gap-2">
        <img
          src={theme === "dark" ? LogoBlack : LogoWhite}
          alt="Zap Logo"
          className="h-6 w-6 object-contain"
        />
        <span className="text-xl font-bold tracking-tight text-black dark:text-white">
          Zap
        </span>
      </div>

      {/* Right: Empty container for future utility icons */}
      <div className="flex items-center gap-3"></div>
    </header>
  );
}

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";

export type Theme = "dark" | "light";

const storageKey = "parkventory:ui-theme:v1";
const themeColors: Record<Theme, string> = {
  dark: "#030504",
  light: "#f4f6f1",
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null | undefined): value is Theme {
  return value === "dark" || value === "light";
}

function readInitialTheme(): Theme {
  const documentTheme = document.documentElement.dataset.theme;
  if (isTheme(documentTheme)) return documentTheme;

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    if (isTheme(storedTheme)) return storedTheme;
  } catch {
    // Storage can be unavailable in hardened or private browser contexts.
  }

  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", themeColors[theme]);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The selected theme still applies for the current page when storage fails.
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeToggle must be rendered inside ThemeProvider.");
  return context;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const classes = ["theme-toggle", className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="group" aria-label="Apparence">
      <button
        type="button"
        aria-label="Thème clair"
        aria-pressed={theme === "light"}
        title="Thème clair"
        onClick={() => setTheme("light")}
      >
        <Sun aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Thème sombre"
        aria-pressed={theme === "dark"}
        title="Thème sombre"
        onClick={() => setTheme("dark")}
      >
        <Moon aria-hidden="true" />
      </button>
    </div>
  );
}

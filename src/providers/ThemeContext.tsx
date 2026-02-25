import { darkColors, lightColors, type AppColors } from "@/src/theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  themeMode: ThemeMode;
  colors: AppColors;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "theme-mode";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(scheme: ReturnType<typeof useColorScheme>): ThemeMode {
  return scheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getSystemTheme(scheme));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (!isMounted) return;

        if (storedTheme === "light" || storedTheme === "dark") {
          setThemeMode(storedTheme);
        } else {
          setThemeMode(getSystemTheme(scheme));
        }
      } catch {
        if (isMounted) {
          setThemeMode(getSystemTheme(scheme));
        }
      } finally {
        if (isMounted) {
          setHydrated(true);
        }
      }
    };

    restoreTheme();

    return () => {
      isMounted = false;
    };
  }, [scheme]);

  useEffect(() => {
    if (!hydrated) return;

    AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode).catch(() => {
      // noop
    });
  }, [hydrated, themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const colors = themeMode === "dark" ? darkColors : lightColors;

  const value = useMemo(
    () => ({ themeMode, colors, toggleTheme }),
    [themeMode, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

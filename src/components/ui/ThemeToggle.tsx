"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./Button";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="تبديل المظهر" aria-label="تبديل المظهر">
        <span className="sr-only">تبديل المظهر</span>
      </Button>
    );
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      aria-label="تبديل المظهر"
      title="تبديل المظهر"
      style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {currentTheme === "dark" ? (
        <Sun style={{ width: '1.2rem', height: '1.2rem' }} />
      ) : (
        <Moon style={{ width: '1.2rem', height: '1.2rem' }} />
      )}
      <span className="sr-only">تبديل المظهر</span>
    </Button>
  );
}

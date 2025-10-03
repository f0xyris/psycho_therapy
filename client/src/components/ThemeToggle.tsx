import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function ThemeToggle() {
  // Dark theme disabled: ensure light theme
  useEffect(() => {
    localStorage.removeItem("theme");
    document.documentElement.classList.remove("dark");
  }, []);

  return null;
}
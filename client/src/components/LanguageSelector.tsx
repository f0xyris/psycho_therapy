import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language, languageNames } from "@/lib/translations";

const flagEmojis: Record<Language, string> = {
  uk: "🇺🇦",
};

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:bg-mystical-100 dark:hover:bg-deep-700 dark:bg-deep-800 dark:text-mystical-300 dark:border dark:border-deep-600"
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t.language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(languageNames).map(([lang, name]) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang as Language)}
            className={`cursor-pointer flex items-center gap-2 ${
              language === lang ? 'bg-mystical-50 dark:bg-mystical-900' : ''
            }`}
          >
            <span className="text-sm">{flagEmojis[lang as Language]}</span>
            <span>{name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
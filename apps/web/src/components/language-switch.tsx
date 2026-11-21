import { Button } from "@plop-ui/react";

import { languageNames, languages } from "@/lib/localization/language";
import { useLanguage } from "@/lib/localization/language-provider";
import { useHydrated } from "@/lib/use-hydrated";

export const LanguageSwitch = () => {
  const { language, setLanguage, text } = useLanguage();
  const hydrated = useHydrated();

  return (
    <fieldset className="flex min-w-0 flex-wrap items-center gap-2 border-0 p-0">
      <legend className="sr-only">{text.language}</legend>
      {languages.map((choice) => (
        <Button
          key={choice}
          type="button"
          lang={choice}
          disabled={!hydrated}
          size="sm"
          variant={choice === language ? "periwinkle" : "plain"}
          aria-pressed={choice === language}
          onClick={() => {
            setLanguage(choice);
          }}
        >
          <span>{languageNames[choice]}</span>
        </Button>
      ))}
    </fieldset>
  );
};

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { Language } from "./language";
import { messages } from "./messages";

interface LanguageSelection {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageSelection | null>(null);

export const LanguageProvider = ({
  children,
  ...selection
}: LanguageSelection & { children: ReactNode }) => (
  <LanguageContext.Provider value={selection}>
    {children}
  </LanguageContext.Provider>
);

export const useLanguage = () => {
  const selection = useContext(LanguageContext);

  if (!selection) {
    throw new Error("LanguageProvider is missing");
  }

  return { ...selection, text: messages[selection.language] };
};

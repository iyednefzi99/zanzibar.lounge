"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type BrandContextValue = {
  primary: string;
  secondary: string;
  accent: string;
  logoUrl: string | null;
  restaurantName: string;
};

const BrandContext = createContext<BrandContextValue>({
  primary: "#C9A96E",
  secondary: "#1B2838",
  accent: "#E8734A",
  logoUrl: null,
  restaurantName: "Zanzibar Lounge",
});

export function useBrand() {
  return useContext(BrandContext);
}

export function WhiteLabelProvider({
  children,
  theme,
}: {
  children: ReactNode;
  theme: BrandContextValue;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-brand-primary", theme.primary);
    root.style.setProperty("--color-brand-secondary", theme.secondary);
    root.style.setProperty("--color-brand-accent", theme.accent);
  }, [theme.primary, theme.secondary, theme.accent]);

  return (
    <BrandContext.Provider value={theme}>
      {children}
    </BrandContext.Provider>
  );
}
